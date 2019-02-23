import { Channel, Connection, Message } from 'amqplib';
import { Observable, ReplaySubject } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { RabbitMqChannelCancelledError } from '../errors/rabbitmq-channel-cancelled.error';
import { RabbitMqChannelClosedError } from '../errors/rabbitmq-channel-closed.error';
import { RabbitMqChannelError } from '../errors/rabbitmq-channel.error';
import { RabbitMqConnectionClosedError } from '../errors/rabbitmq-connection-closed.error';
import { RabbitMqConnectionError } from '../errors/rabbitmq-connection.error';
import { RabbitMqConnectionFactory } from '../factories/rabbit-mq-connection-factory';
import { ConsumerConfigs } from '../interfaces/consumer-configs';
import { RabbitMqSetupFunction } from '../interfaces/rabbit-mq-setup-function';
import { RabbitMqPeer } from '../interfaces/rabbitmq-peer';
import { RabbitMqConnection } from './rabbitmq-connection';

const DEFAULT_RECONNECT_TIMEOUT_MILLIS = 1000;
const DEFAULT_RECONNECT_ATTEMPTS = -1; // infinity
const DEFAULT_PREFETCH = 100;

/**
 * Used for setting up or ensuring required RabbitMQ internal structure and consuming messages.
 */
export class Consumer implements RabbitMqPeer {
  private subject: ReplaySubject<Message>;
  private rawConfigs: ConsumerConfigs;
  private configs: ConsumerConfigs;
  private channel: Channel;
  private connection: RabbitMqConnection;
  private customSetupFunction: RabbitMqSetupFunction;

  constructor() {}

  private fillEmptyConfigsWithDefaults(rawConfigs?: ConsumerConfigs): ConsumerConfigs {
    let filledConfigs = Object.assign({}, rawConfigs);
    if (!filledConfigs.queue || !filledConfigs.queue.name)
      throw new Error('Name of the queue has to be provided');

    filledConfigs.queue.durable = typeof filledConfigs.queue.durable === 'undefined' ? true : filledConfigs.queue.durable;
    filledConfigs.queue.arguments = filledConfigs.queue.arguments || {};

    filledConfigs.exchange = filledConfigs.exchange || {};
    filledConfigs.exchange.name = filledConfigs.exchange.name || `exchange_${filledConfigs.queue.name}`;
    filledConfigs.exchange.durable = typeof filledConfigs.exchange.durable === 'undefined' ? true : filledConfigs.exchange.durable;
    filledConfigs.exchange.arguments = filledConfigs.exchange.arguments || {};
    filledConfigs.exchange.type = filledConfigs.exchange.type || 'direct';

    if (filledConfigs.exchange.type === 'topic' && !filledConfigs.queue.bindingPattern)
      throw new Error('In case of topic exchanges, routing pattern has to be provided for the queue');

    if (filledConfigs.exchange.type === 'direct')
      filledConfigs.queue.bindingPattern = filledConfigs.queue.bindingPattern || `${filledConfigs.queue.name}_rk`;
    else if (filledConfigs.exchange.type === 'fanout')
      filledConfigs.queue.bindingPattern = '';

    filledConfigs.autoAck = typeof filledConfigs.autoAck === 'undefined' ? false : filledConfigs.autoAck;
    filledConfigs.prefetch = filledConfigs.prefetch || DEFAULT_PREFETCH;
    filledConfigs.reconnectAttempts = filledConfigs.reconnectAttempts || DEFAULT_RECONNECT_ATTEMPTS;
    filledConfigs.reconnectTimeoutMillis = filledConfigs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS;

    if (typeof filledConfigs.noDeadLetterQueue !== 'undefined' && filledConfigs.noDeadLetterQueue === true)
      delete filledConfigs.deadLetterQueue;
    else {
      filledConfigs.deadLetterQueue = filledConfigs.deadLetterQueue || {};
      filledConfigs.deadLetterQueue.name = filledConfigs.deadLetterQueue.name || `dlq_${filledConfigs.queue.name}`;
      filledConfigs.deadLetterQueue.exchangeName = filledConfigs.deadLetterQueue.exchangeName || `exchange_${filledConfigs.deadLetterQueue.name}`;
      filledConfigs.deadLetterQueue.exchangeType = filledConfigs.deadLetterQueue.exchangeType || 'fanout';
    }

    return filledConfigs;
  }

  private async defaultSetup(connection: Connection): Promise<Channel> {
    const channel = await connection.createChannel();
    const exchangeOptions: { [x: string]: any } = {};

    if (this.configs.deadLetterQueue) {
      await channel.assertExchange(this.configs.deadLetterQueue.exchangeName, this.configs.deadLetterQueue.exchangeType);
      const dlqMetadata = await channel.assertQueue(this.configs.deadLetterQueue.name);
      await channel.bindQueue(dlqMetadata.queue, this.configs.deadLetterQueue.exchangeName, '');
    }

    await channel.assertExchange(this.configs.exchange.name, this.configs.exchange.type, exchangeOptions);
    const queueMetadata = await channel.assertQueue(this.configs.queue.name, {
      durable: this.configs.queue.durable,
      arguments: this.configs.queue.arguments,
      deadLetterExchange: this.configs.deadLetterQueue ? this.configs.deadLetterQueue.name : undefined,
    });

    await channel.bindQueue(queueMetadata.queue, this.configs.exchange.name, this.configs.queue.bindingPattern, this.configs.queue.arguments);
    await channel.prefetch(this.configs.prefetch);

    return channel;
  }

  /**
   * Sets consumer's configs
   * @param configs consumer's configs
   */
  public setConfigs(configs: ConsumerConfigs) {
    this.rawConfigs = configs;
    this.configs = this.fillEmptyConfigsWithDefaults(this.rawConfigs);
  }

  /**
   * Sets custom setup function
   * @param setupFunction custom setup function
   */
  public setCustomSetupFunction(setupFunction: RabbitMqSetupFunction) {
    this.customSetupFunction = setupFunction;
    this.rawConfigs = null;
    this.configs = null;
  }

  /**
   * Initializes the consumer, sets up internal RabbitMQ structure according to configs or runs custom setup function, if provided
   * @param connection connection
   */
  public async init(connection: RabbitMqConnection): Promise<void> {
    this.connection = connection;
    const amqpConnection = this.connection.getAmqpConnection();
    if (this.customSetupFunction) {
      const {channel, prefetch} = await this.customSetupFunction(amqpConnection);
      this.channel = channel;
      this.subject = new ReplaySubject<Message>(prefetch || DEFAULT_PREFETCH);
    } else {
      this.channel = await this.defaultSetup(amqpConnection);
      this.subject = new ReplaySubject<Message>(this.configs.prefetch);
    }

    await this.channel.consume(
      this.configs.queue.name,
      (message: Message): void => {
        if (message === null)
          return void this.subject.error(new RabbitMqChannelCancelledError('The channel was cancelled by the server'));
        else
          this.subject.next(message);
      },
      { noAck: this.configs.autoAck },
    );

    amqpConnection.on('error', (err) => this.subject.error(new RabbitMqConnectionError(err.message)));
    amqpConnection.on('close', () => this.subject.error(new RabbitMqConnectionClosedError('The connection was closed by the server')));
    this.channel.on('error', (err) => this.subject.error(new RabbitMqChannelError(err.message)));
    this.channel.on('close', () => this.subject.error(new RabbitMqChannelClosedError('The channel was closed by the server')));
  }

  /**
   * Constantly attempts to reconnect to RabbitMQ either default or given amount of times with some default or given timeout
   */
  public reconnect() {
    const connectionFactory = new RabbitMqConnectionFactory();
    connectionFactory.setUri(this.connection.getUri());
    return new Observable<void>((subscriber) => {
      connectionFactory
        .newConnection()
        .then((connection) => this.init(connection))
        .then(() => subscriber.complete())
        .catch(() => {}); // to avoid loud unhandled promise rejections
    }).pipe(
      timeout(this.configs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS),
      retry(this.configs.reconnectTimeoutMillis || DEFAULT_RECONNECT_ATTEMPTS),
    );
  }

  /**
   * Closes the active channel, this will throw a RabbitMqChannelClosedError in the consumer's stream
   */
  public async closeChannel(): Promise<void> {
    await this.channel.close();
  }

  /**
   * Returns a channel object of amqplib
   */
  public getActiveChannel(): Channel {
    return this.channel;
  }

  /**
   * Return a connection object of amqplib
   */
  public getActiveConnection(): Connection {
    return this.connection.getAmqpConnection();
  }

  /**
   * Returns an instance of ReplaySubject<Message>, to which it is possible to subscribe to listen to messages and any other RabbitMQ activity
   */
  public startConsuming(): ReplaySubject<Message> {
    return this.subject;
  }

  /**
   * Returns current consumer's configs. Returns null if consumer was setup with custom setup function
   */
  public getActiveConfigs(): ConsumerConfigs {
    return this.configs;
  }

  /**
   * Commits a message (ack command of amqp)
   * @param amqpMessage amqplib's message object
   */
  public commitMessage(amqpMessage: Message) {
    this.channel.ack(amqpMessage);
  }

  /**
   * Rejects a message (nack command of amqp)
   * @param message amqpMessage amqplib's message object
   * @param allUpToCurrent set true if there is a need to reject all messages up to current, default is false
   * @param requeue set true if there is a need to put this message back in to the queue, default is false
   */
  public rejectMessage(message: Message, allUpToCurrent = false, requeue = false) {
    this.channel.nack(message, allUpToCurrent, requeue);
  }
}

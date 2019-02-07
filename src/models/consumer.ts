import { Channel, Connection, Message } from 'amqplib';
import { Observable, ReplaySubject } from 'rxjs';
import { retry, timeout } from 'rxjs/operators';
import { RabbitMqChannelCancelledError } from '../errors/rabbitmq-channel-cancelled.error';
import { RabbitMqChannelClosedError } from '../errors/rabbitmq-channel-closed.error';
import { RabbitMqChannelError } from '../errors/rabbitmq-channel.error';
import { RabbitMqConnectionClosedError } from '../errors/rabbitmq-connection-closed.error';
import { RabbitMqConnectionError } from '../errors/rabbitmq-connection.error';
import { ConnectionFactory } from '../factories/connection-factory';
import { ConsumerConfigs } from '../interfaces/consumer-configs';
import { RabbitMqPeer } from '../interfaces/rabbitmq-peer';
import { RabbitMqConnection } from './rabbtimq-connection';

const DEFAULT_RECONNECT_TIMEOUT_MILLIS = 1000;
const DEFAULT_RECONNECT_ATTEMPTS = -1; // infinity
const DEFAULT_PREFETCH = 100;

export class Consumer implements RabbitMqPeer {
  private readonly subject: ReplaySubject<Message>;
  private channel: Channel;
  private connection: RabbitMqConnection;

  constructor(private configs: ConsumerConfigs) {
    this.subject = new ReplaySubject<Message>();
  }

  public async init(connection: RabbitMqConnection): Promise<void> {
    this.connection = connection;
    const amqpConnection = this.connection.getAmqpConnection();
    const exchangeOptions: { [x: string]: any } = {};

    this.channel = await amqpConnection.createChannel();
    if (!this.configs.noDeadLetterQueue) {
      await this.channel.assertExchange(`exchange_dlq_${this.configs.queue.name}`, 'fanout');
      const dlqMetadata = await this.channel.assertQueue(`dlq_${this.configs.queue.name}`);
      await this.channel.bindQueue(dlqMetadata.queue, `exchange_dlq_${this.configs.queue.name}`, '');
    }

    let exchangeName = `exchange_${this.configs.queue.name}`;
    let exchangeType = 'topic';
    if (this.configs.exchange) {
      exchangeOptions.durable = typeof this.configs.exchange.durable === 'undefined' ? true : this.configs.exchange.durable;
      exchangeOptions.arguments = this.configs.exchange.arguments || {};
      exchangeName = this.configs.exchange.name;
      exchangeType = this.configs.exchange.type;
    }

    await this.channel.assertExchange(exchangeName, exchangeType, exchangeOptions);
    const queueMetadata = await this.channel.assertQueue(this.configs.queue.name, {
      durable: typeof this.configs.queue.durable === 'undefined' ? true : this.configs.queue.durable,
      arguments: this.configs.queue.arguments,
      deadLetterExchange: this.configs.noDeadLetterQueue ? undefined : `dlq_${this.configs.queue.name}`,
    });
    await this.channel.bindQueue(queueMetadata.queue, exchangeName, this.configs.queue.topic || exchangeType);

    await this.channel.prefetch(this.configs.prefetch || DEFAULT_PREFETCH);

    await this.channel.consume(
      this.configs.queue.name,
      (message: Message): void => {
        if (message === null)
          return void this.subject.error(new RabbitMqChannelCancelledError('Channel was cancelled by the server'));
        else
          this.subject.next(message);
      },
      { noAck: this.configs.noAckNeeded },
    );

    amqpConnection.on('error', (err) => {
      if (this.configs.autoReconnect !== false)
        this.reconnect().toPromise().then(() => console.log('Successfully reconnected to server'));
      this.subject.error(new RabbitMqConnectionError(err.message))
    });
    amqpConnection.on('close', () => this.subject.error(new RabbitMqConnectionClosedError('AMQP server closed connection')));
    this.channel.on('error', (err) => this.subject.error(new RabbitMqChannelError(err.message)));
    this.channel.on('close', () => this.subject.error(new RabbitMqChannelClosedError('AMQP server closed channel')));
  }

  public reconnect() {
    const connectionFactory = new ConnectionFactory();
    connectionFactory.setUri(this.connection.getUri());
    return new Observable((subscriber) => {
      connectionFactory
        .newConnection()
        .then((connection) => this.init(connection))
        .then(() => subscriber.complete())
        .catch((err) => {
          if (err instanceof RabbitMqConnectionError)
            console.error(`Error while reconnecting to server: ${err.code}`);
          else
            console.error(`Error while reconnecting to server: ${err.message}`);
        });
    }).pipe(
      timeout(this.configs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS),
      retry(this.configs.reconnectTimeoutMillis || DEFAULT_RECONNECT_ATTEMPTS),
    );
  }

  public async closeChannel(): Promise<void> {
    await this.channel.close();
  }

  public getActiveChannel(): any {
    return this.channel;
  }

  public getActiveConnection(): Connection {
    return this.connection.getAmqpConnection();
  }

  public startConsuming(): ReplaySubject<Message> {
    return this.subject;
  }

  public commitMessage(amqpMessage: Message) {
    this.channel.ack(amqpMessage);
  }

  public rejectMessage(message: Message, allUpToCurrent = false, requeue = false) {
    this.channel.nack(message, allUpToCurrent, requeue);
  }
}

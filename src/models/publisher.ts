import { Channel, ConfirmChannel, Connection } from 'amqplib';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { catchError, retry, timeout } from 'rxjs/operators';
import { RabbitMqChannelClosedError } from '../errors/rabbitmq-channel-closed.error';
import { RabbitMqChannelError } from '../errors/rabbitmq-channel.error';
import { RabbitMqConnectionClosedError } from '../errors/rabbitmq-connection-closed.error';
import { RabbitMqConnectionError } from '../errors/rabbitmq-connection.error';
import { RabbitMqPublisherConfirmationError } from '../errors/rabbitmq-publisher-confirmation.error';
import { RabbitMqReconnectError } from '../errors/rabbitmq-reconnect.error';
import { RabbitMqConnectionFactory } from '../factories/rabbit-mq-connection-factory';
import { PublisherConfigs } from '../interfaces/publisher-configs';
import { RabbitMqPublisherSetupFunction } from '../interfaces/rabbit-mq-setup-function';
import { RabbitMqPeer } from '../interfaces/rabbitmq-peer';
import { RabbitMqConnection } from './rabbitmq-connection';

const DEFAULT_RECONNECT_TIMEOUT_MILLIS = 1000;
const DEFAULT_RECONNECT_ATTEMPTS = -1; // infinity

/**
 * Used for setting up or ensuring required RabbitMQ internal structure and publishing messages.
 */
export class Publisher implements RabbitMqPeer {
  private connection: RabbitMqConnection;
  private channel: Channel | ConfirmChannel;
  private subject: BehaviorSubject<string>;
  private rawConfigs: PublisherConfigs;
  private configs: PublisherConfigs;
  private customSetupFunction: RabbitMqPublisherSetupFunction;

  constructor() {}

  private fillEmptyConfigsWithDefaults(rawConfigs?: PublisherConfigs): PublisherConfigs {
    let filledConfigs = Object.assign({}, rawConfigs);
    if (!filledConfigs.exchange || !filledConfigs.exchange.name)
      throw new Error('Name of the exchange has to be provided');

    filledConfigs.exchange.options = filledConfigs.exchange.options || {durable: true};
    if (typeof filledConfigs.exchange.options.durable === 'undefined')
      filledConfigs.exchange.options.durable = true;

    filledConfigs.exchange.type = filledConfigs.exchange.type || 'direct';
    filledConfigs.publisherConfirms = typeof filledConfigs.publisherConfirms === 'undefined' ? true : filledConfigs.publisherConfirms;

    if (filledConfigs.reconnectAttempts < 0 && filledConfigs.reconnectAttempts !== -1)
      throw new Error('Reconnect attempts count should be at least 0');
    filledConfigs.reconnectAttempts = filledConfigs.reconnectAttempts || DEFAULT_RECONNECT_ATTEMPTS;

    if (filledConfigs.reconnectTimeoutMillis < 0)
      throw new Error('Reconnect timeout should be at least 0 ms');
    filledConfigs.reconnectTimeoutMillis = filledConfigs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS;

    return filledConfigs;
  }

  private async defaultSetup(connection: Connection): Promise<Channel|ConfirmChannel> {
    const channel = this.configs.publisherConfirms ? await connection.createConfirmChannel() : await connection.createChannel();
    await channel.assertExchange(this.configs.exchange.name, this.configs.exchange.type, this.configs.exchange.options);

    return channel;
  }

  /**
   * Sets publisher configs. Accessible to users, but should only be used by PublisherFactory.
   * @param configs configs to setup publisher and RabbitMQ with
   */
  public setConfigs(configs: PublisherConfigs) {
    this.rawConfigs = configs;
    this.configs = this.fillEmptyConfigsWithDefaults(this.rawConfigs);
  }

  /**
   * Sets custom setup function. Accessible to users, but should only be used by PublisherFactory.
   * @param setupFunction function that sets up internal RabbitMQ structure
   */
  public setCustomSetupFunction(setupFunction: RabbitMqPublisherSetupFunction) {
    this.customSetupFunction = setupFunction;
    this.rawConfigs = null;
    this.configs = null;
  }

  /**
   * Initializes publisher instance and sets up internal RabbitMQ structure either with configs object, or with custom setup function. Prefers function if has both options supplied.
   * @param connection Connection to use to setup internal RabbitMQ structure.
   */
  public async init(connection: RabbitMqConnection): Promise<void> {
    this.connection = connection;
    const amqpConnection = this.connection.getAmqpConnection();

    if (this.customSetupFunction) {
      const {channel, exchange, publisherConfirms} = await this.customSetupFunction(amqpConnection);
      this.channel = channel;
      this.configs = {
        exchange: {
          name: exchange,
        },
        publisherConfirms,
      };
    } else
      this.channel = await this.defaultSetup(amqpConnection);

    this.subject = new BehaviorSubject<string>('Publisher initialized');

    amqpConnection.on('error', (err) => this.subject.error(new RabbitMqConnectionError(err.message)));
    amqpConnection.on('close', () => this.subject.error(new RabbitMqConnectionClosedError('AMQP server closed connection')));
    this.channel.on('error', (err) => this.subject.error(new RabbitMqChannelError(err.message)));
    this.channel.on('close', () => this.subject.error(new RabbitMqChannelClosedError('AMQP server closed channel')));
  }

  /**
   * Reconnects to the server. Retries given or default (infinite) amount of times. Return an observable that completes when connection is established again.
   */
  public reconnect() {
    const connectionFactory = new RabbitMqConnectionFactory();
    if (this.connection.getUri())
      connectionFactory.setUri(this.connection.getUri());
    else
      connectionFactory.setOptions(this.connection.getOptions());
    return new Observable<void>((subscriber) => {
      connectionFactory
        .newConnection()
        .then((connection) => this.init(connection))
        .then(() => subscriber.complete())
        .catch(() => {}); // to avoid loud unhandled promise rejections
    }).pipe(
      timeout(this.configs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS),
      retry(this.configs.reconnectAttempts ? this.configs.reconnectAttempts - 1 : DEFAULT_RECONNECT_ATTEMPTS),
    ).pipe(
      catchError(() => {
        throw new RabbitMqReconnectError('Failed to reconnect');
      }),
    );
  }

  /**
   * Closes current channel. Every other option on it will result in an error thrown inside the stream.
   */
  public async closeChannel(): Promise<void> {
    await this.channel.close();
  }

  /**
   * Returns active channel object of amqplib.
   */
  public getActiveChannel(): Channel {
    return this.channel;
  }

  /**
   * Returns active connection object of amqplib.
   */
  public getActiveConnection(): Connection {
    return this.connection.getAmqpConnection();
  }

  /**
   * Returns active publisher configs or null, if publisher was set up with a custom setup function
   */
  public getActiveConfigs(): PublisherConfigs {
    return this.configs;
  }

  /**
   * Returns a stream of publisher's actions. Contains logs about sent messages as items. Any errors the publisher ends up with will be accessible with this stream.
   */
  public actionsStream(): BehaviorSubject<string> {
    return this.subject;
  }

  /**
   * Publishes messages to RabbitMQ.
   * @param message message to publish in form of Node's Buffer
   * @param routingKey optional routing key to attach to your message
   * @param options options to publish with message with. Can be found in amqplib
   * @throws RabbitMqPublisherConfirmationError
   */
  public async publishMessage(message: Buffer, routingKey?: string, options?: any): Promise<void> {
    if (this.configs.publisherConfirms)
      return new Promise((resolve, reject) => {
        this.channel.publish(this.configs.exchange.name, routingKey || '', message, options || {}, (err) => {
          if (err)
            return reject(new RabbitMqPublisherConfirmationError(err.message));

          this.subject.next(`A message was sent with routing key "${routingKey}"`);
          resolve();
        });
      });

    this.channel.publish(this.configs.exchange.name, routingKey || '', message, options || {});
    this.subject.next(`A message was sent with routing key "${routingKey}"`);
  }
}

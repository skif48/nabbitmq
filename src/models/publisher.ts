import { Channel, ConfirmChannel, Connection } from 'amqplib';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { retry, timeout } from 'rxjs/operators';
import { RabbitMqChannelClosedError } from '../errors/rabbitmq-channel-closed.error';
import { RabbitMqChannelError } from '../errors/rabbitmq-channel.error';
import { RabbitMqConnectionClosedError } from '../errors/rabbitmq-connection-closed.error';
import { RabbitMqConnectionError } from '../errors/rabbitmq-connection.error';
import { RabbitMqPublisherConfirmationError } from '../errors/rabbitmq-publisher-confirmation.error';
import { ConnectionFactory } from '../factories/connection-factory';
import { PublisherConfigs } from '../interfaces/publisher-configs';
import { RabbitMqSetupFunction } from '../interfaces/rabbit-mq-setup-function';
import { RabbitMqPeer } from '../interfaces/rabbitmq-peer';
import { RabbitMqConnection } from './rabbitmq-connection';

const DEFAULT_RECONNECT_TIMEOUT_MILLIS = 1000;
const DEFAULT_RECONNECT_ATTEMPTS = -1; // infinity

export class Publisher implements RabbitMqPeer {
  private connection: RabbitMqConnection;
  private channel: Channel | ConfirmChannel;
  private subject: BehaviorSubject<string>;
  private rawConfigs: PublisherConfigs;
  private configs: PublisherConfigs;
  private customSetupFunction: RabbitMqSetupFunction;

  constructor() {}

  private fillEmptyConfigsWithDefaults(rawConfigs?: PublisherConfigs): PublisherConfigs {
    let filledConfigs = Object.assign({}, rawConfigs);
    if (!filledConfigs.exchange || !filledConfigs.exchange.name)
      throw new Error('Name of the exchange has to be provided');

    filledConfigs.exchange.durable = typeof filledConfigs.exchange.durable === 'undefined' ? true : filledConfigs.exchange.durable;
    filledConfigs.exchange.arguments = filledConfigs.exchange.arguments || {};
    filledConfigs.exchange.type = filledConfigs.exchange.type || 'direct';

    filledConfigs.publisherConfirms = typeof filledConfigs.publisherConfirms === 'undefined' ? true : filledConfigs.publisherConfirms;
    filledConfigs.reconnectAttempts = filledConfigs.reconnectAttempts || DEFAULT_RECONNECT_ATTEMPTS;
    filledConfigs.reconnectTimeoutMillis = filledConfigs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS;

    return filledConfigs;
  }

  private async defaultSetup(connection: Connection): Promise<Channel|ConfirmChannel> {
    const exchangeOptions: { [x: string]: any } = {};
    exchangeOptions.durable = this.configs.exchange.durable;
    exchangeOptions.arguments = this.configs.exchange.arguments || {};
    const channel = this.configs.publisherConfirms ? await connection.createConfirmChannel() : await connection.createChannel();
    await channel.assertExchange(this.configs.exchange.name, this.configs.exchange.type, exchangeOptions);

    return channel;
  }

  public setConfigs(configs: PublisherConfigs) {
    this.rawConfigs = configs;
    this.configs = this.fillEmptyConfigsWithDefaults(this.rawConfigs);
  }

  public setCustomSetupFunction(setupFunction: RabbitMqSetupFunction) {
    this.customSetupFunction = setupFunction;
    this.rawConfigs = null;
    this.configs = null;
  }

  public async init(connection: RabbitMqConnection): Promise<void> {
    this.connection = connection;
    const amqpConnection = this.connection.getAmqpConnection();

    if (this.customSetupFunction) {
      const {channel} = await this.customSetupFunction(amqpConnection);
      this.channel = channel;
    } else
      this.channel = await this.defaultSetup(amqpConnection);

    this.subject = new BehaviorSubject<string>('Publisher initialized');

    amqpConnection.on('error', (err) => this.subject.error(new RabbitMqConnectionError(err.message)));
    amqpConnection.on('close', () => this.subject.error(new RabbitMqConnectionClosedError('AMQP server closed connection')));
    this.channel.on('error', (err) => this.subject.error(new RabbitMqChannelError(err.message)));
    this.channel.on('close', () => this.subject.error(new RabbitMqChannelClosedError('AMQP server closed channel')));
  }

  public reconnect(): Observable<void> {
    const connectionFactory = new ConnectionFactory();
    connectionFactory.setUri(this.connection.getUri());
    return new Observable<void>((subscriber) => {
      connectionFactory
        .newConnection()
        .then((connection) => this.init(connection))
        .then(() => subscriber.complete())
        .catch(() => {}); // to avoid loud unhandled promise rejections
    }).pipe(
      timeout(this.configs.reconnectTimeoutMillis),
      retry(this.configs.reconnectAttempts),
    );
  }

  public async closeChannel(): Promise<void> {
    await this.channel.close();
  }

  public getActiveChannel(): Channel {
    return this.channel;
  }

  public getActiveConnection(): Connection {
    return this.connection.getAmqpConnection();
  }

  public actionsStream(): BehaviorSubject<string> {
    return this.subject;
  }

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

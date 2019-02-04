import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs/internal/Observable';
import { retry, timeout } from 'rxjs/operators';
import { RabbitMqChannelClosedError } from '../errors/rabbitmq-channel-closed.error';
import { RabbitMqChannelError } from '../errors/rabbitmq-channel.error';
import { RabbitMqConnectionClosedError } from '../errors/rabbitmq-connection-closed.error';
import { RabbitMqConnectionError } from '../errors/rabbitmq-connection.error';
import { ConnectionFactory } from '../factories/connection-factory';
import { PublisherConfigs } from '../interfaces/publisher-configs';
import { RabbitMqPeer } from '../interfaces/rabbitmq-peer';
import { RabbitMqConnection } from './connection';

const DEFAULT_RECONNECT_TIMEOUT_MILLIS = 1000;
const DEFAULT_RECONNECT_ATTEMPTS = 100;

export class Publisher implements RabbitMqPeer {
  private connection: RabbitMqConnection;
  private channel: any;
  private readonly subject: BehaviorSubject<string>;

  constructor(
    private readonly configs: PublisherConfigs,
  ) {
    this.subject = new BehaviorSubject<string>('Publisher initialized');
  }

  public async init(connection: RabbitMqConnection) {
    this.connection = connection;
    const amqpConnection = this.connection.getAmqpConnection();
    const exchangeOptions: { [x: string]: any } = {};
    exchangeOptions.durable = this.configs.exchange.durable || false;
    exchangeOptions.arguments = this.configs.exchange.arguments || {};
    this.channel = await amqpConnection.createConfirmChannel();
    await this.channel.assertExchange(this.configs.exchange.name, this.configs.exchange.type, exchangeOptions);

    amqpConnection.on('error', (err) => this.subject.error(new RabbitMqConnectionError(err.message)));
    amqpConnection.on('close', () => this.subject.error(new RabbitMqConnectionClosedError('AMQP server closed connection')));
    this.channel.on('error', (err) => this.subject.error(new RabbitMqChannelError(err.message)));
    this.channel.on('close', () => this.subject.error(new RabbitMqChannelClosedError('AMQP server closed channel')));
  }

  public reconnect(): Observable<any> {
    const connectionFactory = new ConnectionFactory();
    connectionFactory.setUri(this.connection.getUri());
    return new Observable((subscriber) => {
      connectionFactory
        .newConnection()
        .then((connection) => this.init(connection))
        .then(() => subscriber.complete())
        .catch((err) => console.error(`Error while reconnecting to RabbitMQ: ${err.code}`));
    }).pipe(
      timeout(this.configs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS),
      retry(this.configs.reconnectAttempts || DEFAULT_RECONNECT_ATTEMPTS),
    );
  }

  public closeChannel(): void {
    this.channel.close();
  }

  public getActiveChannel(): any {
    return this.channel;
  }

  public getActiveConnection(): any {
    return this.connection.getAmqpConnection();
  }

  public actionsStream(): BehaviorSubject<string> {
    return this.subject;
  }

  public publishMessage(message: Buffer, routingKey?: string, options?: any) {
    this.channel.publish(this.configs.exchange.name, routingKey || '', message, options);
  }
}

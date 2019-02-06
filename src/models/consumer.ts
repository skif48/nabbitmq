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
    exchangeOptions.durable = this.configs.exchange.durable || false;
    exchangeOptions.arguments = this.configs.exchange.arguments || {};
    this.channel = await amqpConnection.createChannel();
    await this.channel.assertExchange(this.configs.exchange.name, this.configs.exchange.type, exchangeOptions);
    const queueMetadata = await this.channel.assertQueue(this.configs.queue.name, {
      durable: this.configs.queue.durable || false,
      arguments: this.configs.queue.arguments,
    });
    await this.channel.bindQueue(queueMetadata.queue, this.configs.exchange.name, this.configs.queue.topic || '');

    if (this.configs.prefetch)
      await this.channel.prefetch(this.configs.prefetch);

    await this.channel.consume(
      this.configs.queue.name,
      (message: any): void => {
        if (message === null)
          return void this.subject.error(new RabbitMqChannelCancelledError('Channel was cancelled by the server'));
        else
          this.subject.next(message);
      },
      { noAck: this.configs.noAckNeeded },
    );

    amqpConnection.on('error', (err) => {
      if (this.configs.reconnectAutomatically)
        this.reconnect().toPromise().then(() => console.log(`Successfully reconnected to ${this.connection.getUri()}`));
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

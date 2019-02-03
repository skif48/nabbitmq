import { RabbitMqPeer } from "../interfaces/rabbit-mq-peer";
import { ReplaySubject, Observable } from "rxjs";
import { timeout, retry } from 'rxjs/operators';
import { RabbitMqConnectionError } from "../errors/rabbitmq-connection.error";
import { RabbitMqConnectionClosedError } from "../errors/rabbitmq-connection-closed.error";
import { RabbitMqChannelError } from "../errors/rabbitmq-channel.error";
import { RabbitMqChannelClosedError } from "../errors/rabbitmq-channel-closed.error";
import { ConsumerConfigs } from "../interfaces/consumer-configs";
import { ConnectionFactory } from "../factories/connection-factory";
import { RabbitMqConnection } from "./connection";

const DEFAULT_RECONNECT_TIMEOUT_MILLIS = 1000;

export class Consumer<T> implements RabbitMqPeer {
  private subject: ReplaySubject<T>;
  private channel: any;
  private connection: RabbitMqConnection;

  constructor(
    private configs: ConsumerConfigs,
  ) {}

  public async init(connection: RabbitMqConnection): Promise<void> {
    this.connection = connection;
    const amqpConnection = this.connection.getAmqpConnection();
    const exchangeOptions: {[x:string]: any} = {};
    exchangeOptions.durable = this.configs.exchange.durable || false;
    exchangeOptions.arguments = this.configs.exchange.arguments || {};
    this.channel = await amqpConnection.createChannel();
    await this.channel.assertExchange(this.configs.exchange.name, this.configs.exchange.type, exchangeOptions);
    const queueMetadata = await this.channel.assertQueue(this.configs.queue.name, {durable: this.configs.queue.durable || false, arguments: this.configs.queue.arguments});
    await this.channel.bindQueue(queueMetadata.queue, this.configs.exchange.name, this.configs.queue.topic || '');
    this.subject = new ReplaySubject<T>();

    if (this.configs.prefetch)
      this.channel.prefetch(this.configs.prefetch);
    
    this.channel.consume(this.configs.queue.name, (message: any): void => {
      if (message === null)
        return void this.subject.error(new Error('Channel was cancelled by the server'));
      else
        this.subject.next(message);   
    }, {noAck: this.configs.noAckNeeded});

    amqpConnection.on('error', (err) => this.subject.error(new RabbitMqConnectionError(err.message)));
    amqpConnection.on('close', () => this.subject.error(new RabbitMqConnectionClosedError('AMQP server closed connection')));
    amqpConnection.on('error', (err) => this.subject.error(new RabbitMqChannelError(err.message)));
    amqpConnection.on('close', () => this.subject.error(new RabbitMqChannelClosedError('AMQP server closed channel')));
  }

  public startConsuming(): ReplaySubject<T> {
    return this.subject;
  }

  public commitMessage(message) {
    this.channel.ack(message);
  }

  public rejectMessage(message, requeue = false) {
    this.channel.nack(message, false, requeue);
  }
  
  public reconnect() {
    const connectionFactory = new ConnectionFactory();
    connectionFactory.setUri(this.connection.getUri());
    return new Observable((subscriber) => {
      connectionFactory.newConnection()
        .then((connection) => this.init(connection))
        .then(() => subscriber.complete())
        .catch((err) => console.error(`Error while reconnection to RabbitMQ: ${err.code}`));
    }).pipe(
      timeout(this.configs.reconnectTimeoutMillis || DEFAULT_RECONNECT_TIMEOUT_MILLIS),
      retry(this.configs.reconnectAttempts || 100),
    );
  }
}

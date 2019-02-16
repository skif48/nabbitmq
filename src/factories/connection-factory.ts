import * as amqp from 'amqplib';
import { RabbitMqConnectionError } from '../errors/rabbitmq-connection.error';
import { RabbitMqConnection } from '../models/rabbitmq-connection';

export class ConnectionFactory {
  private uri: string;
  private options: amqp.Options.Connect;

  constructor() {}

  public setUri(uri: string) {
    this.uri = uri;
  }

  public setOptions(options: amqp.Options.Connect) {
    this.options = options;
  }

  public async newConnection() {
    try {
      const amqpConnection = await amqp.connect(this.options || this.uri);
      return new RabbitMqConnection(amqpConnection, this.uri);
    } catch (error) {
      throw new RabbitMqConnectionError(`Error while connecting to RabbitMQ: ${error.message}`, error.code);
    }
  }
}

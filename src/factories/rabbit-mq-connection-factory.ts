import * as amqp from 'amqplib';
import { RabbitMqConnectionError } from '../errors/rabbitmq-connection.error';
import { RabbitMqConnection } from '../models/rabbitmq-connection';

/**
 * Factory to build RabbitMqConnection instances
 */
export class RabbitMqConnectionFactory {
  private uri: string;
  private options: amqp.Options.Connect;

  constructor() {}

  /**
   * Sets uri to connect to
   * @param uri connection string
   */
  public setUri(uri: string) {
    this.uri = uri;
  }

  /**
   * Sets options of amqplib to build a connection
   * @param options connection options
   */
  public setOptions(options: amqp.Options.Connect) {
    this.options = options;
  }

  /**
   * Builds an instance of RabbitMqConnection, prefers options object over connection string
   * @throws RabbitMqConnectionError
   */
  public async newConnection() {
    try {
      if (!this.options && !this.uri)
        throw new Error('Either options or connection uri must be provided');

      const amqpConnection = await amqp.connect(this.options || this.uri);
      return new RabbitMqConnection(amqpConnection, this.options || this.uri);
    } catch (error) {
      throw new RabbitMqConnectionError(`Error while building connection to RabbitMQ: ${error.message}`, error.code);
    }
  }
}

import { Connection } from 'amqplib';

/**
 * Provides an abstraction over a physical connection to the RabbitMQ server.
 */
export class RabbitMqConnection {
  constructor(
    private readonly connection: Connection,
    private readonly uri: string,
  ) {}

  /**
   * returns connection object of amqplib
   */
  public getAmqpConnection() {
    return this.connection;
  }

  /**
   * returns uri string, we connected to
   */
  public getUri() {
    return this.uri;
  }
}

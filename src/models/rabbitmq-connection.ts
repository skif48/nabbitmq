import { Connection, Options } from 'amqplib';

/**
 * Provides an abstraction over a physical connection to the RabbitMQ server.
 */
export class RabbitMqConnection {
  private readonly uri: string;
  private readonly options: Options.Connect;

  constructor(
    private readonly connection: Connection,
    connectionOptions: string | Options.Connect,
  ) {
    if (typeof connectionOptions === 'string')
      this.uri = connectionOptions;
    else
      this.options = connectionOptions;
  }

  /**
   * returns connection object of amqplib
   */
  public getAmqpConnection() {
    return this.connection;
  }

  /**
   * returns uri string, we connected with, or null if connection was established with an object
   */
  public getUri() {
    return this.uri || null;
  }

  /**
   * returns options object, we connected with, or null if connection was established with a connection string
   */
  public getOptions() {
    return this.options || null;
  }
}

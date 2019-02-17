import { Connection } from 'amqplib';

export class RabbitMqConnection {
  constructor(
    private readonly connection: Connection,
    private readonly uri: string,
  ) {}

  public getAmqpConnection() {
    return this.connection;
  }

  public getUri() {
    return this.uri;
  }
}

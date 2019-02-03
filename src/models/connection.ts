export class RabbitMqConnection {
  constructor(private readonly connection: any, private readonly uri: string) {}

  public getAmqpConnection() {
    return this.connection;
  }

  public getUri() {
    return this.uri;
  }
}

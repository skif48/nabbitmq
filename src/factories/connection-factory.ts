import * as amqp from "amqplib";
import { RabbitMqConnectionError } from "../errors/rabbitmq-connection.error";
import { RabbitMqConnection } from "../models/connection";

export class ConnectionFactory {
  private uri: string;

  constructor() {}

  public setUri(uri: string) {
    this.uri = uri;
  }

  public async newConnection() {
    try {
      const amqpConnection = await amqp.connect(this.uri);
      return new RabbitMqConnection(amqpConnection, this.uri);
    } catch (error) {
      throw new RabbitMqConnectionError(`Error while connecting to RabbitMQ: ${error.message}`);
    }
  }
}

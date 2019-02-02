import * as amqp from "amqplib";
import { RabbitMqConnectionError } from "../errors/rabbitmq-connection.error";

export class ConnectionFactory {
  private uri: string;

  constructor() {}

  /*public setUsername(username: string) {
    this.settings.username = username;
  }

  public setPassword(password: string) {
    this.settings.password = password;
  }

  public setVirtualHost(virtualHost: string) {
    this.settings.virtualHost = virtualHost;
  }

  public setHost(host: string) {
    this.settings.host = host;
  }

  public setPort(port: string) {
    this.settings.port = port;
  }*/

  public setUri(uri: string) {
    this.uri = uri;
  }

  public async newConnection() {
    try {
      return await amqp.connect(this.uri);
    } catch (error) {
      throw new RabbitMqConnectionError(`Error while connecting to RabbitMQ: ${error.message}`);
    }
  }
}
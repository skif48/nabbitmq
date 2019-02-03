import { RabbitMqError } from "./rabbitmq.error";

export class RabbitMqChannelError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqChannelError.prototype);
  }
}

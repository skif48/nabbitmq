import { RabbitMqError } from "./rabbitmq.error";

export class RabbitMqConsumerSetupError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqConsumerSetupError.prototype);
  }
}

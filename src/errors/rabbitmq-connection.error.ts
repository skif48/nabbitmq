import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqConnectionError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqConnectionError.prototype);
  }
}

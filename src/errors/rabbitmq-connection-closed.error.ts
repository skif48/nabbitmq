import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqConnectionClosedError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqConnectionClosedError.prototype);
  }
}

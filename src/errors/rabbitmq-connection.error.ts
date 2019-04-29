import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqConnectionError extends RabbitMqError {
  constructor(
    message?: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'RabbitMqConnectionError';
    Object.setPrototypeOf(this, RabbitMqConnectionError.prototype);
  }
}

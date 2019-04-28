import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqReconnectError extends RabbitMqError {
  constructor(message?: string) {
    super(message);
    this.name = 'RabbitMqReconnectError';
    Object.setPrototypeOf(this, RabbitMqReconnectError.prototype);
  }
}

import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqChannelCancelledError extends RabbitMqError {
  constructor(message?: string) {
    super(message);
    this.name = 'RabbitMqChannelCancelledError';
    Object.setPrototypeOf(this, RabbitMqChannelCancelledError.prototype);
  }
}

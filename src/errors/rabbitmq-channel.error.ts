import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqChannelError extends RabbitMqError {
  constructor(message?: string) {
    super(message);
    this.name = 'RabbitMqChannelError';
    Object.setPrototypeOf(this, RabbitMqChannelError.prototype);
  }
}

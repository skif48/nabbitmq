import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqChannelClosedError extends RabbitMqError {
  constructor(message?: string) {
    super(message);
    this.name = 'RabbitMqChannelClosedError';
    Object.setPrototypeOf(this, RabbitMqChannelClosedError.prototype);
  }
}

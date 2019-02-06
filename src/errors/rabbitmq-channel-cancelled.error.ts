import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqChannelCancelledError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqChannelCancelledError.prototype);
  }
}

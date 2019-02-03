import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqChannelClosedError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqChannelClosedError.prototype);
  }
}

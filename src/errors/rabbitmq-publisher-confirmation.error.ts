import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqPublisherConfirmationError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqPublisherConfirmationError.prototype);
  }
}

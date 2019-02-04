import { RabbitMqError } from './rabbitmq.error';

export class RabbitMqPublisherSetupError extends RabbitMqError {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqPublisherSetupError.prototype);
  }
}

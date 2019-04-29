export class RabbitMqError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'RabbitMqError';
    Object.setPrototypeOf(this, RabbitMqError.prototype);
  }
}

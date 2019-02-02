export class RabbitMqError extends Error {
  constructor(message?: string) {
    super(message);

    Object.setPrototypeOf(this, RabbitMqError.prototype);
  }
}

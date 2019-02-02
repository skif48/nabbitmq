export interface RabbitMqPeer {
  init(...args): void | Promise<void>;
  // reconnect(): Promise<void>;
}

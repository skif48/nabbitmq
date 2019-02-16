import { Channel, Connection } from 'amqplib';
import { Observable } from 'rxjs/internal/Observable';

export interface RabbitMqPeer {
  init(...args): void | Promise<void>;
  reconnect(): Observable<void>;
  closeChannel(): void;
  getActiveChannel(): Channel;
  getActiveConnection(): Connection;
}

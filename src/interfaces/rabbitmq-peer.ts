import { Observable } from 'rxjs/internal/Observable';

export interface RabbitMqPeer {
  init(...args): void | Promise<void>;
  reconnect(): Observable<any>;
}

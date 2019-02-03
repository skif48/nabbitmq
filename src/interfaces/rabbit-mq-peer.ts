import { Observable } from "rxjs";

export interface RabbitMqPeer {
  init(...args): void | Promise<void>;
  reconnect(): Observable<any>;
}

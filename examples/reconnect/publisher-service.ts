import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Publisher, RabbitMqError } from '../../src';

export class PublisherService {
  private stream: BehaviorSubject<string>;
  constructor(
    private readonly publisher: Publisher,
  ) {
    this.init();
  }

  public init() {
    this.stream = this.publisher.actionsStream();
    this.stream.subscribe({
      next: (action) => {
        console.log(action);
      },
      error: (error) => {
        if (error instanceof RabbitMqError) {
          this.publisher.reconnect().toPromise()
            .then(() => this.init())
            .catch((err) => console.error('Failed to reconnect:', err));
        }
      },
    });
  }

  public sendMessage(message: string) {
    this.publisher.publishMessage(Buffer.from(message, 'utf-8'), `route.${Math.ceil(Math.random() * 10)}`);
  }
}

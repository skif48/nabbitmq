import { Message } from 'amqplib';
import { ReplaySubject } from 'rxjs/internal/ReplaySubject';
import { Consumer, RabbitMqError } from '../../src';

export class ConsumerService {
  private stream: ReplaySubject<Message>;
  constructor(
    private readonly consumer: Consumer,
  ) {
    this.init();
  }

  public init() {
    this.stream = this.consumer.startConsuming();
    this.stream.subscribe({
      next: (message) => {
        console.log('Received a message', message);
        this.consumer.commitMessage(message);
      },
      error: (error) => {
        if (error instanceof RabbitMqError) {
          this.consumer.reconnect().toPromise()
            .then(() => this.init())
            .catch((err) => console.error('Failed to reconnect:', err));
        }
      },
    });
  }
}

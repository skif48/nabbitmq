import { RabbitMqPeer } from "../interfaces/rabbit-mq-peer";
import { BehaviorSubject } from "rxjs";

export class Consumer<T> implements RabbitMqPeer {
  private subject: BehaviorSubject<T>;

  constructor(
    private readonly channel: any,
    private readonly connection: any,
  ) {}

  public init(...args: any[]): void | Promise<void> {
    this.subject = new BehaviorSubject<T>(null);
    this.channel.consume('myqueue', (message: any): void => {
      if (message === null)
        return void this.subject.error(new Error('Channel was cancelled by the server'));
      else
        this.subject.next(message);   
    }, {noAck: false});
  }

  public startConsuming(): BehaviorSubject<T> {
    return this.subject;
  }
  
  public reconnect(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

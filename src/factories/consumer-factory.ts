import { Consumer } from "../models/consumer";

export class ConsumerFactory {
  private configs: any;
  private connection: any;

  constructor() {
    this.configs = {};
  }

  public setConnection(connection: any) {
    this.connection = connection;
  }

  public setQueueName(name: string) {
    this.configs.mainQueueName = name;
  }

  public setQueueDurability(durability: boolean) {
    this.configs.queueDurability = durability;
  }

  public setQueueArguments(args: {[x:string]: string|number}) {
    this.configs.queueArgs = args;
  }

  public setExchangeName(name: string) {
    this.configs.exchangeName = name;
  }

  public setExchangeType(type: string) {
    this.configs.exchangeType = type;
  }

  public setExchangeAutoDelete(autoDelete: boolean) {
    this.configs.exchangeAutoDelete = autoDelete;
  }

  public setExchangeArguments(args: {[x:string]: string|number}) {
    this.configs.exchangeArgs = args;
  }

  public setExchangeDurability(durabilty: boolean) {
    this.configs.exchangeDurability = durabilty;
  }

  public setConsumerPrefecth(prefetch: number) {
    this.configs.prefetch = prefetch;
  }

  public async newConsumer<T>(): Promise<Consumer<T>> {
    try {
      const exchangeOptions: {[x:string]: any} = {};
      this.configs.exchangeDurability ? exchangeOptions.durable = this.configs.exchangeDurability : void 0;
      this.configs.exchangeArgs ? exchangeOptions.arguments = this.configs.exchangeArgs : void 0;
      const channel = await this.connection.createConfirmChannel();
      await channel.assertExchange(this.configs.exchangeName, this.configs.exchangeType, exchangeOptions);
      const queueMetadata = await channel.assertQueue(this.configs.mainQueueName, {durable: this.configs.queueDurability, arguments: this.configs.queueArgs});
      await channel.bindQueue(queueMetadata.queue, this.configs.exchangeName, 'key');
      const consumer = new Consumer<T>(channel, this.connection);
      await consumer.init();
      return consumer;
    } catch (err) {
        console.error(err);
        throw err;
    }
  }
}
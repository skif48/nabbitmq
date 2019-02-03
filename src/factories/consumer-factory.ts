import { RabbitMqConsumerSetupError } from "../errors/rabbitmq-consumer-setup.error";
import { ConsumerConfigs } from "../interfaces/consumer-configs";
import { Consumer } from "../models/consumer";

export class ConsumerFactory {
  private configs: ConsumerConfigs;
  private readonly connection: any;

  constructor(connection: any, configs?: ConsumerConfigs) {
    this.connection = connection;
    this.configs = configs;
  }

  public setConfigs(configs: ConsumerConfigs) {
    this.configs = configs;
  }

  public async newConsumer<T>(): Promise<Consumer<T>> {
    try {
      const consumer = new Consumer<T>(this.configs);
      await consumer.init(this.connection);
      return consumer;
    } catch (err) {
      throw new RabbitMqConsumerSetupError(err.message);
    }
  }
}

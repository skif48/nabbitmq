import { Consumer } from "../models/consumer";
import { ConsumerConfigs } from "../interfaces/consumer-configs";
import { RabbitMqConsumerSetupError } from "../errors/rabbitmq-consumer-setup.error";

export class ConsumerFactory {
  private configs: ConsumerConfigs;
  private connection: any;

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

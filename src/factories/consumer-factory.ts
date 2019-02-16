import { RabbitMqConsumerSetupError } from "../errors/rabbitmq-consumer-setup.error";
import { ConsumerConfigs } from "../interfaces/consumer-configs";
import { Consumer } from "../models/consumer";
import { RabbitMqConnection } from '../models/rabbitmq-connection';

export class ConsumerFactory {
  constructor(
    private readonly connection: RabbitMqConnection,
    private configs?: ConsumerConfigs,
  ) {}

  public setConfigs(configs: ConsumerConfigs) {
    this.configs = configs;
  }

  public async newConsumer(): Promise<Consumer> {
    try {
      const consumer = new Consumer(this.configs);
      await consumer.init(this.connection);
      return consumer;
    } catch (err) {
      throw new RabbitMqConsumerSetupError(err.message);
    }
  }
}

import { RabbitMqConsumerSetupError } from "../errors/rabbitmq-consumer-setup.error";
import { ConsumerConfigs } from "../interfaces/consumer-configs";
import { RabbitMqSetupFunction } from '../interfaces/rabbit-mq-setup-function';
import { Consumer } from "../models/consumer";
import { RabbitMqConnection } from '../models/rabbitmq-connection';

export class ConsumerFactory {
  private configs: ConsumerConfigs;
  private customSetupFunction: RabbitMqSetupFunction;

  constructor(
    private readonly connection: RabbitMqConnection,
  ) {}

  public setConfigs(configs: ConsumerConfigs) {
    this.configs = configs;
  }

  public setCustomSetupFunction(setupFunction: RabbitMqSetupFunction) {
    this.customSetupFunction = setupFunction;
  }

  public async newConsumer(): Promise<Consumer> {
    try {
      const consumer = new Consumer();
      if (this.customSetupFunction)
        consumer.setCustomSetupFunction(this.customSetupFunction);
      else
        consumer.setConfigs(this.configs);

      await consumer.init(this.connection);
      return consumer;
    } catch (err) {
      throw new RabbitMqConsumerSetupError(err.message);
    }
  }
}

import { RabbitMqConsumerSetupError } from "../errors/rabbitmq-consumer-setup.error";
import { ConsumerConfigs } from "../interfaces/consumer-configs";
import { RabbitMqSetupFunction } from '../interfaces/rabbit-mq-setup-function';
import { Consumer } from "../models/consumer";
import { RabbitMqConnection } from '../models/rabbitmq-connection';

/**
 * Factory to build Consumer instances
 */
export class ConsumerFactory {
  private configs: ConsumerConfigs;
  private customSetupFunction: RabbitMqSetupFunction;

  /**
   *
   * @param connection connection, which every Publisher instance will use
   */
  constructor(
    private readonly connection: RabbitMqConnection,
  ) {}

  /**
   * Sets configs, with which every Publisher instance will be produced
   * @param configs
   */
  public setConfigs(configs: ConsumerConfigs) {
    this.configs = configs;
  }

  /**
   * Sets setup function, with which every Publisher instance will be produced
   * @param setupFunction
   */
  public setCustomSetupFunction(setupFunction: RabbitMqSetupFunction) {
    this.customSetupFunction = setupFunction;
  }

  /**
   * Returns a Promise, which will resolve with a new Consumer, built with provided configs or custom setup function
   * @throws RabbitMqConsumerSetupError
   */
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

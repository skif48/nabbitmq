import { RabbitMqPublisherSetupError } from '../errors/rabbitmq-publisher-setup.error';
import { PublisherConfigs } from '../interfaces/publisher-configs';
import { RabbitMqSetupFunction } from '../interfaces/rabbit-mq-setup-function';
import { Publisher } from '../models/publisher';
import { RabbitMqConnection } from '../models/rabbitmq-connection';

/**
 * Factory to build Publisher instances
 */
export class PublisherFactory {
  private configs: PublisherConfigs;
  private setupFunction: RabbitMqSetupFunction;

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
  public setConfigs(configs: PublisherConfigs) {
    this.configs = configs;
  }

  /**
   * Sets setup function, with which every Publisher instance will be produced
   * @param setupFunction
   */
  public setCustomSetupFunction(setupFunction: RabbitMqSetupFunction) {
    this.setupFunction = setupFunction;
  }

  /**
   * Returns a Promise, which will resolve with a new Publisher, built with provided configs or custom setup function
   * @throws RabbitMqPublisherSetupError
   */
  public async newPublisher(): Promise<Publisher> {
    try {
      const publisher = new Publisher();
      if (this.setupFunction) {
        publisher.setCustomSetupFunction(this.setupFunction);
        await publisher.init(this.connection);
      } else {
        publisher.setConfigs(this.configs);
        await publisher.init(this.connection);
      }
      return publisher;
    } catch (err) {
      throw new RabbitMqPublisherSetupError(err.message);
    }
  }
}

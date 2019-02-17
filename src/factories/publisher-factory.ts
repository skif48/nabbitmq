import { RabbitMqPublisherSetupError } from '../errors/rabbitmq-publisher-setup.error';
import { PublisherConfigs } from '../interfaces/publisher-configs';
import { RabbitMqSetupFunction } from '../interfaces/rabbit-mq-setup-function';
import { Publisher } from '../models/publisher';
import { RabbitMqConnection } from '../models/rabbitmq-connection';

export class PublisherFactory {
  private configs: PublisherConfigs;
  private setupFunction: RabbitMqSetupFunction;

  constructor(
    private readonly connection: RabbitMqConnection,
  ) {}

  public setConfigs(configs: PublisherConfigs) {
    this.configs = configs;
  }

  public setCustomSetupFunction(setupFunction: RabbitMqSetupFunction) {
    this.setupFunction = setupFunction;
  }

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

import { RabbitMqPublisherSetupError } from '../errors/rabbitmq-publisher-setup.error';
import { PublisherConfigs } from '../interfaces/publisher-configs';
import { Publisher } from '../models/publisher';
import { RabbitMqConnection } from '../models/rabbitmq-connection';

export class PublisherFactory {

  constructor(
    private readonly connection: RabbitMqConnection,
    private configs?: PublisherConfigs,
  ) {}

  public setConfigs(configs: PublisherConfigs) {
    this.configs = configs;
  }

  public async newPublisher(): Promise<Publisher> {
    try {
      const publisher = new Publisher(this.configs);
      await publisher.init(this.connection);
      return publisher;
    } catch (err) {
      throw new RabbitMqPublisherSetupError(err.message);
    }
  }
}

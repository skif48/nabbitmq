import { RabbitMqPublisherSetupError } from '../errors/rabbitmq-publisher-setup.error';
import { PublisherConfigs } from '../interfaces/publisher-configs';
import { Publisher } from '../models/publisher';

export class PublisherFactory {
  private configs: PublisherConfigs;
  private readonly connection: any;

  constructor(connection: any, configs?: PublisherConfigs) {
    this.connection = connection;
    this.configs = configs;
  }

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

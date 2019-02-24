import { ConsumerFactory, PublisherFactory, RabbitMqConnectionFactory } from '../../src';
import { ConsumerService } from './consumer-service';
import { PublisherService } from './publisher-service';

async function main() {
  const connectionFactory = new RabbitMqConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(connection);
  consumerFactory.setConfigs({
    queue: {
      name: 'queue',
      bindingPattern: 'route.#',
    },
    exchange: {
      name: 'exchange',
      type: 'topic',
      durable: false,
    },
    prefetch: 50,
    autoAck: false,
  });
  const consumer = await consumerFactory.newConsumer();
  const consumerService = new ConsumerService(consumer);

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection);
  publisherFactory.setConfigs({
    exchange: {
      name: 'exchange',
      type: 'topic',
    },
    publisherConfirms: false,
  });
  const publisher = await publisherFactory.newPublisher();
  const publisherService = new PublisherService(publisher);

  setInterval(() => publisherService.sendMessage('hello world'), 15000);
}

main();

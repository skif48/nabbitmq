import { ConnectionFactory, ConsumerFactory } from '../src';
import { PublisherFactory } from '../src/factories/publisher-factory';

async function main() {
  const connectionFactory = new ConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(connection, {
    queue: {
      name: 'super_queue',
      topic: 'topic',
      durable: true,
    },
    exchange: {
      name: 'super_exchange',
      type: 'direct',
      durable: true,
    },
    reconnectAutomatically: true,
    noAckNeeded: false,
  });
  const consumer = await consumerFactory.newConsumer();

  consumer.startConsuming().subscribe({
    next: console.log,
    error: console.error,
    complete: () => console.log('complete'),
  });

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection, {
    exchange: {
      name: 'super_exchange',
      type: 'direct',
      durable: true,
    },
    reconnectAutomatically: true,
  });

  const publisher = await publisherFactory.newPublisher();

  publisher.actionsStream().error((err) => console.error(err));

  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), 'topic'), 1000);
}

main();

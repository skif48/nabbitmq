import { ConnectionFactory, ConsumerFactory, PublisherFactory } from '../src';

async function main() {
  const connectionFactory = new ConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(connection, {queue: {name: 'super_queue'}});
  const consumer = await consumerFactory.newConsumer();

  consumer.startConsuming().subscribe({next: console.log, error: console.error});

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection, {exchange: {name: 'exchange_super_queue'}});
  const publisher = await publisherFactory.newPublisher();
  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), 'topic'), 1000);
}

main();

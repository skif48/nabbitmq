import { ConnectionFactory, ConsumerFactory } from '../src';

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
  });
  const consumer = await consumerFactory.newConsumer<any>();

  consumer.startConsuming().subscribe({
    next: console.log,
    error: console.error,
  });
}

main();

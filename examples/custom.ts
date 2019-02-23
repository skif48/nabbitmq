import { ConsumerFactory, PublisherFactory, RabbitMqChannelCancelledError, RabbitMqChannelClosedError, RabbitMqConnectionClosedError, RabbitMqConnectionFactory, RabbitMqPublisherConfirmationError } from '../src';

async function main() {
  const connectionFactory = new RabbitMqConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const rabbitMqConnection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(rabbitMqConnection);
  consumerFactory.setCustomSetupFunction(async (connection) => {
    const channel = await connection.createChannel();
    await channel.assertExchange('exchange', 'topic', {});
    const queueMetadata = await channel.assertQueue('queue', {
      durable: true,
    });

    await channel.bindQueue(queueMetadata.queue, 'exchange', 'route.#', this.configs.queue.arguments);
    await channel.prefetch(50);

    return {channel, prefetch: 50, autoAck: false};
  });

  const consumer = await consumerFactory.newConsumer();

  consumer.startConsuming().subscribe({
    next: (msg) => {
      console.log('Received message', msg);
      consumer.commitMessage(msg);
    },
    error: (error) => {
      if (error instanceof RabbitMqConnectionClosedError)
        return void console.error('Connection was closed');

      if (error instanceof RabbitMqChannelClosedError)
        return void console.error('Channel was closed by the server');

      if (error instanceof RabbitMqChannelCancelledError)
        return void console.error('Channel cancellation occurred');
    },
  });

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection);
  publisherFactory.setCustomSetupFunction(async (connection) => {
    const channel = await connection.createConfirmChannel();
    await channel.assertExchange('exchange', 'topic', {});
    const queueMetadata = await channel.assertQueue('queue', {
      durable: true,
    });

    await channel.bindQueue(queueMetadata.queue, 'exchange', 'route.#', this.configs.queue.arguments);
    return {channel};
  });
  const publisher = await publisherFactory.newPublisher();

  publisher.actionsStream().subscribe({
    next: console.log,
    error: (error) => {
      if (error instanceof RabbitMqPublisherConfirmationError)
        return void console.error('Sent message failed to be confirmed');
    },
  });

  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), `route.${Math.ceil(Math.random() * 10)}`), 1000);
}

main();

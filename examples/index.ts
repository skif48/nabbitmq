import { ConnectionFactory, ConsumerFactory, PublisherFactory, RabbitMqChannelCancelledError, RabbitMqChannelClosedError, RabbitMqConnectionClosedError, RabbitMqError, RabbitMqPublisherConfirmationError } from '../src';

async function main() {
  const connectionFactory = new ConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(connection, {
    queue: {
      name: 'super_queue',
      bindingPattern: 'route.#',
    },
    exchange: {
      type: 'topic',
    },
    noDeadLetterQueue: true,
    autoAck: false,
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
  const publisherFactory = new PublisherFactory(anotherConnection, {
    exchange: {
      name: consumer.getActiveConfigs().exchange.name,
      type: 'topic',
    },
    publisherConfirms: true,
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

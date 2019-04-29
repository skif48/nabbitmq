import { ConsumerFactory, PublisherFactory, RabbitMqConnectionFactory } from '../src';

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
      options: {
        durable: false,
      },
    },
    prefetch: 50,
    autoAck: false,
  });
  const consumer = await consumerFactory.newConsumer();

  consumer.startConsuming().subscribe({
    next: (msg) => {
      console.log(msg);
      consumer.commitMessage(msg);
    },
    error: console.error,
  });

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection);
  publisherFactory.setConfigs({
    exchange: {
      name: 'exchange',
      type: 'topic',
      options: {
        durable: false,
      },
    },
    publisherConfirms: true,
  });
  const publisher = await publisherFactory.newPublisher();
  publisher.actionsStream().subscribe({next: console.log, error: console.error});
  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), `route.${Math.ceil(Math.random() * 10)}`), 1000);
}

main();

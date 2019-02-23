import { ConsumerFactory, PublisherFactory, RabbitMqConnectionFactory } from '../src';

async function main() {
  const connectionFactory = new RabbitMqConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(connection);
  consumerFactory.setConfigs({queue: {name: 'super_queue'}});
  const consumer = await consumerFactory.newConsumer();

  console.log(consumer.getActiveConfigs());
  consumer.startConsuming().subscribe({
    next: (msg) => {
      console.log(msg);
      consumer.commitMessage(msg);
    },
    error: console.error,
  });

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection);
  publisherFactory.setConfigs({exchange: {name: consumer.getActiveConfigs().exchange.name}});
  const publisher = await publisherFactory.newPublisher();
  console.log(publisher.getActiveConfigs());
  publisher.actionsStream().subscribe({next: console.log, error: console.error});
  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), `${consumer.getActiveConfigs().queue.name}_rk`), 1000);
}

main();

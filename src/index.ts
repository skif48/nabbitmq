import { ConnectionFactory } from "./factories/connection-factory";
import { ConsumerFactory } from "./factories/consumer-factory";

async function main() {
  const connectionFactory = new ConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory();
  consumerFactory.setConnection(connection);
  consumerFactory.setQueueName('myqueue');
  consumerFactory.setExchangeName('myexchange');
  consumerFactory.setExchangeType('fanout');
  const consumer = await consumerFactory.newConsumer<any>();

  consumer.startConsuming().subscribe({
    next: console.log,
    error: console.error,
  });
}

main();

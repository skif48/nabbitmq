<p align="center">
  <img src="https://i.imgur.com/zoFHpgH.png" height="160" alt="NabbitMQ Logo"/></a> 
  <h1>NabbitMQ</h1>
</p>

**Node.js library for interacting with RabbitMQ based on RxJS streams**

**Any suggestions, any criticism and any help from the open source community is warmly welcomed!**

### Description

NabbitMQ is a library that makes it easy for Node.js developers to interact with RabbitMQ. It's built on top of famous [amqplib](https://www.npmjs.com/package/amqplib) package and it leverages RxJS streams.

Message queues naturally are streams of events, therefore using RxJS with them is an efficient way for developers to solve complex problems in a very elegant fashion.  

There are a lot of use cases, when we don't need to setup non standard exchanges and non trivial bindings to queues. In fact, most of the time what we actually need is just **a simple queue**, just **out of the box**. And NabbitMQ is here to help you with that! All you need is to provide custom name for the queue and you're ready to go, everything else is handled for you! 

However, NabbitMQ allows you to use amqplib's promise-based api directly, so that **you can build a more complex solution** for your specific needs and still make use of RxJS streams.

### Principles and reasons

Obviously, one of the main reasons for this library to even exist is **to have the threshold of entry to RabbitMQ world a bit lower**, than it is now, but at the same time to allow us to make use of any piece of API that RabbitMQ provides us with.

The other reason is **seamless error handling** and helping developers to easily build fault tolerant solutions. For example, NabbitMQ will provide you with an **automatically set up dead letter queue that listens to your main queue**, unless you just don't need to have.

NabbitMQ has **its own set of error classes**, therefore it makes it easy for developers to debug and build solutions, that will survive even in the most "cornery" corner cases.

In the end, the main principle and goal is to have a solid and reliable solution out of the box, while working with RabbitMQ.

### Quick start

This snippet shows you how you easily spin up a solid RabbitMQ setup and quickly start to consume stream of events from it. Under the hood, NabbitMQ creates all necessary bindings, exchanges and dead letter queues, handles **reconnect logic** for you in such way that **you don't even need to rebuild the consumer**!

```typescript
import { ConnectionFactory, ConsumerFactory, PublisherFactory, RabbitMqChannelClosedError, RabbitMqError } from 'nabbitmq';

async function main() {
  const connectionFactory = new ConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(connection, {queue: {name: 'super_queue'}});
  const consumer = await consumerFactory.newConsumer();

  consumer.startConsuming().subscribe({next: console.log, error: console.error});

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection, {exchange: {name: 'super_exchange'}});
  const publisher = await publisherFactory.newPublisher();
  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), 'topic'), 1000);
}

main();

```

### More to come!

Current version is 0.0.3-alpha. It has already been successfully tested in a real world use case with plugin-based exchanges, however it's just the beginning of this library. Working hard on making it better and better!

<p align="center">
  <img src="https://i.imgur.com/zoFHpgH.png" height="160" alt="NabbitMQ Logo"/></a> 
  <h1>NabbitMQ</h1>
</p>

**Node.js library for interacting with RabbitMQ based on RxJS streams**

[![npm version](https://badge.fury.io/js/nabbitmq.svg)](https://badge.fury.io/js/nabbitmq)

**Any suggestions, any criticism and any help from the open source community is warmly welcomed!**

### Installation

```bash
npm install --save nabbitmq
```

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

This snippet demonstrates how you can easily spin up a solid RabbitMQ setup and quickly start to consume a stream of events from it. Under the hood, NabbitMQ creates all necessary bindings, exchanges, dead letter queues and provides you with **reconnect logic**.

```typescript
import { ConnectionFactory, ConsumerFactory, PublisherFactory } from 'nabbitmq';

async function main() {
  const connectionFactory = new ConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const connection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(connection);
  consumerFactory.setConfigs({queue: {name: 'super_queue'}});
  const consumer = await consumerFactory.newConsumer();

  consumer.startConsuming().subscribe({next: console.log, error: console.error});

  const anotherConnection = await connectionFactory.newConnection();
  const publisherFactory = new PublisherFactory(anotherConnection);
  publisherFactory.setConfigs({exchange: {name: consumer.getActiveConfigs().exchange.name}});
  const publisher = await publisherFactory.newPublisher();
  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), `${consumer.getActiveConfigs().queue.name}_rk`), 1000);
}

main();

```

### Overview
NabbitMQ provides you with two main abstractions: **Publisher** and **Consumer**. Each is represented by a class, that implements **RabbitMqPeer** interface. 
They are supposed to be instantiated with PublisherFactory and ConsumerFactory classes.
However, there is a third abstraction called RabbitMqConnection. 
This is a class, that holds an active connection data to the used RabbitMQ server. 
It is injected into publishers and consumers via their factories.
Configs to setup RabbitMQ internal structure of exchanges, queues and bindings, are provided to factories in form of plain JavaScript/TypeScript objects. 
There are interfaces for these objects, called **ConsumerConfigs** and **PublisherConfigs**.
Most of the values for these objects are optional, the consumers and publishers themselves fill them up with some standard values. For example, if your provide a queue name like *my_queue*, but don't provide an exchange name, the exchange will be called *exchange_my_queue* - you can rely on that.
Also, if **dead letter queue** has to be set up (which is optional), but no name for it provided, consumer will also result with default name like *my_queue_dlq*.
Dead letter exchange will have the following form: *exchange_my_queue_dlq*.


However, it is obvious that you might need to have a rare and not so generic RabbitMQ structure with more than one queue and more than one exchange. 
Therefore there is an option for you not to provide these configs, but to provide a so called **custom setup function**. 
This function accepts a connection object from underlying amqplib package. 
Inside of this function you can do whatever you need, but it should return a *promise* that resolves with an object that contains amqplib channel instance and optional consumer's prefetch count, if you use this function to set up a consumer (not mandatory though, a default prefetch value will be set if not provided).

### Basics

**Consumer configs**

The only required field to setup a consumer is name of the queue you want to use. 
Every other field is optional and will be filled by consumer itself.
Here is an example of how consumer configs object will look like, when there was only queue name *my_queue* provided:

```javascript
const configs = { 
  queue: { 
    name: 'my_queue',
    durable: true, // queue persistence is enabled by default
    arguments: {}, // empty arguments for queue to assert by default
    bindingPattern: 'my_queue_rk', // routing key name: `${your queue name}_rk`
  },
  exchange: { 
    name: 'exchange_my_queue', // exchange name: `exchange_${your queue name}`
    durable: true, // exchange persistence is enabled by default
    arguments: {}, // empty arguments for exchange to assert by default
    type: 'direct', // direct binding type by default with a name
  },
  autoAck: false, // RabbitMQ acknowledge on send is disabled by default, meaning that by default you have to commit your messages.
  prefetch: 100, // consumer prefetch
  reconnectAttempts: -1, // infinite amount of reconnect attempts
  reconnectTimeoutMillis: 1000, // 1 second window between failing reconnect attempts
  deadLetterQueue: { // dead letter queue is built and bound by default
    name: 'dlq_my_queue', // dead letter queue name: `dlq_${your queue name}`
    exchangeName: 'exchange_dlq_my_queue', // dead letter queue exchange name: `exchange_${dead letter queue name}`
    exchangeType: 'fanout', // fanout type for dead letter exchange by default 
  }
};
```

As for publisher, the only required field is the name of the exchange to publish to, everything else will be filled with default values by publisher itself.
Here is an example of publisher configs with *my_exchange* exchange name:

```javascript
const configs = { 
  exchange: {
    name: 'my_exchange',
    durable: true, // exchange persistence is enabled by default
    arguments: {}, // empty arguments for exchange to assert by default
    type: 'direct', // direct binding type by default
  },
  publisherConfirms: true, // publisher confirmations are enabled by default
  reconnectAttempts: -1, // infinite amount of reconnect attempts
  reconnectTimeoutMillis: 1000, // 1 second window between failing reconnect attempts
};
``` 
### Usage
**Topic exchange type**

**With custom setup function**

At this point of time, standard consumer configs are supposed to build a one-to-one relationships between exchanges and queues. 
Obviously, it might not be suitable for use cases, when we need to leverage, for example, routing based bindings between one exchange and many queues. 
Therefore custom setup functions can be used to build consumers and publishers. Here is a snippet that makes of use such approach:

```typescript
import { RabbitMqConnectionFactory, ConsumerFactory, PublisherFactory, RabbitMqChannelCancelledError, RabbitMqChannelClosedError, RabbitMqConnectionClosedError, RabbitMqPublisherConfirmationError } from '../src';

async function main() {
  const connectionFactory = new RabbitMqConnectionFactory();
  connectionFactory.setUri('amqp://localhost:5672');
  const rabbitMqConnection = await connectionFactory.newConnection();
  const consumerFactory = new ConsumerFactory(rabbitMqConnection);
  consumerFactory.setCustomSetupFunction(async (connection) => { // setting up our function
    const channel = await connection.createChannel();
    await channel.assertExchange('exchange', 'topic', {});
    const queueMetadata = await channel.assertQueue('queue', {
      durable: true,
    });

    await channel.bindQueue(queueMetadata.queue, 'exchange', 'route.#', this.configs.queue.arguments);
    await channel.prefetch(50);

    return {channel, prefetch: 50}; // returning an object with channel and prefetch count. Prefetch is optional
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
    return {channel}; // returning an object with channel
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
```

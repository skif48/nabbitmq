
<p align="center">
  <img src="https://i.imgur.com/zoFHpgH.png" height="160" alt="NabbitMQ Logo"/></a> 
  <h1>NabbitMQ</h1>
</p>

**Any suggestions, any criticism and any help from the open source community is warmly welcomed!**

### Description

NabbitMQ is a library that makes it easy for Node.js developers to interact with RabbitMQ. It's built on top of famous [amqplib](https://www.npmjs.com/package/amqplib) package and it leverages RxJS streams.

Message queues naturally are streams of events, therefore using RxJs with them is an efficient way for developers to solve complex problems in a very elegant fashion.  

There are a lot of use cases, when we don't need to setup non standard exchanges and non trivial bindings to queues. In fact, most of the time what we actually need is just **a simple queue**, just **out of the box**. And NabbitMQ is here to help you with that! All you need is to provide custom names for the exchange and the queue, some basic configs (acknowledgments, reconnect attempts and timeouts etc.) and you're ready to go! 

However, NabbitMQ allows you to use amqplib's promise-based api directly, so that **you can build a more complex solution** for your specific needs and still make use of RxJS streams.

### Principles and reasons

Obviously, one of the main reason for this library to even exist is **to have the threshold of entry to RabbitMQ world a bit lower**, than it is now, but at the same time to allow us to make use of any piece of API that RabbitMQ provides us with.

The other reason is a **seamless error handling** and helping developers to easily build fault tolerant solutions. For example, NabbitMQ will provide you with an **automatically set up dead letter queue that listens to your main queue**, unless you just don't need to have.

NabbitMQ has **its own set of error classes**, therefore it makes it easy for developers to debug and build solutions, that will survive even in the most "cornery" corner cases.

In the end, the main principle and goal is to have a solid and reliable solution out of the box, while working with RabbitMQ.

### Example

```typescript
import { ConnectionFactory, ConsumerFactory, PublisherFactory, RabbitMqChannelClosedError, RabbitMqError } from 'nabbitmq';

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
    next: (message) => {},
    error: (error) => {
      if (error instanceof RabbitMqChannelClosedError) {
        console.error('Oops, consumer\'s channel was closed..');
        return;
      }
      
      if (error instanceof RabbitMqError) {
        console.error('So our consumer has a problem talking to RabbitMQ');
      }
    },
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

  publisher.actionsStream().error((error) => {
    if (error instanceof RabbitMqChannelClosedError) {
      console.error('Oops, publisher\'s channel was closed..');
    }
    
    if (error instanceof RabbitMqError) {
      console.error('So our publisher has a problem talking to RabbitMQ');
    }
  });

  setInterval(() => publisher.publishMessage(Buffer.from('hello hello!'), 'topic'), 1000);
}

main();

```


### More to come!

Current version is 0.0.2-alpha. It has already been successfully tested in a real world use case with plugin-based exchanges, however it's just the beginning of this library. Working hard on making it better and better!

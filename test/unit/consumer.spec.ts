import * as amqp from 'amqplib';
import { expect } from 'chai';
import { timeout } from 'rxjs/operators';
import * as sinon from 'sinon';
import { Consumer, ConsumerConfigs, ConsumerFactory, RabbitMqConnection, RabbitMqConnectionFactory } from '../../src';
import { RabbitMqReconnectError } from '../../src/errors/rabbitmq-reconnect.error';
import { RabbitMqConsumerSetupFunction } from '../../src/interfaces/rabbit-mq-setup-function';

const noop = () => {};
const amqpChannelStub = {
  assertExchange: noop,
  assertQueue: () => Promise.resolve({queue: 'queue'}),
  bindQueue: noop,
  prefetch: noop,
  consume: noop,
  on: noop,
};
const amqpConnectionStub = {
  on: noop,
  createChannel: () => Promise.resolve(amqpChannelStub),
};

describe('Consumer unit tests', () => {
  describe('default configs fill up', () => {
    it('should build correct default consumer configs with proper names and bindings', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange_my_queue',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should create a non durable queue, if such option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
          options: {
            durable: false,
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: false,
          },
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange_my_queue',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should supply non empty queue arguments, if such options is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
          options: {
            arguments: {some: 'key'},
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
            arguments: {some: 'key'},
          },
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange_my_queue',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should use supplied exchange name, if provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should create a non durable exchange, if such option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: false,
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: false,
          },
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should supply non empty exchange arguments, if such option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          options: {
            arguments: {some: 'key'},
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
            arguments: {some: 'key'},
          },
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should create a fanout exchange without binding pattern, if fanout type is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should ignore provided binding pattern, if exchange type set to fanout', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
          bindingPattern: 'whatever',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should throw an error in case no binding pattern is provided, if exchange type set to topic', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'topic',
        },
      };

      const consumer = new Consumer();
      const setConfigsSpy = sinon.spy(consumer, 'setConfigs');

      try {
        consumer.setConfigs(consumerConfigs);
      } catch (err) {}

      expect(setConfigsSpy.threw());
    });

    it('should enable automatic acknowledgements, if such option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        autoAck: true,
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: true,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should set requested prefetch, if such option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        prefetch: 5,
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 5,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should throw an error in case 0 prefetch is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
        },
        prefetch: 0,
      };

      const consumer = new Consumer();
      const setConfigsSpy = sinon.spy(consumer, 'setConfigs');

      try {
        consumer.setConfigs(consumerConfigs);
      } catch (err) {}

      expect(setConfigsSpy.threw());
    });

    it('should throw an error in case negative prefetch is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
        },
        prefetch: -1,
      };

      const consumer = new Consumer();
      const setConfigsSpy = sinon.spy(consumer, 'setConfigs');

      try {
        consumer.setConfigs(consumerConfigs);
      } catch (err) {}

      expect(setConfigsSpy.threw());
    });

    it('should set requested reconnect attempts, if provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        reconnectAttempts: 5,
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: 5,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should throw an error in case negative reconnect attempts provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
        },
        reconnectAttempts: -1,
      };

      const consumer = new Consumer();
      const setConfigsSpy = sinon.spy(consumer, 'setConfigs');

      try {
        consumer.setConfigs(consumerConfigs);
      } catch (err) {}

      expect(setConfigsSpy.threw());
    });

    it('should set requested reconnect timeout millis, if provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        reconnectTimeoutMillis: 2000,
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 2000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_my_queue_rk',
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should throw an error in case negative reconnect timeout millis provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
        },
        reconnectTimeoutMillis: -1,
      };

      const consumer = new Consumer();
      const setConfigsSpy = sinon.spy(consumer, 'setConfigs');

      try {
        consumer.setConfigs(consumerConfigs);
      } catch (err) {}

      expect(setConfigsSpy.threw());
    });

    it('should not create dead letter queue, if such option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        noDeadLetterQueue: true,
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
      });
    });

    it('should ignore dead letter queue configs, if no dead letter queue option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        reconnectTimeoutMillis: 2000,
        noDeadLetterQueue: true,
        deadLetterQueue: {
          queue: {
            name: 'dlq',
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 2000,
      });
    });

    it('should create dead letter queue setup according to its name', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        deadLetterQueue: {
          queue: {
            name: 'dlq',
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_rk',
            name: 'dlq',
          },
        },
      });
    });

    it('should create non durable dead letter queue', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        deadLetterQueue: {
          queue: {
            name: 'dlq',
            options: {
              durable: false,
            },
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq',
            type: 'direct',
          },
          queue: {
            options: {
              durable: false,
            },
            bindingPattern: 'dlq_rk',
            name: 'dlq',
          },
        },
      });
    });

    it('should create dead letter queue setup with requested exchange name', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        deadLetterQueue: {
          queue: {
            name: 'dlq',
          },
          exchange: {
            name: 'exchange_for_dlq',
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_for_dlq',
            type: 'direct',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'dlq_rk',
            name: 'dlq',
          },
        },
      });
    });

    it('should create dead letter queue setup with fanout exchange type and without binding pattern', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        deadLetterQueue: {
          queue: {
            name: 'dlq',
          },
          exchange: {
            type: 'fanout',
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq',
            type: 'fanout',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: '',
            name: 'dlq',
          },
        },
      });
    });

    it('should create dead letter queue setup with topic exchange type', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
          type: 'fanout',
        },
        deadLetterQueue: {
          queue: {
            name: 'dlq',
            bindingPattern: 'topic.#',
          },
          exchange: {
            type: 'topic',
          },
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          options: {
            durable: true,
          },
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            options: {
              durable: true,
            },
            name: 'exchange_dlq',
            type: 'topic',
          },
          queue: {
            options: {
              durable: true,
            },
            bindingPattern: 'topic.#',
            name: 'dlq',
          },
        },
      });
    });

    it('should throw an error in case topic dlq exchange provided without binding pattern', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        exchange: {
          name: 'exchange',
        },
        deadLetterQueue: {
          queue: {
            name: 'dlq',
          },
          exchange: {
            type: 'topic',
          },
        },
      };

      const consumer = new Consumer();
      const setConfigsSpy = sinon.spy(consumer, 'setConfigs');

      try {
        consumer.setConfigs(consumerConfigs);
      } catch (err) {}

      expect(setConfigsSpy.threw());
    });
  });

  describe('default initialization', () => {
    before(() => {
      sinon.stub(amqp, 'connect').callsFake(() => Promise.resolve({}));
      sinon.stub(RabbitMqConnection.prototype, 'getAmqpConnection').callsFake(() => amqpConnectionStub);
    });

    after(() => {
      (amqp['connect'] as any).restore();
      (RabbitMqConnection.prototype['getAmqpConnection'] as any).restore();
    });

    afterEach(() => {
      Object.keys(amqpChannelStub).forEach((key) => {
        if (amqpChannelStub[key].restore)
          amqpChannelStub[key].restore();
      });
      Object.keys(amqpConnectionStub).forEach((key) => {
        if (amqpConnectionStub[key].restore)
          amqpConnectionStub[key].restore();
      });
    });

    it('should use default setup strategy if no custom setup function provided', async () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
      };

      const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setUri('amqp://localhost:5672');

      const connection = await connectionFactory.newConnection();
      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const createChannelSpy = sinon.spy(amqpConnectionStub, 'createChannel');
      const assertExchangeSpy = sinon.spy(amqpChannelStub, 'assertExchange');
      const assertQueueSpy = sinon.spy(amqpChannelStub, 'assertQueue');
      const bindQueueSpy = sinon.spy(amqpChannelStub, 'bindQueue');
      const prefetchSpy = sinon.spy(amqpChannelStub, 'prefetch');
      await consumer.init(connection);

      expect(createChannelSpy.calledOnce).to.be.equal(true);
      expect(assertExchangeSpy.calledTwice).to.be.equal(true); // dlq
      expect(assertQueueSpy.calledTwice).to.be.equal(true); // dlq
      expect(bindQueueSpy.calledTwice).to.be.equal(true); // dlq
      expect(bindQueueSpy.calledTwice).to.be.equal(true); // dlq
      expect(prefetchSpy.calledOnce).to.be.equal(true);
    });

    it('should not set up dead letter queue if such option is provided', async () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
        },
        noDeadLetterQueue: true,
      };

      const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setUri('amqp://localhost:5672');

      const connection = await connectionFactory.newConnection();
      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const createChannelSpy = sinon.spy(amqpConnectionStub, 'createChannel');
      const assertExchangeSpy = sinon.spy(amqpChannelStub, 'assertExchange');
      const assertQueueSpy = sinon.spy(amqpChannelStub, 'assertQueue');
      const bindQueueSpy = sinon.spy(amqpChannelStub, 'bindQueue');
      const prefetchSpy = sinon.spy(amqpChannelStub, 'prefetch');
      await consumer.init(connection);

      expect(createChannelSpy.calledOnce).to.be.equal(true);
      expect(assertExchangeSpy.calledOnce).to.be.equal(true);
      expect(assertQueueSpy.calledOnce).to.be.equal(true);
      expect(bindQueueSpy.calledOnce).to.be.equal(true);
      expect(prefetchSpy.calledOnce).to.be.equal(true);
    });
  });

  describe('custom setup function initialization', () => {
    before(() => {
      sinon.stub(amqp, 'connect').callsFake(() => Promise.resolve({}));
      sinon.stub(RabbitMqConnection.prototype, 'getAmqpConnection').callsFake(() => amqpConnectionStub);
    });

    after(() => {
      (amqp['connect'] as any).restore();
      (RabbitMqConnection.prototype['getAmqpConnection'] as any).restore();
    });

    afterEach(() => {
      Object.keys(amqpChannelStub).forEach((key) => {
        if (amqpChannelStub[key].restore)
          amqpChannelStub[key].restore();
      });
      Object.keys(amqpConnectionStub).forEach((key) => {
        if (amqpConnectionStub[key].restore)
          amqpConnectionStub[key].restore();
      });
    });

    it('should successfully setup consumer with custom setup function', async () => {
      const customSetupFunction: RabbitMqConsumerSetupFunction = () => Promise.resolve({
        channel: amqpChannelStub as any,
        queue: 'queue',
      });

      const customSetupFunctionSpy = sinon.spy(customSetupFunction);

      const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setUri('amqp://localhost:5672');
      const connection = await connectionFactory.newConnection();
      const consumer = new Consumer();
      consumer.setCustomSetupFunction(customSetupFunctionSpy);
      await consumer.init(connection);

      expect(customSetupFunctionSpy.calledOnce).to.be.equal(true);
    });
  });

  describe('reconnect logic', () => {
    beforeEach(() => {
      sinon.stub(amqp, 'connect').callsFake(() => Promise.resolve(amqpConnectionStub));
    });

    afterEach(() => {
      amqp.connect['restore']();
    });

    it('should use uri to reconnect, if provided', async () => {
      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setUri('amqp://localhost:5672');
      const connection = await connectionFactory.newConnection();
      const consumerFactory = new ConsumerFactory(connection);
      consumerFactory.setConfigs({
        queue: {
          name: 'test_queue',
        },
      });

      const consumer = await consumerFactory.newConsumer();
      await consumer.init(connection);
      const getUriSpy = sinon.spy(connection, 'getUri');
      await consumer.reconnect().toPromise();
      expect(getUriSpy.calledTwice).to.be.equal(true);
    });

    it('should use options to reconnect, if no uri provided', async () => {
      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      const connection = await connectionFactory.newConnection();
      const consumerFactory = new ConsumerFactory(connection);
      consumerFactory.setConfigs({
        queue: {
          name: 'test_queue',
        },
      });

      const consumer = await consumerFactory.newConsumer();
      await consumer.init(connection);
      const getUriSpy = sinon.spy(connection, 'getUri');
      const setUriSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'setUri');
      const setOptionsSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'setOptions');
      await consumer.reconnect().toPromise();
      expect(getUriSpy.calledOnce).to.be.equal(true);
      expect(setUriSpy.notCalled).to.be.equal(true);
      expect(setOptionsSpy.calledOnce).to.be.equal(true);

      RabbitMqConnectionFactory.prototype.setUri['restore']();
      RabbitMqConnectionFactory.prototype.setOptions['restore']();
    });

    it('should use provided timeout to reconnect', async () => {
      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      const connection = await connectionFactory.newConnection();
      const consumerFactory = new ConsumerFactory(connection);
      consumerFactory.setConfigs({
        queue: {
          name: 'test_queue',
        },
        reconnectTimeoutMillis: 300,
      });

      const consumer = await consumerFactory.newConsumer();
      await consumer.init(connection);
      const newConnectionSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'newConnection');
      sinon.stub(consumer, 'init').callsFake(() => Promise.reject());

      try {
        await consumer.reconnect()
          .pipe(
            timeout(1200),
          )
          .toPromise();
      } catch (err) {}

      expect(newConnectionSpy.callCount).to.be.equal(4);
      RabbitMqConnectionFactory.prototype.newConnection['restore']();
    });

    it('should use provided retry amount to reconnect and throw RabbitMqReconnectError in the end', async () => {
      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      const connection = await connectionFactory.newConnection();
      const consumerFactory = new ConsumerFactory(connection);
      consumerFactory.setConfigs({
        queue: {
          name: 'test_queue',
        },
        reconnectTimeoutMillis: 400,
        reconnectAttempts: 3,
      });

      const consumer = await consumerFactory.newConsumer();
      await consumer.init(connection);
      const newConnectionSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'newConnection');
      sinon.stub(consumer, 'init').callsFake(() => Promise.reject());

      let error;

      try {
        await consumer.reconnect().toPromise();
      } catch (err) {
        error = err;
      }

      expect(error).to.be.instanceof(RabbitMqReconnectError);
      expect(newConnectionSpy.calledThrice).to.be.equal(true);
      RabbitMqConnectionFactory.prototype.newConnection['restore']();
    });

    it('should successfully reconnect', async () => {
      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      const connection = await connectionFactory.newConnection();
      const consumerFactory = new ConsumerFactory(connection);
      consumerFactory.setConfigs({
        queue: {
          name: 'test_queue',
        },
      });

      const consumer = await consumerFactory.newConsumer();
      await consumer.init(connection);
      const newConnectionSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'newConnection');
      const initSpy = sinon.spy(consumer, 'init');

      await consumer.reconnect().toPromise();

      expect(newConnectionSpy.calledOnce).to.be.equal(true);
      expect(initSpy.calledOnce).to.be.equal(true);
      RabbitMqConnectionFactory.prototype.newConnection['restore']();
    });
  });
});

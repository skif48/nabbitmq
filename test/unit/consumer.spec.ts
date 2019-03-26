import { expect } from 'chai';
import * as sinon from 'sinon';
import { Consumer, ConsumerConfigs } from '../../src';

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
          durable: true,
          arguments: {},
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange_my_queue',
          durable: true,
          arguments: {},
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should create a non durable queue, if such option is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
          durable: false,
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          durable: false,
          arguments: {},
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange_my_queue',
          durable: true,
          arguments: {},
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
            name: 'dlq_my_queue',
          },
        },
      });
    });

    it('should supply non empty queue arguments, if such options is provided', () => {
      const consumerConfigs: ConsumerConfigs = {
        queue: {
          name: 'my_queue',
          arguments: {some: 'key'},
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          durable: true,
          arguments: {some: 'key'},
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange_my_queue',
          durable: true,
          arguments: {},
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: false,
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          durable: true,
          arguments: {},
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange',
          durable: false,
          arguments: {},
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          arguments: {some: 'key'},
        },
      };

      const consumer = new Consumer();
      consumer.setConfigs(consumerConfigs);

      const builtConfigs: ConsumerConfigs = consumer.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        queue: {
          name: 'my_queue',
          durable: true,
          arguments: {},
          bindingPattern: 'my_queue_rk',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {some: 'key'},
          type: 'direct',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: true,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 5,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: 5,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 2000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq_my_queue',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_my_queue_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_rk',
            durable: false,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_for_dlq',
            type: 'direct',
          },
          queue: {
            arguments: {},
            bindingPattern: 'dlq_rk',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq',
            type: 'fanout',
          },
          queue: {
            arguments: {},
            bindingPattern: '',
            durable: true,
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
          durable: true,
          arguments: {},
          bindingPattern: '',
        },
        exchange: {
          name: 'exchange',
          durable: true,
          arguments: {},
          type: 'fanout',
        },
        autoAck: false,
        prefetch: 100,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
        deadLetterQueue: {
          exchange: {
            arguments: {},
            durable: true,
            name: 'exchange_dlq',
            type: 'topic',
          },
          queue: {
            arguments: {},
            bindingPattern: 'topic.#',
            durable: true,
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
});

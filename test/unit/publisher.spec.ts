import * as amqp from 'amqplib';
import { expect } from 'chai';
import { timeout } from 'rxjs/operators';
import * as sinon from 'sinon';
import { Publisher, PublisherConfigs, PublisherFactory, RabbitMqConnection, RabbitMqConnectionFactory } from '../../src';
import { RabbitMqReconnectError } from '../../src/errors/rabbitmq-reconnect.error';

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
  createConfirmChannel: () => Promise.resolve(amqpChannelStub),
};

describe('Publisher unit tests', () => {
  describe('default configs fill up', () => {
    it('should build correct default configs with proper names and bindings', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
        },
      };

      const publisher = new Publisher();
      publisher.setConfigs(configs);
      const builtConfigs = publisher.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        exchange: {
          name: 'test_exchange',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        publisherConfirms: true,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
      });
    });

    it('should use non durable option if provided', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
          options: {
            durable: false,
          },
        },
      };

      const publisher = new Publisher();
      publisher.setConfigs(configs);
      const builtConfigs = publisher.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        exchange: {
          name: 'test_exchange',
          options: {
            durable: false,
          },
          type: 'direct',
        },
        publisherConfirms: true,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
      });
    });

    it('should use provided exchange type', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
          type: 'fanout',
        },
      };

      const publisher = new Publisher();
      publisher.setConfigs(configs);
      const builtConfigs = publisher.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        exchange: {
          name: 'test_exchange',
          options: {
            durable: true,
          },
          type: 'fanout',
        },
        publisherConfirms: true,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
      });
    });

    it('should not enable publisher confirms, if such option is provided', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
        },
        publisherConfirms: false,
      };

      const publisher = new Publisher();
      publisher.setConfigs(configs);
      const builtConfigs = publisher.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        exchange: {
          name: 'test_exchange',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        publisherConfirms: false,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
      });
    });

    it('should use provided reconnect attempts', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
        },
        reconnectAttempts: 100,
      };

      const publisher = new Publisher();
      publisher.setConfigs(configs);
      const builtConfigs = publisher.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        exchange: {
          name: 'test_exchange',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        publisherConfirms: true,
        reconnectAttempts: 100,
        reconnectTimeoutMillis: 1000,
      });
    });

    it('should throw an error if provided reconnect attempts count is negative and not -1', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
        },
        reconnectAttempts: -500,
      };

      const publisher = new Publisher();

      let error;

      try {
        publisher.setConfigs(configs);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.not.equal(undefined);
    });

    it('should use provided reconnect timeout', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
        },
        reconnectTimeoutMillis: 500,
      };

      const publisher = new Publisher();
      publisher.setConfigs(configs);
      const builtConfigs = publisher.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        exchange: {
          name: 'test_exchange',
          options: {
            durable: true,
          },
          type: 'direct',
        },
        publisherConfirms: true,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 500,
      });
    });

    it('should throw an error if provided reconnect timeout is negative', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
        },
        reconnectTimeoutMillis: -500,
      };

      const publisher = new Publisher();

      let error;

      try {
        publisher.setConfigs(configs);
      } catch (err) {
        error = err;
      }

      expect(error).to.be.not.equal(undefined);
    });

    it('should use provided exchange arguments', async () => {
      const configs: PublisherConfigs = {
        exchange: {
          name: 'test_exchange',
          options: {
            arguments: {some: 'key'},
          },
        },
      };

      const publisher = new Publisher();
      publisher.setConfigs(configs);
      const builtConfigs = publisher.getActiveConfigs();

      expect(builtConfigs).to.be.deep.equal({
        exchange: {
          name: 'test_exchange',
          options: {
            durable: true,
            arguments: {
              some: 'key',
            },
          },
          type: 'direct',
        },
        publisherConfirms: true,
        reconnectAttempts: -1,
        reconnectTimeoutMillis: 1000,
      });
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
      const publisherConfigs: PublisherConfigs = {
        exchange: {
          name: 'my_exc',
        },
      };

      const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setUri('amqp://localhost:5672');

      const connection = await connectionFactory.newConnection();
      const publisher = new Publisher();
      publisher.setConfigs(publisherConfigs);

      const createConfirmChannelSpy = sinon.spy(amqpConnectionStub, 'createConfirmChannel');
      const assertExchangeSpy = sinon.spy(amqpChannelStub, 'assertExchange');
      await publisher.init(connection);

      expect(createConfirmChannelSpy.calledOnce).to.be.equal(true);
      expect(assertExchangeSpy.calledOnce).to.be.equal(true);
    });

    it('should not set publisher confirms if such option is provided', async () => {
      const publisherConfigs: PublisherConfigs = {
        exchange: {
          name: 'my_queue',
        },
        publisherConfirms: false,
      };

      const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setUri('amqp://localhost:5672');

      const connection = await connectionFactory.newConnection();
      const publisher = new Publisher();
      publisher.setConfigs(publisherConfigs);

      const createChannelSpy = sinon.spy(amqpConnectionStub, 'createChannel');
      const assertExchangeSpy = sinon.spy(amqpChannelStub, 'assertExchange');
      await publisher.init(connection);

      expect(createChannelSpy.calledOnce).to.be.equal(true);
      expect(assertExchangeSpy.calledOnce).to.be.equal(true);
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
      const publisherFactory = new PublisherFactory(connection);
      publisherFactory.setConfigs({
        exchange: {
          name: 'my_exc',
        },
      });

      const publisher = await publisherFactory.newPublisher();
      await publisher.init(connection);
      const getUriSpy = sinon.spy(connection, 'getUri');
      await publisher.reconnect().toPromise();
      expect(getUriSpy.calledTwice).to.be.equal(true);
    });

    it('should use options to reconnect, if no uri provided', async () => {
      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      const connection = await connectionFactory.newConnection();
      const publisherFactory = new PublisherFactory(connection);
      publisherFactory.setConfigs({
        exchange: {
          name: 'my_exc',
        },
      });

      const publisher = await publisherFactory.newPublisher();
      await publisher.init(connection);
      const getUriSpy = sinon.spy(connection, 'getUri');
      const setUriSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'setUri');
      const setOptionsSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'setOptions');
      await publisher.reconnect().toPromise();
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
      const publisherFactory = new PublisherFactory(connection);
      publisherFactory.setConfigs({
        exchange: {
          name: 'my_exc',
        },
        reconnectTimeoutMillis: 300,
      });

      const publisher = await publisherFactory.newPublisher();
      await publisher.init(connection);
      const newConnectionSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'newConnection');
      sinon.stub(publisher, 'init').callsFake(() => Promise.reject());

      try {
        await publisher.reconnect()
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
      const publisherFactory = new PublisherFactory(connection);
      publisherFactory.setConfigs({
        exchange: {
          name: 'my_exc',
        },
        reconnectTimeoutMillis: 400,
        reconnectAttempts: 3,
      });

      const consumer = await publisherFactory.newPublisher();
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
      const publisherFactory = new PublisherFactory(connection);
      publisherFactory.setConfigs({
        exchange: {
          name: 'my_exc',
        },
      });

      const publisher = await publisherFactory.newPublisher();
      await publisher.init(connection);
      const newConnectionSpy = sinon.spy(RabbitMqConnectionFactory.prototype, 'newConnection');
      const initSpy = sinon.spy(publisher, 'init');

      await publisher.reconnect().toPromise();

      expect(newConnectionSpy.calledOnce).to.be.equal(true);
      expect(initSpy.calledOnce).to.be.equal(true);
      RabbitMqConnectionFactory.prototype.newConnection['restore']();
    });
  });
});

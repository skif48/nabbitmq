import * as amqp from 'amqplib';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Consumer, ConsumerFactory, RabbitMqConnection, RabbitMqConnectionFactory } from '../../src';

const noop = () => void 0;

describe('Consumer factory unit tests', () => {
  describe('consumer build tests', () => {
    let setCustomSetupFunctionSpy;
    let setConfigsSpy;
    let connection: RabbitMqConnection;

    before(() => {
      sinon.stub(amqp, 'connect').callsFake(() => Promise.resolve({}));
    });

    beforeEach(async () => {
      setCustomSetupFunctionSpy = sinon.spy(Consumer.prototype, 'setCustomSetupFunction');
      setConfigsSpy = sinon.spy(Consumer.prototype, 'setConfigs');

      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      connection = await connectionFactory.newConnection();

      sinon.stub(connection, 'getAmqpConnection').callsFake(() => ({
        on: noop,
        createChannel: () => Promise.resolve({
          assertExchange: noop,
          assertQueue: () => Promise.resolve({queue: 'queue'}),
          bindQueue: noop,
          prefetch: noop,
          consume: noop,
          on: noop,
        }),
      }));
    });

    after(() => {
      (amqp['connect'] as any).restore();
    });

    afterEach(() => {
      if (Consumer.prototype.setCustomSetupFunction['restore'])
        Consumer.prototype.setCustomSetupFunction['restore']();

      if (Consumer.prototype.setConfigs['restore'])
        Consumer.prototype.setConfigs['restore']();
    });

    it('should prefer custom setup function over consumer configs object', async () => {
      const consumerFactory = new ConsumerFactory(connection);
      consumerFactory.setConfigs({
        queue: {
          name: 'test_queue',
        },
      });
      consumerFactory.setCustomSetupFunction(() => Promise.resolve({channel: {consume: noop, on: noop} as any, queue: ''}));
      await consumerFactory.newConsumer();

      expect(setCustomSetupFunctionSpy.calledOnce).to.be.equal(true);
      expect(setConfigsSpy.notCalled).to.be.equal(true);
    });

    it('should use options configs if provided', async () => {
      const consumerFactory = new ConsumerFactory(connection);
      consumerFactory.setConfigs({
        queue: {
          name: 'test_queue',
        },
      });
      await consumerFactory.newConsumer();

      expect(setConfigsSpy.calledOnce).to.be.equal(true);
      expect(setCustomSetupFunctionSpy.notCalled).to.be.equal(true);
    });

    it('should throw an error in case neither custom setup function nor config object were provided', async () => {
      const consumerFactory = new ConsumerFactory(connection);
      let error;

      try {
        await consumerFactory.newConsumer();
      } catch (err) {
        error = err;
      }

      expect(error).to.be.not.equal(undefined);
    });
  });
});

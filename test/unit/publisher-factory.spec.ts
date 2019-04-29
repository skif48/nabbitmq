import * as amqp from 'amqplib';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Publisher, PublisherFactory, RabbitMqConnection, RabbitMqConnectionFactory } from '../../src';

const noop = () => void 0;

describe('Publisher factory unit tests', () => {
  describe('publisher build tests', () => {
    let setCustomSetupFunctionSpy;
    let setConfigsSpy;
    let connection: RabbitMqConnection;

    before(() => {
      sinon.stub(amqp, 'connect').callsFake(() => Promise.resolve({}));
    });

    beforeEach(async () => {
      setCustomSetupFunctionSpy = sinon.spy(Publisher.prototype, 'setCustomSetupFunction');
      setConfigsSpy = sinon.spy(Publisher.prototype, 'setConfigs');

      const connectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      connection = await connectionFactory.newConnection();

      sinon.stub(connection, 'getAmqpConnection').callsFake(() => ({
        on: noop,
        createConfirmChannel: () => Promise.resolve({
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
      if (Publisher.prototype.setCustomSetupFunction['restore'])
        Publisher.prototype.setCustomSetupFunction['restore']();

      if (Publisher.prototype.setConfigs['restore'])
        Publisher.prototype.setConfigs['restore']();
    });

    it('should prefer custom setup function over consumer configs object', async () => {
      const publisherFactory = new PublisherFactory(connection);
      publisherFactory.setConfigs({
        exchange: {
          name: 'my_exc',
        },
      });
      publisherFactory.setCustomSetupFunction(() => Promise.resolve({channel: {createConfirmChannel: noop, on: noop} as any, exchange: ''}));
      await publisherFactory.newPublisher();

      expect(setCustomSetupFunctionSpy.calledOnce).to.be.equal(true);
      expect(setConfigsSpy.notCalled).to.be.equal(true);
    });

    it('should use options configs if provided', async () => {
      const publisherFactory = new PublisherFactory(connection);
      publisherFactory.setConfigs({
        exchange: {
          name: 'my_exc',
        },
      });
      await publisherFactory.newPublisher();

      expect(setConfigsSpy.calledOnce).to.be.equal(true);
      expect(setCustomSetupFunctionSpy.notCalled).to.be.equal(true);
    });

    it('should throw an error in case neither custom setup function nor config object were provided', async () => {
      const publisherFactory = new PublisherFactory(connection);
      let error;

      try {
        await publisherFactory.newPublisher();
      } catch (err) {
        error = err;
      }

      expect(error).to.be.not.equal(undefined);
    });
  });
});

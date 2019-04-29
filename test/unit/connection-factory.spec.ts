import * as amqp from 'amqplib';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { RabbitMqConnectionError, RabbitMqConnectionFactory } from '../../src';

describe('RabbitMqConnectionFactory unit tests', () => {
  describe('factory tests', () => {
    before(() => {
      sinon.stub(amqp, 'connect').callsFake(() => Promise.resolve({}));
    });

    after(() => {
      (amqp['connect'] as any).restore();
    });

    it('should successfully build a connection with options', async () => {
      let error;
      try {
        const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
        connectionFactory.setOptions({});

        await connectionFactory.newConnection();
      } catch (err) {
        error = err;
      }

      expect(error).to.be.equal(undefined);
    });

    it('should successfully build a connection with uri string', async () => {
      let error;
      try {
        const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
        connectionFactory.setUri('amqp://localhost:5672');

        await connectionFactory.newConnection();
      } catch (err) {
        error = err;
      }

      expect(error).to.be.equal(undefined);
    });

    it('should throw an error in case no options and no connection uri provided', async () => {
      let error;
      try {
        await new RabbitMqConnectionFactory().newConnection();
      } catch (err) {
        error = err;
      }

      expect(error).to.be.instanceOf(RabbitMqConnectionError);
    });
  });
});

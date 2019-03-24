import * as amqp from 'amqplib';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { RabbitMqConnectionFactory } from '../../src';

describe('RabbitMqConnection unit tests', () => {
  before(() => {
    sinon.stub(amqp, 'connect').callsFake(() => Promise.resolve({}));
  });

  after(() => {
    (amqp['connect'] as any).restore();
  });

  describe('constructor test', () => {
    it('should instantiate connection with object based options', async () => {
      const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setOptions({});
      const connection = await connectionFactory.newConnection();
      const options = connection.getOptions();
      const uri = connection.getUri();

      expect(options).to.be.not.equal(null);
      expect(uri).to.be.equal(null);
    });

    it('should instantiate connection with uri based option', async () => {
      const connectionFactory: RabbitMqConnectionFactory = new RabbitMqConnectionFactory();
      connectionFactory.setUri('amqp://localhost:5672');
      const connection = await connectionFactory.newConnection();
      const options = connection.getOptions();
      const uri = connection.getUri();

      expect(options).to.be.equal(null);
      expect(uri).to.be.not.equal(null);
    });
  });
});

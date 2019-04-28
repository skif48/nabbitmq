import { expect } from 'chai';
import { Publisher, PublisherConfigs } from '../../src';

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

      expect(builtConfigs.exchange.name).to.be.equal(configs.exchange.name);
      expect(builtConfigs.exchange.durable).to.be.equal(true);
      expect(builtConfigs.exchange.arguments).to.be.deep.equal({});
      expect(builtConfigs.exchange.type).to.be.equal('direct');
      expect(builtConfigs.publisherConfirms).to.be.equal(true);
      expect(builtConfigs.publisherConfirms).to.be.equal(true);
      expect(builtConfigs.reconnectAttempts).to.be.equal(-1);
      expect(builtConfigs.reconnectTimeoutMillis).to.be.equal(1000);
    });

  });
});

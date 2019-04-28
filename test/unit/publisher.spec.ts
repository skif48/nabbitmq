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
});

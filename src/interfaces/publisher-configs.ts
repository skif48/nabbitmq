import * as amqp from "amqplib";

export interface PublisherConfigs {
  exchange: {
    name: string;
    type?: string;
    options?: amqp.Options.AssertExchange;
  };
  publisherConfirms?: boolean;
  reconnectTimeoutMillis?: number;
  reconnectAttempts?: number;
}

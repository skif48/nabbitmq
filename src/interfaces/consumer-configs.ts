import * as amqp from "amqplib";

export interface ConsumerConfigs {
  queue: {
    name: string;
    bindingPattern?: string;
    options?: {
      exclusive?: boolean;
      durable?: boolean;
      autoDelete?: boolean;
      arguments?: any;
      messageTtl?: number;
      expires?: number;
      maxLength?: number;
      maxPriority?: number;
    };
  };
  exchange?: {
    name?: string;
    type?: string;
    durable?: boolean;
    options?: amqp.Options.AssertExchange;
  };
  prefetch?: number;
  autoAck?: boolean;
  defaultEncoding?: string;
  reconnectTimeoutMillis?: number;
  reconnectAttempts?: number;
  noDeadLetterQueue?: boolean;
  deadLetterQueue?: {
    queue?: {
      name?: string;
      bindingPattern?: string;
      options?: amqp.Options.AssertQueue;
    };
    exchange?: {
      name?: string;
      type?: string;
      options?: amqp.Options.AssertExchange;
    };
  };
}

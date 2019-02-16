export interface ConsumerConfigs {
  queue: {
    name: string;
    bindingPattern?: string;
    durable?: boolean;
    arguments?: { [x: string]: any };
  };
  exchange?: {
    name?: string;
    type?: string;
    durable?: boolean;
    arguments?: { [x: string]: any };
  };
  prefetch?: number;
  autoAck?: boolean;
  defaultEncoding?: string;
  reconnectTimeoutMillis?: number;
  reconnectAttempts?: number;
  noDeadLetterQueue?: boolean;
  deadLetterQueue?: {
    name?: string;
    exchangeName?: string;
    exchangeType?: string;
  };
}

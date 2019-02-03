export interface ConsumerConfigs {
  queue: {
    name: string;
    topic?: string;
    durable?: boolean;
    arguments?: {[x: string]: any};
  };
  exchange: {
    name: string;
    type: string;
    durable?: boolean;
    arguments?: {[x: string]: any};
  };
  prefetch?: number;
  noAckNeeded?: boolean;
  defaultEncoding?: string;
  reconnectTimeoutMillis?: number;
  reconnectAttempts?: number;
  deadLetterQueue?: {
    name: string;
    exchangeName: string;
    exchangeType: string;
  };
}

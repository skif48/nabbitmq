export interface PublisherConfigs {
  exchange: {
    name: string;
    type?: string;
    durable?: boolean;
    arguments?: { [x: string]: any };
  };
  defaultEncoding?: string;
  reconnectTimeoutMillis?: number;
  reconnectAttempts?: number;
  autoReconnect?: boolean;
}

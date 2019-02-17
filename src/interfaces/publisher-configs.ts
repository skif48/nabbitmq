export interface PublisherConfigs {
  exchange: {
    name: string;
    type?: string;
    durable?: boolean;
    arguments?: { [x: string]: any };
  };
  publisherConfirms?: boolean;
  reconnectTimeoutMillis?: number;
  reconnectAttempts?: number;
}

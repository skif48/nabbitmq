import { Channel, Connection } from 'amqplib';

export interface CustomSetupValues {
  channel: Channel;
}

export interface ConsumerCustomSetupValues extends CustomSetupValues {
  queue: string;
  prefetch?: number;
  autoAck?: boolean;
}

export interface PublisherCustomSetupValues extends CustomSetupValues {
  exchange: string;
  publisherConfirms?: boolean;
}

export type RabbitMqConsumerSetupFunction = (connection: Connection) => Promise<ConsumerCustomSetupValues>;
export type RabbitMqPublisherSetupFunction = (connection: Connection) => Promise<PublisherCustomSetupValues>;

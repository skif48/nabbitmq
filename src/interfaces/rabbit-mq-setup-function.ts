import { Channel, Connection } from 'amqplib';

export type RabbitMqSetupFunction = (connection: Connection) => Promise<{channel: Channel, prefetch?: number, autoAck?: boolean}>;

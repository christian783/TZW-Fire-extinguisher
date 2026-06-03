import amqplib from "amqplib";

export const RABBITMQ_URL = () => process.env.RABBITMQ_URL || "amqp://localhost";
export const RABBITMQ_EXCHANGE = () => process.env.RABBITMQ_EXCHANGE || "tzw.domain.events";
export const NOTIFICATION_QUEUE = () => process.env.NOTIFICATION_QUEUE || "notification.email";

export type DomainEvent = {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: string;
};

export const connectRabbit = async () => {
  return amqplib.connect(RABBITMQ_URL());
};

export const publishRabbitEvent = async (event: DomainEvent) => {
  const connection = await connectRabbit();
  const channel = await connection.createChannel();

  await channel.assertExchange(RABBITMQ_EXCHANGE(), "topic", { durable: true });
  await assertNotificationQueue(channel);
  channel.publish(RABBITMQ_EXCHANGE(), event.type, Buffer.from(JSON.stringify(event)), {
    contentType: "application/json",
    persistent: true
  });

  await channel.close();
  await connection.close();
};

export const assertNotificationQueue = async (channel) => {
  await channel.assertExchange(RABBITMQ_EXCHANGE(), "topic", { durable: true });
  await channel.assertQueue(NOTIFICATION_QUEUE(), { durable: true });
  await channel.bindQueue(NOTIFICATION_QUEUE(), RABBITMQ_EXCHANGE(), "inspection.*");
  await channel.bindQueue(NOTIFICATION_QUEUE(), RABBITMQ_EXCHANGE(), "maintenance.*");
  await channel.bindQueue(NOTIFICATION_QUEUE(), RABBITMQ_EXCHANGE(), "extinguisher.*");
  await channel.bindQueue(NOTIFICATION_QUEUE(), RABBITMQ_EXCHANGE(), "user.registered");
  await channel.bindQueue(NOTIFICATION_QUEUE(), RABBITMQ_EXCHANGE(), "auth.*");
};

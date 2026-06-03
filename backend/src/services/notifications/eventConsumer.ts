import { assertNotificationQueue, connectRabbit, NOTIFICATION_QUEUE } from "../../platform/rabbitmq";
import logger from "../../utils/logger";
import { sendDomainEventEmail } from "./notificationService";

export const startNotificationEventConsumer = async () => {
  const connection = await connectRabbit();
  const channel = await connection.createChannel();

  await assertNotificationQueue(channel);
  channel.prefetch(Number(process.env.NOTIFICATION_QUEUE_PREFETCH || 5));

  await channel.consume(
    NOTIFICATION_QUEUE(),
    async (message) => {
      if (!message) {
        return;
      }

      try {
        const event = JSON.parse(message.content.toString("utf8"));
        logger.info("[notification-service] RabbitMQ event received", {
          type: event.type,
          recipientEmail: event.payload?.recipientEmail
        });
        const result = await sendDomainEventEmail(event.type, event.payload || {});
        logger.info("[notification-service] RabbitMQ event processed", result);
        channel.ack(message);
      } catch (error) {
        logger.error("[notification-service] Failed to process RabbitMQ event", {
          message: error.message,
          stack: error.stack
        });
        channel.nack(message, false, false);
      }
    },
    { noAck: false }
  );

  logger.info(`[notification-service] Consuming RabbitMQ queue ${NOTIFICATION_QUEUE()}`);
};

import { publishRabbitEvent } from "../platform/rabbitmq";
import logger from "./logger";

export const publishDomainEvent = async (type: string, payload: Record<string, unknown>) => {
  try {
    await publishRabbitEvent({
      type,
      payload,
      occurredAt: new Date().toISOString()
    });
  } catch (error) {
    logger.warn("RabbitMQ domain event publish failed", {
      type,
      message: error.message
    });
  }
};

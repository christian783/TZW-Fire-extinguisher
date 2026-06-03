import { sendSuccess } from "../../utils/apiResponse";
import { listOperationalNotifications } from "./notificationService";

const listNotifications = async (req, res) => {
  const notifications = await listOperationalNotifications();

  return sendSuccess(res, {
    message: "Operational notifications fetched successfully",
    data: { notifications },
    total: notifications.length,
    page: 1,
    totalPages: 1
  });
};

export default {
  listNotifications
};

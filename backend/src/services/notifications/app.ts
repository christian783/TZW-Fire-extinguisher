import createServiceApp from "../../platform/createServiceApp";
import notificationRoutes from "./notificationRoutes";

export default createServiceApp("notification-service", [{ path: "/notifications", router: notificationRoutes }]);

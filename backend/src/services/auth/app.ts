import createServiceApp from "../../platform/createServiceApp";
import authRoutes from "../../routes/authRoutes";

export default createServiceApp("auth-service", [{ path: "/auth", router: authRoutes }]);

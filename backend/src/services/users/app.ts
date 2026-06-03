import createServiceApp from "../../platform/createServiceApp";
import userRoutes from "../../routes/userRoutes";

export default createServiceApp("user-service", [{ path: "/users", router: userRoutes }]);

import createServiceApp from "../../platform/createServiceApp";
import reportRoutes from "./reportRoutes";

export default createServiceApp("reporting-service", [{ path: "/reports", router: reportRoutes }]);

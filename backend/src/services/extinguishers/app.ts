import createServiceApp from "../../platform/createServiceApp";
import extinguisherRoutes from "./extinguisherRoutes";

export default createServiceApp("fire-extinguisher-service", [{ path: "/extinguishers", router: extinguisherRoutes }]);

import createServiceApp from "../../platform/createServiceApp";
import inspectionRoutes from "../inspections/inspectionRoutes";
import maintenanceRoutes from "../maintenance/maintenanceRoutes";

export default createServiceApp("inspection-maintenance-service", [
  { path: "/inspections", router: inspectionRoutes },
  { path: "/maintenance", router: maintenanceRoutes }
]);

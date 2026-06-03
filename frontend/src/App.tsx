import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Extinguishers from "./pages/Extinguishers";
import Inspections from "./pages/Inspections";
import Login from "./pages/Login";
import Maintenance from "./pages/Maintenance";
import Register from "./pages/Register";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import VerifyOtp from "./pages/VerifyOtp";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route element={<ProtectedRoute roles={["ADMIN", "INSPECTOR", "USER"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/extinguishers" element={<Extinguishers />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route element={<ProtectedRoute roles={["ADMIN", "INSPECTOR"]} />}>
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route path="/admin/users" element={<Users />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;

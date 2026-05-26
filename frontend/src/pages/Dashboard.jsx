import { useEffect, useState } from "react";
import { Database, KeyRound, ShieldCheck } from "lucide-react";

import api from "../api/axios.js";
import Navbar from "../components/Navbar.jsx";
import PaginationControls from "../components/PaginationControls.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Dashboard = () => {
  const { user, isAdmin, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await api.get("/auth/me");
      setProfile(response.data.data.user);
    };

    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="lg:grid lg:grid-cols-[18rem_1fr]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Authenticated workspace</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Authenticated</h2>
                  <p className="text-sm text-slate-600">{profile ? "Session verified" : "Checking session"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-mint text-white">
                  <KeyRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">Role</h2>
                  <p className="text-sm text-slate-600">{user?.role || "Unknown"}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-coral text-white">
                  <Database className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">API</h2>
                <p className="text-sm text-slate-600">Connected foundation</p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">Current user</h2>
                <p className="text-sm text-slate-600">Verified profile</p>
              </div>
              <span className="inline-flex w-fit rounded-md bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700">
                {isAdmin() ? "Admin access" : hasRole("USER") ? "User access" : "Custom role"}
              </span>
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Name</dt>
                <dd className="mt-1 text-sm text-ink">
                  {profile ? `${profile.firstName} ${profile.lastName}` : `${user?.firstName || ""} ${user?.lastName || ""}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Email</dt>
                <dd className="mt-1 break-all text-sm text-ink">{profile?.email || user?.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">Role</dt>
                <dd className="mt-1 text-sm text-ink">{profile?.role || user?.role}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-500">User ID</dt>
                <dd className="mt-1 break-all text-sm text-ink">{profile?.id || user?.id}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-6 rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-ink">Reusable pagination</h2>
              <p className="text-sm text-slate-600">Reusable controls</p>
            </div>
            <PaginationControls page={page} totalPages={5} onPageChange={setPage} />
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

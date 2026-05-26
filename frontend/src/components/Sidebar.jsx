import { LayoutDashboard, X } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard
  }
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open ? <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} /> : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-line bg-white transition-transform lg:static lg:z-0 lg:block lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5 lg:hidden">
          <span className="font-semibold text-ink">Navigation</span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-md border border-line"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium ${
                    isActive ? "bg-brand text-white" : "text-slate-700 hover:bg-slate-100 hover:text-ink"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

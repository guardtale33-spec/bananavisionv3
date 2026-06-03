import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Leaf, Cpu, LogOut, Menu, X, ShieldAlert } from "lucide-react";

export default function AdminLayout({ children, admin, handleAdminLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Kelola Penyakit",
      path: "/admin/diseases",
      icon: Leaf,
    },
    {
      name: "Sistem Model AI",
      path: "/admin/models",
      icon: Cpu,
    },
  ];

  const handleLogoutClick = () => {
    if (handleAdminLogout) {
      handleAdminLogout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* --- Mobile Topbar --- */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 border-b border-slate-800 px-4 py-4 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-green-400" />
          </div>
          <span className="font-bold text-white text-base tracking-tight">BananaVision Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-slate-400 hover:text-white focus:outline-none transition-colors"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* --- Sidebar --- */}
      <aside
        className={`fixed inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out md:relative md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 z-30`}
      >
        {/* Brand */}
        <div className="hidden md:flex items-center gap-2.5 px-6 py-6 border-b border-slate-800/80">
          <div className="w-9 h-9 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-5.5 h-5.5 text-green-400" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">BananaVision Admin</span>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-green-500/10 border border-green-500/20 text-green-400 shadow-lg shadow-green-950/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-green-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin profile and logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {admin?.name ? admin.name.substring(0, 2).toUpperCase() : "AD"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{admin?.name || "Super Admin"}</p>
              <p className="text-xs text-slate-500 truncate">{admin?.email || "admin@bananavision.com"}</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-950/20 border border-slate-700 hover:border-red-900/40 text-slate-400 hover:text-red-400 text-sm font-medium py-2.5 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Panel</span>
          </button>
        </div>
      </aside>

      {/* --- Overlay when sidebar open on mobile --- */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-20 md:hidden transition-opacity"
        />
      )}

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col min-h-screen bg-slate-950 md:overflow-x-hidden relative">
        {/* Glow effect at the top right of the screen */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex-1 p-6 md:p-8 relative z-10">{children}</div>
      </main>
    </div>
  );
}

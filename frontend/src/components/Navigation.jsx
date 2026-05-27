import { useState } from "react";
import {
  Menu,
  X,
  Home,
  Activity,
  Camera,
  History,
  Book,
  User,
} from "lucide-react";

export default function Navigation({
  user,
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen,
  handleLogout,
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  const items = [
    { icon: Home, label: "Beranda", page: "home" },
    { icon: Activity, label: "Dashboard", page: "dashboard" },
    { icon: Camera, label: "Analisis", page: "analyze" },
    { icon: History, label: "Riwayat", page: "history" },
    { icon: Book, label: "Katalog", page: "diseases" },
    { icon: User, label: "Profil", page: "profile" },
  ];

  // unified navigation helper so nav works the same whether setCurrentPage is state setter or goTo navigator
  const handleNav = (page) => {
    setProfileOpen(false);
    setSidebarOpen && setSidebarOpen(false);
    if (setCurrentPage) setCurrentPage(page);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50 shadow-sm">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => handleNav("home")}
          role="button"
          aria-label="Go to home"
        >
          <div className="w-8 h-8">
            <img
              src="./bananavision.png"
              alt="BananaVision Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-bold text-lg text-gray-800 flex">
            <p className="text-green-500">Banana</p>Vision
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <button onClick={() => setSidebarOpen(true)} className="p-2">
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
          ) : (
            <button
              onClick={() => handleNav("login")}
              className="text-sm text-green-600 font-semibold"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Desktop Top Navigation */}
      <header className="hidden md:block fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => handleNav("home")}
            >
              <div className="w-10 h-10">
                <img
                  src="./bananavision.png"
                  alt="BananaVision Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-bold text-xl text-gray-800 flex ">
                <p className="text-green-500">Banana</p>Vision
              </span>
            </div>

            <nav className="flex items-center gap-3">
              {(user
                ? items
                : items.filter(
                    (item) => item.page === "home" || item.page === "diseases",
                  )
              ).map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm transform hover:-translate-y-0.5 ${
                    currentPage === item.page
                      ? "bg-green-50 text-green-600 font-semibold ring-1 ring-green-100"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {!user ? (
                <button
                  onClick={() => handleNav("login")}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition"
                >
                  Login
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((s) => !s)}
                    className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-50 transition"
                  >
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=10b981&color=fff`
                      }
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden sm:inline text-sm font-medium text-gray-800">
                      {user.name}
                    </span>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2">
                      <button
                        onClick={() => {
                          handleNav("profile");
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Profil
                      </button>
                      <button
                        onClick={() => {
                          handleNav("dashboard");
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        Dashboard
                      </button>
                      <div className="border-t my-1" />
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout && handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar (unchanged) */}
      {user && sidebarOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-50 transform transition-transform">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-gray-800 flex">
                    <p className="text-green-500">Banana</p>Vision
                  </span>
                </div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6 text-gray-800" />
                </button>
              </div>

              <nav className="space-y-2">
                {(user
                  ? items
                  : items.filter(
                      (item) =>
                        item.page === "home" || item.page === "diseases",
                    )
                ).map((item) => (
                  <button
                    key={item.page}
                    onClick={() => {
                      handleNav(item.page);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      currentPage === item.page
                        ? "bg-green-50 text-green-600 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}

      {/* Bottom Navigation Mobile */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="flex justify-around items-center py-2">
            {[
              { icon: Home, page: "home" },
              { icon: Activity, page: "dashboard" },
              { icon: Camera, page: "analyze" },
              { icon: History, page: "history" },
              { icon: User, page: "profile" },
            ].map((item) => (
              <button
                key={item.page}
                onClick={() => handleNav(item.page)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  currentPage === item.page ? "text-green-600" : "text-gray-600"
                }`}
              >
                <item.icon className="w-6 h-6" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

import { Link, useLocation } from "react-router-dom";
import useTheme from "./context/themeContext";

export default function Sidebar() {
  const { thememode, changeMode } = useTheme();
  const location = useLocation();

  const isMeetingRoute = location.pathname.startsWith("/meeting");
  const bottomSafePadding = isMeetingRoute ? "calc(80px + 1rem)" : undefined;

  const navItems = [{ name: "Lobby", path: "/", icon: LobbyIcon }];

  const handleLobbyClick = (evt) => {
    const ev = new CustomEvent("before-leave-meeting", { detail: { from: "sidebar" } });
    window.dispatchEvent(ev);
    navigate("/");
  };
  
  return (
    <aside
      className="flex flex-col justify-between shrink-0
                 w-20 sm:w-64 p-3 bg-white dark:bg-[#0F1419] border-r border-gray-200 dark:border-[#15191F]
                 transition-colors duration-200"
      style={{ paddingBottom: bottomSafePadding }}
    >
      <div className="flex items-center">
        <Link to="/" className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{ background: "#6366F1", color: "white" }}
          >
            IK
          </div>

          <div className="hidden sm:block">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Ikarus
            </div>
            <div className="text-xs text-gray-500 dark:text-[#8b949e]">
              Video Call
            </div>
          </div>
        </Link>
      </div>

      <nav className="mt-6 flex-1">
        <ul className="space-y-1">
          {navItems.map(({ name, path, icon: Icon }) => (
            <li key={name}>
              <Link
                to={path}
                className={`flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${
                  location.pathname === path
                    ? "bg-gray-200 dark:bg-[#1A1F2E] text-[#6366F1]"
                    : "text-gray-700 dark:text-[#c9d1d9] hover:bg-gray-100 dark:hover:bg-[#1A1F2E]"
                }`}
              >
                <Icon />
                <span className="hidden sm:inline">{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-4">
        <button
          onClick={changeMode}
          aria-label="Toggle theme"
          className="w-full flex items-center justify-center gap-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#1A1F2E] transition-colors"
        >
          {thememode === "dark" ? (
            <>
              <MoonIcon />
              <span className="hidden sm:inline text-sm text-gray-100">Dark</span>
            </>
          ) : (
            <>
              <SunIcon />
              <span className="hidden sm:inline text-sm text-gray-800">Light</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function LobbyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="flex-shrink-0"
    >
      <path d="M21 10L12 3 3 10v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"></path>
      <path d="M7 21v-6a5 5 0 0 1 10 0v6"></path>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
    </svg>
  );
}

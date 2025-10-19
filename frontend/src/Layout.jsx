import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./SideBar";

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0d1117] transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

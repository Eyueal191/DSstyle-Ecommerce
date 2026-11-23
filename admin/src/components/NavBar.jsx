import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, Settings } from "lucide-react";

function NavBar() {
  const location = useLocation();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/products", label: "Products", icon: <Package size={18} /> },
    { to: "/orders", label: "Orders", icon: <ShoppingCart size={18} /> },
    { to: "/customers", label: "Customers", icon: <Users size={18} /> },
    { to: "/reports", label: "Reports", icon: <BarChart3 size={18} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <nav className="flex flex-col w-full bg-white p-2 rounded-xl border border-gray-100 shadow-2xs space-y-1 dark:bg-slate-900 dark:border-slate-800">
      {links.map((link) => {
        const isActive = location.pathname.includes(link.to);
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs font-medium ${
              isActive
                ? "bg-pink-50 text-pink-700 font-semibold"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800"
            }`}
          >
            <span className={isActive ? "text-pink-600" : "text-gray-400"}>
              {link.icon}
            </span>
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default NavBar;

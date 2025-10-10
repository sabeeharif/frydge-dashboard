// config/navigation.js
import {
  Home,
  Package,
  MapPin,
  BarChart2,
  Settings,
  Users,
  Navigation,
  Trello,
} from "lucide-react";

// Safe parse user role from localStorage
let userRole = null;
if (typeof window !== "undefined") {
  const storedUserData = localStorage.getItem("userData");
  if (storedUserData) {
    try {
      const parsed = JSON.parse(storedUserData);
      userRole = parsed?.user?.dsbUserRole || null;
    } catch (err) {
      console.error("Failed to parse userData from localStorage:", err);
    }
  }
}

export const navItems = [
  { name: "Overview", path: "/dashboard/overview", icon: Home },
  ...(userRole === "admin"
    ? [{ name: "Users", path: "/dashboard/users", icon: Users }]
    : []), // spread conditional item
  { name: "App-Orders", path: "/dashboard/app-orders", icon: Trello },
  { name: "Machines", path: "/dashboard/machines", icon: Package },
  { name: "Routes", path: "/dashboard/routes", icon: Navigation },
  { name: "Driver Routes", path: "/dashboard/routes-new", icon: MapPin },
  { name: "Cleaner Routes", path: "/dashboard/routes-new", icon: MapPin },
  // { name: "Location", path: "/dashboard/locations", icon: MapPin },
  // { name: "Reporting", path: "/dashboard/reporting", icon: BarChart2 },
  // { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

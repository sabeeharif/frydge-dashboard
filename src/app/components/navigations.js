// config/navigation.js
import {
  Home,
  Package,
  MapPin,
  BarChart2,
  Settings,
  Users,
  Navigation,
} from "lucide-react";

export const navItems = [
  { name: "Overview", path: "/dashboard/overview", icon: Home },
  { name: "Users", path: "/dashboard/users", icon: Users },
  { name: "Machines", path: "/dashboard/machines", icon: Package },
  { name: "Routes", path: "/dashboard/routes", icon: Navigation },
  { name: "Location", path: "/dashboard/locations", icon: MapPin }, // Changed from Package to MapPin
  { name: "Reporting", path: "/dashboard/reporting", icon: BarChart2 }, // Changed from Settings to BarChart2
  { name: "Settings", path: "/dashboard/settings", icon: Settings }, // Optionally keep a separate Settings tab
];

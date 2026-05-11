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
  Truck,
  Sparkles,
  PackageSearch,
  SquareChartGantt,
  AlertCircle,
  Bell,
} from "lucide-react";

// Dynamic builder to always reflect current role from localStorage
export function getNavItems() {
  let role = null;
  if (typeof window !== "undefined") {
    const storedUserData = localStorage.getItem("frydge-user-data");
    if (storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        // Prefer flat shape (current), fallback to nested (legacy)
        role = parsed?.dsbUserRole || parsed?.user?.dsbUserRole || null;
      } catch (err) {
        console.error("Failed to parse userData from localStorage:", err);
      }
    }
  }

  return [
    { name: "Overview", path: "/dashboard/overview", icon: Home },
    ...(role === "admin"
      ? [{ name: "Users", path: "/dashboard/users", icon: Users }]
      : []),
    { name: "Notifications", path: "/dashboard/notifications", icon: Bell},
    { name: "App-Orders", path: "/dashboard/app-orders", icon: Trello },
    { name: "Machines", path: "/dashboard/machines", icon: Package },
    // { name: "Routes", path: "/dashboard/routes", icon: Navigation },
    { name: "Driver Routes", path: "/dashboard/driver-routes", icon: Truck },
    { name: "Cleaner Routes", path: "/dashboard/cleaner-routes", icon: Sparkles },
    { name: "Suppliers Management", path: "/dashboard/suppliers-management", icon: Users },
    // { name: "Order Management", path: "/dashboard/order-management", icon: Package },
    { name: "Products Management", path: "/dashboard/product-management", icon: PackageSearch },
    { name: "Planogram Versions", path: "/dashboard/planogram-versions", icon: SquareChartGantt },
    { name: "Location Config", path: "/dashboard/location-config", icon: MapPin },
    { name: "Inventory Calculation", path: "/dashboard/inventory-calculation", icon: Package },
    // { name: "Reporting", path: "/dashboard/reporting", icon: BarChart2 },
    // { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];
}

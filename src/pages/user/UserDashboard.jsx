import React, { useState, useEffect } from "react";
import { canAccessModule } from "../../utils/permissionUtils";
import ChecklistView from "../../components/Checklist/ChecklistView";
import MaintenanceView from "../../components/Maintenance/MaintenanceView";
import { LayoutDashboard, Tool, Building2 } from "lucide-react";

const UserDashboard = () => {
  // Persistence for active module tab
  const [activeModule, setActiveModule] = useState(() => {
    const saved = localStorage.getItem("user_dashboard_active_module");
    if (saved && canAccessModule(saved)) return saved;
    // Default fallback based on access
    if (canAccessModule("checklist")) return "checklist";
    if (canAccessModule("delegation")) return "delegation";
    if (canAccessModule("maintenance")) return "maintenance";
    return "checklist";
  });
  
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [userDepartments, setUserDepartments] = useState([]);

  const userRole = localStorage.getItem("role");
  const userAccess = localStorage.getItem("user_access") || "";

  // Handle department prefill for admins
  useEffect(() => {
    const depts = userAccess 
      ? userAccess.split(',').map(dept => dept.trim()) 
      : [];
    setUserDepartments(depts);

    if ((userRole === "admin" || userRole === "div_admin") && depts.length > 0) {
      // Prefill with the first assigned department if not already set or if 'all' isn't explicitly wanted
      // In User dashboard, restricted admins should focus on their dept
      setDepartmentFilter(depts[0]);
    }
  }, [userRole, userAccess]);

  const handleModuleChange = (module) => {
    setActiveModule(module);
    localStorage.setItem("user_dashboard_active_module", module);
  };

  // Module visibility fallback logic
  useEffect(() => {
    if (!canAccessModule(activeModule)) {
      const availableModules = ["checklist", "delegation", "maintenance"].filter(canAccessModule);
      if (availableModules.length > 0) {
        setActiveModule(availableModules[0]);
      }
    }
  }, [activeModule]);

  return (
    <div className="space-y-6">
      {/* Top Level Module Switcher (Segmented Control) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-600 rounded-lg shadow-md">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">TaskDesk</h1>
        </div>

        <div className="flex w-full p-1 bg-white rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          {canAccessModule("checklist") && (
            <button
              onClick={() => handleModuleChange("checklist")}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-0 ${
                activeModule === "checklist"
                  ? "bg-blue-600 text-white shadow-lg scale-105 z-10"
                  : "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="hidden min-[480px]:inline truncate">Checklist</span>
            </button>
          )}
          {canAccessModule("delegation") && (
            <button
              onClick={() => handleModuleChange("delegation")}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-0 ${
                activeModule === "delegation"
                  ? "bg-blue-600 text-white shadow-lg scale-105 z-10"
                  : "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              }`}
            >
              <i className="fas fa-handshake h-4 w-4 shrink-0" />
              <span className="hidden min-[480px]:inline truncate">Delegation</span>
            </button>
          )}
          {canAccessModule("maintenance") && (
            <button
              onClick={() => handleModuleChange("maintenance")}
              className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 min-w-0 ${
                activeModule === "maintenance"
                  ? "bg-blue-600 text-white shadow-lg scale-105 z-10"
                  : "text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              }`}
            >
               <i className="fas fa-tools h-4 w-4 shrink-0" />
              <span className="hidden min-[480px]:inline truncate">Maintenance</span>
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Title below switcher - only for Maintenance since Checklist has its own */}
      {activeModule === "maintenance" && (
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">
            Dashboard
          </h1>
        </div>
      )}

      {/* Dynamic Department Indicator for Admins */}
      {(userRole === "admin" || userRole === "div_admin") && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-full w-fit">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">Dept:</span>
          <span className="text-xs font-medium text-amber-800 dark:text-amber-300">{departmentFilter}</span>
        </div>
      )}

      {/* Main Module Content */}
      <div className="mt-6">
        {activeModule === "checklist" || activeModule === "delegation" ? (
          <ChecklistView dashboardType={activeModule} />
        ) : (
          <MaintenanceView />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;


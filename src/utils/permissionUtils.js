/**
 * Permission Utilities
 * Handles page-level and system-level access checks with role-based fallbacks.
 */

export const getPageAccess = () => {
  try {
    const raw = localStorage.getItem("page_access");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error parsing page_access from localStorage", e);
    return [];
  }
};

export const getSystemAccess = () => {
  try {
    const raw = localStorage.getItem("system_access");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error parsing system_access from localStorage", e);
    return [];
  }
};

/**
 * Checks if the user has access to a specific page.
 * @param {string} page - The page identifier (e.g., 'dashboard', 'settings').
 * @returns {boolean}
 */
export const hasPageAccess = (page) => {
  const pageAccess = getPageAccess();
  const role = localStorage.getItem("role");

  // Full access wildcard
  if (pageAccess.includes("*")) return true;
  
  // Specific page access
  if (pageAccess.includes(page)) return true;

  // Fallback to role-based logic if page_access is empty
  if (pageAccess.length === 0) {
    const adminRoles = ["admin", "super_admin"];
    const superAdminRoles = ["super_admin"];
    const adminOnlyPages = ["quick_task", "settings", "holiday_management", "admin_data", "delegation_task"];
    const superAdminOnlyPages = ["settings_admin", "holiday_management_admin"];
    
    if (superAdminOnlyPages.includes(page)) {
      return superAdminRoles.includes(role);
    }
    
    if (adminOnlyPages.includes(page)) {
      return adminRoles.includes(role);
    }
    return true; // Default to public access for non-admin pages
  }

  return false;
};

/**
 * Checks if the user has access to a specific system/module.
 * @param {string} system - The system identifier (e.g., 'checklist', 'maintenance').
 * @returns {boolean}
 */
export const hasSystemAccess = (system) => {
  const systemAccess = getSystemAccess();
  const role = localStorage.getItem("role");

  // Full access wildcard
  if (systemAccess.includes("*")) return true;
  
  // Specific system access
  if (systemAccess.includes(system)) return true;

  // Fallback to role-based logic
  if (systemAccess.length === 0) {
    if (system === "maintenance" || system === "settings") {
      return ["admin", "super_admin"].includes(role);
    }
    return true; // Checklist is usually default
  }

  return false;
};

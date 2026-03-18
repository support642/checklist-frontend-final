/**
 * Permission Utilities
 * Handles page-level and system-level access checks with role-based fallbacks.
 */
import { MODULE_FEATURE_MAP } from "../constants/permissions";

export const getPageAccess = () => {
  try {
    const raw = localStorage.getItem("page_access");
    if (!raw) return [];
    let parsed = JSON.parse(raw);
    // Handle double-stringification if it occurs
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error parsing page_access from localStorage", e);
    return [];
  }
};

export const getSystemAccess = () => {
  try {
    const raw = localStorage.getItem("system_access");
    if (!raw) return [];
    let parsed = JSON.parse(raw);
    // Handle double-stringification if it occurs
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    return Array.isArray(parsed) ? parsed : [];
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
  if (pageAccess.includes(page) || pageAccess.includes(`${page}_view`) || pageAccess.includes(`${page}_modify`)) return true;

  // // Development whitelist for Repair module
  // const repairPages = ['dashboard', 'request_form', 'pending_request', 'request_approval', 'repair_setting'];
  // if (repairPages.includes(page)) return true;

  // Fallback to role-based logic if page_access is empty
  if (!pageAccess || pageAccess.length === 0) {
    // STRICT FALLBACK: If no explicit permissions are granted, 
    // ONLY the base dashboard is accessible, regardless of role.
    return page === "dashboard";
  }

  return false;
};

/**
 * Checks if a specific module/tab should be visible based on system_access.
 * @param {string} module - The module identifier (e.g., 'checklist', 'maintenance').
 * @returns {boolean}
 */
export const canAccessModule = (module) => {
  const feature = MODULE_FEATURE_MAP[module];
  if (!feature) return true; // Default to visible if not mapped
  return hasSystemAccess(feature);
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
    // STRICT FALLBACK: If no explicit system access is granted,
    // deny all system modules by default.
    return false;
  }

  return false;
};

/**
 * Checks if the user can VIEW a specific page (read-only access).
 * Returns true if `page_view` OR `page_modify` is in page_access.
 * Falls back to hasPageAccess() if neither is present (backward compat).
 * @param {string} page - e.g. 'settings', 'pending_task'
 * @returns {boolean}
 */
export const hasViewAccess = (page) => {
  const pageAccess = getPageAccess();

  // Wildcard — full access
  if (pageAccess.includes("*")) return true;

  // Explicit view or modify keys
  if (pageAccess.includes(`${page}_view`)) return true;
  if (pageAccess.includes(`${page}_modify`)) return true;

  // Neither _view nor _modify is set — fall back to existing logic
  const hasExplicitViewModify = pageAccess.some(
    (p) => p.endsWith("_view") || p.endsWith("_modify")
  );
  if (!hasExplicitViewModify) {
    return hasPageAccess(page);
  }

  return false;
};

/**
 * Checks if the user can MODIFY (fully interact with) a specific page.
 * Returns true only if `page_modify` is in page_access.
 * Falls back to hasPageAccess() if no _view/_modify keys exist at all (backward compat).
 * @param {string} page - e.g. 'settings', 'pending_task'
 * @returns {boolean}
 */
export const hasModifyAccess = (page) => {
  const pageAccess = getPageAccess();

  // Wildcard — full access
  if (pageAccess.includes("*")) return true;

  // Explicit modify key
  if (pageAccess.includes(`${page}_modify`)) return true;

  // Neither _view nor _modify is set — fall back to existing logic
  const hasExplicitViewModify = pageAccess.some(
    (p) => p.endsWith("_view") || p.endsWith("_modify")
  );
  if (!hasExplicitViewModify) {
    return hasPageAccess(page);
  }

  return false;
};

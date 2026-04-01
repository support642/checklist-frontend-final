import { MODULE_FEATURE_MAP, DOC_SYSTEMS, DOC_PAGE_MAP, PAGE_SYSTEM_MAP } from "../constants/permissions";
import { buildUnifiedPermissions, hasPermission as hasPermissionAdapter } from "./permissionAdapter";

/**
 * Reads all permission sources from localStorage and builds a unified object.
 * @returns {Object} Unified permissions object
 */
export const getUnifiedPermissions = () => {
  try {
    const user = {
      role: localStorage.getItem("role"),
      system_access: JSON.parse(localStorage.getItem("system_access") || "[]"),
      page_access: JSON.parse(localStorage.getItem("page_access") || "[]"),
      subscription_access_system: localStorage.getItem("subscription_access_system")
    };
    return buildUnifiedPermissions(user);
  } catch (e) {
    console.error("Error building unified permissions from localStorage", e);
    return {};
  }
};

/**
 * Universal permission check helper.
 * @param {string} module 
 * @param {string} page 
 * @param {string} action - 'view' or 'modify'
 */
export const hasPermission = (module, page, action) => {
  const unified = getUnifiedPermissions();
  return hasPermissionAdapter(unified, module, page, action);
};

/**
 * Normalizes a page key for consistent checking.
 */
const normalizeKey = (key) => {
  if (!key) return '';
  return key.toLowerCase().replace(/[\/\s-]+/g, '_');
};

/**
 * Backward compatible page access check.
 */
export const hasPageAccess = (page) => {
  if (page === "dashboard") {
    const unified = getUnifiedPermissions();
    if (unified['*'] === '*') return true;
    
    const modules = Object.keys(unified);
    // If user has no permissions at all, show dashboard as default fallback
    if (modules.length === 0) return true;
    // If they have any checklist-related permissions, show it
    if (unified.checklist || unified.maintenance) return true;
    // Otherwise (e.g. only documentation access), hide it
    return false;
  }

  const unified = getUnifiedPermissions();
  if (unified['*'] === '*') return true;

  const normalizedPage = normalizeKey(page);

  // 1. Check Legacy/Standard Mapping
  const module = PAGE_SYSTEM_MAP[page]?.[0] || 'checklist';
  if (hasPermissionAdapter(unified, module, normalizedPage, 'view')) return true;
  
  // 2. Check Documentation/JSON Mapping
  const docPageIdentifier = DOC_PAGE_MAP[page];
  if (docPageIdentifier) {
    const normalizedDocPage = normalizeKey(docPageIdentifier);
    let docModule = 'documentation';
    if (normalizedDocPage.startsWith('subscription')) docModule = 'subscription';
    else if (normalizedDocPage.startsWith('loan')) docModule = 'loan';
    else if (normalizedDocPage.startsWith('master')) docModule = 'master';
    
    if (hasPermissionAdapter(unified, docModule, normalizedDocPage, 'view')) return true;
  }

  return false;
};

/**
 * Checks if a specific module/tab should be visible.
 */
export const canAccessModule = (module) => {
  const unified = getUnifiedPermissions();
  if (unified['*'] === '*') return true;

  // Accessible if ANY page in this module is visible, or if the system itself is active
  return !!unified[module] || !!unified[MODULE_FEATURE_MAP[module]];
};

/**
 * Standard system access check.
 */
export const hasSystemAccess = (system) => {
  const unified = getUnifiedPermissions();
  if (unified['*'] === '*') return true;
  
  // For the composite sidebar block, check any of the JSON modules
  if (system === 'documentation' || system === 'docs') {
    return !!unified['documentation'] || !!unified['subscription'] || !!unified['loan'] || !!unified['master'];
  }

  return !!unified[system];
};

/**
 * Detailed view access check.
 */
export const hasViewAccess = (page) => {
  return hasPageAccess(page);
};

/**
 * Detailed modify access check.
 */
export const hasModifyAccess = (page) => {
  const unified = getUnifiedPermissions();
  if (unified['*'] === '*') return true;

  const normalizedPage = normalizeKey(page);

  // 1. Check Legacy/Standard Mapping
  const module = PAGE_SYSTEM_MAP[page]?.[0] || 'checklist';
  if (hasPermissionAdapter(unified, module, normalizedPage, 'modify')) return true;
  
  // 2. Check Documentation/JSON Mapping
  const docPageIdentifier = DOC_PAGE_MAP[page];
  if (docPageIdentifier) {
    const normalizedDocPage = normalizeKey(docPageIdentifier);
    let docModule = 'documentation';
    if (normalizedDocPage.startsWith('subscription')) docModule = 'subscription';
    else if (normalizedDocPage.startsWith('loan')) docModule = 'loan';
    else if (normalizedDocPage.startsWith('master')) docModule = 'master';
    
    if (hasPermissionAdapter(unified, docModule, normalizedDocPage, 'modify')) return true;
  }

  return false;
};

/**
 * Provides the default landing page based on permissions.
 */
export const getDefaultDashboardRoute = () => {
  const unified = getUnifiedPermissions();
  if (unified['*'] === '*') return "/dashboard/admin";
  
  if (unified.checklist || unified.maintenance) return "/dashboard/admin";
  if (unified.documentation || unified.subscription || unified.loan || unified.master) return "/doc-sub/dashboard";
  if (unified.assets) return "/asset/dashboard";
  
  return "/dashboard/admin"; // Fallback
};

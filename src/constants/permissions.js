export const SYSTEM_PERMISSIONS = [
  "checklist",
  "maintenance"
];

export const PAGE_PERMISSIONS = [
  "dashboard",
  "assign_task",
  "delegation",
  "quick_task",
  "settings",
  "holiday_management",
  "admin_data",
  "pending_task",
  "calendar",
  "admin_approval"
];

// Used by the manual View/Modify permission UI (super_admin only)
export const PAGE_PERMISSION_GROUPS = [
  { key: "dashboard",         label: "Dashboard" },
  { key: "assign_task",       label: "Assign Task" },
  { key: "delegation",        label: "Delegation" },
  { key: "quick_task",        label: "Quick Task" },
  { key: "settings",          label: "Settings" },
  { key: "pending_task",      label: "Pending Task" },
  { key: "calendar",          label: "Calendar" },
  { key: "holiday_management",label: "Holiday Management" },
  { key: "admin_data",        label: "Admin Data" },
  { key: "admin_approval",    label: "Admin Approval" },
];

// Maps UI modules (checklist, maintenance, etc.) to system_access features
export const MODULE_FEATURE_MAP = {
  "checklist": "checklist",
  "maintenance": "maintenance",
  "delegation": "checklist"
};

// Maps specific pages to system features for permission UI filtering
export const PAGE_SYSTEM_MAP = {
  "dashboard": ["checklist", "maintenance"],
  "assign_task": ["checklist", "maintenance"],
  "delegation": ["checklist"],
  "quick_task": ["checklist"],
  "settings": ["checklist", "maintenance"],
  "pending_task": ["checklist", "maintenance"],
  "calendar": ["checklist", "maintenance"],
  "holiday_management": ["checklist", "maintenance"],
  "admin_data": ["checklist", "maintenance"],
  "admin_approval": ["checklist", "maintenance"]
};

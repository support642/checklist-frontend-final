// maintenanceApi.js
import { authFetch } from "../../utils/authFetch";
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/maintenance`;

// =======================================================
// 1️⃣ Fetch Pending Maintenance Tasks
// =======================================================
export const fetchMaintenanceDataSortByDate = async (page = 1, search = '', startDate = "", endDate = "", status = 'all', frequency = 'all', name = 'all', division = 'all', departmentFilter = 'all') => {
    const username = localStorage.getItem("user-name");
    const role = localStorage.getItem("role");
    const department = localStorage.getItem("department");
    const unit = localStorage.getItem("unit");
    const divisionLocal = localStorage.getItem("division");

    let url = `${BASE_URL}?page=${page}&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${divisionLocal}&search=${encodeURIComponent(search)}`;
    
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (status !== 'all') url += `&status=${status}`;
    if (frequency !== 'all') url += `&frequency=${frequency}`;
    if (name !== 'all') url += `&name=${encodeURIComponent(name)}`;
    if (division !== 'all') url += `&divisionFilter=${encodeURIComponent(division)}`;
    if (departmentFilter !== 'all') url += `&departmentFilter=${encodeURIComponent(departmentFilter)}`;

    const response = await authFetch(url);

    if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errJson = await response.json();
            throw new Error(errJson.error || `Server error ${response.status}`);
        } else {
            throw new Error(`Server returned non-JSON response (${response.status}).`);
        }
    }

    const json = await response.json();
    return { 
        data: json.data || [], 
        totalCount: json.totalCount || 0, 
        page: json.page || page 
    };
};

// =======================================================
// 2️⃣ Fetch Maintenance History
// =======================================================
export const fetchMaintenanceDataForHistory = async (search = "", startDate = "", endDate = "", name = 'all', division = 'all', departmentFilter = 'all') => {
    const username = localStorage.getItem("user-name");
    const role = localStorage.getItem("role");
    const department = localStorage.getItem("department");
    const unit = localStorage.getItem("unit");
    const divisionLocal = localStorage.getItem("division");
    const PAGE_SIZE = 50;

    const encodedSearch = encodeURIComponent(search);

    // Fetch page 1 to get totalCount
    let baseUrl = `${BASE_URL}/history?page=1&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${divisionLocal}&search=${encodedSearch}`;
    if (startDate) baseUrl += `&startDate=${startDate}`;
    if (endDate) baseUrl += `&endDate=${endDate}`;
    if (name !== 'all') baseUrl += `&nameFilter=${encodeURIComponent(name)}`;
    if (division !== 'all') baseUrl += `&divisionFilter=${encodeURIComponent(division)}`;
    if (departmentFilter !== 'all') baseUrl += `&departmentFilter=${encodeURIComponent(departmentFilter)}`;

    const firstRes = await authFetch(baseUrl);
    const firstJson = await firstRes.json();
    const totalCount = firstJson.totalCount || 0;
    const approvedCount = firstJson.approvedCount || 0;
    let allData = firstJson.data || [];

    // Fetch remaining pages in parallel
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    if (totalPages > 1) {
        const remaining = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) => {
                const pUrl = baseUrl.replace('page=1', `page=${i + 2}`);
                return authFetch(pUrl)
                    .then(r => r.json())
                    .then(j => j.data || []);
            })
        );
        allData = [...allData, ...remaining.flat()];
    }

    // NOTE: This logic loads all history chunks locally to match checklistApi behavior for exporting
    return { data: allData, totalCount, approvedCount };
};

// =======================================================
// 3️⃣ Submit Maintenance Tasks
// =======================================================
export const updateMaintenanceData = async (submissionData) => {
    try {
        const response = await authFetch(`${BASE_URL}/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submissionData),
        });

        if (!response.ok) {
            throw new Error("Update failed");
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error("❌ Error Updating Maintenance Tasks:", error);
        throw error;
    }
};

// =======================================================
// 4️⃣ Admin Done API
// =======================================================
export const postMaintenanceAdminDoneAPI = async (selectedItems) => {
    try {
        const response = await authFetch(`${BASE_URL}/admin-done`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(selectedItems),
        });

        const json = await response.json();
        return json;
    } catch (error) {
        console.error("❌ Error Marking Admin Done:", error);
        return { error };
    }
};

// =======================================================
// 5️⃣ Fetch Dropdown Options (Machine Name, Part Name, Part Area)
// =======================================================
export const fetchMaintenanceDropdownOptions = async () => {
    try {
        const response = await authFetch(`${BASE_URL}/dropdown-options`);
        if (!response.ok) {
            throw new Error("Failed to fetch dropdown options");
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error fetching maintenance dropdown options:", error);
        return { machineNames: [], partNames: [], partAreas: [] };
    }
};

// =======================================================
// 5b️⃣ Fetch Machine Parts (from machine_parts master table)
// =======================================================
const SETTINGS_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/settings`;

export const fetchMachineParts = async () => {
    try {
        const response = await authFetch(`${SETTINGS_BASE_URL}/machines`);
        if (!response.ok) {
            throw new Error("Failed to fetch machine parts");
        }
        return await response.json();
    } catch (error) {
        console.error("❌ Error fetching machine parts:", error);
        return [];
    }
};

// =======================================================
// 6️⃣ Fetch Unique Maintenance Tasks (QuickTask Dashboard)
// =======================================================
// =======================================================
// 6️⃣ Fetch Unique Maintenance Tasks (QuickTask Dashboard)
// =======================================================
export const fetchUniqueMaintenanceData = async (page = 0, pageSize = 50, nameFilter = "", freqFilter = "", userRole = "", userDept = "", userDiv = "", userName = "", deptFilter = "", divFilter = "") => {
    const res = await authFetch(`${BASE_URL}/unique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, pageSize, nameFilter, freqFilter, userRole, userDept, userDiv, userName, deptFilter, divFilter }),
    });
    return res.json();
};

// =======================================================
// 6b️⃣ Fetch Unique Maintenance Task Count
// =======================================================
export const fetchMaintenanceUniqueCountApi = async (userRole, userDept, userDiv, userName) => {
    const res = await authFetch(`${BASE_URL}/unique-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userRole, userDept, userDiv, userName }),
    });
    return res.json();
};

// =======================================================
// 7️⃣ Delete Unique Maintenance Tasks
// =======================================================
export const deleteUniqueMaintenanceTasksApi = async (tasks) => {
    const res = await authFetch(`${BASE_URL}/delete-unique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
    });
    return res.json();
};

// =======================================================
// 8️⃣ Update Unique Maintenance Task
// =======================================================
export const updateUniqueMaintenanceTaskApi = async (updatedTask, originalTask) => {
    const res = await authFetch(`${BASE_URL}/update-unique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedTask, originalTask }),
    });
    return res.json();
};

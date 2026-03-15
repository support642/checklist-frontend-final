// maintenanceApi.js
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/maintenance`;

// =======================================================
// 1️⃣ Fetch Pending Maintenance Tasks
// =======================================================
export const fetchMaintenanceDataSortByDate = async (page = 1, search = '') => {
    const username = localStorage.getItem("user-name");
    const role = localStorage.getItem("role");
    const department = localStorage.getItem("department");
    const unit = localStorage.getItem("unit");
    const division = localStorage.getItem("division");

    const firstRes = await fetch(
        `${BASE_URL}?page=1&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${division}&search=${encodeURIComponent(search)}`
    );

    if (!firstRes.ok) {
        const contentType = firstRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errJson = await firstRes.json();
            throw new Error(errJson.error || `Server error ${firstRes.status}`);
        } else {
            throw new Error(`Server returned non-JSON response (${firstRes.status}). This often means the API URL or Port is incorrect.`);
        }
    }

    const contentType = firstRes.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Expected JSON response but received HTML/Text. Check your API configuration.");
    }

    const firstJson = await firstRes.json();
    const totalCount = firstJson.totalCount || 0;
    let allData = firstJson.data || [];
    const PAGE_SIZE = 50;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    if (totalPages > 1) {
        const remaining = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
                fetch(`${BASE_URL}?page=${i + 2}&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${division}&search=${encodeURIComponent(search)}`)
                    .then(r => r.json())
                    .then(j => j.data || [])
            )
        );
        allData = [...allData, ...remaining.flat()];
    }

    return { data: allData, totalCount, page: 1 };
};

// =======================================================
// 2️⃣ Fetch Maintenance History
// =======================================================
export const fetchMaintenanceDataForHistory = async (search = "") => {
    const username = localStorage.getItem("user-name");
    const role = localStorage.getItem("role");
    const department = localStorage.getItem("department");
    const unit = localStorage.getItem("unit");
    const division = localStorage.getItem("division");
    const PAGE_SIZE = 50;

    const encodedSearch = encodeURIComponent(search);

    // Fetch page 1 to get totalCount
    const firstRes = await fetch(
        `${BASE_URL}/history?page=1&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${division}&search=${encodedSearch}`
    );
    const firstJson = await firstRes.json();
    const totalCount = firstJson.totalCount || 0;
    const approvedCount = firstJson.approvedCount || 0;
    let allData = firstJson.data || [];

    // Fetch remaining pages in parallel
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    if (totalPages > 1) {
        const remaining = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, i) =>
                fetch(`${BASE_URL}/history?page=${i + 2}&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${division}&search=${encodedSearch}`)
                    .then(r => r.json())
                    .then(j => j.data || [])
            )
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
        const response = await fetch(`${BASE_URL}/update`, {
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
        const response = await fetch(`${BASE_URL}/admin-done`, {
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
        const response = await fetch(`${BASE_URL}/dropdown-options`);
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
        const response = await fetch(`${SETTINGS_BASE_URL}/machines`);
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
export const fetchUniqueMaintenanceData = async (page = 0, pageSize = 50, nameFilter = "", freqFilter = "") => {
    const res = await fetch(`${BASE_URL}/unique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, pageSize, nameFilter, freqFilter }),
    });
    return res.json();
};

// =======================================================
// 7️⃣ Delete Unique Maintenance Tasks
// =======================================================
export const deleteUniqueMaintenanceTasksApi = async (tasks) => {
    const res = await fetch(`${BASE_URL}/delete-unique`, {
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
    const res = await fetch(`${BASE_URL}/update-unique`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updatedTask, originalTask }),
    });
    return res.json();
};

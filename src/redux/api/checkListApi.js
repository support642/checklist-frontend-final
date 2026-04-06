// checkListApi.js
import { authFetch } from "../../utils/authFetch";
// const BASE_URL = "http://localhost:5050/api/checklist";
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/checklist`;

// =======================================================
// 1️⃣ Fetch Pending Checklist (AWS Backend)
// =======================================================
export const fetchChechListDataSortByDate = async (page = 1, search = '', status = 'all', frequency = 'all', name = 'all', division = 'all', departmentFilter = 'all') => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");
  const department = localStorage.getItem("department");
  const unit = localStorage.getItem("unit");
  const divisionLocal = localStorage.getItem("division");

  let url = `${BASE_URL}/pending?page=${page}&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${divisionLocal}&search=${encodeURIComponent(search)}`;
  
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
// 2️⃣ Fetch Checklist History (AWS Backend)
// =======================================================
export const fetchChechListDataForHistory = async (search = "", name = 'all', division = 'all', departmentFilter = 'all') => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");
  const department = localStorage.getItem("department");
  const unit = localStorage.getItem("unit");
  const divisionLocal = localStorage.getItem("division");
  const PAGE_SIZE = 50;

  const encodedSearch = encodeURIComponent(search);
  let baseUrl = `${BASE_URL}/history?page=1&username=${username}&role=${role}&department=${department}&unit=${unit}&division=${divisionLocal}&search=${encodedSearch}`;

  if (name !== 'all') baseUrl += `&nameFilter=${encodeURIComponent(name)}`;
  if (division !== 'all') baseUrl += `&divisionFilter=${encodeURIComponent(division)}`;
  if (departmentFilter !== 'all') baseUrl += `&departmentFilter=${encodeURIComponent(departmentFilter)}`;

  // Fetch page 1 to get totalCount
  const firstRes = await authFetch(baseUrl);

  if (!firstRes.ok) {
    const contentType = firstRes.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errJson = await firstRes.json();
      throw new Error(errJson.error || `Server error ${firstRes.status}`);
    } else {
      throw new Error(`Server returned non-JSON response (${firstRes.status}). Check API URL/Port.`);
    }
  }

  const contentType = firstRes.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Expected JSON response but received HTML/Text. Check API configuration.");
  }

  const firstJson = await firstRes.json();
  const totalCount = firstJson.totalCount || 0;
  const approvedCount = firstJson.approvedCount || 0;
  let allData = firstJson.data || [];

  // Fetch remaining pages in parallel
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages > 1) {
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        authFetch(`${baseUrl.replace('page=1', `page=${i + 2}`)}`)
          .then(r => r.json())
          .then(j => j.data || [])
      )
    );
    allData = [...allData, ...remaining.flat()];
  }

  return { data: allData, totalCount, approvedCount };
};


// =======================================================
// 3️⃣ Submit Checklist (AWS Backend)
// =======================================================
export const updateChecklistData = async (submissionData) => {
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
    console.error("❌ Error Updating Checklist:", error);
    throw error;
  }
};

// =======================================================
// 4️⃣ Admin Done API (AWS Backend)
// =======================================================
export const postChecklistAdminDoneAPI = async (selectedItems) => {
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
// 5️⃣ Send Email Notification (AWS Backend - Admin Only)
// =======================================================
export const sendEmailNotificationAPI = async (items) => {
  try {
    const response = await authFetch(`${BASE_URL}/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error("Email sending failed");
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Sending Email:", error);
    throw error;
  }
};

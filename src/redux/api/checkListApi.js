// checkListApi.js
// const BASE_URL = "http://localhost:5050/api/checklist";
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/checklist`;

// =======================================================
// 1️⃣ Fetch Pending Checklist (AWS Backend)
// =======================================================
export const fetchChechListDataSortByDate = async (page = 1, search = '') => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");
  const department = localStorage.getItem("department");

  const response = await fetch(
    `${BASE_URL}/pending?page=${page}&username=${username}&role=${role}&department=${department}&search=${encodeURIComponent(search)}`
  );

  return await response.json();
};


// =======================================================
// 2️⃣ Fetch Checklist History (AWS Backend)
// =======================================================
export const fetchChechListDataForHistory = async (search = "") => {
  const username = localStorage.getItem("user-name");
  const role = localStorage.getItem("role");
  const department = localStorage.getItem("department");
  const PAGE_SIZE = 50;

  const encodedSearch = encodeURIComponent(search);

  // Fetch page 1 to get totalCount
  const firstRes = await fetch(
    `${BASE_URL}/history?page=1&username=${username}&role=${role}&department=${department}&search=${encodedSearch}`
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
        fetch(`${BASE_URL}/history?page=${i + 2}&username=${username}&role=${role}&department=${department}&search=${encodedSearch}`)
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
    console.error("❌ Error Updating Checklist:", error);
    throw error;
  }
};

// =======================================================
// 4️⃣ Admin Done API (AWS Backend)
// =======================================================
export const postChecklistAdminDoneAPI = async (selectedItems) => {
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
// 5️⃣ Send WhatsApp Notification API (Admin Only)
// =======================================================
export const sendChecklistWhatsAppAPI = async (selectedItems) => {
  try {
    const response = await fetch(`${BASE_URL}/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: selectedItems }),
    });

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("❌ Error Sending WhatsApp:", error);
    return { error };
  }
};

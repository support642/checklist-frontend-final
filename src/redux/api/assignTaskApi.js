import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:5050/api/assign-task",
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/assign-task`,
});

export const fetchUniqueDepartmentDataApi = async (user_name) => {
  return (await API.get(`/departments/${user_name}`)).data;
};

export const fetchUniqueGivenByDataApi = async () => {
  return (await API.get(`/given-by`)).data;
};

export const fetchUniqueDoerNameDataApi = async (args = {}) => {
  const { department, unit, division } = args;
  if (!department) {
    // No department specified — return all active doer names
    return (await API.get(`/doer-all`)).data;
  }
  const params = {};
  if (unit) params.unit = unit;
  if (division) params.division = division;
  return (await API.get(`/doer/${department}`, { params })).data;
};

export const pushAssignTaskApi = async (tasks) => {
  return (await API.post(`/assign`, tasks)).data;
};

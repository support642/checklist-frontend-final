import axios from "axios";

const API = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/assign-task`,
});

export const fetchUserProfileApi = async (username) => {
    return (await API.get(`/user-profile/${username}`)).data;
};

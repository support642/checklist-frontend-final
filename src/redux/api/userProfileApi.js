import { authAxios, createAuthAxios } from "../../utils/authAxios";
import axios from "axios";

const API = createAuthAxios({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/assign-task`,
});

export const fetchUserProfileApi = async (username) => {
    return (await API.get(`/user-profile/${username}`)).data;
};

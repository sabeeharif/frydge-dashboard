// src/app/utils/axios/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge",
    withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" && localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response);
        return Promise.reject(error);
    }
);

export default axiosClient;

// src/app/utils/axios/productApi.js
import axiosClient from "./axiosClient";

const productApi = {
    create: (data) => axiosClient.post("/products", data),
    getAll: (limit = 10, headers = {}) =>
        axiosClient.get(`/products?limit=${limit}`, { headers }),
    update: (id, data) => axiosClient.put(`/products/${id}`, data),
    delete: (id) => axiosClient.delete(`/products/${id}`),
};

export default productApi;

import axios from "axios";

export const API_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
// const API_URL = `${API_URL}/api`;

export const getAllCategory = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/getAllCategory`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getCategoryById = async (categoryId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/getCategoryById/${categoryId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const addCategory = async (categoryData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/addCategory`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateCategory = async (categoryData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.put(`${API_URL}/updateCategory`, categoryData, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteCategory = async (categoryId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.delete(`${API_URL}/deleteCategory?categoryId=${categoryId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};


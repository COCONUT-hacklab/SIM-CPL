import axios from "axios";

// Ambil URL dari env, jika tidak ada gunakan localhost sebagai default
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

export const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: false,
    headers: {
        // Header ini berguna agar tidak mentok di halaman warning ngrok saat development
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json",
    }
});
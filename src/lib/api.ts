import axios from "axios";

export const api = axios.create({
    baseURL: "https://2b308d25805d.ngrok-free.app/api",
    withCredentials: false,
});
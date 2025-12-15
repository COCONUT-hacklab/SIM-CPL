import axios from "axios";

export const api = axios.create({
    baseURL: "https://gths0ls0-8001.asse.devtunnels.ms/api",
    withCredentials: false,
});
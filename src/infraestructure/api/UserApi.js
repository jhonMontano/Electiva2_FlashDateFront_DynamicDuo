import axios from "axios";
import { API_URL } from "../../shared/constants";

const api = axios.create({
    baseURL: API_URL,
    Headers: {
        "Content-Type": "application/json"
    }
});

export default api;
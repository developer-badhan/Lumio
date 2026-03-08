// services/auth.js
import api from "./axios";

// Fetch all registered users for the contact list
export const fetchAllUsers = () => api.get("/auth/users");

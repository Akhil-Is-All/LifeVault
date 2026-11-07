import axios from "axios";

const API_URL = "http://localhost:5000/api/reminders";
const AUTH_URL = "http://localhost:5000/api/auth";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lifevault_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Authentication APIs

export async function registerUser(userData) {
  const response = await api.post("/auth/register", userData);
  return response.data.data;
}

export async function loginUser(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.data;
}

// Reminder APIs

export async function getReminders() {
  const response = await api.get("/reminders");
  return response.data.data;
}

export async function createReminder(reminderData) {
  const response = await api.post("/reminders", reminderData);
  return response.data.data;
}

export async function updateReminder(id, reminderData) {
  const response = await api.patch(`/reminders/${id}`, reminderData);
  return response.data.data;
}

export async function deleteReminder(id) {
  const response = await api.delete(`/reminders/${id}`);
  return response.data;
}

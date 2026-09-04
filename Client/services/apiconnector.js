// src/services/apiConnector.js

import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5501/api/v1",
  withCredentials: true,
});

export const apiConnector = (method, url, bodyData, params, headers, extraConfig) => {
  return axiosInstance({
    method,
    url,
    data: bodyData || null,
    params: params || null,
    headers: headers || null,
    ...extraConfig, // e.g. { responseType: "blob" } for CSV export
  });
};
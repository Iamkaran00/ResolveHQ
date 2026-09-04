import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5500/api/v1/",
  withCredentials: true,
});

export const apiConnector = (
  method,
  url,
  bodyData,
  params,
  headers
) => {
  return axiosInstance({
    method: method,
    url: url,
    data: bodyData || null,
    headers: headers || null,
    params: params || null,
  });
};
import axios from "axios"

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true // important for cookies
})

export default axiosInstance
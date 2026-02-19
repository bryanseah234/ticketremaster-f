// Axios instance + interceptors
import axios from 'axios'
// import { useAuthStore } from '@/stores/auth'
// import router from '@/router'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

// TODO: Add interceptors as per INSTRUCTIONS.md

export default api;

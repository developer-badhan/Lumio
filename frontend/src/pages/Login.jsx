import React, { useState } from 'react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-8 border border-gray-100 dark:border-gray-700">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-linear-to-br from-purple-500 to-purple-700 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Enter your details to access your chats.</p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
            <input 
              type="email" 
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200"
              placeholder="name@example.com"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors">Forgot password?</a>
            </div>
            <input 
              type="password" 
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all duration-200"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center">
            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500/30 transition-colors" />
            <label className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</label>
          </div>

          <button className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-md shadow-purple-500/20 active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2">
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account? <a href="#" className="font-semibold text-purple-600 hover:text-purple-500 transition-colors">Register here</a>
        </p>
      </div>
    </div>
  );
};

export default Login;




// import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import axios from "../services/axios"
// import { useAuth } from "../context/AuthContext"

// const Login = () => {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const { getMe } = useAuth()
//   const navigate = useNavigate()

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     await axios.post("/auth/login", { email, password })

//     await getMe()
//     navigate("/")
//   }

//   return (
//     <div className="h-screen flex items-center justify-center">
//       <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
//         <h2 className="text-xl mb-4">Login</h2>

//         <input value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Email"
//           className="w-full border p-2 mb-2" />

//         <input type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Password"
//           className="w-full border p-2 mb-2" />

//         <button className="bg-blue-600 text-white w-full p-2 rounded">
//           Login
//         </button>
//       </form>
//     </div>
//   )
// }

// export default Login
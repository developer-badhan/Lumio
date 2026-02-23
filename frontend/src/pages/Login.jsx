import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../services/axios"
import { useAuth } from "../context/AuthContext"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { getMe } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    await axios.post("/auth/login", { email, password })

    await getMe()
    navigate("/")
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl mb-4">Login</h2>

        <input value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full border p-2 mb-2" />

        <input type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border p-2 mb-2" />

        <button className="bg-blue-600 text-white w-full p-2 rounded">
          Login
        </button>
      </form>
    </div>
  )
}

export default Login
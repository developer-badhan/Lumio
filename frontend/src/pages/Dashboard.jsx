import { useAuth } from "../context/AuthContext"
import axios from "../services/axios"

const Dashboard = () => {
  const { user } = useAuth()

  const logout = async () => {
    await axios.post("/auth/logout")
    window.location.href = "/login"
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl">Welcome {user?.name}</h1>
      <button onClick={logout} className="bg-red-500 text-white p-2 mt-4">
        Logout
      </button>
    </div>
  )
}

export default Dashboard
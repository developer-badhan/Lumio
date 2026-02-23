import { createContext, useContext, useEffect, useState } from "react"
import axios from "../services/axios"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const getMe = async () => {
    try {
      const { data } = await axios.get("/auth/me")
      setUser(data.user)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getMe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading, getMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
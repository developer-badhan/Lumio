import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../services/axios"

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  })
  const [profilePic, setProfilePic] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append("name", form.name)
    formData.append("email", form.email)
    formData.append("password", form.password)
    if (profilePic) {
      formData.append("profilePic", profilePic)
    }

    await axios.post("/auth/register", formData)

    navigate("/verify-otp")
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl mb-4">Register</h2>

        <input name="name" placeholder="Name"
          onChange={handleChange}
          className="w-full border p-2 mb-2" />

        <input name="email" placeholder="Email"
          onChange={handleChange}
          className="w-full border p-2 mb-2" />

        <input type="password" name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full border p-2 mb-2" />

        <input type="file"
          onChange={(e) => setProfilePic(e.target.files[0])}
          className="mb-2" />

        <button className="bg-blue-500 text-white w-full p-2 rounded">
          Register
        </button>
      </form>
    </div>
  )
}

export default Register
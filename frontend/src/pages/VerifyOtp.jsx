import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../services/axios"

const VerifyOtp = () => {
  const [otp, setOtp] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    await axios.post("/auth/verify-otp", { otp })

    navigate("/login")
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl mb-4">Verify OTP</h2>

        <input value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full border p-2 mb-2" />

        <button className="bg-green-500 text-white w-full p-2 rounded">
          Verify
        </button>
      </form>
    </div>
  )
}

export default VerifyOtp
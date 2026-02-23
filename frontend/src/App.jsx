import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"

import Register from "./pages/Register"
import VerifyOtp from "./pages/VerifyOtp"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { useAuth } from './context/AuthContext';

// // Pages
// import Login from './pages/Login.jsx';
// import Register from './pages/Register.jsx';
// import VerifyOTP from './pages/VerifyOTP.jsx';
// import Dashboard from './pages/Dashboard.jsx';

// // Helper Component for Protected Routes 
// const ProtectedRoute = ({ children }) => {
//   const { token } = useAuth();
//   return token ? children : <Navigate to="/login" replace />;
// };

// const App = () => {
//   return (
//     <Router>
//       <Routes>
//         {/* Auth Routes */}
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/verify-otp" element={<VerifyOTP />} />

//         {/* Protected Dashboard Route [cite: 3, 5] */}
//         <Route 
//           path="/dashboard" 
//           element={
//             <ProtectedRoute>
//               <Dashboard />
//             </ProtectedRoute>
//           } 
//         />

//         {/* Root Redirect */}
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
//         {/* 404 Fallback */}
//         <Route path="*" element={<div className="flex items-center justify-center h-screen dark:bg-gray-900 dark:text-white">Page Not Found</div>} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;



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
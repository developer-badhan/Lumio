import React, { useState, useRef, useEffect } from 'react';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef([]);

  // Simple countdown timer for UX
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Auto focus previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-8 border border-gray-100 dark:border-gray-700 text-center animate-fade-in-up">
        
        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 rounded-full mx-auto flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          We've sent a 6-digit verification code to <br/>
          <span className="font-medium text-gray-900 dark:text-gray-200">s****@example.com</span>
        </p>

        <div className="flex justify-center gap-2 sm:gap-3 mb-8">
          {otp.map((data, index) => (
            <input
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              type="text"
              name="otp"
              maxLength="1"
              key={index}
              value={data}
              onChange={e => handleChange(e.target, index)}
              onKeyDown={e => handleKeyDown(e, index)}
              ref={el => inputRefs.current[index] = el}
            />
          ))}
        </div>

        <button className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow-md shadow-purple-500/20 active:scale-[0.98] transition-all duration-200 mb-6">
          Verify Account
        </button>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Didn't receive the code?{' '}
          {countdown > 0 ? (
            <span className="font-medium text-gray-400 cursor-not-allowed">Resend in {countdown}s</span>
          ) : (
            <button 
              onClick={() => setCountdown(30)}
              className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
            >
              Click to resend
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;


// import { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import axios from "../services/axios"

// const VerifyOtp = () => {
//   const [otp, setOtp] = useState("")
//   const navigate = useNavigate()

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     await axios.post("/auth/verify-otp", { otp })

//     navigate("/login")
//   }

//   return (
//     <div className="h-screen flex items-center justify-center">
//       <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-96">
//         <h2 className="text-xl mb-4">Verify OTP</h2>

//         <input value={otp}
//           onChange={(e) => setOtp(e.target.value)}
//           placeholder="Enter OTP"
//           className="w-full border p-2 mb-2" />

//         <button className="bg-green-500 text-white w-full p-2 rounded">
//           Verify
//         </button>
//       </form>
//     </div>
//   )
// }

// export default VerifyOtp
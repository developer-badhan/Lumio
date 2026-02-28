import React, { useState } from 'react';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-full bg-white dark:bg-gray-950 flex overflow-hidden text-gray-900 dark:text-white transition-colors duration-300">
      
      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Chat List */}
      <aside className={`fixed md:relative z-30 w-80 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-500 to-purple-700 shadow-sm flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="font-semibold">Chats</h1>
          </div>
          {/* Dark Mode / Settings Toggles go here */}
        </div>

        {/* Search Bar */}
        <div className="p-3">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 group-focus-within:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Chat List (Scrollable) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {/* Dummy Chat Item */}
          <div className="flex items-center gap-3 p-3 mx-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors active:scale-[0.99]">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0 relative">
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-medium text-sm truncate">Sarah Jenkins</h3>
                <span className="text-xs text-gray-500">10:42 AM</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Hey! Have you seen the new design?</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-opacity-5">
        
        {/* Chat Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center px-4 shrink-0 z-10 sticky top-0">
          <button 
            className="mr-3 md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div>
              <h2 className="font-semibold text-sm">Sarah Jenkins</h2>
              <p className="text-xs text-purple-600 font-medium">Online</p>
            </div>
          </div>
        </header>

        {/* Chat Messages (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Example Chat Bubbles would go here */}
        </div>

        {/* Sticky Input Area */}
        <footer className="p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shrink-0">
          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <button className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center">
              <textarea 
                rows="1"
                placeholder="Type a message..."
                className="w-full bg-transparent border-none py-3 px-4 focus:ring-0 resize-none max-h-32 text-sm outline-none"
              ></textarea>
            </div>
            <button className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-md shadow-purple-500/20 active:scale-95 transition-all">
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;



// import { useAuth } from "../context/AuthContext"
// import axios from "../services/axios"

// const Dashboard = () => {
//   const { user } = useAuth()

//   const logout = async () => {
//     await axios.post("/auth/logout")
//     window.location.href = "/login"
//   }

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl">Welcome {user?.name}</h1>
//       <button onClick={logout} className="bg-red-500 text-white p-2 mt-4">
//         Logout
//       </button>
//     </div>
//   )
// }

// export default Dashboard
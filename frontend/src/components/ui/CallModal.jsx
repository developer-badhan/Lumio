// import React from 'react';
// import { PhoneOff, MicOff, Volume2 } from 'lucide-react';

// const CallModal = ({ isOpen, user, onEnd }) => {
//   if (!isOpen) return null;
  
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
//       <div className="w-80 flex flex-col items-center text-center">
//         <div className="relative mb-8">
//           <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
//           <img src={user.avatar} className="w-32 h-32 rounded-full border-4 border-white/10 relative z-10" alt="" />
//         </div>
//         <h2 className="text-2xl font-bold text-white mb-1">{user.name}</h2>
//         <p className="text-blue-400 text-sm font-medium animate-pulse">Calling...</p>
        
//         <div className="mt-12 flex gap-6">
//           <button className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
//             <MicOff size={24} />
//           </button>
//           <button onClick={onEnd} className="p-4 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-xl shadow-red-500/40 transition-all hover:rotate-12">
//             <PhoneOff size={24} />
//           </button>
//           <button className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
//             <Volume2 size={24} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };



import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import Avatar from './Avatar';

const CallModal = ({ isOpen, callerName, callType = 'audio', isIncoming = true, onAccept, onReject }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111111] border border-purple-500/30 p-8 rounded-2xl flex flex-col items-center max-w-sm w-full shadow-[0_0_40px_rgba(168,85,247,0.15)] text-white">
        
        <Avatar size="w-24 h-24" fallback={callerName?.charAt(0) || 'U'} />
        
        <h2 className="text-2xl font-bold mt-4">{callerName || 'Unknown Contact'}</h2>
        <p className="text-purple-400 mt-1">
          {isIncoming ? `Incoming ${callType} call...` : `Calling...`}
        </p>

        <div className="flex gap-8 mt-10">
          <button 
            onClick={onReject}
            className="w-14 h-14 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors"
          >
            <PhoneOff size={24} />
          </button>
          
          {isIncoming && (
            <button 
              onClick={onAccept}
              className="w-14 h-14 rounded-full bg-linear-to-r from-purple-500 to-purple-700 hover:opacity-90 text-white flex items-center justify-center transition-opacity"
            >
              {callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
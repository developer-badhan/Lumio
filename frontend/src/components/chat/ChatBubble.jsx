import React from 'react';

const ChatBubble = ({ isOwn, message, timestamp }) => {
  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      <div className={`max-w-[75%] md:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div 
          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
            isOwn 
              ? 'bg-purple-600 text-white rounded-tr-sm' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-700'
          }`}
        >
          {message}
        </div>
        <span className="text-[11px] text-gray-400 mt-1 px-1">
          {timestamp}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;
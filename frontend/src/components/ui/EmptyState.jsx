import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import Button from './Button';

const EmptyState = ({ title, description, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-400">
        <MessageSquarePlus size={40} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-70 mb-8 leading-relaxed">
        {description}
      </p>
      {actionText && (
        <Button onClick={onAction} variant="secondary">
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
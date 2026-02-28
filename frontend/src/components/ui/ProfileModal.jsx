import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

const ProfileModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    bio: 'Product Designer at Vercel. Coffee lover ☕️'
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings">
      <div className="space-y-6">
        {/* Avatar Upload Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="group relative">
            <Avatar size="lg" name={profile.name} src={null} />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input type="file" className="hidden" />
            </label>
          </div>
          <div className="text-center">
            <h4 className="font-semibold text-gray-900 dark:text-white">Profile Photo</h4>
            <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 2MB</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <Input 
            label="Full Name" 
            value={profile.name} 
            onChange={(e) => setProfile({...profile, name: e.target.value})}
          />
          <Input 
            label="Email Address" 
            type="email" 
            value={profile.email} 
            disabled 
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">About</label>
            <textarea 
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none h-24 text-sm"
              value={profile.bio}
              onChange={(e) => setProfile({...profile, bio: e.target.value})}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;
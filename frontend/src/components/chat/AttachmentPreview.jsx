import React, { useEffect, useState } from 'react';
import { X, FileText } from 'lucide-react';

/**
 * AttachmentPreview
 * ─────────────────
 * Shows a preview of the file selected for upload before sending.
 * 
 * Fix vs original:
 *   • Original called URL.createObjectURL(file) directly in render — this creates
 *     a new blob URL on every re-render and never revokes it → memory leak.
 *   • Now uses useEffect to create the URL once and revoke it on cleanup.
 */

const AttachmentPreview = ({ file, onClear }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file || !file.type?.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Revoke on unmount or when file changes — prevents memory leak
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file) return null;

  const isImage = file.type?.startsWith('image/');
  const isAudio = file.type?.startsWith('audio/');
  const isVideo = file.type?.startsWith('video/');

  const getFileIcon = () => {
    if (isAudio) return '🎵';
    if (isVideo) return '🎬';
    return null;
  };

  return (
    <div className="absolute bottom-full left-0 mb-2 p-3 bg-[#111111] border border-purple-500/30 rounded-lg flex items-center gap-3 shadow-lg max-w-sm w-full backdrop-blur-md">

      {/* Thumbnail / icon */}
      <div className="w-12 h-12 rounded bg-black flex items-center justify-center overflow-hidden border border-gray-800 shrink-0">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">
            {getFileIcon() || <FileText className="text-purple-500" size={24} />}
          </span>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate font-medium">{file.name}</p>
        <p className="text-xs text-gray-500">
          {(file.size / 1024 / 1024).toFixed(2)} MB
          {isAudio && ' · Audio'}
          {isVideo && ' · Video'}
          {isImage && ' · Image'}
        </p>
      </div>

      {/* Clear button */}
      <button
        onClick={onClear}
        className="p-1.5 bg-gray-900 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition-colors shrink-0"
        title="Remove attachment"
      >
        <X size={16} />
      </button>

    </div>
  );
};

export default AttachmentPreview;
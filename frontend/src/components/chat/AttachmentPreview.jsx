import React, { useEffect, useState } from "react";
import { X, FileText, Image as ImageIcon, File } from "lucide-react";

const formatFileSize = (size) => {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
};

const AttachmentPreview = ({ files, onRemove }) => {
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    const urls = files.map((file) =>
      file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  if (!files || files.length === 0) return null;

  return (
    <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide bg-purple-900/20 border border-purple-500/10 rounded-xl">
      {files.map((file, index) => {
        const isImage = file.type.startsWith("image/");

        return (
          <div
            key={index}
            className="relative w-24 shrink-0 group"
          >
            <div className="h-24 rounded-xl overflow-hidden border border-purple-500/20 bg-[#1d1736] flex items-center justify-center">
              {isImage ? (
                <img
                  src={previewUrls[index]}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <File size={28} className="text-purple-400" />
              )}
            </div>

            {/* File Info */}
            <div className="mt-1 text-xs text-purple-200 truncate">
              {file.name}
            </div>
            <div className="text-[10px] text-purple-300/60">
              {formatFileSize(file.size)}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentPreview;
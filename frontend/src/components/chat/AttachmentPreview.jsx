// import React, { useEffect, useState } from "react";
// import { X, FileText, Image as ImageIcon, File } from "lucide-react";

// const formatFileSize = (size) => {
//   if (size < 1024) return size + " B";
//   if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
//   return (size / (1024 * 1024)).toFixed(1) + " MB";
// };

// const AttachmentPreview = ({ files, onRemove }) => {
//   const [previewUrls, setPreviewUrls] = useState([]);

//   useEffect(() => {
//     const urls = files.map((file) =>
//       file.type.startsWith("image/")
//         ? URL.createObjectURL(file)
//         : null
//     );

//     setPreviewUrls(urls);

//     return () => {
//       urls.forEach((url) => {
//         if (url) URL.revokeObjectURL(url);
//       });
//     };
//   }, [files]);

//   if (!files || files.length === 0) return null;

//   return (
//     <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide bg-purple-900/20 border border-purple-500/10 rounded-xl">
//       {files.map((file, index) => {
//         const isImage = file.type.startsWith("image/");

//         return (
//           <div
//             key={index}
//             className="relative w-24 shrink-0 group"
//           >
//             <div className="h-24 rounded-xl overflow-hidden border border-purple-500/20 bg-[#1d1736] flex items-center justify-center">
//               {isImage ? (
//                 <img
//                   src={previewUrls[index]}
//                   alt={file.name}
//                   className="w-full h-full object-cover"
//                   loading="lazy"
//                 />
//               ) : (
//                 <File size={28} className="text-purple-400" />
//               )}
//             </div>

//             {/* File Info */}
//             <div className="mt-1 text-xs text-purple-200 truncate">
//               {file.name}
//             </div>
//             <div className="text-[10px] text-purple-300/60">
//               {formatFileSize(file.size)}
//             </div>

//             {/* Remove Button */}
//             <button
//               onClick={() => onRemove(index)}
//               className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         );
//       })}
//     </div>
//   );
// };

// export default AttachmentPreview;









import React from 'react';
import { X, FileText, Image as ImageIcon } from 'lucide-react';

const AttachmentPreview = ({ file, onClear }) => {
  if (!file) return null;

  const isImage = file.type?.startsWith('image/');
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="absolute bottom-full left-0 mb-2 p-3 bg-[#111111] border border-purple-500/30 rounded-lg flex items-center gap-3 shadow-lg max-w-sm w-full backdrop-blur-md">
      <div className="w-12 h-12 rounded bg-black flex items-center justify-center overflow-hidden border border-gray-800">
        {isImage ? (
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <FileText className="text-purple-500" size={24} />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate font-medium">{file.name}</p>
        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>

      <button 
        onClick={onClear}
        className="p-1.5 bg-gray-900 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-full transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AttachmentPreview;
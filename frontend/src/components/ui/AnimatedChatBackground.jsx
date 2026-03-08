import React from "react";

const AnimatedChatBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">

      {/* Dark base */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      {/* Aurora gradient */}
      <div className="absolute inset-0 aurora-bg opacity-40" />

      {/* Telegram style lines */}
      <div className="absolute inset-0 telegram-lines opacity-30" />

      {/* Floating glow blobs */}
      <div className="absolute w-[700px] h-[700px] bg-purple-700/20 rounded-full blur-[160px] animate-float1 -top-[250px] -left-[250px]" />

      <div className="absolute w-[600px] h-[600px] bg-fuchsia-700/20 rounded-full blur-[140px] animate-float2 -bottom-[250px] -right-[250px]" />

      <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-float3 top-[35%] left-[30%]" />

      {/* Noise */}
      <div className="absolute inset-0 noise-bg opacity-[0.03]" />

    </div>
  );
};

export default AnimatedChatBackground;
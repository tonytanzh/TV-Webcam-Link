import React, { useEffect, useRef } from 'react';

interface MotionScreenProps {
  stream: MediaStream;
  logoUrl: string;
}

const MotionScreen: React.FC<MotionScreenProps> = ({ stream, logoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="w-full h-full relative bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
      {/* 
        This container spans the full width at the bottom and uses flexbox 
        to perfectly center the logo, which is a more robust method.
      */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center">
        {/*
          The image scales proportionally within these constraints.
          - max-w-[25%] limits width to 25% of the screen width.
          - max-h-[15vh] limits height to 15% of the screen height.
          - object-contain ensures the aspect ratio is maintained.
          This handles both very wide and very tall logos gracefully.
        */}
        <img 
          src={logoUrl} 
          alt="Brand Logo" 
          className="max-w-[25%] max-h-[15vh] object-contain" 
        />
      </div>
    </div>
  );
};

export default MotionScreen;

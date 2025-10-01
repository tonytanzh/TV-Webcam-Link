
import React from 'react';

interface IdleScreenProps {
  videoUrl: string;
}

const IdleScreen: React.FC<IdleScreenProps> = ({ videoUrl }) => {
  return (
    <div className="w-full h-full absolute top-0 left-0">
      <video
        key={videoUrl}
        className="w-full h-full object-cover"
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
};

export default IdleScreen;

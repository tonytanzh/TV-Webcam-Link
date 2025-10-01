import React, { useState, useCallback, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import IdleScreen from './components/IdleScreen';
import MotionScreen from './components/MotionScreen';
import { useMotionDetection } from './hooks/useMotionDetection';

interface AppConfig {
  videoObjectUrl: string;
  logoUrl: string;
  sensitivity: number;
}

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isMotionActive, setIsMotionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up the object URL when the component unmounts or config changes
  useEffect(() => {
    return () => {
      if (config?.videoObjectUrl) {
        URL.revokeObjectURL(config.videoObjectUrl);
      }
    };
  }, [config]);


  const handleMotionStart = useCallback(() => {
    setIsMotionActive(true);
  }, []);

  const handleMotionEnd = useCallback(() => {
    setIsMotionActive(false);
  }, []);
  
  const handleCameraError = useCallback((err: Error) => {
    console.error("Camera Error:", err);
    setError(err.message);
  }, []);

  const { stream } = useMotionDetection({
    onMotionStart: handleMotionStart,
    onMotionEnd: handleMotionEnd,
    onError: handleCameraError,
    enabled: !!config,
    sensitivity: config?.sensitivity,
  });

  const handleSetupComplete = (videoFile: File, logoUrl: string, sensitivity: number) => {
    setError(null); // Clear previous errors on new setup
    
    // Clean up previous object URL if it exists
    if (config?.videoObjectUrl) {
      URL.revokeObjectURL(config.videoObjectUrl);
    }

    const newVideoObjectUrl = URL.createObjectURL(videoFile);
    setConfig({ videoObjectUrl: newVideoObjectUrl, logoUrl, sensitivity });

    // Request fullscreen after user interaction
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Failed to enter fullscreen mode:", err);
      }
    };
    enterFullscreen();
  };
  
  const handleRetrySetup = () => {
    setConfig(null);
    setError(null);
  };

  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-red-500 p-8" role="alert">
        <h1 className="text-4xl font-bold mb-4">An Error Occurred</h1>
        <p className="text-xl text-center text-gray-300 max-w-3xl">{error}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={handleRetrySetup}
            className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Retry Setup
          </button>
        </div>
      </div>
    );
  }

  if (!config) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <div className="w-screen h-screen bg-black">
      {isMotionActive && stream ? (
        <MotionScreen stream={stream} logoUrl={config.logoUrl} />
      ) : (
        <IdleScreen videoUrl={config.videoObjectUrl} />
      )}
    </div>
  );
};

export default App;
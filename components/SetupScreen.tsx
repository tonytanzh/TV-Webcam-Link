import React, { useState } from 'react';

interface SetupScreenProps {
  onComplete: (videoFile: File, logoUrl: string, sensitivity: number) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('https://www.google.com/images/branding/googlelogo/2x/googlelogo_light_color_272x92dp.png');
  const [sensitivity, setSensitivity] = useState(50);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (videoFile && logoUrl) {
      onComplete(videoFile, logoUrl, sensitivity);
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4">TV Motion Display Setup</h1>
        <p className="text-xl text-gray-400 mb-12">
          Select your idle video file and brand logo URL to begin.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-start">
            <label htmlFor="videoFile" className="text-lg font-semibold mb-2 text-gray-300">Idle Video File</label>
            <label className="w-full cursor-pointer p-4 bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg text-lg text-white hover:border-blue-500 hover:bg-gray-700 transition-colors">
              <input
                id="videoFile"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <span className={videoFile ? 'text-green-400' : 'text-gray-400'}>
                {videoFile ? `Selected: ${videoFile.name}` : 'Click to select a video file'}
              </span>
            </label>
          </div>
          <div className="flex flex-col items-start">
            <label htmlFor="logoUrl" className="text-lg font-semibold mb-2 text-gray-300">Brand Logo URL</label>
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full p-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex flex-col items-start">
             <label htmlFor="sensitivity" className="text-lg font-semibold mb-2 text-gray-300">
                Motion Sensitivity: <span className="font-bold text-blue-400">{sensitivity}</span>
            </label>
            <input
                id="sensitivity"
                type="range"
                min="1"
                max="100"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-full flex justify-between text-sm text-gray-400 mt-1 px-1">
                <span>Less Sensitive</span>
                <span>More Sensitive</span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-6 py-4 text-xl font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!videoFile || !logoUrl}
          >
            Start Display
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
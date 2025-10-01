import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMotionDetectionProps {
  onMotionStart: () => void;
  onMotionEnd: () => void;
  onError: (error: Error) => void;
  enabled?: boolean;
  sensitivity?: number; // 1-100, where 100 is most sensitive
}

// Custom hook for motion detection using the device's camera.
export const useMotionDetection = ({
  onMotionStart,
  onMotionEnd,
  onError,
  enabled = true,
  sensitivity = 50,
}: UseMotionDetectionProps): { stream: MediaStream | null } => {
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Refs to hold DOM elements and other values that shouldn't trigger re-renders.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Ref to hold the stream and break dependency cycle
  // FIX: Explicitly initialize useRef with undefined to resolve ambiguity with function overloads that might cause "Expected 1 arguments, but got 0" error.
  const requestRef = useRef<number | undefined>(undefined);
  const lastImageDataRef = useRef<ImageData | null>(null);
  const motionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDetectingMotionRef = useRef(false);

  // Refs to hold the latest props to avoid stale closures in callbacks.
  const onMotionStartRef = useRef(onMotionStart);
  const onMotionEndRef = useRef(onMotionEnd);
  const onErrorRef = useRef(onError);
  const sensitivityRef = useRef(sensitivity);

  useEffect(() => {
    onMotionStartRef.current = onMotionStart;
    onMotionEndRef.current = onMotionEnd;
    onErrorRef.current = onError;
    sensitivityRef.current = sensitivity;
  }, [onMotionStart, onMotionEnd, onError, sensitivity]);

  const detectMotionLoop = useCallback(() => {
    // Ensure we have the required elements to work with.
    if (!videoRef.current || !canvasRef.current) {
      requestRef.current = requestAnimationFrame(detectMotionLoop);
      return;
    }

    const video = videoRef.current;
    if (video.paused || video.ended || video.readyState < video.HAVE_ENOUGH_DATA) {
      requestRef.current = requestAnimationFrame(detectMotionLoop);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      requestRef.current = requestAnimationFrame(detectMotionLoop);
      return;
    }

    const { videoWidth: width, videoHeight: height } = video;
    if (width === 0 || height === 0) {
      requestRef.current = requestAnimationFrame(detectMotionLoop);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw the current video frame to the canvas.
    ctx.drawImage(video, 0, 0, width, height);
    const currentImageData = ctx.getImageData(0, 0, width, height);

    // If this is the first frame, store it and wait for the next one.
    if (!lastImageDataRef.current) {
      lastImageDataRef.current = currentImageData;
      requestRef.current = requestAnimationFrame(detectMotionLoop);
      return;
    }

    const lastData = lastImageDataRef.current.data;
    const currentData = currentImageData.data;

    // Map sensitivity (1-100) to a pixel color difference threshold.
    // A higher sensitivity means a lower threshold, detecting smaller changes.
    // sensitivity=1 (least) => threshold=50
    // sensitivity=100 (most) => threshold=5
    const pixelDiffThreshold = 50 - ((sensitivityRef.current - 1) / 99) * 45;

    let changedPixels = 0;
    // Downsample for performance by checking every 4th pixel.
    const resolution = 4;
    for (let i = 0; i < currentData.length; i += 4 * resolution) {
      // Simple grayscale conversion for pixel comparison.
      const avg1 = (lastData[i] + lastData[i + 1] + lastData[i + 2]) / 3;
      const avg2 = (currentData[i] + currentData[i + 1] + currentData[i + 2]) / 3;
      const diff = Math.abs(avg1 - avg2);
      if (diff > pixelDiffThreshold) {
        changedPixels++;
      }
    }

    // Store the current frame's data for the next iteration.
    lastImageDataRef.current = currentImageData;

    // Motion is detected if more than 0.1% of checked pixels have changed.
    const totalPixelsChecked = (width * height) / resolution;
    const motionPixelThreshold = totalPixelsChecked * 0.001;

    if (changedPixels > motionPixelThreshold) {
      // If motion was not previously detected, trigger the start callback.
      if (!isDetectingMotionRef.current) {
        isDetectingMotionRef.current = true;
        onMotionStartRef.current();
      }

      // Reset the timeout that detects when motion has stopped.
      if (motionTimeoutRef.current) {
        clearTimeout(motionTimeoutRef.current);
      }
      motionTimeoutRef.current = setTimeout(() => {
        isDetectingMotionRef.current = false;
        onMotionEndRef.current();
      }, 1000); // 1 second of no motion triggers 'motion end'.
    }

    // Continue the loop.
    requestRef.current = requestAnimationFrame(detectMotionLoop);
  }, []);

  const cleanup = useCallback(() => {
    // FIX: Check against undefined to correctly handle a request ID of 0, which is falsy but valid.
    if (requestRef.current !== undefined) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
    if (motionTimeoutRef.current) {
      clearTimeout(motionTimeoutRef.current);
      motionTimeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    setStream(null);
    lastImageDataRef.current = null;
    isDetectingMotionRef.current = false;
    canvasRef.current = null;
  }, []);

  const setup = useCallback(async () => {
    cleanup(); // Ensure a clean state before setting up.
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      
      setStream(mediaStream);
      streamRef.current = mediaStream;

      // Create in-memory video and canvas elements to process the stream.
      const videoElement = document.createElement('video');
      videoElement.srcObject = mediaStream;
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoRef.current = videoElement;

      canvasRef.current = document.createElement('canvas');

      await videoElement.play();
      requestRef.current = requestAnimationFrame(detectMotionLoop);
    } catch (err) {
      // This error is expected when the component unmounts or re-renders quickly,
      // interrupting the play() promise. We can safely ignore it.
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log("Video play() was aborted, this is expected on cleanup.");
        return;
      }
      
      if (err instanceof Error) {
        onErrorRef.current(err);
      } else {
        onErrorRef.current(new Error('An unknown error occurred while accessing the camera.'));
      }
    }
  }, [cleanup, detectMotionLoop]);

  useEffect(() => {
    if (enabled) {
      setup();
    } else {
      cleanup();
    }
    return cleanup;
  }, [enabled, setup, cleanup]);

  return { stream };
};

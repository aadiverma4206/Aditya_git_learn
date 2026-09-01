import { useEffect, useRef, useState, useCallback } from 'react';
import { useStudioStore } from '../state/useStudioStore';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const setCameraStatus = useStudioStore((s) => s.setCameraStatus);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus(false, null);
  }, [stream, setCameraStatus]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus(false, 'Webcam API not supported on this browser/device.');
      return;
    }

    try {
      // Preferred resolution: 1280x720, fallback gracefully
      const constraintsList: MediaStreamConstraints[] = [
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            frameRate: { ideal: 60, max: 60 },
          },
          audio: false,
        },
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let mediaStream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintsList) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          if (mediaStream) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!mediaStream) {
        throw lastError || new Error('Failed to acquire webcam stream');
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setCameraStatus(true, null);

      // Listen for camera track ended / disconnected
      mediaStream.getVideoTracks()[0].onended = () => {
        setCameraStatus(false, 'Camera disconnected or stream ended.');
      };
    } catch (error: any) {
      console.error('Camera access error:', error);
      let errorMsg = 'Failed to access webcam.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Webcam permission denied. Please allow camera access in browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on this system.';
      }
      setCameraStatus(false, errorMsg);
    }
  }, [setCameraStatus]);

  // Handle visibility change (pause camera when tab is hidden, resume when visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (videoRef.current) videoRef.current.pause();
      } else {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return {
    videoRef,
    stream,
    startCamera,
    stopCamera,
  };
}

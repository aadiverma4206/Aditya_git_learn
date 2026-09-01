import { useRef } from 'react';
import { useStudioStore } from '../state/useStudioStore';

export function useFps() {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const setFps = useStudioStore((s) => s.setFps);
  const setLatency = useStudioStore((s) => s.setLatency);

  const tick = (latencyMs: number = 0) => {
    frameCount.current++;
    const now = performance.now();
    const delta = now - lastTime.current;

    if (delta >= 1000) {
      const currentFps = Math.round((frameCount.current * 1000) / delta);
      setFps(currentFps);
      setLatency(Math.round(latencyMs));

      frameCount.current = 0;
      lastTime.current = now;
    }
  };

  return { tick };
}

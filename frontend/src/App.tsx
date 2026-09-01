import React, { useEffect } from 'react';
import { StudioPage } from './pages/StudioPage';
import { useStudioStore } from './state/useStudioStore';

export const App: React.FC = () => {
  const loadSavedConfig = useStudioStore((s) => s.loadSavedConfig);

  useEffect(() => {
    loadSavedConfig();
  }, [loadSavedConfig]);

  return <StudioPage />;
};

export default App;

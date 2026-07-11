import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-5xl font-bold text-blue-500">Tailwind v4 works!</h1>
    </div>
  </StrictMode>
);

import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import Health from '@/pages/Health';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="health" element={<Health />} />
        {/* future routes go here */}
      </Route>
    </Routes>
  );
}

export default App;

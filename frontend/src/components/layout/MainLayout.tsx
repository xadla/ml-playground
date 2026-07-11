import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-lg font-bold">ML Playground</h1>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
      <footer className="bg-gray-200 p-4 text-center text-sm text-gray-600">
        &copy; {new Date().getFullYear()} ML Playground
      </footer>
    </div>
  );
};

export default MainLayout;

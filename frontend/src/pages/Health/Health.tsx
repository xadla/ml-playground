import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { Helmet } from 'react-helmet-async';

const Health = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await api.get('/health');
      return res.data;
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Failed to reach backend</p>;

  return (
    <>
      <Helmet>
        <title>Health – ML Playground</title>
      </Helmet>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Backend Health</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </>
  );
};

export default Health;

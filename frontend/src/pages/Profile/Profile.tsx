import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

export default function Profile() {
  const { user, logoutAction } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile – ML Playground</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 w-full max-w-md text-center space-y-6">
          {/* Avatar */}
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
            {user.email.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.email}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Joined{' '}
              {new Date(user.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* Actions */}
          <button
            onClick={logoutAction}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-md shadow-red-500/20 active:scale-[0.98]"
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}

import { Helmet } from 'react-helmet-async';

export default function Contact() {
  return (
    <>
      <Helmet>
        <title>Contact – ML Playground</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Get in touch</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Have a question, feature request, or found a bug? We'd love to hear from you.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <a
              href="mailto:hadinjr4122@gmail.com"
              className="block w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Email hadinjr4122@gmail.com
            </a>
            <a
              href="https://github.com/xadla/ml-playground/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Open an issue on GitHub
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

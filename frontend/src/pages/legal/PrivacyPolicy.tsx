import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy – ML Playground</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="prose prose-gray dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h1>Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date().getFullYear()}-01-01</p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect your email address when you create an account. We also store experiment
              data (datasets, configurations, and results) that you generate on the platform.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
              Your email is used solely for account verification and communication regarding the
              service. Experiment data is used to provide the service and improve our algorithms.
            </p>

            <h2>3. Data Storage and Security</h2>
            <p>
              Your data is stored securely on our servers. We do not sell or share your personal
              data with third parties.
            </p>

            <h2>4. Cookies</h2>
            <p>
              We use essential cookies to keep you signed in. No tracking cookies are used unless
              explicitly stated.
            </p>

            <h2>5. Your Rights</h2>
            <p>
              You can delete your account and all associated data at any time by contacting us. You
              may also request a copy of your data.
            </p>

            <h2>6. Contact</h2>
            <p>For privacy concerns, email hadinjr4122@gmail.com.</p>
          </article>
        </div>
      </div>
    </>
  );
}

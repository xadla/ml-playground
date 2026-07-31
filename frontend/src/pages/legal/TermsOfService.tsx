import { Helmet } from 'react-helmet-async';

export default function TermsOfService() {
  return (
    <>
      <Helmet>
        <title>Terms of Service – ML Playground</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <article className="prose prose-gray dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
            <h1>Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date().getFullYear()}-01-01</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing ML Playground, you agree to these terms. If you do not agree, please do
              not use the service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              ML Playground provides an interactive environment for creating datasets, training
              machine learning models, and viewing results. All experiments are processed on our
              servers and results are stored for your convenience.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials.
              You must not misuse the service, including attempting to overload or disrupt our
              servers.
            </p>

            <h2>4. Limitation of Liability</h2>
            <p>
              The service is provided "as is". We are not liable for any damages arising from the
              use of the service, including but not limited to loss of data or incorrect model
              predictions.
            </p>

            <h2>5. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use after changes
              constitutes acceptance of the new terms.
            </p>

            <h2>6. Contact</h2>
            <p>For any questions about these terms, please contact us at legal@mlplayground.com.</p>
          </article>
        </div>
      </div>
    </>
  );
}

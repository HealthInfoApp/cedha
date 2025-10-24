export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl text-indigo-600">
              MyFirstApp
            </div>
            <div className="space-x-4">
              <a 
                href="/" 
                className="text-gray-700 hover:text-indigo-600 transition-colors"
              >
                Home
              </a>
              <a 
                href="/dashboard" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to Your
            <span className="text-indigo-600 block">First Next.js App</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            This is a demo application built with Next.js, TypeScript, and Tailwind CSS. 
            Ready to be deployed on Vercel!
          </p>
          <div className="space-x-4">
            <a
              href="/dashboard"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors inline-block font-medium"
            >
              Go to Dashboard
            </a>
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-indigo-400 transition-colors inline-block font-medium"
            >
              Learn Next.js
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-indigo-600 font-bold">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast</h3>
            <p className="text-gray-600">
              Built with Next.js for optimal performance and fast page loads.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 font-bold">🎨</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Beautiful</h3>
            <p className="text-gray-600">
              Styled with Tailwind CSS for a modern and responsive design.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 font-bold">🚀</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Deploy Ready</h3>
            <p className="text-gray-600">
              Optimized for deployment on Vercel with zero configuration.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
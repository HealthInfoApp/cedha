export default function Dashboard() {
  // Mock data for demonstration
  const stats = [
    { name: 'Total Visitors', value: '12,456', change: '+12%' },
    { name: 'Revenue', value: '$8,459', change: '+8%' },
    { name: 'Orders', value: '324', change: '+5%' },
    { name: 'Conversion', value: '4.2%', change: '+1.2%' },
  ];

  const recentActivity = [
    { id: 1, action: 'New order received', time: '2 min ago' },
    { id: 2, action: 'User signed up', time: '5 min ago' },
    { id: 3, action: 'Payment processed', time: '10 min ago' },
    { id: 4, action: 'Product updated', time: '15 min ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl text-indigo-600">
              Dashboard
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Dashboard</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your app today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <div className="flex items-baseline mt-2">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <span className="ml-2 text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center">
                <span className="block text-2xl mb-2">📊</span>
                <span className="text-sm font-medium text-gray-900">Analytics</span>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center">
                <span className="block text-2xl mb-2">👥</span>
                <span className="text-sm font-medium text-gray-900">Users</span>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center">
                <span className="block text-2xl mb-2">🛍️</span>
                <span className="text-sm font-medium text-gray-900">Products</span>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center">
                <span className="block text-2xl mb-2">⚙️</span>
                <span className="text-sm font-medium text-gray-900">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Workouts</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">24</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">This Week</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">5</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Minutes</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">720</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg Intensity</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">7.5</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Workouts
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Your recent workouts will appear here
        </p>
      </div>
    </div>
  )
}

import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { Home, Dumbbell, TrendingUp, Calendar, User, Moon, Sun, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { signOut, profile } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Training', href: '/training', icon: Dumbbell },
    { name: 'Progress', href: '/progress', icon: TrendingUp },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar Navigation - Desktop Only */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gradient-to-b from-maroon-900 to-maroon-950 dark:from-gray-900 dark:to-gray-950 border-r border-maroon-800 dark:border-gray-700">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-maroon-800 dark:border-gray-700">
            <span className="text-2xl">💪</span>
            <span className="ml-3 text-lg font-bold text-white">
              Arm Wrestling Pro
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-maroon-800 dark:border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-white/60 truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-white/10 text-white rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <span className="text-2xl">💪</span>
              <span className="ml-2 text-lg font-bold text-gray-900 dark:text-white">
                Arm Wrestling Pro
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg ${
                      isActive
                        ? 'bg-red-50 dark:bg-red-900/20 text-primary'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                <button
                  onClick={toggleTheme}
                  className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 mx-auto" /> : <Moon className="w-4 h-4 mx-auto" />}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"
                >
                  <LogOut className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8 max-w-[1400px]">
          {children}
        </main>
      </div>
    </div>
  )
}

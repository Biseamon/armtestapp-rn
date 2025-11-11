import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Workout, type Goal, type Cycle } from '../lib/supabase'
import { Target, Calendar, Clock, TrendingUp, Plus, Dumbbell } from 'lucide-react'

export default function Dashboard() {
  const { profile } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [activeGoals, setActiveGoals] = useState<Goal[]>([])
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalMinutes: 0,
    avgIntensity: 0,
  })

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      const [workoutsRes, cyclesRes, goalsRes] = await Promise.all([
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('cycles')
          .select('*')
          .eq('user_id', profile.id)
          .order('is_active', { ascending: false })
          .order('start_date', { ascending: false })
          .limit(3),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
      ])

      if (workoutsRes.data) {
        setWorkouts(workoutsRes.data)
        calculateStats(workoutsRes.data)
      }
      if (cyclesRes.data) setCycles(cyclesRes.data)
      if (goalsRes.data) {
        setActiveGoals(goalsRes.data.filter(g => !g.is_completed).slice(0, 5))
        setCompletedGoals(goalsRes.data.filter(g => g.is_completed).slice(0, 3))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (workoutData: Workout[]) => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const thisWeekWorkouts = workoutData.filter(
      (w) => new Date(w.created_at) > weekAgo
    )

    const totalMinutes = workoutData.reduce((sum, w) => sum + w.duration_minutes, 0)
    const avgIntensity =
      workoutData.length > 0
        ? workoutData.reduce((sum, w) => sum + w.intensity, 0) / workoutData.length
        : 0

    setStats({
      totalWorkouts: workoutData.length,
      thisWeek: thisWeekWorkouts.length,
      totalMinutes,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProgressPercentage = (goal: Goal) => {
    return Math.min((goal.current_value / goal.target_value) * 100, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.full_name || 'Athlete'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Here's your training overview
          </p>
        </div>
        <Link
          to="/training"
          className="inline-flex items-center px-6 py-3 bg-primary hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Log Workout
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Workouts</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalWorkouts}</p>
            </div>
            <Target className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">This Week</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.thisWeek}</p>
            </div>
            <Calendar className="w-10 h-10 text-secondary" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Minutes</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalMinutes}</p>
            </div>
            <Clock className="w-10 h-10 text-premium" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Avg Intensity</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.avgIntensity}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-success" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Active Goals</h2>
                <Link to="/progress" className="text-primary hover:text-red-700 text-sm font-medium">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{goal.goal_type}</h3>
                    {goal.deadline && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>{goal.current_value} / {goal.target_value}</span>
                    <span className="font-medium text-secondary">{Math.round(getProgressPercentage(goal))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-secondary rounded-full h-2 transition-all"
                      style={{ width: `${getProgressPercentage(goal)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Cycles */}
        {cycles.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Training Cycles</h2>
                <Link to="/training" className="text-primary hover:text-red-700 text-sm font-medium">
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  className={`border rounded-lg p-4 ${
                    cycle.is_active
                      ? 'border-secondary bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{cycle.name}</h3>
                    {cycle.is_active && (
                      <span className="px-2 py-1 bg-secondary text-white text-xs font-medium rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Workouts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Workouts</h2>
            <Link to="/training" className="text-primary hover:text-red-700 text-sm font-medium">
              View All
            </Link>
          </div>
        </div>
        <div className="p-6">
          {workouts.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No workouts yet</p>
              <Link
                to="/training"
                className="inline-flex items-center px-4 py-2 bg-primary hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Log Your First Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div key={workout.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-primary">
                      {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(workout.created_at)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{workout.duration_minutes} min</span>
                    <span>•</span>
                    <span>Intensity: {workout.intensity}/10</span>
                  </div>
                  {workout.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                      {workout.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recently Completed</h2>
          </div>
          <div className="p-6 space-y-3">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🎯</span>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{goal.goal_type}</h3>
                    <p className="text-sm text-success">✓ Completed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

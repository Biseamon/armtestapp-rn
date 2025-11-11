import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, type Workout, type Cycle, type Exercise } from '../lib/supabase'
import { Plus, X, Save, Pencil, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { convertWeight } from '../lib/weightUtils'

type ExerciseForm = {
  exercise_name: string
  sets: number
  reps: number
  weight_lbs: number
  notes: string
}

export default function Training() {
  const { profile } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showCycleModal, setShowCycleModal] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null)
  const [saving, setSaving] = useState(false)

  const [workoutType, setWorkoutType] = useState('table_practice')
  const [duration, setDuration] = useState('30')
  const [intensity, setIntensity] = useState('5')
  const [notes, setNotes] = useState('')
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<ExerciseForm[]>([])

  const [cycleName, setCycleName] = useState('')
  const [cycleType, setCycleType] = useState('competition_prep')
  const [cycleDescription, setCycleDescription] = useState('')
  const [cycleStartDate, setCycleStartDate] = useState(new Date().toISOString().split('T')[0])
  const [cycleEndDate, setCycleEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  const workoutTypes = [
    { value: 'table_practice', label: 'Table Practice' },
    { value: 'strength', label: 'Strength Training' },
    { value: 'technique', label: 'Technique' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'sparring', label: 'Sparring' },
  ]

  const cycleTypes = [
    { value: 'competition_prep', label: 'Competition Prep' },
    { value: 'rehab', label: 'Rehabilitation' },
    { value: 'strength_building', label: 'Strength Building' },
    { value: 'technique_focus', label: 'Technique Focus' },
    { value: 'off_season', label: 'Off Season' },
  ]

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    if (!profile) return

    try {
      const [workoutsRes, cyclesRes] = await Promise.all([
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('cycles')
          .select('*')
          .eq('user_id', profile.id)
          .order('start_date', { ascending: false }),
      ])

      if (workoutsRes.data) setWorkouts(workoutsRes.data)
      if (cyclesRes.data) setCycles(cyclesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = () => {
    resetWorkoutForm()
    setEditingWorkout(null)
    setShowWorkoutModal(true)
  }

  const handleEditWorkout = async (workout: Workout) => {
    setEditingWorkout(workout)
    setWorkoutType(workout.workout_type)
    setDuration(workout.duration_minutes?.toString() || '')
    setIntensity(workout.intensity?.toString() || '')
    setNotes(workout.notes || '')
    setSelectedCycleId(workout.cycle_id || null)

    const { data: exercisesData } = await supabase
      .from('exercises')
      .select('*')
      .eq('workout_id', workout.id)

    if (exercisesData) {
      const userUnit = profile?.weight_unit || 'lbs'
      const convertedExercises = exercisesData.map((exercise: Exercise) => {
        const storedUnit = exercise.weight_unit || 'lbs'
        const convertedWeight = convertWeight(exercise.weight_lbs, storedUnit, userUnit)
        return {
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_lbs: convertedWeight,
          notes: exercise.notes || '',
        }
      })
      setExercises(convertedExercises)
    }
    setShowWorkoutModal(true)
  }

  const handleDeleteWorkout = async (workout: Workout) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      await supabase.from('workouts').delete().eq('id', workout.id)
      fetchData()
    }
  }

  const handleAddExercise = () => {
    setExercises([...exercises, { exercise_name: '', sets: 3, reps: 10, weight_lbs: 0, notes: '' }])
  }

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const handleUpdateExercise = (index: number, field: keyof ExerciseForm, value: any) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const handleSaveWorkout = async () => {
    if (!profile) return

    setSaving(true)
    try {
      let workoutId: string
      const userUnit = profile.weight_unit || 'lbs'

      if (editingWorkout) {
        const { error: workoutError } = await supabase
          .from('workouts')
          .update({
            workout_type: workoutType,
            duration_minutes: parseInt(duration) || 0,
            intensity: parseInt(intensity) || 5,
            notes,
            cycle_id: selectedCycleId,
          })
          .eq('id', editingWorkout.id)

        if (workoutError) throw workoutError
        workoutId = editingWorkout.id

        await supabase.from('exercises').delete().eq('workout_id', workoutId)
      } else {
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: profile.id,
            workout_type: workoutType,
            duration_minutes: parseInt(duration) || 0,
            intensity: parseInt(intensity) || 5,
            notes,
            cycle_id: selectedCycleId,
          })
          .select()
          .single()

        if (workoutError) throw workoutError
        workoutId = workoutData.id
      }

      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map((exercise) => ({
          workout_id: workoutId,
          exercise_name: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight_lbs: exercise.weight_lbs,
          weight_unit: userUnit,
          notes: exercise.notes || '',
        }))

        const { error: exercisesError } = await supabase.from('exercises').insert(exercisesToInsert)
        if (exercisesError) throw exercisesError
      }

      setShowWorkoutModal(false)
      resetWorkoutForm()
      fetchData()
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Failed to save workout')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCycle = () => {
    resetCycleForm()
    setEditingCycle(null)
    setShowCycleModal(true)
  }

  const handleEditCycle = (cycle: Cycle) => {
    setEditingCycle(cycle)
    setCycleName(cycle.name)
    setCycleType(cycle.cycle_type)
    setCycleDescription(cycle.description || '')
    setCycleStartDate(cycle.start_date)
    setCycleEndDate(cycle.end_date)
    setShowCycleModal(true)
  }

  const handleSaveCycle = async () => {
    if (!profile) return

    if (!cycleName.trim()) {
      alert('Cycle name is required')
      return
    }

    try {
      if (editingCycle) {
        await supabase.from('cycles').update({
          name: cycleName,
          description: cycleDescription,
          cycle_type: cycleType,
          start_date: cycleStartDate,
          end_date: cycleEndDate,
        }).eq('id', editingCycle.id)
      } else {
        await supabase.from('cycles').insert({
          user_id: profile.id,
          name: cycleName,
          description: cycleDescription,
          cycle_type: cycleType,
          start_date: cycleStartDate,
          end_date: cycleEndDate,
          is_active: false,
        })
      }

      setShowCycleModal(false)
      resetCycleForm()
      fetchData()
    } catch (error) {
      console.error('Error saving cycle:', error)
      alert('Failed to save cycle')
    }
  }

  const handleDeleteCycle = async (cycle: Cycle) => {
    if (window.confirm('Are you sure you want to delete this cycle?')) {
      await supabase.from('cycles').delete().eq('id', cycle.id)
      fetchData()
    }
  }

  const resetWorkoutForm = () => {
    setWorkoutType('table_practice')
    setDuration('30')
    setIntensity('5')
    setNotes('')
    setSelectedCycleId(null)
    setExercises([])
  }

  const resetCycleForm = () => {
    setCycleName('')
    setCycleType('competition_prep')
    setCycleDescription('')
    setCycleStartDate(new Date().toISOString().split('T')[0])
    setCycleEndDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Training</h1>
        <div className="flex gap-3">
          <button
            onClick={handleAddCycle}
            className="inline-flex items-center px-4 py-2 bg-secondary hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            New Cycle
          </button>
          <button
            onClick={handleStartWorkout}
            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Log Workout
          </button>
        </div>
      </div>

      {/* Cycles Section */}
      {cycles.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Training Cycles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cycles.map((cycle) => (
              <div
                key={cycle.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-5 border-2 ${
                  cycle.is_active ? 'border-secondary' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{cycle.name}</h3>
                  {cycle.is_active && (
                    <span className="px-2 py-1 bg-secondary text-white text-xs font-medium rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary font-medium mb-2">
                  {cycle.cycle_type.replace(/_/g, ' ').toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {formatDate(cycle.start_date)} - {formatDate(cycle.end_date)}
                </p>
                {cycle.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                    {cycle.description}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditCycle(cycle)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCycle(cycle)}
                    className="flex-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workouts Section */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Workouts</h2>
        {workouts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No workouts yet</p>
            <button
              onClick={handleStartWorkout}
              className="inline-flex items-center px-4 py-2 bg-primary hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Your First Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div key={workout.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-primary text-lg mb-2">
                      {workout.workout_type.replace(/_/g, ' ').toUpperCase()}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>{workout.duration_minutes} min</span>
                      <span>•</span>
                      <span>Intensity: {workout.intensity}/10</span>
                      <span>•</span>
                      <span>{formatDate(workout.created_at)}</span>
                    </div>
                    {workout.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">{workout.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditWorkout(workout)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkout(workout)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Modal - Continued in next part due to length */}
    </div>
  )
}

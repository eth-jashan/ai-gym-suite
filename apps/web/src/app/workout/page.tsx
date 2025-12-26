'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  Play,
  Check,
  RotateCcw,
  Timer,
  Dumbbell,
  Loader2,
  X,
  Plus,
  Minus,
} from 'lucide-react';

interface Exercise {
  id: string;
  orderIndex: number;
  targetSets: number;
  targetReps: string;
  targetWeight: number | null;
  restSeconds: number;
  status: string;
  exercise: {
    id: string;
    name: string;
    description: string;
    primaryMuscles: string[];
    formCues: string[];
  };
}

interface Workout {
  id: string;
  title: string;
  description: string;
  workoutType: string;
  focusMuscles: string[];
  estimatedDuration: number;
  status: string;
  exercises: Exercise[];
}

export default function WorkoutPage() {
  const router = useRouter();
  const { isAuthenticated, loadUser } = useAuthStore();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [motivation, setMotivation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [reps, setReps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, number[]>>({});

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
      return;
    }
    fetchWorkout();
  }, [isAuthenticated, router]);

  // Rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => prev - 1);
      }, 1000);
    } else if (restTime === 0 && isResting) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const fetchWorkout = async () => {
    try {
      const data = await api.getTodaysWorkout();
      setWorkout(data.workout);
      setMotivation(data.motivation);

      // Set default reps from first exercise
      if (data.workout?.exercises?.[0]) {
        const repRange = data.workout.exercises[0].targetReps;
        const defaultReps = parseInt(repRange.split('-')[0]) || 10;
        setReps(defaultReps);
      }
    } catch (err) {
      console.error('Failed to load workout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!workout) return;
    try {
      await api.startWorkout(workout.id);
      setWorkout({ ...workout, status: 'IN_PROGRESS' });
      setActiveExercise(workout.exercises[0]?.id);
    } catch (err) {
      console.error('Failed to start workout:', err);
    }
  };

  const handleLogSet = async () => {
    if (!workout || !activeExercise) return;

    const exercise = workout.exercises.find((e) => e.id === activeExercise);
    if (!exercise) return;

    try {
      await api.logSet(workout.id, activeExercise, {
        setNumber: currentSet,
        repsCompleted: reps,
        weightUsed: weight || undefined,
        rpe: 7,
      });

      // Track completed sets
      setCompletedSets((prev) => ({
        ...prev,
        [activeExercise]: [...(prev[activeExercise] || []), currentSet],
      }));

      // Check if all sets are done for this exercise
      if (currentSet >= exercise.targetSets) {
        // Move to next exercise
        const currentIndex = workout.exercises.findIndex(
          (e) => e.id === activeExercise
        );
        if (currentIndex < workout.exercises.length - 1) {
          setActiveExercise(workout.exercises[currentIndex + 1].id);
          setCurrentSet(1);
        } else {
          // All exercises done
          setActiveExercise(null);
        }
      } else {
        // Start rest timer and move to next set
        setIsResting(true);
        setRestTime(exercise.restSeconds);
        setCurrentSet((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to log set:', err);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workout) return;
    try {
      const result = await api.completeWorkout(workout.id);
      router.push(`/workout/complete?id=${workout.id}`);
    } catch (err) {
      console.error('Failed to complete workout:', err);
    }
  };

  const handleSwapExercise = async (exerciseId: string) => {
    if (!workout) return;
    try {
      const updated = await api.swapExercise(workout.id, exerciseId);
      // Refresh workout
      fetchWorkout();
    } catch (err) {
      console.error('Failed to swap exercise:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Card variant="bordered" className="max-w-md text-center">
          <h2 className="text-xl font-semibold mb-4">No Workout Today</h2>
          <p className="text-dark-400 mb-6">
            Generate a new workout or take a rest day.
          </p>
          <Button onClick={() => api.generateWorkout().then(fetchWorkout)}>
            Generate Workout
          </Button>
        </Card>
      </div>
    );
  }

  const activeEx = workout.exercises.find((e) => e.id === activeExercise);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="border-b border-dark-800 bg-dark-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-dark-800 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold">{workout.title}</h1>
            <p className="text-sm text-dark-400">
              {workout.estimatedDuration} min
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Workout Not Started */}
        {workout.status === 'SCHEDULED' && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center mx-auto mb-6">
              <Dumbbell className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{workout.title}</h2>
            <p className="text-dark-400 mb-2">{workout.description}</p>
            <p className="text-primary-400 mb-8">
              {workout.exercises.length} exercises
            </p>

            {motivation && (
              <p className="text-dark-300 italic mb-8 max-w-md mx-auto">
                "{motivation}"
              </p>
            )}

            <Button size="lg" onClick={handleStartWorkout}>
              <Play className="w-5 h-5 mr-2" />
              Start Workout
            </Button>

            {/* Exercise Preview */}
            <div className="mt-12 space-y-3 max-w-md mx-auto">
              {workout.exercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-4 bg-dark-900 rounded-lg p-4 text-left"
                >
                  <span className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-sm font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{ex.exercise.name}</p>
                    <p className="text-sm text-dark-400">
                      {ex.targetSets} x {ex.targetReps}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSwapExercise(ex.id)}
                    className="text-dark-500 hover:text-dark-300"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workout In Progress */}
        {workout.status === 'IN_PROGRESS' && activeEx && (
          <div className="max-w-md mx-auto">
            {/* Rest Timer Overlay */}
            {isResting && (
              <div className="fixed inset-0 bg-dark-950/90 flex items-center justify-center z-50">
                <div className="text-center">
                  <Timer className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                  <p className="text-4xl font-bold mb-2">{restTime}s</p>
                  <p className="text-dark-400 mb-6">Rest Time</p>
                  <Button variant="outline" onClick={() => setIsResting(false)}>
                    Skip Rest
                  </Button>
                </div>
              </div>
            )}

            {/* Current Exercise */}
            <Card variant="elevated" className="mb-6">
              <div className="text-center mb-6">
                <p className="text-sm text-primary-500 mb-1">
                  Exercise {workout.exercises.findIndex((e) => e.id === activeExercise) + 1} of{' '}
                  {workout.exercises.length}
                </p>
                <h2 className="text-2xl font-bold">{activeEx.exercise.name}</h2>
                <p className="text-dark-400 mt-1">
                  {activeEx.exercise.primaryMuscles.join(', ')}
                </p>
              </div>

              {/* Set Tracker */}
              <div className="flex justify-center gap-2 mb-6">
                {Array.from({ length: activeEx.targetSets }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2',
                      completedSets[activeEx.id]?.includes(i + 1)
                        ? 'bg-primary-600 border-primary-600'
                        : i + 1 === currentSet
                        ? 'border-primary-500 text-primary-500'
                        : 'border-dark-600 text-dark-500'
                    )}
                  >
                    {completedSets[activeEx.id]?.includes(i + 1) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                ))}
              </div>

              <p className="text-center text-dark-400 mb-6">
                Set {currentSet} of {activeEx.targetSets} - Target: {activeEx.targetReps} reps
              </p>

              {/* Input Controls */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-dark-400 block mb-2 text-center">
                    Reps
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReps((r) => Math.max(0, r - 1))}
                      className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <Input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(Number(e.target.value))}
                      className="text-center text-xl"
                    />
                    <button
                      onClick={() => setReps((r) => r + 1)}
                      className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-dark-400 block mb-2 text-center">
                    Weight (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWeight((w) => Math.max(0, w - 2.5))}
                      className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <Input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="text-center text-xl"
                      step={2.5}
                    />
                    <button
                      onClick={() => setWeight((w) => w + 2.5)}
                      className="w-10 h-10 rounded-lg bg-dark-700 hover:bg-dark-600 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleLogSet}>
                <Check className="w-5 h-5 mr-2" />
                Log Set
              </Button>

              {/* Form Cues */}
              {activeEx.exercise.formCues.length > 0 && (
                <div className="mt-6 pt-6 border-t border-dark-700">
                  <p className="text-sm text-dark-400 mb-2">Form Tips:</p>
                  <ul className="text-sm text-dark-300 space-y-1">
                    {activeEx.exercise.formCues.slice(0, 3).map((cue, i) => (
                      <li key={i}>• {cue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* All Exercises Done */}
        {workout.status === 'IN_PROGRESS' && !activeEx && (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Great Work!</h2>
            <p className="text-dark-400 mb-8">
              You've completed all exercises. Finish your workout?
            </p>
            <Button size="lg" onClick={handleCompleteWorkout}>
              Complete Workout
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

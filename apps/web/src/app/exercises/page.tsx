'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { ChevronLeft, Search, Dumbbell, Loader2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  primaryMuscles: string[];
  difficultyLevel: number;
  equipmentRequired: string[];
  isBeginnerFriendly: boolean;
}

const MUSCLE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'core', label: 'Core' },
];

export default function ExercisesPage() {
  const router = useRouter();
  const { loadUser } = useAuthStore();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');

  useEffect(() => {
    loadUser();
    fetchExercises();
  }, [loadUser]);

  useEffect(() => {
    fetchExercises();
  }, [search, selectedMuscle]);

  const fetchExercises = async () => {
    try {
      const data = await api.getExercises({
        search: search || undefined,
        muscle: selectedMuscle !== 'all' ? selectedMuscle : undefined,
        limit: 50,
      });
      setExercises(data.exercises);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="font-semibold">Exercise Library</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises..."
            className="pl-10"
          />
        </div>

        {/* Muscle Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
          {MUSCLE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedMuscle(filter.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                selectedMuscle === filter.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            No exercises found
          </div>
        ) : (
          <div className="grid gap-4">
            {exercises.map((exercise) => (
              <Card
                key={exercise.id}
                variant="bordered"
                className="cursor-pointer hover:border-dark-600 transition-colors"
                onClick={() => router.push(`/exercises/${exercise.slug}`)}
              >
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-6 h-6 text-dark-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium truncate">{exercise.name}</h3>
                      {exercise.isBeginnerFriendly && (
                        <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full flex-shrink-0">
                          Beginner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-400 line-clamp-1">
                      {exercise.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {exercise.primaryMuscles.slice(0, 2).map((muscle) => (
                        <span
                          key={muscle}
                          className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded"
                        >
                          {muscle}
                        </span>
                      ))}
                      {exercise.equipmentRequired.length > 0 && (
                        <span className="text-xs bg-dark-700 text-dark-300 px-2 py-0.5 rounded">
                          {exercise.equipmentRequired[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';

interface Question {
  key: string;
  question: string;
  type: string;
  options?: { value: string; label: string; description?: string }[];
  validation?: { required?: boolean; min?: number; max?: number };
  helpText?: string;
}

interface Phase {
  phase: number;
  title: string;
  description: string;
  questions: Question[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser, loadUser } = useAuthStore();

  const [phases, setPhases] = useState<Phase[]>([]);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth?mode=login');
      return;
    }

    if (user?.onboardingCompleted) {
      router.push('/dashboard');
      return;
    }

    fetchQuestions();
  }, [isAuthenticated, user, router]);

  const fetchQuestions = async () => {
    try {
      const data = await api.getOnboardingQuestions();
      setPhases(data.phases);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleResponse = (key: string, value: any) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    const currentQuestions = phases.find((p) => p.phase === currentPhase)?.questions || [];

    // Validate required fields
    for (const q of currentQuestions) {
      if (q.validation?.required && !responses[q.key]) {
        setError(`Please answer: ${q.question}`);
        return;
      }
    }

    setError('');

    if (currentPhase < phases.length) {
      setCurrentPhase((prev) => prev + 1);
    } else {
      // Complete onboarding
      setIsSubmitting(true);
      try {
        await api.submitOnboardingResponses(responses);
        await api.completeOnboarding();
        await loadUser();
        router.push('/dashboard');
      } catch (err: any) {
        setError(err.message);
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentPhase > 1) {
      setCurrentPhase((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await api.skipOnboarding();
      setUser({ ...user!, onboardingCompleted: true });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const phase = phases.find((p) => p.phase === currentPhase);
  const progress = (currentPhase / phases.length) * 100;

  return (
    <div className="min-h-screen bg-dark-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-400">
              Step {currentPhase} of {phases.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-sm text-dark-500 hover:text-dark-300"
            >
              Skip for now
            </button>
          </div>
          <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{phase?.title}</h1>
          <p className="text-dark-400">{phase?.description}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {phase?.questions.map((question) => (
            <QuestionCard
              key={question.key}
              question={question}
              value={responses[question.key]}
              onChange={(value) => handleResponse(question.key, value)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentPhase === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button onClick={handleNext} isLoading={isSubmitting}>
            {currentPhase === phases.length ? (
              <>
                Complete
                <Check className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <Card variant="bordered" className="p-5">
      <h3 className="font-medium mb-1">{question.question}</h3>
      {question.helpText && (
        <p className="text-sm text-dark-400 mb-4">{question.helpText}</p>
      )}

      {question.type === 'text' && (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your answer"
        />
      )}

      {question.type === 'number' && (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(Number(e.target.value))}
          min={question.validation?.min}
          max={question.validation?.max}
        />
      )}

      {question.type === 'slider' && (
        <div className="space-y-2">
          <input
            type="range"
            min={question.validation?.min || 1}
            max={question.validation?.max || 7}
            value={value || question.validation?.min || 1}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
          <div className="text-center text-lg font-semibold text-primary-500">
            {value || question.validation?.min || 1} days
          </div>
        </div>
      )}

      {question.type === 'single_select' && question.options && (
        <div className="grid gap-2">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                value === option.value
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-dark-700 hover:border-dark-600 text-dark-300'
              )}
            >
              <div className="font-medium">{option.label}</div>
              {option.description && (
                <div className="text-sm text-dark-400">{option.description}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {question.type === 'multi_select' && question.options && (
        <div className="grid gap-2">
          {question.options.map((option) => {
            const selected = (value || []).includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => {
                  const current = value || [];
                  if (selected) {
                    onChange(current.filter((v: string) => v !== option.value));
                  } else {
                    onChange([...current, option.value]);
                  }
                }}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3',
                  selected
                    ? 'border-primary-500 bg-primary-500/10 text-white'
                    : 'border-dark-700 hover:border-dark-600 text-dark-300'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center',
                    selected
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-dark-600'
                  )}
                >
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'boolean' && (
        <div className="flex gap-4">
          {[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ].map((option) => (
            <button
              key={String(option.value)}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex-1 px-4 py-3 rounded-lg border transition-colors font-medium',
                value === option.value
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-dark-700 hover:border-dark-600 text-dark-300'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

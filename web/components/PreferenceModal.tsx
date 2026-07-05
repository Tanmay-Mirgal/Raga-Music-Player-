'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS = [
  { id: 'hin', name: 'Hindi', query: 'hindi', color: '#E61E32' },
  { id: 'eng', name: 'English', query: 'english', color: '#1E3264' },
  { id: 'pun', name: 'Punjabi', query: 'punjabi', color: '#B026FF' },
  { id: 'tel', name: 'Telugu', query: 'telugu', color: '#E8115B' },
  { id: 'tam', name: 'Tamil', query: 'tamil', color: '#31B057' },
  { id: 'mar', name: 'Marathi', query: 'marathi', color: '#FF6437' },
];

const GENRE_OPTIONS = [
  { id: 'lofi', name: 'Lofi & Chill', query: 'lofi', color: '#2D46B9', emoji: '🍃' },
  { id: 'romance', name: 'Romantic Vibes', query: 'romantic', color: '#C82A40', emoji: '❤️' },
  { id: 'hiphop', name: 'Hip-Hop / Rap', query: 'hip hop', color: '#8C1D6B', emoji: '🎤' },
  { id: 'workout', name: 'Workout Power', query: 'workout', color: '#FF7F00', emoji: '💪' },
  { id: 'party', name: 'Party Hits', query: 'party', color: '#1F9651', emoji: '🎉' },
  { id: 'sad', name: 'Sad Songs', query: 'sad', color: '#4A5568', emoji: '🌧️' },
];

interface PreferenceModalProps {
  open: boolean;
  selectedLanguages: string[];
  selectedGenres: string[];
  onToggleLanguage: (query: string) => void;
  onToggleGenre: (query: string) => void;
  onSave: () => void;
  loading?: boolean;
}

export default function PreferenceModal({
  open, selectedLanguages, selectedGenres,
  onToggleLanguage, onToggleGenre, onSave, loading
}: PreferenceModalProps) {
  const [step, setStep] = useState(1);

  const canGoNext = selectedLanguages.length >= 1;
  const canSave = selectedGenres.length >= 2;

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-[#121212] border-[#282828] text-white max-w-lg p-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Step indicator */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex items-center mb-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="mr-3 text-white/60 hover:text-white transition-colors">
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="flex gap-2 items-center">
              <div className={cn('w-2 h-2 rounded-full transition-colors', step >= 1 ? 'bg-[#1DB954]' : 'bg-white/20')} />
              <div className={cn('w-2 h-2 rounded-full transition-colors', step >= 2 ? 'bg-[#1DB954]' : 'bg-white/20')} />
            </div>
            <span className="ml-auto text-white/40 text-xs">Step {step} of 2</span>
          </div>

          <h2 className="text-2xl font-black mb-1">
            {step === 1 ? 'Select Languages' : 'Choose your vibes'}
          </h2>
          <p className="text-[#B3B3B3] text-sm">
            {step === 1
              ? 'Which languages do you listen to? (Pick at least 1)'
              : 'Select at least 2 genres or moods to personalize your feed.'}
          </p>
        </div>

        {/* Grid */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(step === 1 ? LANGUAGE_OPTIONS : GENRE_OPTIONS).map((item) => {
              const isSelected = step === 1
                ? selectedLanguages.includes(item.query)
                : selectedGenres.includes(item.query);
              return (
                <button
                  key={item.id}
                  onClick={() => step === 1 ? onToggleLanguage(item.query) : onToggleGenre(item.query)}
                  className={cn(
                    'relative h-20 rounded-lg p-3 text-left transition-all duration-150 font-bold text-white text-sm',
                    'hover:brightness-110 active:scale-95'
                  )}
                  style={{ backgroundColor: item.color }}
                >
                  {'emoji' in item && (
                    <span className="block text-2xl mb-1">{(item as any).emoji}</span>
                  )}
                  <span>{item.name}</span>
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1DB954] flex items-center justify-center">
                      <Check size={12} className="text-black" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={!canGoNext}
              className="w-full h-12 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full disabled:opacity-40"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={onSave}
              disabled={!canSave || loading}
              className="w-full h-12 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold rounded-full disabled:opacity-40"
            >
              {loading ? 'Personalizing...' : 'Personalize My Feed'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

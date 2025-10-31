// src/components/chat/VoiceMessage.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceMessageProps {
  audioUrl: string;
  duration?: number;
  className?: string;
}

export const VoiceMessage: React.FC<VoiceMessageProps> = ({
  audioUrl,
  duration = 0,
  className = ""
}) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [totalDuration, setTotalDuration] = React.useState(duration);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Обработчики аудио событий
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error('Error loading audio');
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // Воспроизведение/пауза
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    }
  };

  // Перемотка по клику на прогресс-бар
  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * totalDuration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Прогресс в процентах
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-3 bg-white rounded-lg max-w-xs ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Кнопка воспроизведения */}
      <Button
        onClick={handlePlayPause}
        size="sm"
        variant="ghost"
        className="hover:bg-gray-100 rounded-full w-10 h-10 p-0"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 text-green-600" />
        ) : (
          <Play className="w-5 h-5 text-green-600 ml-0.5" />
        )}
      </Button>

      {/* Прогресс и время */}
      <div className="flex-1 min-w-0">
        {/* Прогресс-бар */}
        <div
          className="h-2 bg-gray-200 rounded-full cursor-pointer mb-1"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Время */}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Иконка аудио */}
      <Volume2 className="w-4 h-4 text-gray-400" />
    </div>
  );
};
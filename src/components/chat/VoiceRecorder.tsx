// src/components/chat/VoiceRecorder.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, X, Send, Pause, Play } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  className?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
  className = ""
}) => {
  const {
    isRecording,
    duration,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration
  } = useVoiceRecording();

  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  // Воспроизведение записанного аудио
  const handlePlayPause = () => {
    if (!audioBlob || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Отправка голосового сообщения
  const handleSend = () => {
    if (audioBlob) {
      onSendVoice(audioBlob, duration);
      cancelRecording();
    }
  };

  // Отмена записи
  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  React.useEffect(() => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      
      audioRef.current.onended = () => setIsPlaying(false);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  // Показываем ошибку если есть
  if (error) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-red-50 rounded-lg ${className}`}>
        <span className="text-red-600 text-sm">{error}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Режим записи
  if (isRecording) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-red-50 rounded-lg ${className}`}>
        {/* Индикатор записи */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-medium">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Режим предпросмотра после записи
  if (audioBlob) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-green-50 rounded-lg ${className}`}>
        <audio ref={audioRef} />
        
        {/* Кнопка воспроизведения */}
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePlayPause}
          className="hover:bg-green-100"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>

        {/* Длительность */}
        <span className="text-green-700 font-medium">
          {formatDuration(duration)}
        </span>

        {/* Кнопки управления */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="hover:bg-red-100"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Кнопка начала записи
  return (
    <Button
      onClick={startRecording}
      size="sm"
      variant="ghost"
      className={`hover:bg-green-100 ${className}`}
      title="Записать голосовое сообщение"
    >
      <Mic className="w-4 h-4" />
    </Button>
  );
};
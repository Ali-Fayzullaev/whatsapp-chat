// src/hooks/useVideoRecording.ts
import { useState, useRef, useCallback } from 'react';

interface VideoRecordingState {
  isRecording: boolean;
  duration: number;
  videoBlob: Blob | null;
  error: string | null;
  isPreviewOpen: boolean;
}

export const useVideoRecording = () => {
  const [state, setState] = useState<VideoRecordingState>({
    isRecording: false,
    duration: 0,
    videoBlob: null,
    error: null,
    isPreviewOpen: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startRecording = useCallback(async () => {
    try {
      // Запрашиваем доступ к камере и микрофону
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Фронтальная камера по умолчанию
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Показываем превью камеры
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Создаем MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Обработчики событий
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: 'video/webm;codecs=vp8,opus' });
        setState(prev => ({
          ...prev,
          videoBlob,
          isRecording: false,
          isPreviewOpen: true
        }));
        
        // Останавливаем поток камеры
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      // Начинаем запись
      mediaRecorder.start();

      // Запускаем таймер
      let startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setState(prev => ({
          ...prev,
          duration: elapsed
        }));
      }, 100);

      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0,
        error: null,
        videoBlob: null,
        isPreviewOpen: false
      }));

    } catch (error) {
      console.error('Error starting video recording:', error);
      let errorMessage = 'Не удалось получить доступ к камере';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Доступ к камере запрещен';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Камера не найдена';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Камера занята другим приложением';
        }
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();

      // Очищаем таймер
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [state.isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Останавливаем поток
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Очищаем таймер
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setState({
      isRecording: false,
      duration: 0,
      videoBlob: null,
      error: null,
      isPreviewOpen: false,
    });
  }, []);

  const closePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewOpen: false,
      videoBlob: null,
      duration: 0
    }));
  }, []);

  // Форматирование времени
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording: state.isRecording,
    duration: state.duration,
    videoBlob: state.videoBlob,
    error: state.error,
    isPreviewOpen: state.isPreviewOpen,
    videoRef,
    startRecording,
    stopRecording,
    cancelRecording,
    closePreview,
    formatDuration
  };
};
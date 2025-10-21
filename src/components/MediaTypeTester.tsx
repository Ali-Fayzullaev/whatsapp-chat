// src/components/MediaTypeTester.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MediaTypeTester() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [results, setResults] = useState<any[]>([]);

  const detectFileType = (file: File) => {
    const detections: any[] = [];

    // 1. По MIME типу
    let mimeType = 'unknown';
    if (file.type.startsWith('image/')) mimeType = 'image';
    else if (file.type.startsWith('video/')) mimeType = 'video';
    else if (file.type.startsWith('audio/')) mimeType = 'audio';
    else mimeType = 'document';
    
    detections.push({
      method: 'MIME Type',
      value: file.type,
      detected: mimeType
    });

    // 2. По расширению
    const ext = file.name.split('.').pop()?.toLowerCase();
    let extType = 'unknown';
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const videoExts = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
    const audioExts = ['mp3', 'wav', 'ogg', 'aac', 'm4a'];
    
    if (imageExts.includes(ext || '')) extType = 'image';
    else if (videoExts.includes(ext || '')) extType = 'video';
    else if (audioExts.includes(ext || '')) extType = 'audio';
    else extType = 'document';
    
    detections.push({
      method: 'File Extension',
      value: ext,
      detected: extType
    });

    return detections;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    const detections = detectFileType(file);
    
    setResults(prev => [...prev, {
      fileName: file.name,
      fileSize: file.size,
      timestamp: Date.now(),
      detections
    }]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔍 Тестер типов медиа файлов</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            onChange={handleFileSelect}
            accept="*/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {selectedFile && (
          <div className="p-4 bg-gray-50 rounded border">
            <h3 className="font-semibold mb-2">Текущий файл:</h3>
            <div className="text-sm space-y-1">
              <div><strong>Имя:</strong> {selectedFile.name}</div>
              <div><strong>Размер:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
              <div><strong>MIME:</strong> {selectedFile.type || 'не определен'}</div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Результаты тестирования:</h3>
            {results.slice(-5).reverse().map((result, idx) => (
              <div key={idx} className="border rounded p-3 bg-white">
                <div className="font-medium text-sm mb-2">
                  📄 {result.fileName} ({(result.fileSize / 1024).toFixed(1)} KB)
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(result.timestamp).toLocaleTimeString()}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.detections.map((detection: any, detIdx: number) => (
                    <div key={detIdx} className={`p-2 rounded text-xs ${
                      detection.detected === 'video' ? 'bg-purple-50 border border-purple-200' :
                      detection.detected === 'image' ? 'bg-green-50 border border-green-200' :
                      detection.detected === 'audio' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className="font-medium">{detection.method}</div>
                      <div>Значение: {detection.value}</div>
                      <div className="font-semibold">
                        Тип: 
                        <span className={
                          detection.detected === 'video' ? 'text-purple-700' :
                          detection.detected === 'image' ? 'text-green-700' :
                          detection.detected === 'audio' ? 'text-yellow-700' :
                          'text-gray-700'
                        }>
                          {detection.detected === 'video' ? '🎥 Видео' :
                           detection.detected === 'image' ? '🖼️ Изображение' :
                           detection.detected === 'audio' ? '🎵 Аудио' :
                           '📄 Документ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <Button 
            onClick={() => setResults([])} 
            variant="outline" 
            size="sm"
          >
            🗑️ Очистить результаты
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
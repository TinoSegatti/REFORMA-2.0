'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
  title: string;
  youtubeId?: string;
}

export default function VideoModal({ isOpen, onClose, videoSrc, title, youtubeId }: VideoModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl glass-card rounded-xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Video */}
        <div className="relative aspect-video bg-black">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoSrc ? (
            <video
              src={videoSrc}
              controls
              className="w-full h-full"
              autoPlay
            >
              Tu navegador no soporta el elemento de video.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-foreground/60">
              Video no disponible
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50">
          <div className="flex justify-end">
            <Button variant="neutral" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


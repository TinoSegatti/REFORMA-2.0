'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Settings } from 'lucide-react';

type BackgroundMode = 'solid' | 'image';

type BgPreference = {
  mode: BackgroundMode;
  color?: string;
  imageDataUrl?: string;
};

export default function ConfiguracionPage() {
  const params = useParams();
  const router = useRouter();
  const id = useMemo(() => (params?.id as string) || null, [params]);

  const [mode, setMode] = useState<BackgroundMode>('solid');
  const [color, setColor] = useState<string>('#0a0a0f');
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(id ? `bgPref:${id}` : 'bgPref:global');
      if (raw) {
        const parsed = JSON.parse(raw) as BgPreference;
        setMode(parsed.mode || 'solid');
        if (parsed.color) setColor(parsed.color);
        if (parsed.imageDataUrl) setImageDataUrl(parsed.imageDataUrl);
      }
    } catch {}
  }, [id]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const pref: BgPreference = { mode };
    if (mode === 'solid') {
      pref.color = color;
    } else if (mode === 'image' && imageDataUrl) {
      pref.imageDataUrl = imageDataUrl;
    }
    try {
      localStorage.setItem(id ? `bgPref:${id}` : 'bgPref:global', JSON.stringify(pref));
      setMessage('Preferencia guardada.');
      setTimeout(() => {
        setMessage(null);
        window.location.reload();
      }, 800);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    localStorage.removeItem(id ? `bgPref:${id}` : 'bgPref:global');
    setMode('solid');
    setColor('#0a0a0f');
    setImageDataUrl(undefined);
    setMessage('Preferencia restablecida.');
    setTimeout(() => setMessage(null), 1600);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Configuración</h1>

          {/* Card de Auditoría */}
          <Card>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Auditoría</h2>
                  <p className="text-sm text-foreground/70">Registros de cambios y operaciones del sistema</p>
                </div>
              </div>
              <p className="text-sm text-foreground/80">
                Visualiza todos los cambios realizados en compras, fabricaciones e inventario. 
                Accede al historial completo de operaciones críticas del sistema.
              </p>
              <Button
                onClick={() => router.push(`/granja/${id}/configuracion/auditoria`)}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Acceder a Auditoría
              </Button>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Fondo de la aplicación</h2>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setMode('solid')}
                  className={`px-4 py-2 rounded-lg transition ${mode === 'solid' ? 'bg-primary text-primary-foreground' : 'glass-surface text-foreground/80'}`}
                >
                  Color sólido
                </button>
                <button
                  onClick={() => setMode('image')}
                  className={`px-4 py-2 rounded-lg transition ${mode === 'image' ? 'bg-primary text-primary-foreground' : 'glass-surface text-foreground/80'}`}
                >
                  Imagen personalizada
                </button>
              </div>

              {mode === 'solid' && (
                <div className="flex items-center gap-4">
                  <label className="text-sm text-foreground/80">Selecciona un color:</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-16 rounded-md bg-transparent cursor-pointer"
                    aria-label="Color de fondo"
                  />
                  <div className="h-10 px-3 glass-surface rounded-md flex items-center text-sm text-foreground">
                    {color}
                  </div>
                </div>
              )}

              {mode === 'image' && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground hover:file:brightness-95"
                    aria-label="Seleccionar imagen de fondo"
                  />
                  {imageDataUrl && (
                    <div className="relative h-48 glass-card overflow-hidden">
                      <img src={imageDataUrl} alt="Fondo" className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </Button>
                <Button variant="neutral" onClick={reset}>Restablecer</Button>
              </div>

              {message && <p className="text-sm text-foreground/80">{message}</p>}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}



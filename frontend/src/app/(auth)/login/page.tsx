'use client';

import { useState } from 'react';
import { Input, Button, Card } from '@/components/ui';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="retro-card w-full max-w-md">
        {/* Header */}
        <div className="retro-header">
          <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Bienvenido a REFORMA
            </h1>
          </div>
          <button className="retro-icon-button">✕</button>
        </div>

        {/* Tabs */}
        <div className="p-6">
          <div className="flex mb-6 border-b-2 border-border">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                isLogin
                  ? 'border-b-2 border-primary text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Iniciar Sesión →
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                !isLogin
                  ? 'border-b-2 border-primary text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Form */}
          <form className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="retro-input w-4 h-4"
                />
                <span className="text-sm text-foreground">Recordarme</span>
              </label>
              <a
                href="#"
                className="text-sm text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button variant="primary" className="w-full mt-6">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}


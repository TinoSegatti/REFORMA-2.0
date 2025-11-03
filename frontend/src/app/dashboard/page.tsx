'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KPICard, Button } from '@/components/ui';
import { authService } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string; nombreUsuario: string; apellidoUsuario: string; tipoUsuario: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    const currentUser = authService.getUser();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B6CCAE] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/80">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="glass-card px-8 py-6 m-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              ¡Hola, {user?.nombreUsuario || 'Usuario'}! 👋
            </h2>
            <p className="text-foreground/70">
              Bienvenido al panel de control de REFORMA
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto p-8 space-y-8">
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Total Productos"
              value="247"
              icon="📦"
              color="pink"
              trend={{ value: 12, isPositive: true }}
            />
            <KPICard
              title="Alertas Críticas"
              value="2"
              icon="⚠️"
              color="yellow"
            />
            <KPICard
              title="Valor Total Stock"
              value="€24.5K"
              icon="💰"
              color="green"
              trend={{ value: 8, isPositive: true }}
            />
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Acciones Rápidas</h3>
              <span className="text-sm text-foreground/70">Selecciona una acción</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#F5B8DA]/10 to-[#E599C6]/10 rounded-xl hover:from-[#F5B8DA]/20 hover:to-[#E599C6]/20 transition-all duration-300 border border-[#F5B8DA]/20">
                <span className="text-4xl mb-2">📦</span>
                <span className="text-sm font-semibold text-foreground">Stock</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#FAD863]/10 to-[#F8C540]/10 rounded-xl hover:from-[#FAD863]/20 hover:to-[#F8C540]/20 transition-all duration-300 border border-[#FAD863]/20">
                <span className="text-4xl mb-2">🔍</span>
                <span className="text-sm font-semibold text-foreground">Buscar</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#9AAB64]/10 to-[#7B8E54]/10 rounded-xl hover:from-[#9AAB64]/20 hover:to-[#7B8E54]/20 transition-all duration-300 border border-[#9AAB64]/20">
                <span className="text-4xl mb-2">📊</span>
                <span className="text-sm font-semibold text-foreground">Reportes</span>
              </button>
              <button className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#B6CAEB]/10 to-[#9DB5D9]/10 rounded-xl hover:from-[#B6CAEB]/20 hover:to-[#9DB5D9]/20 transition-all duration-300 border border-[#B6CAEB]/20">
                <span className="text-4xl mb-2">⚙️</span>
                <span className="text-sm font-semibold text-foreground">Config</span>
              </button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Distribución de Stock</h3>
                <span className="text-xs bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-white px-3 py-1 rounded-full font-semibold">Nuevo</span>
              </div>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#B6CCAE]/10 to-[#9AAB64]/10 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-6xl mb-2">📊</p>
                  <p className="text-foreground/70 font-medium">Gráfico de pastel</p>
                  <p className="text-sm text-foreground/60 mt-1">Próximamente</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Top 10 Materias Primas</h3>
                <span className="text-xs bg-gradient-to-r from-[#FAD863] to-[#F8C540] text-gray-900 px-3 py-1 rounded-full font-semibold">Popular</span>
              </div>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-[#FAD863]/10 to-[#F5B8DA]/10 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-6xl mb-2">📈</p>
                  <p className="text-foreground/70 font-medium">Gráfico de barras</p>
                  <p className="text-sm text-foreground/60 mt-1">Próximamente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

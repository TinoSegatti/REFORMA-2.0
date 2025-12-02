'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import AnimatedCounter from './AnimatedCounter';
import ScrollReveal from './ScrollReveal';

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}

function StatCard({
  title,
  value,
  suffix = '',
  prefix = '',
  description,
  trend,
  trendValue,
}: StatCardProps) {
  return (
    <div className="glass-card p-6 rounded-xl border border-border/50">
      <div className="text-sm text-foreground/60 mb-2">{title}</div>
      <div className="text-3xl font-bold text-foreground mb-1">
        <AnimatedCounter
          end={value}
          prefix={prefix}
          suffix={suffix}
          className="inline-block"
        />
      </div>
      {description && (
        <div className="text-sm text-foreground/60 mt-2">{description}</div>
      )}
      {trend && trendValue && (
        <div
          className={`text-xs mt-2 flex items-center gap-1 ${
            trend === 'up'
              ? 'text-green-400'
              : trend === 'down'
              ? 'text-red-400'
              : 'text-foreground/60'
          }`}
        >
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span>{Math.abs(trendValue)}%</span>
        </div>
      )}
    </div>
  );
}

interface StatsSectionProps {
  stats?: {
    totalUsers?: number;
    totalGranjas?: number;
    totalCompras?: number;
    totalFabricaciones?: number;
  };
  chartData?: Array<{ name: string; value: number }>;
}

export default function StatsSection({
  stats = {
    totalUsers: 500,
    totalGranjas: 300,
    totalCompras: 5000,
    totalFabricaciones: 3000,
  },
  chartData = [
    { name: 'Mes 1', value: 50 },
    { name: 'Mes 3', value: 150 },
    { name: 'Mes 6', value: 300 },
    { name: 'Mes 9', value: 450 },
    { name: 'Mes 12', value: 600 },
    { name: 'Meta', value: 1000 },
  ],
}: StatsSectionProps) {
  const pieData = [
    { name: 'Ahorro de Tiempo', value: 40 },
    { name: 'Reducción de Errores', value: 35 },
    { name: 'Optimización de Costos', value: 25 },
  ];

  const COLORS = ['#9d77f4', '#f472b6', '#06b6d4'];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        <ScrollReveal direction="fade" className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Potencial y Metas
          </h2>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Nuestras estimaciones de rendimiento y el potencial que vemos en REFORMA para transformar la gestión de granjas
          </p>
        </ScrollReveal>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <ScrollReveal direction="up" delay={0.1}>
            <StatCard
              title="Meta de Usuarios"
              value={stats.totalUsers || 0}
              suffix="+"
              description="Nuestra meta para el primer año"
            />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.2}>
            <StatCard
              title="Granjas Objetivo"
              value={stats.totalGranjas || 0}
              suffix="+"
              description="Granjas que esperamos gestionar"
            />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.3}>
            <StatCard
              title="Compras Estimadas"
              value={stats.totalCompras || 0}
              suffix="+"
              description="Registros proyectados mensualmente"
            />
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.4}>
            <StatCard
              title="Fabricaciones Esperadas"
              value={stats.totalFabricaciones || 0}
              suffix="+"
              description="Proyección de uso del sistema"
            />
          </ScrollReveal>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScrollReveal direction="left" delay={0.2}>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Proyección de Crecimiento
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.6)"
                    tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.6)"
                    tick={{ fill: 'rgba(255,255,255,0.6)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 20, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#9d77f4"
                    strokeWidth={2}
                    dot={{ fill: '#9d77f4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.3}>
            <div className="glass-card p-6 rounded-xl border border-border/50">
              <h3 className="text-xl font-semibold text-foreground mb-6">
                Beneficios Esperados
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(20, 20, 30, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}


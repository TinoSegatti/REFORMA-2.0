'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [granjaActiva, setGranjaActiva] = useState<{ id: string; nombre: string } | null>(() => {
    // Inicializar estado basado en la ruta actual
    const idGranja = pathname.match(/\/granja\/([^/]+)/)?.[1];
    if (idGranja) {
      const granja = localStorage.getItem('granjaInfo');
      if (granja) {
        return JSON.parse(granja);
      }
      return { id: idGranja, nombre: 'Mi Planta' };
    }
    return null;
  });

  useEffect(() => {
    // Solo actualizar si la ruta cambia
    const idGranja = pathname.match(/\/granja\/([^/]+)/)?.[1];
    if (idGranja && (!granjaActiva || granjaActiva.id !== idGranja)) {
      const granja = localStorage.getItem('granjaInfo');
      if (granja) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGranjaActiva(JSON.parse(granja));
      } else {
        setGranjaActiva({ id: idGranja, nombre: 'Mi Planta' });
      }
    }
  }, [pathname, granjaActiva]);

  // Obtener el ID de la granja de la ruta actual
  const idGranja = pathname.match(/\/granja\/([^/]+)/)?.[1];
  
  // Función para generar href correcto
  const getHref = (modulo: string) => {
    if (idGranja) {
      return `/granja/${idGranja}${modulo}`;
    }
    return `/mis-plantas`; // Redirigir a mis-plantas si no hay granja activa
  };

  const menuItems = [
    {
      id: 'materias-primas',
      icon: '📦',
      label: 'Materias Primas',
      href: getHref('/materias-primas'),
    },
    {
      id: 'proveedores',
      icon: '🏢',
      label: 'Proveedores',
      href: getHref('/proveedores'),
    },
    {
      id: 'compras',
      icon: '🛒',
      label: 'Compras',
      href: getHref('/compras'),
    },
    {
      id: 'formulas',
      icon: '📋',
      label: 'Fórmulas',
      href: getHref('/formulas'),
    },
    {
      id: 'fabricaciones',
      icon: '⚙️',
      label: 'Fabricaciones',
      href: getHref('/fabricaciones'),
    },
    {
      id: 'inventario',
      icon: '📊',
      label: 'Inventario',
      href: getHref('/inventario'),
    },
    {
      id: 'piensos',
      icon: '🐷',
      label: 'Piensos',
      href: getHref('/piensos'),
    },
    {
      id: 'configuracion',
      icon: '⚙️',
      label: 'Configuración',
      href: getHref('/configuracion'),
    },
  ];

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('granjaActiva');
    localStorage.removeItem('granjaInfo');
    router.push('/login');
  };

  const volverAGranjas = () => {
    router.push('/mis-plantas');
  };

  const estaEnGranja = pathname.includes('/granja/');

  return (
    <aside className="w-64 bg-[#121212] text-white min-h-screen fixed left-0 top-0 z-40">
      {/* Logo y Botón Volver */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#F5B8DA] to-[#E599C6] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <h1 className="text-xl font-bold">REFORMA</h1>
        </div>

        {/* Info de Granja Activa */}
        {estaEnGranja && granjaActiva && (
          <div className="bg-gradient-to-r from-[#B6CCAE]/20 to-[#9AAB64]/20 border border-[#B6CCAE]/30 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <span className="text-xl">🏭</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Granja Activa</p>
                <p className="text-sm font-semibold text-white truncate">
                  {granjaActiva.nombre || 'Mi Planta'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botón Volver a Granjas */}
        {estaEnGranja && (
          <button
            onClick={volverAGranjas}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#B6CCAE] to-[#9AAB64] text-gray-900 font-semibold transition-all duration-300 hover:shadow-lg text-sm"
          >
            <span>🏠</span>
            <span>Volver a Mis Granjas</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-[#B6CAEB] to-[#9DB5D9] text-gray-900 font-semibold shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all duration-300 font-semibold"
        >
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { 
  Box, Package, ShoppingCart, FileText, Settings, BarChart3, 
  PiggyBank, Home, LogOut, Factory, Users, Sprout, Moon, Sun, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [granjaActiva, setGranjaActiva] = useState<{ id: string; nombre: string } | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Cargar tema inicial
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.className = 'light';
      document.body.style.backgroundColor = '#ffffff';
    } else {
      setDarkMode(true);
      document.documentElement.className = 'dark';
      document.body.style.backgroundColor = '#0a0a0f';
    }

    // Solo actualizar si la ruta cambia
    const idGranja = pathname.match(/\/granja\/([^/]+)/)?.[1];
    if (idGranja) {
      const granja = localStorage.getItem('granjaInfo');
      if (granja) {
        setGranjaActiva(JSON.parse(granja));
      } else {
        setGranjaActiva({ id: idGranja, nombre: 'Mi Planta' });
      }
    } else {
      setGranjaActiva(null);
    }
  }, [pathname]);

  useEffect(() => {
    // Actualizar clase en body para ajustar layout cuando colapsa
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.className = newDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    // Actualizar fondo según el tema
    document.body.style.backgroundColor = newDarkMode ? '#0a0a0f' : '#ffffff';
  };

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
      Icon: Sprout,
      label: 'Materias Primas',
      href: getHref('/materias-primas'),
    },
    {
      id: 'proveedores',
      Icon: Users,
      label: 'Proveedores',
      href: getHref('/proveedores'),
    },
    {
      id: 'compras',
      Icon: ShoppingCart,
      label: 'Compras',
      href: getHref('/compras'),
    },
    {
      id: 'formulas',
      Icon: FileText,
      label: 'Fórmulas',
      href: getHref('/formulas'),
    },
    {
      id: 'fabricaciones',
      Icon: Factory,
      label: 'Fabricaciones',
      href: getHref('/fabricaciones'),
    },
    {
      id: 'inventario',
      Icon: BarChart3,
      label: 'Inventario',
      href: getHref('/inventario'),
    },
    {
      id: 'piensos',
      Icon: PiggyBank,
      label: 'Piensos',
      href: getHref('/piensos'),
    },
    {
      id: 'configuracion',
      Icon: Settings,
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
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} text-white min-h-screen fixed left-0 top-0 z-40 bg-white/5 backdrop-blur-xl border-r border-white/10 sidebar-glass transition-all duration-300`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 w-6 h-6 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full flex items-center justify-center shadow-lg hover:brightness-110 transition-all z-50"
        title={isCollapsed ? 'Expandir' : 'Colapsar'}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4 text-white" /> : <ChevronLeft className="h-4 w-4 text-white" />}
      </button>

      {/* Logo y Botón Volver */}
      <div className="p-4 border-b border-white/10 space-y-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Box className="text-white h-6 w-6" />
          </div>
          {!isCollapsed && <h1 className="text-xl font-bold">REFORMA</h1>}
        </div>

        {/* Info de Granja Activa */}
        {estaEnGranja && granjaActiva && !isCollapsed && (
          <div className="glass-card rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Factory className="text-xl text-cyan-400" />
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
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:brightness-110 text-sm"
          >
            <Home className="h-5 w-5" />
            {!isCollapsed && <span>Volver a Mis Granjas</span>}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const IconComponent = item.Icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30' 
                  : 'text-gray-200 hover:bg-white/10 hover:text-white'
                }
              `}
              title={isCollapsed ? item.label : ''}
            >
              <IconComponent className="h-5 w-5" />
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3 border-t border-white/10">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 glass-surface rounded-xl font-semibold hover:bg-white/10 transition-all text-sm text-foreground"
          title={isCollapsed ? (darkMode ? 'Modo Claro' : 'Modo Oscuro') : ''}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!isCollapsed && <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </button>

        {/* Upgrade Box */}
        {!isCollapsed && (
          <div className="glass-card rounded-xl p-4 border-2 border-amber-400/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-400 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                <span className="text-xl">⭐</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide mb-1">Upgrade</p>
                <p className="text-sm text-white leading-tight mb-2">
                  Desbloquea funciones premium
                </p>
                <button className="w-full px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-gray-900 rounded-lg font-semibold text-xs hover:shadow-lg hover:brightness-110 transition-all">
                  Ver Planes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all duration-300 font-semibold hover:shadow-lg hover:shadow-red-600/30"
          title={isCollapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}

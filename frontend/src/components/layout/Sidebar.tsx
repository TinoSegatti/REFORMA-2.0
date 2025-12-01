'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useState, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  FileText,
  Settings,
  BarChart3,
  PiggyBank,
  Home,
  LogOut,
  Factory,
  Users,
  Sprout,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  // Estado para controlar si el componente está montado (solo cliente)
  const [mounted, setMounted] = useState(false);
  
  // Inicializar darkMode siempre con valor por defecto para evitar hidratación
  const [darkMode, setDarkMode] = useState(true); // Por defecto dark mode

  // Marcar como montado y cargar tema desde localStorage solo después de la hidratación
  useEffect(() => {
    setMounted(true);
    
    // Cargar tema desde localStorage solo en el cliente
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme !== 'light';
    setDarkMode(isDark);
    
    // Aplicar tema inicial al DOM
    document.documentElement.className = isDark ? 'dark' : 'light';
    document.body.style.backgroundColor = isDark ? '#0a0a0f' : '#ffffff';
  }, []);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasManualToggle, setHasManualToggle] = useState(false);
  
  // Obtener ID de granja desde pathname
  const idGranja = pathname.match(/\/granja\/([^/]+)/)?.[1];
  
  // Estado para la granja activa - siempre inicializar con valor por defecto para evitar hidratación
  const [granjaActiva, setGranjaActiva] = useState<{ id: string; nombre: string } | null>(
    idGranja ? { id: idGranja, nombre: 'Mi Planta' } : null
  );

  // Actualizar información de la granja cuando el componente está montado y cambia idGranja
  useEffect(() => {
    if (!mounted || !idGranja) return;
    
    // Cargar desde localStorage solo después de la hidratación
    const granja = localStorage.getItem('granjaInfo');
    if (granja) {
      try {
        const granjaData = JSON.parse(granja);
        if (granjaData.id === idGranja) {
          setGranjaActiva(granjaData);
          return;
        }
      } catch {
        // Si hay error, mantener valor por defecto
      }
    }
    // Si no hay datos en localStorage, mantener valor por defecto
    setGranjaActiva({ id: idGranja, nombre: 'Mi Planta' });
  }, [mounted, idGranja]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else if (!hasManualToggle) {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasManualToggle]);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.className = newDarkMode ? 'dark' : 'light';
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    // Actualizar fondo según el tema
    document.body.style.backgroundColor = newDarkMode ? '#0a0a0f' : '#ffffff';
  };

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
    setHasManualToggle(true);
  };

  // Función para generar href correcto
  const getHref = (modulo: string) => {
    if (idGranja) {
      return `/granja/${idGranja}${modulo}`;
    }
    return `/mis-plantas`; // Redirigir a mis-plantas si no hay granja activa
  };

  const panelHref = idGranja ? `/granja/${idGranja}` : '/mis-plantas';

  const menuItems = [
    {
      id: 'panel-principal',
      Icon: BarChart3,
      label: 'Panel Principal',
      href: panelHref,
    },
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
      Icon: Package,
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
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } text-white min-h-screen fixed left-0 top-0 z-40 bg-white/5 backdrop-blur-xl border-r border-white/10 sidebar-glass flex flex-col transition-all duration-300`}
    >
      <div className="relative p-4 border-b border-white/10 space-y-4">
        <button
          onClick={toggleCollapse}
          className="absolute -right-3 top-6 w-7 h-7 rounded-full bg-purple-600/80 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/40 transition-all"
          aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30 p-1.5">
            <img 
              src="/logo.png?v=2" 
              alt="REFORMA Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && <h1 className="text-lg font-semibold tracking-wide">REFORMA</h1>}
        </div>

        <button
          onClick={toggleTheme}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2 px-3 py-2 glass-surface rounded-lg font-medium hover:bg-white/10 transition-all text-xs text-foreground`}
        >
          <span className="flex items-center gap-2">
            {mounted ? (darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4" />}
            {!isCollapsed && <span>{mounted ? (darkMode ? 'Modo Claro' : 'Modo Oscuro') : 'Modo Oscuro'}</span>}
          </span>
        </button>

        {estaEnGranja && idGranja && (
          <div className={`glass-card rounded-lg ${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'}`}>
            {isCollapsed ? (
              <Factory className="text-lg text-cyan-400" />
            ) : (
              <div className="flex items-start gap-2">
                <Factory className="text-lg text-cyan-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Granja Activa</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {mounted && granjaActiva?.nombre ? granjaActiva.nombre : 'Mi Planta'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {estaEnGranja && (
          <button
            onClick={volverAGranjas}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:brightness-110 text-xs`}
          >
            <Home className="h-4 w-4" />
            {!isCollapsed && <span>Mis Granjas</span>}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isPanelPrincipal = item.id === 'panel-principal';
          const isActive = pathname === item.href || (!isPanelPrincipal && pathname.startsWith(item.href + '/'));
          const IconComponent = item.Icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30'
                  : 'text-gray-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <IconComponent className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-3 border-t border-white/10">
        <div className={`glass-card rounded-lg border border-amber-400/30 ${isCollapsed ? 'p-2 flex items-center justify-center' : 'p-3'}`}>
          {isCollapsed ? (
            <Link
              href="/planes"
              className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-400 rounded-md flex items-center justify-center shadow-lg shadow-amber-500/30 text-base hover:brightness-110 transition-all"
              aria-label="Ver planes"
            >
              ⭐
            </Link>
          ) : (
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-400 rounded-md flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                <span className="text-base">⭐</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-wide mb-1">Upgrade</p>
                <p className="text-xs text-white leading-tight mb-2">Desbloquea funciones premium.</p>
                <Link
                  href="/planes"
                  className="block w-full px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-gray-900 rounded-md font-semibold text-xs hover:shadow-lg hover:brightness-110 transition-all text-center"
                >
                  Ver planes
                </Link>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-2'} px-3 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-300 font-semibold hover:shadow-lg hover:shadow-red-600/30 text-sm`}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
}

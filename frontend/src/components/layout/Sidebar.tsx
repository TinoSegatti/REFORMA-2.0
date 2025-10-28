'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export const Sidebar = () => {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    { id: 'materias-primas', label: 'Materias Primas', icon: '📦', href: '/materias-primas' },
    { id: 'stock', label: 'Stock', icon: '📦', href: '/stock' },
    { id: 'proveedores', label: 'Proveedores', icon: '👤', href: '/proveedores' },
    { id: 'compras', label: 'Compras', icon: '🛒', href: '/compras' },
    { id: 'recetas', label: 'Recetas', icon: '📄', href: '/recetas' },
    { id: 'producciones', label: 'Producciones', icon: '🏭', href: '/producciones' },
    { id: 'archivos', label: 'Archivos', icon: '📁', href: '/archivos' },
    { id: 'cerdos', label: 'Cerdos', icon: '🐷', href: '/cerdos' },
  ];

  const bottomItems = [
    { id: 'plantas', label: 'Mis Plantas', icon: '🏠', href: '/plantas' },
    { id: 'logout', label: 'Cerrar Sesión', icon: '→', href: '/logout' },
  ];

  return (
    <div className="w-64 bg-sidebar border-r-2 border-sidebar-border h-screen flex flex-col">
      {/* Logo */}
      <div className="retro-header justify-center p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">R</span>
          </div>
          <span className="text-xl font-bold text-foreground">REFORMA</span>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 mb-2 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="border-t-2 border-sidebar-border p-4 space-y-2">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              item.id === 'plantas'
                ? 'bg-secondary text-secondary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};


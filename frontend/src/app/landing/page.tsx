'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { 
  Sprout, 
  Users, 
  ShoppingCart, 
  Package, 
  FileText, 
  Factory,
  BarChart3,
  Check,
  ArrowRight,
  Zap,
  Shield,
  TrendingUp,
  Download,
  Upload,
  FileCheck,
  Clock,
  BookOpen,
  Mail,
  Phone
} from 'lucide-react';
import VideoModal from '@/components/landing/VideoModal';

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const features = [
    {
      icon: Package,
      title: 'Gestión de Inventario',
      description: 'Control automático de inventario con cálculos de merma, precio almacen y valor stock en tiempo real.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: FileText,
      title: 'Fórmulas de Alimentación',
      description: 'Crea y gestiona fórmulas de alimentación con múltiples materias primas y cálculo automático de costos.',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: Factory,
      title: 'Fabricaciones',
      description: 'Registra fabricaciones basadas en fórmulas con verificación de existencias y cálculo automático de costos.',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: ShoppingCart,
      title: 'Gestión de Compras',
      description: 'Registra y gestiona compras con múltiples items, actualización automática de precios y seguimiento completo.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Users,
      title: 'Proveedores',
      description: 'Gestiona proveedores, analiza compras y gastos con gráficos y reportes detallados.',
      color: 'from-pink-500 to-pink-600'
    },
    {
      icon: BarChart3,
      title: 'Panel Principal',
      description: 'Dashboard completo con KPIs, gráficos interactivos y métricas en tiempo real de tu operación.',
      color: 'from-cyan-500 to-cyan-600'
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Cálculos Automáticos',
      description: 'Todos los cálculos se realizan automáticamente: inventario, costos, mermas y más.',
    },
    {
      icon: Shield,
      title: 'Datos Seguros',
      description: 'Tus datos están seguros con backups automáticos y sistema de auditoría completo.',
    },
    {
      icon: TrendingUp,
      title: 'Análisis Avanzado',
      description: 'Analiza tu operación con gráficos, reportes y métricas en tiempo real.',
    },
    {
      icon: Download,
      title: 'Exportación de Datos',
      description: 'Exporta tus datos en formato CSV para análisis externos y respaldos.',
    },
    {
      icon: Upload,
      title: 'Importación de Datos',
      description: 'Importa datos desde CSV para migrar información existente rápidamente.',
    },
    {
      icon: FileCheck,
      title: 'Auditoría Completa',
      description: 'Historial completo de todas las operaciones con trazabilidad total.',
    },
  ];

  const plans = [
    {
      name: 'Demo Gratuita',
      price: 0,
      priceAnnual: 0,
      description: 'Prueba todas las funcionalidades',
      features: [
        '1 granja',
        '50 registros temporales',
        '5 fórmulas',
        '5 fabricaciones',
        'Todos los módulos',
        'Datos temporales (30 días)',
        'Exportación CSV',
        'Importación CSV',
        'Panel Principal completo',
        'Gráficos disponibles',
        'Auditoría completa',
      ],
      cta: 'Comenzar Gratis',
      popular: false,
      color: 'from-gray-500 to-gray-600'
    },
    {
      name: 'Starter',
      price: 35,
      priceAnnual: 350,
      description: 'Para operaciones pequeñas',
      features: [
        '2 plantas',
        '2 usuarios',
        '20 materias primas',
        '20 proveedores',
        '15 piensos',
        '30 fórmulas',
        '1,000 fabricaciones',
        '2,000 compras',
        'Inventario sin límite',
        'Datos permanentes',
        'Exportación CSV',
        'Importación CSV (limitada)',
        'Sin publicidad',
      ],
      cta: 'Comenzar Ahora',
      popular: true,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Business',
      price: 99,
      priceAnnual: 990,
      description: 'Para operaciones profesionales',
      features: [
        '5 plantas',
        '5 usuarios',
        '100 materias primas',
        '500 proveedores',
        '100 piensos',
        '100 fórmulas',
        '5,000 fabricaciones',
        '8,000 compras',
        'Inventario sin límite',
        'Gráficos avanzados',
        'Reportes PDF (6 tipos)',
        'Archivos históricos (180)',
        'Auditoría completa',
        'Importación CSV completa',
        'Capacitación virtual',
        'Soporte 72 horas',
      ],
      cta: 'Comenzar Ahora',
      popular: false,
      color: 'from-pink-500 to-pink-600'
    },
    {
      name: 'Enterprise',
      price: 229,
      priceAnnual: 2290,
      description: 'Para grandes operaciones',
      features: [
        '25 plantas',
        '25 usuarios',
        'Registros ilimitados',
        'Fórmulas ilimitadas',
        'Fabricaciones ilimitadas',
        'Compras ilimitadas',
        'Dashboard personalizado',
        'Reportes PDF personalizados',
        'Archivos históricos ilimitados',
        'Alertas avanzadas (Email)',
        'Backup automático',
        'Capacitación presencial',
        'Soporte < 24 horas',
        'Consultoría personalizada',
      ],
      cta: 'Contactar Ventas',
      popular: false,
      color: 'from-cyan-500 to-cyan-600'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-surface border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">REFORMA</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a 
                href="#features" 
                className="text-foreground/80 hover:text-foreground transition-colors scroll-smooth"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Funcionalidades
              </a>
              <a 
                href="#pricing" 
                className="text-foreground/80 hover:text-foreground transition-colors scroll-smooth"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Precios
              </a>
              <a 
                href="#benefits" 
                className="text-foreground/80 hover:text-foreground transition-colors scroll-smooth"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Beneficios
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="neutral" className="text-sm px-4 py-2">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="primary" className="text-sm px-4 py-2">
                  Comenzar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-surface rounded-full border border-border/50">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-foreground/80">Sistema de Gestión de Granjas</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Gestiona tu Granja de Forma
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Inteligente y Eficiente
              </span>
            </h1>
            <p className="text-xl text-foreground/70 max-w-3xl mx-auto">
              Controla inventario, fórmulas, fabricaciones y compras con cálculos automáticos, 
              gráficos en tiempo real y reportes profesionales.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button variant="primary" className="w-full sm:w-auto px-8 py-4 text-lg flex items-center justify-center gap-2">
                  Comenzar Gratis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                className="w-full sm:w-auto px-8 py-4 text-lg"
                onClick={() => setShowVideoModal(true)}
              >
                Ver Demo
              </Button>
            </div>
            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">0</div>
                <div className="text-sm text-foreground/60">Costo inicial</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">30 días</div>
                <div className="text-sm text-foreground/60">Prueba gratis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">100%</div>
                <div className="text-sm text-foreground/60">Funcionalidades</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Funcionalidades Completas
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Todas las herramientas que necesitas para gestionar tu granja de forma profesional
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-xl border border-border/50 hover:border-primary/50 transition-all group"
              >
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-foreground/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              ¿Por Qué Elegir REFORMA?
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Ventajas que hacen la diferencia en la gestión de tu granja
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="glass-card p-6 rounded-xl border border-border/50"
              >
                <div className="inline-flex p-3 rounded-lg bg-primary/20 mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-foreground/70">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Planes de Suscripción
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto mb-8">
              Elige el plan que mejor se adapte a tu operación
            </p>
            <div className="inline-flex items-center gap-4 glass-surface p-2 rounded-xl border border-border/50">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  !isAnnual
                    ? 'bg-primary text-white'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isAnnual
                    ? 'bg-primary text-white'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                Anual
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  Ahorra 2 meses
                </span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`glass-card p-6 rounded-xl border-2 ${
                  plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border/50'
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Más Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-foreground/60 text-sm mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-foreground">
                      ${isAnnual ? plan.priceAnnual : plan.price}
                    </span>
                    <span className="text-foreground/60">
                      /{isAnnual ? 'año' : 'mes'}
                    </span>
                  </div>
                  {isAnnual && plan.price > 0 && (
                    <p className="text-sm text-foreground/60 mt-2">
                      ${Math.round(plan.priceAnnual / 12)}/mes facturado anualmente
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="block w-full">
                  <Button
                    variant={plan.popular ? 'primary' : 'neutral'}
                    className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white border-0`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-card p-12 rounded-xl border border-border/50 text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              ¿Listo para Comenzar?
            </h2>
            <p className="text-xl text-foreground/70 mb-8 max-w-2xl mx-auto">
              Prueba REFORMA gratis durante 30 días. Sin tarjeta de crédito requerida.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button variant="primary" className="px-8 py-4 text-lg flex items-center justify-center gap-2">
                  Comenzar Gratis
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="secondary" className="px-8 py-4 text-lg">
                Contactar Ventas
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">REFORMA</span>
              </div>
              <p className="text-foreground/60 text-sm">
                Sistema de gestión de granjas profesional y eficiente.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Precios</a></li>
                <li><a href="#benefits" className="hover:text-foreground transition-colors">Beneficios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentación</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Ayuda</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>soporte@reforma.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-foreground/60 border-t border-border/50 pt-8">
            <p>&copy; 2024 REFORMA. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title="Demo de REFORMA"
        videoSrc="/landing/videos/demo-panel-principal.mp4"
      />
    </div>
  );
}


import { useState, useEffect } from 'react';
import "./Dashboard.css";
import { useAuth } from './AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { isSupabaseConfigured, cargarDatosDashboard, updateLineaProducto } from './supabaseClient';

// ==================== DATOS ====================

// Datos de proyección mensual (6 líneas: Publicitaria 10%, Eco 15%, EcoForro 15%, Básica 15%, Estándar 25%, Premium 20%)
const proyeccionData = [
  { mes: 'Mes 1', ventas: 20, publicitaria: 2, eco: 3, ecoForro: 3, basica: 3, estandar: 5, premium: 4, ecomm: 6, directa: 6, mayoreo: 8, modelos: 15, utilidad: 1580, acumulado: 1580 },
  { mes: 'Mes 2', ventas: 28, publicitaria: 3, eco: 4, ecoForro: 4, basica: 4, estandar: 8, premium: 5, ecomm: 8, directa: 8, mayoreo: 12, modelos: 25, utilidad: 2240, acumulado: 3820 },
  { mes: 'Mes 3', ventas: 38, publicitaria: 4, eco: 6, ecoForro: 6, basica: 6, estandar: 10, premium: 6, ecomm: 11, directa: 11, mayoreo: 16, modelos: 35, utilidad: 3040, acumulado: 6860 },
  { mes: 'Mes 4', ventas: 50, publicitaria: 5, eco: 7, ecoForro: 7, basica: 8, estandar: 13, premium: 10, ecomm: 15, directa: 15, mayoreo: 20, modelos: 45, utilidad: 4000, acumulado: 10860 },
  { mes: 'Mes 5', ventas: 65, publicitaria: 6, eco: 10, ecoForro: 10, basica: 10, estandar: 16, premium: 13, ecomm: 20, directa: 20, mayoreo: 25, modelos: 55, utilidad: 5200, acumulado: 16060 },
  { mes: 'Mes 6', ventas: 80, publicitaria: 8, eco: 12, ecoForro: 12, basica: 12, estandar: 20, premium: 16, ecomm: 24, directa: 24, mayoreo: 32, modelos: 65, utilidad: 6400, acumulado: 22460 },
  { mes: 'Mes 7', ventas: 95, publicitaria: 10, eco: 14, ecoForro: 14, basica: 14, estandar: 24, premium: 19, ecomm: 28, directa: 28, mayoreo: 39, modelos: 75, utilidad: 7600, acumulado: 30060 },
  { mes: 'Mes 8', ventas: 115, publicitaria: 12, eco: 17, ecoForro: 17, basica: 17, estandar: 29, premium: 23, ecomm: 34, directa: 34, mayoreo: 47, modelos: 85, utilidad: 9200, acumulado: 39260 },
  { mes: 'Mes 9', ventas: 132, publicitaria: 13, eco: 20, ecoForro: 20, basica: 20, estandar: 33, premium: 26, ecomm: 40, directa: 40, mayoreo: 52, modelos: 92, utilidad: 10560, acumulado: 49820 },
  { mes: 'Mes 10', ventas: 150, publicitaria: 15, eco: 22, ecoForro: 23, basica: 22, estandar: 38, premium: 30, ecomm: 45, directa: 45, mayoreo: 60, modelos: 100, utilidad: 12000, acumulado: 61820 },
];

// Productos - 6 líneas (Publicitaria, Eco, Eco+Forro, Básica, Estándar, Premium)
const productos = {
  eco: {
    nombre: 'ECO',
    icon: '💎',
    descripcion: 'Loneta 2.40m • 1 Bolsillo • Biodegradable',
    material: 'Loneta 100% Algodón (2.40m ancho)',
    especificaciones: {
      dimensiones: '35 x 40 cm',
      exterior: 'Loneta 2.40m ancho (2 bolsas/corte)',
      forro: 'Sin forro',
      bolsillos: '1 bolsillo frontal',
      acabado: 'Costuras estéticas de calidad'
    },
    costos: {
      loneta: 17,
      forro: 0,
      maquila: 10,
      insumos: 2,
      merma: 1.45
    },
    costoTotal: 30,
    precioPublico: 80,
    precioMayoreo: 55,
    utilidadPublica: 50,
    utilidadMayoreo: 23,
    margenPublico: 167,
    margenMayoreo: 72,
    color: '#16A085',
    colorLight: '#D5F5E3',
    target: 'Volumen masivo, eventos, gobierno, supermercados',
    ventajaEspecial: 'Loneta 2.40m = 51% ahorro vs básica',
    escenarios: [
      { nombre: 'Conservador', precio: 60, pvp: 85, volMin: 50 },
      { nombre: 'Equilibrado', precio: 55, pvp: 80, volMin: 100, recomendado: true },
      { nombre: 'Agresivo', precio: 50, pvp: 75, volMin: 200 },
      { nombre: 'Ultra-agresivo', precio: 45, pvp: 70, volMin: 500 },
      { nombre: 'Volumen extremo', precio: 40, pvp: 60, volMin: 1000 },
    ],
    volumenes: [
      { qty: 100, descuento: 0, tipo: 'Mayorista inicial' },
      { qty: 200, descuento: 0.05, tipo: 'Mayorista estándar' },
      { qty: 500, descuento: 0.09, tipo: 'Mayorista frecuente' },
      { qty: 1000, descuento: 0.14, tipo: 'Distribuidor' },
      { qty: 2000, descuento: 0.18, tipo: 'Distribuidor grande' },
      { qty: 5000, descuento: 0.22, tipo: 'Distribuidor Premium' },
    ],
    casos: [
      { uso: 'Eventos masivos', volumen: '500-2000 pzas', precio: '$45-50' },
      { uso: 'Campañas gobierno', volumen: '1000-5000 pzas', precio: '$40-45' },
      { uso: 'Supermercados', volumen: '2000-10000 pzas', precio: '$40-43' },
      { uso: 'Empresas AAA', volumen: '500-1000 pzas', precio: '$50-55' },
      { uso: 'Franquicias', volumen: '1000+ pzas', precio: '$45-50' },
      { uso: 'Exportación', volumen: '5000+ pzas', precio: '$40-42' },
    ],
    promociones: [
      { nombre: 'Promo 2x$139', precioUnit: 69.5, ahorro: '13%' },
      { nombre: 'Promo 3x$199', precioUnit: 66.33, ahorro: '17%' },
      { nombre: 'E-commerce $79', precioUnit: 79, ahorro: '1%' },
    ]
  },
  ecoForro: {
    nombre: 'ECO+FORRO',
    icon: '💠',
    descripcion: 'Loneta 2.40m • Forro Manta • Mejor Acabado',
    material: 'Loneta 100% Algodón + Forro Manta',
    especificaciones: {
      dimensiones: '35 x 40 cm',
      exterior: 'Loneta 2.40m ancho (2 bolsas/corte)',
      forro: 'Manta económica (0.20m)',
      bolsillos: '1 bolsillo frontal',
      acabado: 'Interior forrado, costuras ocultas'
    },
    costos: {
      loneta: 17,
      forro: 5,
      maquila: 12,
      insumos: 2,
      merma: 1.8
    },
    costoTotal: 38,
    precioPublico: 99,
    precioMayoreo: 65,
    utilidadPublica: 59,
    utilidadMayoreo: 25,
    margenPublico: 148,
    margenMayoreo: 63,
    color: '#1ABC9C',
    colorLight: '#D1F2EB',
    target: 'Balance eco-calidad, cliente que busca mejor acabado',
    ventajaEspecial: 'Forro por solo +$8 vs ECO básica',
    escenarios: [
      { nombre: 'Conservador', precio: 70, pvp: 105, volMin: 50 },
      { nombre: 'Equilibrado', precio: 65, pvp: 99, volMin: 100, recomendado: true },
      { nombre: 'Agresivo', precio: 60, pvp: 89, volMin: 200 },
      { nombre: 'Ultra-agresivo', precio: 55, pvp: 79, volMin: 500 },
    ],
    volumenes: [
      { qty: 100, descuento: 0, tipo: 'Mayorista inicial' },
      { qty: 200, descuento: 0.05, tipo: 'Mayorista estándar' },
      { qty: 500, descuento: 0.08, tipo: 'Mayorista frecuente' },
      { qty: 1000, descuento: 0.12, tipo: 'Distribuidor' },
      { qty: 2000, descuento: 0.15, tipo: 'Distribuidor grande' },
    ],
    casos: [
      { uso: 'Eventos premium', volumen: '200-500 pzas', precio: '$60-65' },
      { uso: 'Tiendas boutique', volumen: '100-300 pzas', precio: '$65' },
      { uso: 'Regalos corporativos', volumen: '300-1000 pzas', precio: '$55-60' },
      { uso: 'E-commerce nacional', volumen: '100+ pzas', precio: '$65' },
    ],
    promociones: [
      { nombre: 'Promo 2x$179', precioUnit: 89.5, ahorro: '10%' },
      { nombre: 'E-commerce $99', precioUnit: 99, ahorro: '0%' },
      { nombre: 'Pack 3x$269', precioUnit: 89.67, ahorro: '9%' },
    ]
  },
  basica: {
    nombre: 'BÁSICA',
    icon: '🛍️',
    descripcion: 'Solo Loneta • Sin Forro • Promocional',
    material: 'Loneta 100% Algodón',
    especificaciones: {
      dimensiones: '35 x 40 cm',
      exterior: 'Loneta 100% algodón estampada (0.50m)',
      forro: 'Sin forro',
      bolsillos: 'Sin bolsillos',
      acabado: 'Costuras reforzadas'
    },
    costos: {
      loneta: 34.5,
      forro: 0,
      maquila: 12,
      insumos: 2,
      merma: 2.5
    },
    costoTotal: 51,
    precioPublico: 120,
    precioMayoreo: 85,
    utilidadPublica: 69,
    utilidadMayoreo: 34,
    margenPublico: 135,
    margenMayoreo: 67,
    color: '#E67E22',
    colorLight: '#FDEBD0',
    target: 'Volumen alto, eventos, promocionales',
    escenarios: [
      { nombre: 'Conservador', precio: 95, pvp: 130, volMin: 30 },
      { nombre: 'Equilibrado', precio: 85, pvp: 120, volMin: 50, recomendado: true },
      { nombre: 'Agresivo', precio: 75, pvp: 110, volMin: 100 },
      { nombre: 'Ultra-agresivo', precio: 70, pvp: 100, volMin: 200 },
      { nombre: 'Volumen extremo', precio: 65, pvp: 90, volMin: 500 },
    ],
    volumenes: [
      { qty: 50, descuento: 0, tipo: 'Mayorista inicial' },
      { qty: 100, descuento: 0.06, tipo: 'Mayorista estándar' },
      { qty: 200, descuento: 0.09, tipo: 'Mayorista frecuente' },
      { qty: 500, descuento: 0.12, tipo: 'Distribuidor' },
      { qty: 1000, descuento: 0.15, tipo: 'Distribuidor grande' },
    ],
    casos: [
      { uso: 'Eventos corporativos', volumen: '100-500 pzas', precio: '$75-85' },
      { uso: 'Promocionales empresa', volumen: '200-1000 pzas', precio: '$70-80' },
      { uso: 'Escuelas/Universidades', volumen: '100-300 pzas', precio: '$80-85' },
      { uso: 'Supermercados eco', volumen: '500-2000 pzas', precio: '$65-70' },
    ]
  },
  estandar: {
    nombre: 'ESTÁNDAR',
    icon: '👜',
    descripcion: 'Loneta + Forro Económico • 2 Bolsillos',
    material: 'Loneta + Forro Económico',
    especificaciones: {
      dimensiones: '35 x 40 cm',
      exterior: 'Loneta 100% algodón estampada (0.50m)',
      forro: 'Tela económica (popelina/manta delgada)',
      bolsillos: '2 bolsillos laterales abiertos',
      acabado: 'Costuras reforzadas'
    },
    costos: {
      loneta: 34.5,
      forro: 5.25,
      maquila: 16,
      insumos: 2.5,
      merma: 2.75
    },
    costoTotal: 61,
    precioPublico: 180,
    precioMayoreo: 120,
    utilidadPublica: 119,
    utilidadMayoreo: 59,
    margenPublico: 195,
    margenMayoreo: 97,
    color: '#2980B9',
    colorLight: '#D6EAF8',
    target: 'Balance precio/calidad, cliente recurrente',
    escenarios: [
      { nombre: 'Conservador', precio: 130, pvp: 180, volMin: 20 },
      { nombre: 'Equilibrado', precio: 120, pvp: 170, volMin: 30, recomendado: true },
      { nombre: 'Agresivo', precio: 110, pvp: 160, volMin: 50 },
      { nombre: 'Ultra-agresivo', precio: 100, pvp: 150, volMin: 100 },
    ],
    volumenes: [
      { qty: 20, descuento: 0, tipo: 'Mayorista inicial' },
      { qty: 30, descuento: 0.025, tipo: 'Mayorista estándar' },
      { qty: 50, descuento: 0.05, tipo: 'Mayorista frecuente' },
      { qty: 100, descuento: 0.08, tipo: 'Distribuidor' },
      { qty: 200, descuento: 0.10, tipo: 'Distribuidor Plus' },
    ],
    casos: [
      { uso: 'Tiendas boutique', volumen: '30-100 pzas', precio: '$115-120' },
      { uso: 'Regalos corporativos', volumen: '50-200 pzas', precio: '$110-115' },
      { uso: 'Mercados artesanales', volumen: '20-50 pzas', precio: '$120' },
    ]
  },
  premium: {
    nombre: 'PREMIUM',
    icon: '👛',
    descripcion: 'Loneta + Manta Teñida • 2 Bolsillos • Artesanal',
    material: 'Loneta + Forro Manta Teñida',
    especificaciones: {
      dimensiones: '35 x 40 cm',
      exterior: 'Loneta 100% algodón estampada (0.55m)',
      forro: 'Manta teñida artesanal (0.45m)',
      bolsillos: '2 bolsillos laterales',
      acabado: 'Confección elaborada premium'
    },
    costos: {
      loneta: 37.95,
      forro: 18.9,
      maquila: 18,
      insumos: 3,
      merma: 4.15
    },
    costoTotal: 82,
    precioPublico: 250,
    precioMayoreo: 165,
    utilidadPublica: 168,
    utilidadMayoreo: 80,
    margenPublico: 205,
    margenMayoreo: 98,
    color: '#8E44AD',
    colorLight: '#E8DAEF',
    target: 'Máxima calidad, regalo, cliente exigente',
    escenarios: [
      { nombre: 'Conservador', precio: 180, pvp: 250, volMin: 20 },
      { nombre: 'Equilibrado', precio: 165, pvp: 240, volMin: 30, recomendado: true },
      { nombre: 'Agresivo', precio: 150, pvp: 220, volMin: 50 },
      { nombre: 'Ultra-agresivo', precio: 140, pvp: 200, volMin: 100 },
    ],
    volumenes: [
      { qty: 20, descuento: 0, tipo: 'Mayorista inicial' },
      { qty: 30, descuento: 0.03, tipo: 'Mayorista estándar' },
      { qty: 50, descuento: 0.05, tipo: 'Mayorista frecuente' },
      { qty: 100, descuento: 0.08, tipo: 'Distribuidor' },
      { qty: 200, descuento: 0.10, tipo: 'Distribuidor Plus' },
    ],
    casos: [
      { uso: 'Boutiques premium', volumen: '20-50 pzas', precio: '$165' },
      { uso: 'Regalos ejecutivos', volumen: '30-100 pzas', precio: '$160-165' },
      { uso: 'Tiendas eco-luxury', volumen: '50-100 pzas', precio: '$150-160' },
    ]
  },
  publicitaria: {
    nombre: 'PUBLICITARIA',
    icon: '📢',
    descripcion: 'Manta Cruda • Serigrafía • Ultra Económica',
    material: 'Manta 160g 100% Algodón',
    especificaciones: {
      dimensiones: '35 x 40 cm',
      exterior: 'Manta cruda 160g (1.80m ancho = 4 bolsas/m)',
      forro: 'Sin forro',
      bolsillos: 'Sin bolsillos',
      acabado: 'Costuras simples, ideal para serigrafía'
    },
    costos: {
      manta: 6.25,
      forro: 0,
      maquila: 6,
      insumos: 1.5,
      merma: 0.69,
      serigrafia1: 5
    },
    costoTotal: 20,
    precioPublico: 45,
    precioMayoreo: 30,
    utilidadPublica: 25,
    utilidadMayoreo: 10,
    margenPublico: 125,
    margenMayoreo: 50,
    color: '#95A5A6',
    colorLight: '#F2F3F4',
    target: 'Eventos masivos, campañas, promocionales corporativos',
    ventajaEspecial: 'Manta 1.80m = 4 bolsas/metro, costo ultra bajo',
    escenarios: [
      { nombre: 'Conservador', precio: 35, pvp: 50, volMin: 100 },
      { nombre: 'Equilibrado', precio: 30, pvp: 45, volMin: 200, recomendado: true },
      { nombre: 'Agresivo', precio: 25, pvp: 40, volMin: 500 },
      { nombre: 'Ultra-agresivo', precio: 22, pvp: 35, volMin: 1000 },
      { nombre: 'Volumen extremo', precio: 20, pvp: 30, volMin: 2000 },
    ],
    volumenes: [
      { qty: 100, descuento: 0, tipo: 'Mayorista inicial' },
      { qty: 200, descuento: 0.05, tipo: 'Mayorista estándar' },
      { qty: 500, descuento: 0.10, tipo: 'Mayorista frecuente' },
      { qty: 1000, descuento: 0.15, tipo: 'Distribuidor' },
      { qty: 2000, descuento: 0.20, tipo: 'Distribuidor grande' },
      { qty: 5000, descuento: 0.25, tipo: 'Distribuidor Premium' },
    ],
    casos: [
      { uso: 'Eventos masivos', volumen: '500-5000 pzas', precio: '$20-25' },
      { uso: 'Campañas gobierno', volumen: '1000-10000 pzas', precio: '$18-22' },
      { uso: 'Promocionales empresa', volumen: '200-1000 pzas', precio: '$25-30' },
      { uso: 'Ferias y exposiciones', volumen: '500-2000 pzas', precio: '$22-28' },
      { uso: 'Supermercados', volumen: '2000-10000 pzas', precio: '$18-22' },
      { uso: 'ONG / Fundaciones', volumen: '500-3000 pzas', precio: '$20-25' },
    ],
    promociones: [
      { nombre: 'Pack 10x$350', precioUnit: 35, ahorro: '22%' },
      { nombre: 'Pack 50x$1500', precioUnit: 30, ahorro: '33%' },
      { nombre: 'Mayoreo 100+ pzas', precioUnit: 28, ahorro: '38%' },
    ],
    personalizacion: {
      serigrafia1: { costo: '+$4-6/pza', minimo: '100+', descripcion: '1 tinta' },
      serigrafia2: { costo: '+$7-9/pza', minimo: '100+', descripcion: '2 tintas' },
      serigrafia3: { costo: '+$10-12/pza', minimo: '100+', descripcion: '3 tintas' },
    }
  }
};

// E-commerce análisis
const ecommerceData = [
  { canal: 'ML Pack 2x$399', precio: 399, utilidad: 47, margen: 54, pros: 'Alto tráfico', contras: 'Comisiones altas' },
  { canal: 'ML $299', precio: 299, utilidad: 41, margen: 47, pros: 'Envío gratis cliente', contras: 'Margen bajo' },
  { canal: 'Amazon $299', precio: 299, utilidad: 57, margen: 65, pros: 'Mejor margen, Prime', contras: 'Más competencia' },
  { canal: 'Directa + Skydropx', precio: 220, utilidad: 62, margen: 71, pros: 'Control total', contras: 'Sin tráfico orgánico' },
  { canal: 'Directa + DiDi Local', precio: 250, utilidad: 118, margen: 136, pros: 'Máxima utilidad', contras: 'Solo Puebla' },
  { canal: 'Promo 2x$400 local', precio: 400, utilidad: 98, margen: 119, pros: 'Volumen + utilidad', contras: 'Requiere marketing' },
];

// Costos de envío
const costosEnvio = {
  local: [
    { servicio: 'DiDi Entrega Light', tarifa: 29, tiempo: 'Mismo día', nota: 'Más económico' },
    { servicio: 'Uber Flash Moto', tarifa: 38, tiempo: 'Mismo día', nota: 'Hasta 16 km' },
    { servicio: 'Uber Envíos (auto)', tarifa: 40, tiempo: 'Mismo día', nota: 'Paquetes grandes' },
    { servicio: 'Rappi Favores', tarifa: 45, tiempo: 'Mismo día', nota: 'Después de 4 km' },
  ],
  nacional: [
    { servicio: '99 Minutos', tarifa: 85, tiempo: 'Next Day', nota: 'Nacional' },
    { servicio: 'EnvíaTodo', tarifa: 63, tiempo: '3-5 días', nota: 'Mejor precio' },
    { servicio: 'EnvíaYa', tarifa: 73, tiempo: '3-5 días', nota: 'Sin mínimo' },
    { servicio: 'EnvíosPerros', tarifa: 85, tiempo: '3-5 días', nota: 'Fácil de usar' },
  ]
};

// Personalización
const personalizacion = [
  { tipo: 'Serigrafía 1 tinta', costo: '+$8-12/pza', minimo: '100+', ideal: 'Logo, texto simple' },
  { tipo: 'Serigrafía 2 tintas', costo: '+$15-18/pza', minimo: '100+', ideal: 'Diseños bicolor' },
  { tipo: 'Sublimación', costo: '+$20-25/pza', minimo: '50+', ideal: 'Full color, fotos' },
  { tipo: 'Bordado', costo: '+$25-35/pza', minimo: '50+', ideal: 'Look premium' },
  { tipo: 'Etiqueta personalizada', costo: '+$3-5/pza', minimo: '100+', ideal: 'Marca del cliente' },
];

// Tipos de diseños
const tiposDiseno = [
  {
    id: 'florales',
    nombre: 'Florales',
    icon: '🌸',
    descripcion: 'Patrones botánicos, flores silvestres, jardines',
    popularidad: 95,
    temporada: 'Primavera/Verano',
    target: 'Mujeres 25-45 años',
    ejemplos: ['Rosas vintage', 'Flores silvestres', 'Hojas tropicales', 'Jardín inglés'],
    colores: ['Rosa pastel', 'Verde sage', 'Terracota', 'Crema'],
    tendencia: 'alta'
  },
  {
    id: 'geometricos',
    nombre: 'Geométricos',
    icon: '◆',
    descripcion: 'Líneas, formas abstractas, patrones repetitivos',
    popularidad: 80,
    temporada: 'Todo el año',
    target: 'Unisex, millennials',
    ejemplos: ['Líneas minimalistas', 'Azteca moderno', 'Art deco', 'Bauhaus'],
    colores: ['Negro/Blanco', 'Mostaza', 'Azul marino', 'Terracota'],
    tendencia: 'media'
  },
  {
    id: 'artisticos',
    nombre: 'Artísticos',
    icon: '🎨',
    descripcion: 'Ilustraciones, arte original, pinturas',
    popularidad: 85,
    temporada: 'Todo el año',
    target: 'Creativos, artistas',
    ejemplos: ['Acuarelas', 'Ilustración botánica', 'Retratos', 'Arte abstracto'],
    colores: ['Multicolor', 'Tonos tierra', 'Pasteles'],
    tendencia: 'alta'
  },
  {
    id: 'lettering',
    nombre: 'Lettering/Frases',
    icon: '✎',
    descripcion: 'Tipografía, frases motivacionales, quotes',
    popularidad: 75,
    temporada: 'Todo el año',
    target: 'Jóvenes 18-35',
    ejemplos: ['Frases positivas', 'Nombres propios', 'Ciudades', 'Fechas especiales'],
    colores: ['Negro sobre natural', 'Dorado', 'Rosa gold'],
    tendencia: 'media'
  },
  {
    id: 'animales',
    nombre: 'Animales',
    icon: '🦋',
    descripcion: 'Fauna, mascotas, criaturas ilustradas',
    popularidad: 70,
    temporada: 'Todo el año',
    target: 'Amantes de animales',
    ejemplos: ['Gatos', 'Perros', 'Mariposas', 'Aves', 'Animales mexicanos'],
    colores: ['Natural', 'Colores vivos', 'Tonos tierra'],
    tendencia: 'media'
  },
  {
    id: 'mexicano',
    nombre: 'Mexicano/Artesanal',
    icon: '🇲🇽',
    descripcion: 'Cultura mexicana, bordados, tradiciones',
    popularidad: 90,
    temporada: 'Todo el año (pico en Sept)',
    target: 'Turistas, mexicanos orgullosos',
    ejemplos: ['Otomí', 'Talavera', 'Día de muertos', 'Alebrije', 'Tenango'],
    colores: ['Multicolor vibrante', 'Rojo/Verde', 'Azul talavera'],
    tendencia: 'alta'
  },
  {
    id: 'minimalista',
    nombre: 'Minimalista',
    icon: '○',
    descripcion: 'Diseños simples, elegantes, menos es más',
    popularidad: 88,
    temporada: 'Todo el año',
    target: 'Profesionales, estilo clean',
    ejemplos: ['Una línea', 'Punto focal', 'Logo discreto', 'Textura sutil'],
    colores: ['Crudo natural', 'Negro', 'Gris', 'Beige'],
    tendencia: 'alta'
  },
  {
    id: 'vintage',
    nombre: 'Vintage/Retro',
    icon: '📻',
    descripcion: 'Estética nostálgica, décadas pasadas',
    popularidad: 72,
    temporada: 'Otoño/Invierno',
    target: 'Hipsters, nostálgicos',
    ejemplos: ['70s groovy', 'Art nouveau', 'Publicidad retro', 'Mapas antiguos'],
    colores: ['Mostaza', 'Naranja quemado', 'Verde olivo', 'Marrón'],
    tendencia: 'media'
  }
];

// Colecciones de modelos
const colecciones = [
  {
    nombre: 'Primavera Botánica',
    temporada: 'Primavera 2024',
    modelos: 12,
    diseños: ['Flores silvestres', 'Hojas monstera', 'Jardín secreto', 'Rosas vintage'],
    lineas: ['Estándar', 'Premium'],
    estado: 'activa',
    ventas: 145,
    rating: 4.8
  },
  {
    nombre: 'Puebla Artesanal',
    temporada: 'Todo el año',
    modelos: 15,
    diseños: ['Talavera azul', 'Bordado Otomí', 'Catrina elegante', 'Tenango colorido'],
    lineas: ['Básica', 'Estándar', 'Premium'],
    estado: 'activa',
    ventas: 230,
    rating: 4.9
  },
  {
    nombre: 'Minimal Chic',
    temporada: 'Todo el año',
    modelos: 8,
    diseños: ['Línea continua', 'Monograma', 'Geometric black', 'Pure cotton'],
    lineas: ['Estándar', 'Premium'],
    estado: 'activa',
    ventas: 180,
    rating: 4.7
  },
  {
    nombre: 'Verano Tropical',
    temporada: 'Verano 2024',
    modelos: 10,
    diseños: ['Palmeras', 'Tucanes', 'Frutas tropicales', 'Atardecer playa'],
    lineas: ['Básica', 'Estándar'],
    estado: 'próxima',
    ventas: 0,
    rating: 0
  },
  {
    nombre: 'Edición Corporativa',
    temporada: 'Todo el año',
    modelos: 5,
    diseños: ['Logo empresa', 'Colores corporativos', 'Evento especial'],
    lineas: ['Básica'],
    estado: 'activa',
    ventas: 320,
    rating: 4.6
  }
];

// Roadmap de modelos por mes
const roadmapModelos = [
  { mes: 'Mes 1', nuevos: 15, acumulado: 15, coleccion: 'Lanzamiento inicial' },
  { mes: 'Mes 2', nuevos: 10, acumulado: 25, coleccion: 'Puebla Artesanal' },
  { mes: 'Mes 3', nuevos: 10, acumulado: 35, coleccion: 'Primavera Botánica' },
  { mes: 'Mes 4', nuevos: 10, acumulado: 45, coleccion: 'Minimal Chic' },
  { mes: 'Mes 5', nuevos: 10, acumulado: 55, coleccion: 'Ampliación florales' },
  { mes: 'Mes 6', nuevos: 10, acumulado: 65, coleccion: 'Verano Tropical' },
  { mes: 'Mes 7', nuevos: 10, acumulado: 75, coleccion: 'Ediciones especiales' },
  { mes: 'Mes 8', nuevos: 10, acumulado: 85, coleccion: 'Día de Muertos' },
  { mes: 'Mes 9', nuevos: 7, acumulado: 92, coleccion: 'Navidad/Fiestas' },
  { mes: 'Mes 10', nuevos: 8, acumulado: 100, coleccion: 'Consolidación catálogo' },
];

// Paleta de colores fashion
const colors = {
  cream: '#F5F0E8',
  sand: '#E8DFD0',
  camel: '#C9A96E',
  espresso: '#4A3728',
  sidebarBg: '#005F84',
  sidebarText: '#ABD55E',
  olive: '#6B7B5E',
  gold: '#B8954F',
  cotton: '#F8F4EF',
  terracotta: '#C4784A',
  sage: '#9CAF88',
  linen: '#EDE6DB',
};

// ==================== COMPONENTES ====================

// Sidebar responsive
const Sidebar = ({ seccionActiva, setSeccionActiva, menuAbierto, setMenuAbierto, isMobile }) => {
  const secciones = [
    { id: 'dashboard', nombre: 'Dashboard', icon: '📊' },
    { id: 'productos', nombre: 'Productos', icon: '🛍️' },
    { id: 'mayoreo', nombre: 'Mayoreo', icon: '📦' },
    { id: 'ecommerce', nombre: 'E-commerce', icon: '🛒' },
    { id: 'promociones', nombre: 'Promociones', icon: '🎉' },
    { id: 'costos', nombre: 'Costos', icon: '💰' },
  ];


  return (
    <>
      {/* Overlay para cerrar en móvil */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
            display: isMobile ? 'block' : 'none'
          }}
        />
      )}

      <div style={{
        width: '220px',
        minHeight: '100vh',
        background: colors.sidebarBg,
        padding: '20px 0',
        position: 'fixed',
        left: menuAbierto || !isMobile ? 0 : '-220px',
        top: 0,
        zIndex: 100,
        transition: 'left 0.3s ease'
      }}>
        {/* Botón cerrar en móvil */}
        <button
          onClick={() => setMenuAbierto(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            color: colors.sidebarText,
            fontSize: '24px',
            cursor: 'pointer',
            display: isMobile ? 'block' : 'none'
          }}
        >
          ✕
        </button>

        <div style={{ padding: '0 20px 30px', borderBottom: `1px solid ${colors.camel}40` }}>
          <div style={{ fontSize: '11px', letterSpacing: '3px', color: colors.sidebarText, marginBottom: '5px' }}>
            TOTE BAG
          </div>
          <div style={{ fontSize: '20px', fontWeight: '300', color: colors.sidebarText, letterSpacing: '2px' }}>
            DASHBOARD
          </div>
        </div>

        <nav style={{ marginTop: '20px' }}>
          {secciones.map(sec => (
            <div
              key={sec.id}
              onClick={() => {
                setSeccionActiva(sec.id);
                if (isMobile) setMenuAbierto(false);
              }}
              style={{
                padding: '15px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: seccionActiva === sec.id ? colors.sidebarText : 'transparent',
                borderLeft: seccionActiva === sec.id ? `3px solid ${colors.sidebarText}` : '3px solid transparent',
                transition: 'all 0.2s',
                color: seccionActiva === sec.id ? colors.sidebarBg : colors.sidebarText
              }}
            >
              <span style={{ fontSize: '20px' }}>{sec.icon}</span>
              <span style={{ fontSize: '14px', letterSpacing: '1px' }}>{sec.nombre}</span>
            </div>
          ))}
        </nav>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          fontSize: '10px',
          color: colors.camel,
          textAlign: 'center'
        }}>
          Hecho a mano en Puebla
        </div>
      </div>
    </>
  );
};

// Vista Dashboard Principal
const DashboardView = ({ productosActualizados }) => {
  const productosUsar = productosActualizados || productos;
  const totalVentas = proyeccionData.reduce((sum, d) => sum + d.ventas, 0);
  const totalUtilidad = proyeccionData[9].acumulado;
  const roi = ((totalUtilidad - 15000) / 15000 * 100).toFixed(1);

  return (
    <div>
      <h2 style={{ margin: '0 0 25px', fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
        Proyección de Crecimiento — 10 Meses
      </h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {[
          { label: 'Total Ventas', value: `${totalVentas} pzas`, color: colors.camel },
          { label: 'Utilidad Total', value: `$${totalUtilidad.toLocaleString()}`, color: colors.olive },
          { label: 'Promedio/Mes', value: `$${Math.round(totalUtilidad/10).toLocaleString()}`, color: colors.terracotta },
          { label: 'ROI', value: `${roi}%`, color: colors.gold },
          { label: 'Modelos Meta', value: '100', color: colors.sage },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: colors.cotton,
            border: `1px solid ${colors.sand}`,
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: '500', color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: '10px', color: colors.camel, marginTop: '5px', letterSpacing: '1px', textTransform: 'uppercase' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>VENTAS POR LÍNEA DE PRODUCTO</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={proyeccionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke={colors.camel} />
              <YAxis stroke={colors.camel} />
              <Tooltip contentStyle={{ background: colors.cotton, border: `1px solid ${colors.camel}` }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="publicitaria" stackId="a" fill={productos.publicitaria.color} name="Publicitaria 10%" />
              <Bar dataKey="eco" stackId="a" fill={productos.eco.color} name="Eco 15%" />
              <Bar dataKey="ecoForro" stackId="a" fill={productos.ecoForro.color} name="Eco+Forro 15%" />
              <Bar dataKey="basica" stackId="a" fill={productos.basica.color} name="Básica 15%" />
              <Bar dataKey="estandar" stackId="a" fill={productos.estandar.color} name="Estándar 25%" />
              <Bar dataKey="premium" stackId="a" fill={productos.premium.color} name="Premium 20%" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>UTILIDAD ACUMULADA</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={proyeccionData}>
              <defs>
                <linearGradient id="colorAcum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.gold} stopOpacity={0.7}/>
                  <stop offset="95%" stopColor={colors.cream} stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke={colors.camel} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke={colors.camel} />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Acumulado']} contentStyle={{ background: colors.cotton, border: `1px solid ${colors.gold}` }} />
              <Area type="monotone" dataKey="acumulado" stroke={colors.gold} fill="url(#colorAcum)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribución por canal */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>DISTRIBUCIÓN POR CANAL DE VENTA</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={proyeccionData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke={colors.camel} />
              <YAxis stroke={colors.camel} />
              <Tooltip contentStyle={{ background: colors.cotton, border: `1px solid ${colors.camel}` }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="ecomm" stackId="a" fill={colors.camel} name="E-commerce 30%" />
              <Bar dataKey="directa" stackId="a" fill={colors.olive} name="Directa 30%" />
              <Bar dataKey="mayoreo" stackId="a" fill={colors.terracotta} name="Mayoreo 40%" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>RESUMEN PRODUCTOS</h3>
          {Object.values(productos).map((p, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              background: i % 2 === 0 ? colors.cream : 'transparent',
              marginBottom: '5px'
            }}>
              <div>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>{p.icon}</span>
                <span style={{ fontSize: '13px', color: colors.espresso }}>{p.nombre}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: p.color }}>${p.precioPublico}</div>
                <div style={{ fontSize: '10px', color: colors.camel }}>Costo: ${p.costoTotal}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de proyección */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>PROYECCIÓN DETALLADA</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: colors.cream }}>
                {['Mes', 'Vtas', 'Eco', 'Eco+F', 'Bás', 'Std', 'Prem', 'E-com', 'Dir', 'May', 'Mod', 'Util', 'Acum'].map(h => (
                  <th key={h} style={{ padding: '8px 4px', textAlign: 'center', borderBottom: `2px solid ${colors.camel}`, fontSize: '8px', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proyeccionData.map((row, i) => (
                <tr key={i} style={{ background: i === 9 ? `${colors.gold}22` : i % 2 === 0 ? colors.cotton : colors.cream }}>
                  <td style={{ padding: '5px 3px', textAlign: 'center', fontWeight: i === 9 ? '700' : '400', fontSize: '10px' }}>{row.mes}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', fontWeight: '600', fontSize: '10px' }}>{row.ventas}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: productos.eco.color, fontSize: '10px' }}>{row.eco}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: productos.ecoForro.color, fontSize: '10px' }}>{row.ecoForro}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: productos.basica.color, fontSize: '10px' }}>{row.basica}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: productos.estandar.color, fontSize: '10px' }}>{row.estandar}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: productos.premium.color, fontSize: '10px' }}>{row.premium}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', fontSize: '10px' }}>{row.ecomm}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', fontSize: '10px' }}>{row.directa}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', fontSize: '10px' }}>{row.mayoreo}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: colors.sage, fontSize: '10px' }}>{row.modelos}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: colors.olive, fontSize: '10px' }}>${row.utilidad.toLocaleString()}</td>
                  <td style={{ padding: '5px 3px', textAlign: 'center', color: colors.gold, fontWeight: '600', fontSize: '10px' }}>${row.acumulado.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Vista Productos
const ProductosView = () => {
  const [hoverAgregar, setHoverAgregar] = useState(false);
  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [lineasProducto, setLineasProducto] = useState([
    { id: 'publicitaria-sencilla', nombre: 'Publicitaria Sencilla', medidas: '35 x 40', modelos: [] },
    { id: 'publicitaria-bolsa-lateral', nombre: 'Publicitaria Bolsa Lateral', medidas: '35 x 40', modelos: [] }
  ]);
  const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
  const [mostrarAgregarLinea, setMostrarAgregarLinea] = useState(false);
  const [nuevaLinea, setNuevaLinea] = useState({ nombre: '', medidas: '' });
  const [hoverItems, setHoverItems] = useState({});

  // Estado para anchos de tela disponibles (editables)
  const [anchosTela, setAnchosTela] = useState([
    { id: 1, nombre: 'Manta cruda (básica)', ancho: 1.80, precio: 25.00 },
    { id: 2, nombre: 'Manta teñida (forro)', ancho: 1.60, precio: 42.00 },
    { id: 3, nombre: 'Loneta estampada', ancho: 1.60, precio: 69.00 },
    { id: 4, nombre: 'Loneta estampada (ancha)', ancho: 2.50, precio: 69.00 }
  ]);
  const [editandoAnchos, setEditandoAnchos] = useState(false);

  // Estado del formulario de producto
  const [formProducto, setFormProducto] = useState({
    descripcion: '',
    telaSeleccionada: null,
    cantidadTela: 0,
    piezasPorCorte: 1,
    costoMaquila: 0,
    insumos: 0,
    merma: 5,
    serigrafia1: 0,
    serigrafia2: 0,
    serigrafia3: 0,
    empaqueLogistica: 0
  });

  // Cálculos automáticos
  const calcularCostos = () => {
    const tela = anchosTela.find(t => t.id === formProducto.telaSeleccionada);
    const costoTela = tela ? (tela.precio * formProducto.cantidadTela) / formProducto.piezasPorCorte : 0;
    const subtotal = costoTela + formProducto.costoMaquila + formProducto.insumos;
    const conMerma = subtotal * (1 + formProducto.merma / 100);
    const base = conMerma + formProducto.empaqueLogistica;

    return {
      costoTela: costoTela.toFixed(2),
      subtotal: subtotal.toFixed(2),
      conMerma: conMerma.toFixed(2),
      total1Tinta: (base + formProducto.serigrafia1).toFixed(2),
      total2Tintas: (base + formProducto.serigrafia2).toFixed(2),
      total3Tintas: (base + formProducto.serigrafia3).toFixed(2)
    };
  };

  const costos = calcularCostos();

  const agregarLineaProducto = () => {
    if (nuevaLinea.nombre.trim()) {
      const id = nuevaLinea.nombre.toLowerCase().replace(/\s+/g, '-');
      setLineasProducto([...lineasProducto, { id, nombre: nuevaLinea.nombre, medidas: nuevaLinea.medidas, modelos: [] }]);
      setNuevaLinea({ nombre: '', medidas: '' });
      setMostrarAgregarLinea(false);
    }
  };

  const seleccionarLinea = (linea) => {
    setLineaSeleccionada(linea);
    setMostrarPopup(false);
    setFormProducto({
      descripcion: '',
      telaSeleccionada: anchosTela[0]?.id || null,
      cantidadTela: 0,
      piezasPorCorte: 1,
      costoMaquila: 0,
      insumos: 0,
      merma: 5,
      serigrafia1: 0,
      serigrafia2: 0,
      serigrafia3: 0,
      empaqueLogistica: 0
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${colors.sand}`,
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: colors.cream
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: colors.espresso
  };

  const sectionStyle = {
    background: colors.cream,
    border: `1px solid ${colors.sand}`,
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  };

  return (
    <div>
      {/* Header con título y botón agregar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
          Productos
        </h2>
        <button
          onClick={() => setMostrarPopup(true)}
          onMouseEnter={() => setHoverAgregar(true)}
          onMouseLeave={() => setHoverAgregar(false)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            background: hoverAgregar ? colors.sidebarText : colors.sidebarBg,
            color: hoverAgregar ? colors.sidebarBg : colors.sidebarText,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '1px'
          }}
        >
          + Agregar
        </button>
      </div>

      {/* Popup para seleccionar línea de producto */}
      {mostrarPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: colors.cotton, borderRadius: '12px', padding: '30px',
            maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h3 style={{ margin: 0, color: colors.espresso, fontSize: '20px', fontWeight: '500' }}>
                Seleccionar Línea de Producto
              </h3>
              <button onClick={() => setMostrarPopup(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.camel, padding: '5px' }}>
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {lineasProducto.map((linea) => (
                <div key={linea.id} onClick={() => seleccionarLinea(linea)}
                  onMouseEnter={() => setHoverItems({ ...hoverItems, [linea.id]: true })}
                  onMouseLeave={() => setHoverItems({ ...hoverItems, [linea.id]: false })}
                  style={{
                    padding: '18px 20px',
                    background: hoverItems[linea.id] ? colors.sidebarBg : colors.cream,
                    color: hoverItems[linea.id] ? colors.sidebarText : colors.espresso,
                    border: `2px solid ${hoverItems[linea.id] ? colors.sidebarBg : colors.sand}`,
                    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{linea.nombre}</div>
                    <div style={{ fontSize: '13px', marginTop: '4px', color: hoverItems[linea.id] ? 'rgba(171,213,94,0.8)' : colors.camel }}>
                      {linea.medidas}
                    </div>
                  </div>
                  <span style={{ fontSize: '20px' }}>🛍️</span>
                </div>
              ))}
            </div>

            {!mostrarAgregarLinea ? (
              <button onClick={() => setMostrarAgregarLinea(true)}
                style={{ width: '100%', padding: '15px', background: 'transparent', border: `2px dashed ${colors.camel}`,
                  borderRadius: '8px', color: colors.camel, fontSize: '14px', cursor: 'pointer' }}>
                + Agregar Nueva Línea de Producto
              </button>
            ) : (
              <div style={{ padding: '20px', background: colors.cream, borderRadius: '8px', border: `2px solid ${colors.sand}` }}>
                <input type="text" placeholder="Nombre de la línea" value={nuevaLinea.nombre}
                  onChange={(e) => setNuevaLinea({ ...nuevaLinea, nombre: e.target.value })}
                  style={{ ...inputStyle, marginBottom: '10px' }} />
                <input type="text" placeholder="Medidas (ej: 35 x 40)" value={nuevaLinea.medidas}
                  onChange={(e) => setNuevaLinea({ ...nuevaLinea, medidas: e.target.value })}
                  style={{ ...inputStyle, marginBottom: '15px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={agregarLineaProducto}
                    style={{ flex: 1, padding: '12px', background: colors.sidebarBg, color: colors.sidebarText,
                      border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                    Guardar
                  </button>
                  <button onClick={() => { setMostrarAgregarLinea(false); setNuevaLinea({ nombre: '', medidas: '' }); }}
                    style={{ flex: 1, padding: '12px', background: colors.sand, color: colors.espresso,
                      border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario de producto */}
      {lineaSeleccionada ? (
        <div style={{ background: colors.cotton, border: `1px solid ${colors.sand}`, padding: '30px', borderRadius: '8px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.espresso, fontSize: '20px' }}>{lineaSeleccionada.nombre}</h3>
              <p style={{ margin: '5px 0 0', color: colors.camel, fontSize: '14px' }}>{lineaSeleccionada.medidas}</p>
            </div>
            <button onClick={() => setLineaSeleccionada(null)}
              style={{ padding: '8px 16px', background: colors.sand, color: colors.espresso,
                border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
              Cancelar
            </button>
          </div>

          {/* 1. Descripción */}
          <div style={sectionStyle}>
            <label style={labelStyle}>1. Descripción del Producto</label>
            <textarea value={formProducto.descripcion}
              onChange={(e) => setFormProducto({ ...formProducto, descripcion: e.target.value })}
              placeholder="Describe las características del producto..."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>

          {/* 2. Parámetros de Producción */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ ...labelStyle, margin: 0, fontSize: '15px' }}>2. Parámetros de Producción</label>
              <button onClick={() => setEditandoAnchos(!editandoAnchos)}
                style={{ padding: '6px 12px', background: editandoAnchos ? colors.sidebarBg : colors.sand,
                  color: editandoAnchos ? colors.sidebarText : colors.espresso,
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                {editandoAnchos ? 'Cerrar Editor' : 'Editar Telas'}
              </button>
            </div>

            {/* Editor de anchos de tela */}
            {editandoAnchos && (
              <div style={{ background: colors.cotton, border: `1px dashed ${colors.camel}`, borderRadius: '6px', padding: '15px', marginBottom: '15px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: colors.espresso, marginBottom: '10px' }}>
                  Anchos de Tela Disponibles
                </div>
                {anchosTela.map((tela, idx) => (
                  <div key={tela.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '8px', marginBottom: '8px' }}>
                    <input type="text" value={tela.nombre}
                      onChange={(e) => {
                        const nuevo = [...anchosTela];
                        nuevo[idx].nombre = e.target.value;
                        setAnchosTela(nuevo);
                      }}
                      style={{ ...inputStyle, padding: '8px' }} />
                    <input type="number" value={tela.ancho} step="0.1"
                      onChange={(e) => {
                        const nuevo = [...anchosTela];
                        nuevo[idx].ancho = parseFloat(e.target.value) || 0;
                        setAnchosTela(nuevo);
                      }}
                      style={{ ...inputStyle, padding: '8px', textAlign: 'center' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: colors.camel }}>$</span>
                      <input type="number" value={tela.precio} step="0.5"
                        onChange={(e) => {
                          const nuevo = [...anchosTela];
                          nuevo[idx].precio = parseFloat(e.target.value) || 0;
                          setAnchosTela(nuevo);
                        }}
                        style={{ ...inputStyle, padding: '8px', flex: 1 }} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: '11px', color: colors.camel, marginTop: '5px' }}>
                  Nombre | Ancho (m) | Precio/m
                </div>
              </div>
            )}

            {/* Selector de tela */}
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Tipo de Tela (base de precio)</label>
              <select value={formProducto.telaSeleccionada || ''}
                onChange={(e) => setFormProducto({ ...formProducto, telaSeleccionada: parseInt(e.target.value) })}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Seleccionar tela...</option>
                {anchosTela.map(tela => (
                  <option key={tela.id} value={tela.id}>
                    {tela.nombre} — {tela.ancho}m — ${tela.precio.toFixed(2)}/m
                  </option>
                ))}
              </select>
            </div>

            {/* Grid de campos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <label style={labelStyle}>Cantidad de Tela (m)</label>
                <input type="number" value={formProducto.cantidadTela} step="0.1"
                  onChange={(e) => setFormProducto({ ...formProducto, cantidadTela: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Piezas por Corte</label>
                <input type="number" value={formProducto.piezasPorCorte} min="1"
                  onChange={(e) => setFormProducto({ ...formProducto, piezasPorCorte: parseInt(e.target.value) || 1 })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Costo Maquila (Corte + Confección)</label>
                <input type="number" value={formProducto.costoMaquila} step="0.5"
                  onChange={(e) => setFormProducto({ ...formProducto, costoMaquila: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Insumos (Hilo + Etiqueta)</label>
                <input type="number" value={formProducto.insumos} step="0.1"
                  onChange={(e) => setFormProducto({ ...formProducto, insumos: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Merma (%)</label>
                <input type="number" value={formProducto.merma} min="0" max="100"
                  onChange={(e) => setFormProducto({ ...formProducto, merma: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
            </div>
          </div>

          {/* 3. Serigrafía */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, fontSize: '15px', marginBottom: '15px' }}>3. Serigrafía</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
              <div>
                <label style={labelStyle}>1 Tinta ($)</label>
                <input type="number" value={formProducto.serigrafia1} step="0.5"
                  onChange={(e) => setFormProducto({ ...formProducto, serigrafia1: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>2 Tintas ($)</label>
                <input type="number" value={formProducto.serigrafia2} step="0.5"
                  onChange={(e) => setFormProducto({ ...formProducto, serigrafia2: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>3 Tintas ($)</label>
                <input type="number" value={formProducto.serigrafia3} step="0.5"
                  onChange={(e) => setFormProducto({ ...formProducto, serigrafia3: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
            </div>
          </div>

          {/* 4. Empaque + Logística */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, fontSize: '15px', marginBottom: '15px' }}>4. Empaque + Logística</label>
            <div style={{ maxWidth: '250px' }}>
              <label style={labelStyle}>Costo ($)</label>
              <input type="number" value={formProducto.empaqueLogistica} step="0.5"
                onChange={(e) => setFormProducto({ ...formProducto, empaqueLogistica: parseFloat(e.target.value) || 0 })}
                style={inputStyle} />
            </div>
          </div>

          {/* Resumen de Costos */}
          <div style={{ background: colors.sidebarBg, borderRadius: '8px', padding: '25px', color: colors.sidebarText }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', letterSpacing: '1px' }}>
              RESUMEN DE COSTOS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Costo Tela</div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>${costos.costoTela}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Subtotal (sin merma)</div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>${costos.subtotal}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px' }}>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>Con Merma ({formProducto.merma}%)</div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>${costos.conMerma}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div style={{ background: 'rgba(171,213,94,0.2)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>COSTO TOTAL (1 TINTA)</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '5px' }}>${costos.total1Tinta}</div>
                </div>
                <div style={{ background: 'rgba(171,213,94,0.3)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>COSTO TOTAL (2 TINTAS)</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '5px' }}>${costos.total2Tintas}</div>
                </div>
                <div style={{ background: 'rgba(171,213,94,0.4)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>COSTO TOTAL (3 TINTAS)</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '5px' }}>${costos.total3Tintas}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => setLineaSeleccionada(null)}
              style={{ padding: '12px 25px', background: colors.sand, color: colors.espresso,
                border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              Cancelar
            </button>
            <button style={{ padding: '12px 25px', background: colors.sidebarBg, color: colors.sidebarText,
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
              Guardar Producto
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: colors.cotton, border: `1px solid ${colors.sand}`, padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px' }}>🛍️</span>
          <h3 style={{ margin: '20px 0 10px', color: colors.espresso }}>Sin productos registrados</h3>
          <p style={{ color: colors.camel, fontSize: '14px' }}>Haz clic en "+ Agregar" para crear tu primer producto</p>
        </div>
      )}
    </div>
  );
};


// Vista Mayoreo
const MayoreoView = ({ productosActualizados, condicionesEco, condicionesEcoForro }) => {
  const [lineaActiva, setLineaActiva] = useState('estandar');
  const productosUsar = productosActualizados || productos;
  const linea = productosUsar[lineaActiva];

  // Obtener condiciones de envío según línea activa
  const condicionesActivas = lineaActiva === 'eco' ? condicionesEco :
                              lineaActiva === 'ecoForro' ? condicionesEcoForro : null;

  return (
    <div>
      <h2 style={{ margin: '0 0 25px', fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
        Precios Mayoreo — Escala por Volumen
      </h2>

      {/* Selector de línea */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        {Object.entries(productosUsar).map(([key, p]) => (
          <div
            key={key}
            onClick={() => setLineaActiva(key)}
            style={{
              background: lineaActiva === key ? p.colorLight : colors.cotton,
              border: `2px solid ${lineaActiva === key ? p.color : colors.sand}`,
              padding: '15px',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: '24px' }}>{p.icon}</span>
            <div style={{ fontSize: '14px', color: p.color, fontWeight: '600', marginTop: '5px' }}>{p.nombre}</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: colors.espresso, marginTop: '5px' }}>${p.precioMayoreo}</div>
            <div style={{ fontSize: '10px', color: colors.camel }}>precio mayoreo</div>
          </div>
        ))}
      </div>

      {/* Panel de condiciones de envío para líneas ECO */}
      {condicionesActivas && (
        <div style={{
          background: `linear-gradient(135deg, ${linea.colorLight} 0%, ${colors.cotton} 100%)`,
          border: `2px solid ${linea.color}`,
          padding: '20px',
          marginBottom: '25px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '24px' }}>🚚</span>
            <h3 style={{ margin: 0, fontSize: '14px', color: colors.espresso }}>
              ENVÍO GRATIS MAYOREO — {linea.nombre} (Precio actual: ${linea.precioMayoreo})
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
            <div style={{ background: colors.cotton, padding: '15px', textAlign: 'center', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: colors.camel }}>NACIONAL</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: colors.olive }}>
                {condicionesActivas.mayoreo.nacional.unidadesMin}+
              </div>
              <div style={{ fontSize: '11px', color: colors.espresso }}>pzas mínimo</div>
              <div style={{ fontSize: '10px', color: colors.camel, marginTop: '5px' }}>
                Envío ${condicionesActivas.mayoreo.nacional.costo} gratis
              </div>
            </div>
            <div style={{ background: colors.cotton, padding: '15px', textAlign: 'center', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: colors.camel }}>PUEBLA LOCAL</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: colors.terracotta }}>
                {condicionesActivas.mayoreo.local.unidadesMin}+
              </div>
              <div style={{ fontSize: '11px', color: colors.espresso }}>pzas mínimo</div>
              <div style={{ fontSize: '10px', color: colors.camel, marginTop: '5px' }}>
                Envío ${condicionesActivas.mayoreo.local.costo} gratis
              </div>
            </div>
            <div style={{ background: `${colors.gold}20`, padding: '15px', textAlign: 'center', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: colors.camel }}>MARGEN ACTUAL</div>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: condicionesActivas.esValidoMayoreo ? colors.olive : '#E74C3C'
              }}>
                {condicionesActivas.margenMayoreoActual}%
              </div>
              <div style={{ fontSize: '11px', color: colors.espresso }}>
                {condicionesActivas.esValidoMayoreo ? '✅ Válido' : '⚠️ Bajo 31%'}
              </div>
            </div>
            <div style={{ background: colors.cotton, padding: '15px', textAlign: 'center', borderRadius: '6px' }}>
              <div style={{ fontSize: '10px', color: colors.camel }}>UTILIDAD/PZA</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: colors.gold }}>
                ${condicionesActivas.utilidadMayoreo}
              </div>
              <div style={{ fontSize: '11px', color: colors.espresso }}>mayoreo</div>
            </div>
          </div>
        </div>
      )}

      {/* Escenarios de precio */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>
          ESCENARIOS DE PRECIO MAYOREO — {linea.nombre}
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: linea.colorLight }}>
              {['Escenario', 'Precio Mayoreo', 'Tu Utilidad', 'Tu Margen', 'PVP Sugerido', 'Ganancia Mayorista', 'Vol. Mínimo'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'center', borderBottom: `2px solid ${linea.color}`, fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linea.escenarios.map((esc, i) => (
              <tr key={i} style={{ background: esc.recomendado ? `${colors.olive}20` : i % 2 === 0 ? colors.cotton : colors.cream }}>
                <td style={{ padding: '10px', fontWeight: esc.recomendado ? '700' : '400' }}>
                  {esc.recomendado && '✅ '}{esc.nombre}
                </td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: linea.color }}>${esc.precio}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: colors.olive }}>${esc.precio - linea.costoTotal - 3}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{Math.round((esc.precio - linea.costoTotal - 3) / (linea.costoTotal + 3) * 100)}%</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>${esc.pvp}</td>
                <td style={{ padding: '10px', textAlign: 'center', color: colors.camel }}>${esc.pvp - esc.precio}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{esc.volMin}+ pzas</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Escala por volumen */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>
          DESCUENTOS POR VOLUMEN (Base: ${linea.precioMayoreo})
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: linea.colorLight }}>
              {['Cantidad', 'Descuento', 'Precio Unit', 'Tu Utilidad', 'Total Pedido', 'Utilidad Total', 'Tipo Cliente'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'center', borderBottom: `2px solid ${linea.color}`, fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linea.volumenes.map((vol, i) => {
              const precioUnit = linea.precioMayoreo * (1 - vol.descuento);
              const utilidad = precioUnit - linea.costoTotal - 3;
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>{vol.qty}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{(vol.descuento * 100).toFixed(1)}%</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: linea.color, fontWeight: '600' }}>${precioUnit.toFixed(0)}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: colors.olive, fontWeight: '600' }}>${utilidad.toFixed(0)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>${(vol.qty * precioUnit).toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: colors.gold, background: `${colors.gold}20` }}>
                    ${(vol.qty * utilidad).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', fontSize: '11px' }}>{vol.tipo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Casos de uso */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>CASOS DE USO TÍPICOS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {linea.casos.map((caso, i) => (
            <div key={i} style={{ background: colors.cream, padding: '15px', border: `1px solid ${colors.sand}` }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: linea.color }}>{caso.uso}</div>
              <div style={{ fontSize: '11px', color: colors.camel }}>
                <div>📦 {caso.volumen}</div>
                <div>💰 {caso.precio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Vista E-commerce
const EcommerceView = ({ productosActualizados, condicionesEco, condicionesEcoForro }) => {
  const productosUsar = productosActualizados || productos;
  return (
    <div>
      <h2 style={{ margin: '0 0 25px', fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
        Análisis E-commerce — Rentabilidad por Canal
      </h2>

      {/* Panel de condiciones de envío ECO para e-commerce */}
      {(condicionesEco || condicionesEcoForro) && (
        <div style={{
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.linen} 100%)`,
          border: `2px solid ${colors.camel}`,
          padding: '20px',
          marginBottom: '25px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '24px' }}>🛒</span>
            <h3 style={{ margin: 0, fontSize: '14px', color: colors.espresso }}>
              ENVÍO GRATIS E-COMMERCE — Líneas ECO (Precios editables en Productos)
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {condicionesEco && (
              <div style={{ background: colors.cotton, padding: '15px', borderRadius: '6px', border: `1px solid ${productosUsar.eco.color}` }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: productosUsar.eco.color, marginBottom: '10px' }}>
                  💎 ECO — Precio: ${productosUsar.eco.precioPublico}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: colors.camel }}>NAC. ENVÍO GRATIS</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.olive }}>
                      {condicionesEco.ecommerce.nacional.unidadesMin}+ pzas
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: colors.camel }}>LOCAL ENVÍO GRATIS</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.terracotta }}>
                      {condicionesEco.ecommerce.local.unidadesMin}+ pzas
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: colors.camel }}>MARGEN</div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: condicionesEco.esValidoPublico ? colors.olive : '#E74C3C'
                    }}>
                      {condicionesEco.margenPublicoActual}%
                    </div>
                  </div>
                </div>
              </div>
            )}
            {condicionesEcoForro && (
              <div style={{ background: colors.cotton, padding: '15px', borderRadius: '6px', border: `1px solid ${productosUsar.ecoForro.color}` }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: productosUsar.ecoForro.color, marginBottom: '10px' }}>
                  💠 ECO+FORRO — Precio: ${productosUsar.ecoForro.precioPublico}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: colors.camel }}>NAC. ENVÍO GRATIS</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.olive }}>
                      {condicionesEcoForro.ecommerce.nacional.unidadesMin}+ pzas
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: colors.camel }}>LOCAL ENVÍO GRATIS</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.terracotta }}>
                      {condicionesEcoForro.ecommerce.local.unidadesMin}+ pzas
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: colors.camel }}>MARGEN</div>
                    <div style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: condicionesEcoForro.esValidoPublico ? colors.olive : '#E74C3C'
                    }}>
                      {condicionesEcoForro.margenPublicoActual}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comparativa de canales */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>COMPARATIVA DE CANALES</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: colors.cream }}>
              {['Canal', 'Precio', 'Utilidad/pza', 'Margen %', 'Pros', 'Contras'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: 'center', borderBottom: `2px solid ${colors.camel}`, fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ecommerceData.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                <td style={{ padding: '10px', fontWeight: '600' }}>{row.canal}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>${row.precio}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: colors.olive }}>~${row.utilidad}</td>
                <td style={{ padding: '10px', textAlign: 'center', color: colors.gold }}>{row.margen}%</td>
                <td style={{ padding: '10px', fontSize: '11px', color: colors.olive }}>{row.pros}</td>
                <td style={{ padding: '10px', fontSize: '11px', color: colors.terracotta }}>{row.contras}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráfico comparativo */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>UTILIDAD POR CANAL</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={ecommerceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
            <XAxis type="number" stroke={colors.camel} />
            <YAxis dataKey="canal" type="category" width={120} tick={{ fontSize: 10 }} stroke={colors.camel} />
            <Tooltip contentStyle={{ background: colors.cotton, border: `1px solid ${colors.camel}` }} />
            <Bar dataKey="utilidad" fill={colors.olive} name="Utilidad/pza" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recomendaciones */}
      <div style={{ background: `${colors.gold}20`, padding: '20px', border: `1px solid ${colors.gold}` }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>💡 RECOMENDACIONES ESTRATÉGICAS</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {[
            { titulo: 'PRIORIDAD LOCAL', desc: 'Tu promo 2x$400 + envío gratis en Puebla es la MÁS RENTABLE (~$98/pza)' },
            { titulo: 'MERCADO LIBRE', desc: 'Vende en PACKS de 2 bolsas a $399-$499 para diluir comisiones y envío' },
            { titulo: 'AMAZON', desc: 'Precio mínimo $299 para que valga la pena con FBA, mejor $349' },
            { titulo: 'VENTA DIRECTA NACIONAL', desc: 'Usa Skydropx o EnvíaYa, precio $220-$250 con envío incluido' },
          ].map((rec, i) => (
            <div key={i} style={{ background: colors.cotton, padding: '15px', border: `1px solid ${colors.sand}` }}>
              <div style={{ fontWeight: '600', color: colors.espresso, marginBottom: '5px' }}>{i + 1}. {rec.titulo}</div>
              <div style={{ fontSize: '12px', color: colors.camel }}>{rec.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Vista Promociones
const PromocionesView = ({ productosActualizados }) => {
  const productosUsar = productosActualizados || productos;
  const precioNormal = 250;
  const descuento = 0.20;
  const costoEnvio = 40;
  const costoProduccion = 82;

  const precioPromo = precioNormal * 2 * (1 - descuento);
  const costoTotal = costoProduccion * 2 + costoEnvio;
  const utilidad = precioPromo - costoTotal;

  return (
    <div>
      <h2 style={{ margin: '0 0 25px', fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
        Análisis de Promociones
      </h2>

      {/* Promoción principal */}
      <div style={{ background: `${colors.terracotta}15`, padding: '25px', border: `2px solid ${colors.terracotta}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', color: colors.terracotta, textAlign: 'center' }}>
          🎉 PROMO 2x1: 20% DESCUENTO + ENVÍO GRATIS
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div style={{ background: colors.cotton, padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px', fontSize: '13px', color: colors.espresso }}>PARA EL CLIENTE:</h4>
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.sand}` }}>
                <span>Precio normal (2 pzas)</span>
                <span>${precioNormal * 2}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.sand}` }}>
                <span>Descuento 20%</span>
                <span style={{ color: colors.terracotta }}>-${precioNormal * 2 * descuento}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.sand}` }}>
                <span>Envío</span>
                <span style={{ color: colors.olive }}>GRATIS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', background: `${colors.gold}30`, marginTop: '10px', fontWeight: '700' }}>
                <span>TOTAL CLIENTE</span>
                <span style={{ fontSize: '18px', color: colors.espresso }}>${precioPromo}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: colors.olive }}>
                ¡Ahorra ${precioNormal * 2 - precioPromo + costoEnvio}!
              </div>
            </div>
          </div>

          <div style={{ background: colors.cotton, padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px', fontSize: '13px', color: colors.espresso }}>TU COSTO Y GANANCIA:</h4>
            <div style={{ fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.sand}` }}>
                <span>Costo producción (2 pzas)</span>
                <span>${costoProduccion * 2}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.sand}` }}>
                <span>Costo envío (DiDi)</span>
                <span>${costoEnvio}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${colors.sand}` }}>
                <span>Tu costo total</span>
                <span style={{ fontWeight: '600' }}>${costoTotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', background: `${colors.olive}30`, marginTop: '10px', fontWeight: '700' }}>
                <span>TU UTILIDAD</span>
                <span style={{ fontSize: '20px', color: colors.olive }}>${utilidad}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', marginTop: '10px' }}>
                <span style={{ color: colors.camel }}>Margen sobre costo</span>
                <span style={{ fontWeight: '600', color: colors.gold }}>{Math.round(utilidad / costoTotal * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Escenarios de venta */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>PROYECCIÓN DE VENTAS MENSUALES</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: colors.cream }}>
              {['Ventas Promo/mes', 'Piezas', 'Ingreso', 'Costo Total', 'Utilidad', 'Margen'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'center', borderBottom: `2px solid ${colors.camel}`, fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[5, 10, 15, 20, 30].map((ventas, i) => {
              const piezas = ventas * 2;
              const ingreso = ventas * precioPromo;
              const costo = ventas * costoTotal;
              const util = ingreso - costo;
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600' }}>{ventas}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{piezas}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>${ingreso.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>${costo.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: colors.olive }}>${util.toLocaleString()}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: colors.gold }}>{Math.round(util / costo * 100)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Personalización */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>🎨 OPCIONES DE PERSONALIZACIÓN</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {personalizacion.map((p, i) => (
            <div key={i} style={{ background: colors.cream, padding: '15px', textAlign: 'center', border: `1px solid ${colors.sand}` }}>
              <div style={{ fontWeight: '600', fontSize: '12px', marginBottom: '8px', color: colors.espresso }}>{p.tipo}</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: colors.olive, marginBottom: '4px' }}>{p.costo}</div>
              <div style={{ fontSize: '10px', color: colors.camel }}>Mín: {p.minimo}</div>
              <div style={{ fontSize: '10px', color: colors.camel, marginTop: '4px', fontStyle: 'italic' }}>{p.ideal}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Vista Costos
const CostosView = ({ productosActualizados, condicionesEco, condicionesEcoForro }) => {
  const productosUsar = productosActualizados || productos;
  return (
    <div>
      <h2 style={{ margin: '0 0 25px', fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
        Estructura de Costos y Envíos
      </h2>

      {/* Comparativa de costos por producto */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>DESGLOSE DE COSTOS POR LÍNEA</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: colors.cream }}>
              {['Concepto', '💎 Eco', '💠 Eco+F', '🛍️ Básica', '👜 Estándar', '👛 Premium'].map(h => (
                <th key={h} style={{ padding: '8px', textAlign: 'center', borderBottom: `2px solid ${colors.camel}`, fontSize: '9px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['loneta', 'forro', 'maquila', 'insumos', 'merma'].map((key, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                <td style={{ padding: '6px', textTransform: 'capitalize', fontSize: '10px' }}>{key}</td>
                <td style={{ padding: '6px', textAlign: 'center', fontSize: '10px' }}>${productos.eco.costos[key].toFixed(2)}</td>
                <td style={{ padding: '6px', textAlign: 'center', fontSize: '10px' }}>${productos.ecoForro.costos[key].toFixed(2)}</td>
                <td style={{ padding: '6px', textAlign: 'center', fontSize: '10px' }}>${productos.basica.costos[key].toFixed(2)}</td>
                <td style={{ padding: '6px', textAlign: 'center', fontSize: '10px' }}>${productos.estandar.costos[key].toFixed(2)}</td>
                <td style={{ padding: '6px', textAlign: 'center', fontSize: '10px' }}>${productos.premium.costos[key].toFixed(2)}</td>
              </tr>
            ))}
            <tr style={{ background: `${colors.gold}30`, fontWeight: '700' }}>
              <td style={{ padding: '8px', fontSize: '10px' }}>TOTAL</td>
              <td style={{ padding: '8px', textAlign: 'center', color: productos.eco.color, fontSize: '11px' }}>${productos.eco.costoTotal}</td>
              <td style={{ padding: '8px', textAlign: 'center', color: productos.ecoForro.color, fontSize: '11px' }}>${productos.ecoForro.costoTotal}</td>
              <td style={{ padding: '8px', textAlign: 'center', color: productos.basica.color, fontSize: '11px' }}>${productos.basica.costoTotal}</td>
              <td style={{ padding: '8px', textAlign: 'center', color: productos.estandar.color, fontSize: '11px' }}>${productos.estandar.costoTotal}</td>
              <td style={{ padding: '8px', textAlign: 'center', color: productos.premium.color, fontSize: '11px' }}>${productos.premium.costoTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Costos de envío */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>🏍️ ENVÍO LOCAL — PUEBLA</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: colors.cream }}>
                {['Servicio', 'Tarifa', 'Tiempo'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: `2px solid ${colors.camel}`, fontSize: '10px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costosEnvio.local.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                  <td style={{ padding: '8px' }}>{row.servicio}</td>
                  <td style={{ padding: '8px', fontWeight: '600', color: colors.olive }}>${row.tarifa}</td>
                  <td style={{ padding: '8px', fontSize: '11px', color: colors.camel }}>{row.tiempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>📦 ENVÍO NACIONAL</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: colors.cream }}>
                {['Servicio', 'Tarifa', 'Tiempo'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', borderBottom: `2px solid ${colors.camel}`, fontSize: '10px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {costosEnvio.nacional.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                  <td style={{ padding: '8px' }}>{row.servicio}</td>
                  <td style={{ padding: '8px', fontWeight: '600', color: colors.olive }}>${row.tarifa}</td>
                  <td style={{ padding: '8px', fontSize: '11px', color: colors.camel }}>{row.tiempo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estrategia de envío */}
      <div style={{ background: `${colors.olive}15`, padding: '20px', border: `1px solid ${colors.olive}` }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>💡 ESTRATEGIA DE ENVÍO RECOMENDADA</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          {[
            { pedido: '1-24 pzas', estrategia: 'Cobrar envío aparte', detalle: 'Local: $50-80 / Nacional: $85-100' },
            { pedido: '25-49 pzas', estrategia: 'Envío subsidiado 50%', detalle: 'Cliente paga $25-40' },
            { pedido: '50-99 pzas', estrategia: 'Envío con descuento', detalle: 'Cliente paga $20-30' },
            { pedido: '100+ pzas', estrategia: 'ENVÍO GRATIS', detalle: 'Absorber en margen (~$0.85/pza)' },
          ].map((e, i) => (
            <div key={i} style={{ background: colors.cotton, padding: '15px', border: `1px solid ${colors.sand}` }}>
              <div style={{ fontWeight: '600', color: colors.espresso, marginBottom: '5px' }}>{e.pedido}</div>
              <div style={{ fontSize: '12px', color: colors.olive, fontWeight: '600', marginBottom: '5px' }}>{e.estrategia}</div>
              <div style={{ fontSize: '11px', color: colors.camel }}>{e.detalle}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ModelosView ha sido removido - la funcionalidad de modelos se eliminó completamente
// Los datos del dashboard ahora se cargan desde la base de datos Supabase
// ModelosView y modelosIniciales han sido eliminados completamente

// Placeholder para mantener compatibilidad (se puede eliminar en futuras versiones)
const _placeholderModelosRemoved = () => null;

// ============================================================================
// La sección de "Modelos" ha sido eliminada del dashboard.
// Los datos ahora se gestionan desde la base de datos Supabase.
// ============================================================================

// Mantenemos solo el comentario para referencia histórica:
// - modelosIniciales: Objeto con modelos por línea (publicitaria, eco, ecoForro, basica, estandar, premium)
// - ModelosView: Componente que mostraba la gestión de modelos por línea
// - ModelosManager: Componente importado para gestión avanzada de modelos (también eliminado)

// ==================== CALCULADORA DE ENVÍO Y RENTABILIDAD ====================

const calcularCondicionesEnvio = (costo, precioPublico, precioMayoreo) => {
  // Costos de envío
  const envioLocal = 35; // DiDi/Uber Puebla
  const envioNacional = 85; // Paquetería nacional promedio

  // Márgenes mínimos
  const margenMinMayoreo = 0.31; // 31%
  const margenMinMenudeo = 1.00; // 100%

  // Utilidades
  const utilidadPublico = precioPublico - costo;
  const utilidadMayoreo = precioMayoreo - costo;

  // Calcular unidades mínimas para envío gratis MAYOREO NACIONAL
  // Fórmula: (cantidad × utilidadMayoreo - costoEnvio) / (cantidad × costo) >= margenMinMayoreo
  // Despejando: cantidad >= costoEnvio / (utilidadMayoreo - costo × margenMinMayoreo)
  const denominadorMayoreoNac = utilidadMayoreo - (costo * margenMinMayoreo);
  const unidadesMinMayoreoNacional = denominadorMayoreoNac > 0
    ? Math.ceil(envioNacional / denominadorMayoreoNac)
    : 999;

  // Unidades mínimas para envío gratis MAYOREO LOCAL
  const unidadesMinMayoreoLocal = denominadorMayoreoNac > 0
    ? Math.ceil(envioLocal / denominadorMayoreoNac)
    : 999;

  // Calcular unidades mínimas para envío gratis E-COMMERCE (menudeo)
  // Debe mantener margen mínimo 100% después de absorber envío
  const denominadorMenudeoNac = utilidadPublico - (costo * margenMinMenudeo);
  const unidadesMinEcommerceNacional = denominadorMenudeoNac > 0
    ? Math.ceil(envioNacional / denominadorMenudeoNac)
    : 999;

  const unidadesMinEcommerceLocal = denominadorMenudeoNac > 0
    ? Math.ceil(envioLocal / denominadorMenudeoNac)
    : 999;

  // Validar márgenes actuales
  const margenPublicoActual = ((precioPublico - costo) / costo * 100);
  const margenMayoreoActual = ((precioMayoreo - costo) / costo * 100);

  const esValidoPublico = margenPublicoActual >= 100;
  const esValidoMayoreo = margenMayoreoActual >= 31;

  // Calcular precio mínimo viable
  const precioMinPublico = Math.ceil(costo * 2); // 100% margen
  const precioMinMayoreo = Math.ceil(costo * 1.31); // 31% margen

  // Promociones sugeridas con envío incluido
  const promo2x1Nacional = {
    precio: Math.ceil((costo * 2 + envioNacional) * 1.31), // 31% margen en pack
    utilidad: Math.ceil((costo * 2 + envioNacional) * 0.31),
    precioUnit: Math.ceil((costo * 2 + envioNacional) * 1.31 / 2)
  };

  const promo2x1Local = {
    precio: Math.ceil((costo * 2 + envioLocal) * 1.31),
    utilidad: Math.ceil((costo * 2 + envioLocal) * 0.31),
    precioUnit: Math.ceil((costo * 2 + envioLocal) * 1.31 / 2)
  };

  return {
    envioLocal,
    envioNacional,
    utilidadPublico,
    utilidadMayoreo,
    margenPublicoActual: margenPublicoActual.toFixed(1),
    margenMayoreoActual: margenMayoreoActual.toFixed(1),
    esValidoPublico,
    esValidoMayoreo,
    precioMinPublico,
    precioMinMayoreo,
    // Unidades mínimas para envío gratis
    mayoreo: {
      nacional: { unidadesMin: unidadesMinMayoreoNacional, costo: envioNacional },
      local: { unidadesMin: unidadesMinMayoreoLocal, costo: envioLocal }
    },
    ecommerce: {
      nacional: { unidadesMin: unidadesMinEcommerceNacional, costo: envioNacional },
      local: { unidadesMin: unidadesMinEcommerceLocal, costo: envioLocal }
    },
    promociones: {
      pack2Nacional: promo2x1Nacional,
      pack2Local: promo2x1Local
    }
  };
};

// Panel de Condiciones de Envío
const PanelEnvioGratis = ({ producto, precios, condiciones }) => {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.linen} 100%)`,
      border: `2px solid ${colors.olive}`,
      padding: '20px',
      marginTop: '20px',
      borderRadius: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        <span style={{ fontSize: '28px' }}>🚚</span>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', color: colors.espresso }}>
            CONDICIONES ENVÍO GRATIS — {producto.nombre}
          </h4>
          <p style={{ margin: '3px 0 0', fontSize: '11px', color: colors.camel }}>
            Calculado para mantener rentabilidad mínima (Mayoreo 31% / Menudeo 100%)
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
        {/* Mayoreo */}
        <div style={{ background: colors.cotton, padding: '15px', border: `1px solid ${colors.sand}`, borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso, marginBottom: '12px' }}>
            📦 MAYOREO (Precio: ${precios.precioMayoreo})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            <div style={{ background: `${colors.olive}15`, padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: colors.camel }}>NACIONAL</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.olive }}>
                {condiciones.mayoreo.nacional.unidadesMin}+ pzas
              </div>
              <div style={{ fontSize: '10px', color: colors.camel }}>envío gratis ${condiciones.mayoreo.nacional.costo}</div>
            </div>
            <div style={{ background: `${colors.terracotta}15`, padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: colors.camel }}>PUEBLA LOCAL</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.terracotta }}>
                {condiciones.mayoreo.local.unidadesMin}+ pzas
              </div>
              <div style={{ fontSize: '10px', color: colors.camel }}>envío gratis ${condiciones.mayoreo.local.costo}</div>
            </div>
          </div>
        </div>

        {/* E-commerce */}
        <div style={{ background: colors.cotton, padding: '15px', border: `1px solid ${colors.sand}`, borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso, marginBottom: '12px' }}>
            🛒 E-COMMERCE / MENUDEO (Precio: ${precios.precioPublico})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            <div style={{ background: `${colors.olive}15`, padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: colors.camel }}>NACIONAL</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.olive }}>
                {condiciones.ecommerce.nacional.unidadesMin}+ pzas
              </div>
              <div style={{ fontSize: '10px', color: colors.camel }}>envío gratis ${condiciones.ecommerce.nacional.costo}</div>
            </div>
            <div style={{ background: `${colors.terracotta}15`, padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: colors.camel }}>PUEBLA LOCAL</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: colors.terracotta }}>
                {condiciones.ecommerce.local.unidadesMin}+ pzas
              </div>
              <div style={{ fontSize: '10px', color: colors.camel }}>envío gratis ${condiciones.ecommerce.local.costo}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Promociones sugeridas */}
      <div style={{ background: `${colors.gold}15`, padding: '15px', borderRadius: '6px', border: `1px solid ${colors.gold}` }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso, marginBottom: '10px' }}>
          🎁 PROMOCIONES SUGERIDAS CON ENVÍO INCLUIDO (Mantienen 31% margen)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <div style={{ background: colors.cotton, padding: '10px', textAlign: 'center', borderRadius: '4px' }}>
            <div style={{ fontSize: '9px', color: colors.camel }}>PACK 2 + ENVÍO NAC</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.gold }}>
              ${condiciones.promociones.pack2Nacional.precio}
            </div>
            <div style={{ fontSize: '10px', color: colors.olive }}>
              ${condiciones.promociones.pack2Nacional.precioUnit}/pza
            </div>
          </div>
          <div style={{ background: colors.cotton, padding: '10px', textAlign: 'center', borderRadius: '4px' }}>
            <div style={{ fontSize: '9px', color: colors.camel }}>PACK 2 + ENVÍO LOCAL</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.gold }}>
              ${condiciones.promociones.pack2Local.precio}
            </div>
            <div style={{ fontSize: '10px', color: colors.olive }}>
              ${condiciones.promociones.pack2Local.precioUnit}/pza
            </div>
          </div>
          <div style={{ background: colors.cotton, padding: '10px', textAlign: 'center', borderRadius: '4px' }}>
            <div style={{ fontSize: '9px', color: colors.camel }}>UTILIDAD PACK NAC</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.olive }}>
              ${condiciones.promociones.pack2Nacional.utilidad}
            </div>
            <div style={{ fontSize: '10px', color: colors.camel }}>por pack</div>
          </div>
          <div style={{ background: colors.cotton, padding: '10px', textAlign: 'center', borderRadius: '4px' }}>
            <div style={{ fontSize: '9px', color: colors.camel }}>UTILIDAD PACK LOCAL</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.olive }}>
              ${condiciones.promociones.pack2Local.utilidad}
            </div>
            <div style={{ fontSize: '10px', color: colors.camel }}>por pack</div>
          </div>
        </div>
      </div>

      {/* Advertencia de rentabilidad */}
      <div style={{
        marginTop: '15px',
        padding: '12px',
        background: condiciones.esValidoPublico && condiciones.esValidoMayoreo ? `${colors.olive}15` : '#FDEDEC',
        borderRadius: '4px',
        border: `1px solid ${condiciones.esValidoPublico && condiciones.esValidoMayoreo ? colors.olive : '#E74C3C'}`
      }}>
        {condiciones.esValidoPublico && condiciones.esValidoMayoreo ? (
          <div style={{ fontSize: '12px', color: colors.olive }}>
            ✅ <strong>RENTABILIDAD OK</strong> — Márgenes actuales: Menudeo {condiciones.margenPublicoActual}% | Mayoreo {condiciones.margenMayoreoActual}%
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#E74C3C' }}>
            ⚠️ <strong>ALERTA DE RENTABILIDAD</strong> — Ajusta precios.
            Mínimos: Público ${condiciones.precioMinPublico} | Mayoreo ${condiciones.precioMinMayoreo}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export default function DashboardToteBag() {
  // Autenticacion y roles
  const { user, profile, isAdmin, logout } = useAuth();

  const [seccionActiva, setSeccionActiva] = useState('dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  // Estado global de precios editables para TODAS las líneas
  const [preciosGlobales, setPreciosGlobales] = useState({
    publicitaria: { precioPublico: 45, precioMayoreo: 30 },
    eco: { precioPublico: 80, precioMayoreo: 55 },
    ecoForro: { precioPublico: 99, precioMayoreo: 65 },
    basica: { precioPublico: 120, precioMayoreo: 85 },
    estandar: { precioPublico: 180, precioMayoreo: 120 },
    premium: { precioPublico: 250, precioMayoreo: 165 }
  });

  // Estado para datos cargados desde BD
  const [datosDB, setDatosDB] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Cargar datos desde Supabase al montar
  useEffect(() => {
    const cargarDatos = async () => {
      if (!isSupabaseConfigured) {
        setCargandoDatos(false);
        return;
      }

      try {
        const resultado = await cargarDatosDashboard();
        if (resultado.data && !resultado.usarDatosLocales) {
          setDatosDB(resultado.data);
          // Actualizar precios globales desde BD si hay datos
          if (resultado.data.productos && Object.keys(resultado.data.productos).length > 0) {
            const nuevosPrecios = {};
            Object.keys(resultado.data.productos).forEach(key => {
              const prod = resultado.data.productos[key];
              nuevosPrecios[key] = {
                precioPublico: prod.precioPublico,
                precioMayoreo: prod.precioMayoreo
              };
            });
            setPreciosGlobales(prev => ({ ...prev, ...nuevosPrecios }));
          }
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargandoDatos(false);
      }
    };

    cargarDatos();
  }, []);

  // Calcular condiciones de envío para TODAS las líneas
  const condicionesPublicitaria = calcularCondicionesEnvio(
    productos.publicitaria.costoTotal,
    preciosGlobales.publicitaria.precioPublico,
    preciosGlobales.publicitaria.precioMayoreo
  );

  const condicionesEco = calcularCondicionesEnvio(
    productos.eco.costoTotal,
    preciosGlobales.eco.precioPublico,
    preciosGlobales.eco.precioMayoreo
  );

  const condicionesEcoForro = calcularCondicionesEnvio(
    productos.ecoForro.costoTotal,
    preciosGlobales.ecoForro.precioPublico,
    preciosGlobales.ecoForro.precioMayoreo
  );

  const condicionesBasica = calcularCondicionesEnvio(
    productos.basica.costoTotal,
    preciosGlobales.basica.precioPublico,
    preciosGlobales.basica.precioMayoreo
  );

  const condicionesEstandar = calcularCondicionesEnvio(
    productos.estandar.costoTotal,
    preciosGlobales.estandar.precioPublico,
    preciosGlobales.estandar.precioMayoreo
  );

  const condicionesPremium = calcularCondicionesEnvio(
    productos.premium.costoTotal,
    preciosGlobales.premium.precioPublico,
    preciosGlobales.premium.precioMayoreo
  );

  // Objeto con todas las condiciones
  const todasCondiciones = {
    publicitaria: condicionesPublicitaria,
    eco: condicionesEco,
    ecoForro: condicionesEcoForro,
    basica: condicionesBasica,
    estandar: condicionesEstandar,
    premium: condicionesPremium
  };

  // Función helper para calcular datos actualizados de un producto
  const calcularProductoActualizado = (key) => {
    const prod = productos[key];
    const precios = preciosGlobales[key];
    return {
      ...prod,
      precioPublico: precios.precioPublico,
      precioMayoreo: precios.precioMayoreo,
      utilidadPublica: precios.precioPublico - prod.costoTotal,
      utilidadMayoreo: precios.precioMayoreo - prod.costoTotal,
      margenPublico: Math.round((precios.precioPublico - prod.costoTotal) / prod.costoTotal * 100),
      margenMayoreo: Math.round((precios.precioMayoreo - prod.costoTotal) / prod.costoTotal * 100)
    };
  };

  // Crear productos actualizados con precios editados para TODAS las líneas
  const productosActualizados = {
    publicitaria: calcularProductoActualizado('publicitaria'),
    eco: calcularProductoActualizado('eco'),
    ecoForro: calcularProductoActualizado('ecoForro'),
    basica: calcularProductoActualizado('basica'),
    estandar: calcularProductoActualizado('estandar'),
    premium: calcularProductoActualizado('premium')
  };

  // Calcular proyección de utilidad dinámica basada en precios actuales
  const calcularProyeccionDinamica = () => {
    return proyeccionData.map(mes => {
      const utilidadMes =
        (mes.publicitaria || 0) * productosActualizados.publicitaria.utilidadMayoreo +
        (mes.eco || 0) * productosActualizados.eco.utilidadMayoreo +
        (mes.ecoForro || 0) * productosActualizados.ecoForro.utilidadMayoreo +
        (mes.basica || 0) * productosActualizados.basica.utilidadMayoreo +
        (mes.estandar || 0) * productosActualizados.estandar.utilidadMayoreo +
        (mes.premium || 0) * productosActualizados.premium.utilidadMayoreo;
      return { ...mes, utilidadActualizada: Math.round(utilidadMes) };
    });
  };

  const proyeccionActualizada = calcularProyeccionDinamica();

  const renderSeccion = () => {
    if (cargandoDatos) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛍️</div>
          <div style={{ color: colors.camel }}>Cargando datos...</div>
        </div>
      );
    }

    switch (seccionActiva) {
      case 'dashboard': return <DashboardView productosActualizados={productosActualizados} proyeccionActualizada={proyeccionActualizada} todasCondiciones={todasCondiciones} datosDB={datosDB} />;
      case 'productos': return (
        <ProductosView
          productosActualizados={productosActualizados}
          preciosGlobales={preciosGlobales}
          setPreciosGlobales={setPreciosGlobales}
          todasCondiciones={todasCondiciones}
          datosDB={datosDB}
        />
      );
      case 'mayoreo': return <MayoreoView productosActualizados={productosActualizados} todasCondiciones={todasCondiciones} />;
      case 'ecommerce': return <EcommerceView productosActualizados={productosActualizados} todasCondiciones={todasCondiciones} datosDB={datosDB} />;
      case 'promociones': return <PromocionesView productosActualizados={productosActualizados} todasCondiciones={todasCondiciones} />;
      case 'costos': return <CostosView productosActualizados={productosActualizados} todasCondiciones={todasCondiciones} datosDB={datosDB} />;
      default: return <DashboardView productosActualizados={productosActualizados} />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.sand} 50%, ${colors.linen} 100%)`,
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      color: colors.espresso
    }}>
      <Sidebar
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
        menuAbierto={menuAbierto}
        setMenuAbierto={setMenuAbierto}
        isMobile={isMobile}
      />

      <div style={{
        marginLeft: isMobile ? 0 : '220px',
        padding: isMobile ? '15px' : '30px',
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Header móvil con hamburguesa */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '15px',
            padding: '10px 15px',
            background: colors.sidebarBg,
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setMenuAbierto(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: colors.cream,
                fontSize: '24px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ☰
            </button>
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '2px', color: colors.camel }}>TOTE BAG</div>
              <div style={{ fontSize: '14px', fontWeight: '300', color: colors.cream, letterSpacing: '1px' }}>DASHBOARD</div>
            </div>
          </div>
        )}

        {/* Header desktop */}
        <div style={{
          marginBottom: isMobile ? '20px' : '30px',
          padding: isMobile ? '15px' : '20px 25px',
          background: colors.cotton,
          border: `1px solid ${colors.camel}`,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '10px' : '0',
          borderRadius: isMobile ? '8px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
            <img
              src="/Yolotl_logo_OK.png"
              alt="Yolotl Logo"
              style={{
                height: isMobile ? '45px' : '60px',
                width: 'auto',
                objectFit: 'contain'
              }}
            />
            <div>
              <div style={{ fontSize: isMobile ? '9px' : '10px', letterSpacing: '3px', color: '#A27B36', marginBottom: '5px' }}>
                HECHO A MANO EN PUEBLA, MÉXICO
              </div>
              <h1 style={{ margin: 0, fontSize: isMobile ? '16px' : '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
                Sinai Hogar - Totebags Yolotl
              </h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '11px', color: colors.camel }}>{profile?.email || user?.email}</div>
              <div style={{ fontSize: '10px', fontWeight: '600', color: isAdmin ? colors.olive : colors.terracotta }}>
                {isAdmin ? 'Admin' : 'Usuario'}
              </div>
            </div>
            <button className="logout-btn" onClick={() => logout()} onTouchEnd={(e) => { e.preventDefault(); logout(); }} style={{ padding: '12px 18px', background: colors.sidebarBg, color: colors.sidebarText, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}>
              Salir
            </button>
          </div>
        </div>

        {/* Contenido */}
        {renderSeccion()}

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: isMobile ? '30px' : '40px',
          paddingTop: '20px',
          borderTop: `1px solid ${colors.sand}`,
          fontSize: '11px',
          color: colors.camel
        }}>
          100% Algodón Biodegradable • ◇ ✦ ◇
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import "./Dashboard.css";
import { useAuth } from './AuthContext';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  isSupabaseConfigured,
  cargarDatosDashboard,
  updateLineaProducto,
  getTiposTela,
  updateTipoTela,
  getConfigEnvio,
  updateConfigEnvio,
  createProducto,
  updateProducto,
  deleteProducto,
  getProductos,
  getClientes,
  createCliente,
  getMovimientosStock,
  createMovimientoStock,
  createConsignacionConVenta,
  registrarVentaConsignacion,
  registrarDevolucionConsignacion,
  uploadImagenProducto,
  uploadPdfProducto,
  getSignedPdfUrl,
  getCostosAmazon,
  saveCostosAmazon,
  getCategorias,
  getSubcategorias,
  getCamposCategoria,
  createCategoria,
  deleteCategoria,
  deleteSubcategoria,
  getVentas,
  createVenta,
  updateVenta,
  deleteVenta,
  getResumenVentas,
  registrarPagoVenta,
  getVariantes,
  createVariante,
  updateVariante,
  deleteVariante,
  updateStockVariante,
  uploadImagenVariante,
  deleteImagenVariante,
  getConfiguracionesCorte,
  getConfiguracionActual,
  createConfiguracionCorte,
  updateConfiguracionCorte,
  deleteConfiguracionCorte,
  duplicarConfiguracionConNuevoPrecio,
  getHistorialPrecios,
  deleteMovimientoStock,
  deleteVentaPorMovimiento,
  getMovimientosCaja,
  createMovimientoCaja,
  deleteMovimientoCaja,
  getBalanceCaja,
  getServiciosMaquila,
  createServicioMaquila,
  updateServicioMaquila,
  deleteServicioMaquila,
  registrarPagoServicio
} from './supabaseClient';

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

// E-commerce análisis - AMAZON
// Valores por defecto para costos (editables por admin)
const COSTOS_AMAZON_DEFAULT = {
  material: 6.25,        // Manta $25/m ÷ 2 bolsas
  maquila: 6.00,         // Corte + Confección
  insumos: 1.50,         // Hilo + Etiqueta
  merma: 0.75,           // 5% margen error
  amazonComision: 15,    // 15% del valor de venta
  amazonFbaFee: 55,      // Tarifa gestión FBA
  amazonEnvioBodega: 15, // Envío a bodega Amazon
  precioBaseMayoreo: 24.50, // Precio base mayoreo por pieza (mínimo 20 pzas)
  piezasPorEnvioFBA: 10,  // Piezas por envío para prorrateo
  // Tabla de volúmenes mayoreo con descuentos
  volumenesMayoreo: [
    { cantidad: 20, descuento: 0, segmento: 'Mínimo' },
    { cantidad: 30, descuento: 3, segmento: 'Inicial' },
    { cantidad: 40, descuento: 5, segmento: 'Básico' },
    { cantidad: 50, descuento: 8, segmento: 'Estándar' },
    { cantidad: 60, descuento: 10, segmento: 'Preferente' },
    { cantidad: 70, descuento: 12, segmento: 'Frecuente' },
    { cantidad: 80, descuento: 14, segmento: 'Premium' },
    { cantidad: 100, descuento: 16, segmento: 'Distribuidor' },
    { cantidad: 150, descuento: 20, segmento: 'Mayorista' }
  ]
};

// Función para calcular costo de producción total
const calcularCostoProduccion = (costos) => {
  return costos.material + costos.maquila + costos.insumos + costos.merma;
};

// Función para generar datos de precios Amazon (menudeo)
const generarAmazonPreciosData = (costos) => {
  const costoProduccion = calcularCostoProduccion(costos);
  const comisionRate = costos.amazonComision / 100;

  return [
    { precioVenta: 149, piezas: 1 },
    { precioVenta: 179, piezas: 1 },
    { precioVenta: 199, piezas: 1 },
    { precioVenta: 249, piezas: 1 },
    { precioVenta: 299, piezas: 1 },
  ].map(item => {
    const comision = item.precioVenta * comisionRate;
    const costoFBA = costos.amazonFbaFee / costos.piezasPorEnvioFBA;
    const costoEnvioBodega = costos.amazonEnvioBodega / costos.piezasPorEnvioFBA;
    const costoTotal = costoProduccion + comision + costoFBA + costoEnvioBodega;
    const utilidad = item.precioVenta - costoTotal;
    const margen = ((utilidad / costoTotal) * 100).toFixed(0);
    return { ...item, comision: comision.toFixed(2), costoTotal: costoTotal.toFixed(2), utilidad: utilidad.toFixed(2), margen };
  });
};

// Función para generar datos de mayoreo Amazon (con volúmenes dinámicos)
const generarAmazonMayoreoData = (costos) => {
  const costoProduccion = calcularCostoProduccion(costos);
  const volumenes = costos.volumenesMayoreo || COSTOS_AMAZON_DEFAULT.volumenesMayoreo;

  return volumenes.map(item => {
    const descuentoDecimal = item.descuento / 100;
    const precioUnit = costos.precioBaseMayoreo * (1 - descuentoDecimal);
    const utilidadUnit = precioUnit - costoProduccion;
    const margen = ((utilidadUnit / costoProduccion) * 100).toFixed(0);
    const ingresoTotal = precioUnit * item.cantidad;
    const utilidadTotal = utilidadUnit * item.cantidad;
    return {
      ...item,
      precioUnit: precioUnit.toFixed(2),
      utilidadUnit: utilidadUnit.toFixed(2),
      margen,
      ingresoTotal: ingresoTotal.toFixed(0),
      utilidadTotal: utilidadTotal.toFixed(0)
    };
  });
};

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
    { id: 'stocks', nombre: 'Stocks', icon: '📋' },
    { id: 'salidas', nombre: 'Salidas', icon: '📤' },
    { id: 'ventas', nombre: 'Ventas', icon: '💵' },
    { id: 'caja', nombre: 'Caja', icon: '🏦' },
    { id: 'balance', nombre: 'Balance', icon: '📒' },
    { id: 'servicios', nombre: 'Servicios', icon: '🧵' },
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

  // Estado para posición económica real
  const [posEcon, setPosEcon] = useState(null);
  const [periodoEcon, setPeriodoEcon] = useState('mes');

  const formatearMonedaDash = (monto) => {
    return '$' + (parseFloat(monto) || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const cargarPosicionEconomica = async () => {
    const hoy = new Date();
    let fechaInicio = null;
    let fechaFin = hoy.toISOString().split('T')[0];

    switch (periodoEcon) {
      case 'hoy':
        fechaInicio = hoy.toISOString().split('T')[0];
        break;
      case 'semana': {
        const hace7 = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        fechaInicio = hace7.toISOString().split('T')[0];
        break;
      }
      case 'mes': {
        const hace30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        fechaInicio = hace30.toISOString().split('T')[0];
        break;
      }
      case 'todo':
        fechaInicio = null;
        fechaFin = null;
        break;
      default:
        break;
    }

    const filtrosVentas = {};
    if (fechaInicio) filtrosVentas.fechaInicio = fechaInicio;
    if (fechaFin) filtrosVentas.fechaFin = fechaFin;

    const [ventasRes, cajaRes, serviciosRes] = await Promise.all([
      getVentas(filtrosVentas),
      getBalanceCaja(fechaInicio, fechaFin),
      getServiciosMaquila()
    ]);

    const ventasData = ventasRes.data || [];
    const cajaData = cajaRes.data || { totalIngresos: 0, totalEgresos: 0, balance: 0 };
    const serviciosData = serviciosRes.data || [];

    // Calcular utilidad bruta de ventas (ventas - costos de producto)
    let ingresoVentas = 0;
    let costoVentas = 0;
    let utilidadBruta = 0;
    let piezasVendidas = 0;
    let ventasCobradas = 0;
    let ventasPendientes = 0;

    ventasData.forEach(v => {
      const total = parseFloat(v.total) || 0;
      const costo = (parseFloat(v.costo_unitario) || 0) * (v.cantidad || 0);
      const pagado = parseFloat(v.monto_pagado) || 0;
      ingresoVentas += total;
      costoVentas += costo;
      utilidadBruta += total - costo;
      piezasVendidas += v.cantidad || 0;
      ventasCobradas += pagado;
      ventasPendientes += Math.max(0, total - pagado);
    });

    // Servicios de maquila por cobrar a clientes
    let porCobrarMaquila = 0;
    serviciosData.forEach(s => {
      porCobrarMaquila += Math.max(0, (parseFloat(s.total) || 0) - (parseFloat(s.monto_pagado) || 0));
    });

    // Utilidad neta = utilidad bruta - egresos de caja
    const utilidadNeta = utilidadBruta - cajaData.totalEgresos;

    setPosEcon({
      ingresoVentas,
      costoVentas,
      utilidadBruta,
      egresos: cajaData.totalEgresos,
      ingresosCaja: cajaData.totalIngresos,
      utilidadNeta,
      balanceCaja: cajaData.balance,
      piezasVendidas,
      ventasCobradas,
      ventasPendientes,
      porCobrarMaquila,
      numVentas: ventasData.length
    });
  };

  useEffect(() => {
    cargarPosicionEconomica();
  }, [periodoEcon]);

  return (
    <div>
      {/* POSICIÓN ECONÓMICA */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
            Posición Económica
          </h2>
          <div style={{ display: 'flex', gap: '4px', background: colors.cotton, borderRadius: '8px', padding: '4px' }}>
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Semana' },
              { id: 'mes', label: 'Mes' },
              { id: 'todo', label: 'Todo' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodoEcon(p.id)}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: periodoEcon === p.id ? '700' : '400',
                  background: periodoEcon === p.id ? colors.sidebarBg : 'transparent',
                  color: periodoEcon === p.id ? 'white' : colors.espresso
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {posEcon ? (
          <>
            {/* Fila principal: Utilidad Bruta, Egresos, Utilidad Neta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                background: colors.cotton,
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: colors.camel, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Ventas totales</div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMonedaDash(posEcon.ingresoVentas)}</div>
                <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px' }}>{posEcon.numVentas} ventas • {posEcon.piezasVendidas} pzas</div>
              </div>

              <div style={{
                background: colors.cotton,
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                border: `2px solid ${colors.olive}`
              }}>
                <div style={{ fontSize: '12px', color: colors.camel, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Utilidad bruta</div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: colors.olive }}>{formatearMonedaDash(posEcon.utilidadBruta)}</div>
                <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px' }}>Ventas - Costo de producto</div>
              </div>

              <div style={{
                background: colors.cotton,
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: colors.camel, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Egresos</div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: colors.terracotta }}>{formatearMonedaDash(posEcon.egresos)}</div>
                <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px' }}>Gastos operativos</div>
              </div>

              <div style={{
                background: posEcon.utilidadNeta >= 0 ? 'rgba(171,213,94,0.08)' : 'rgba(196,120,74,0.08)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                border: `2px solid ${posEcon.utilidadNeta >= 0 ? colors.olive : colors.terracotta}`
              }}>
                <div style={{ fontSize: '12px', color: colors.camel, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Utilidad neta</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: posEcon.utilidadNeta >= 0 ? colors.olive : colors.terracotta }}>
                  {formatearMonedaDash(posEcon.utilidadNeta)}
                </div>
                <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px' }}>Utilidad bruta - Egresos</div>
              </div>
            </div>

            {/* Fila secundaria: Cobrado, Por cobrar, Por cobrar maquila, Balance caja */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <div style={{ background: colors.cotton, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cobrado</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: colors.olive }}>{formatearMonedaDash(posEcon.ventasCobradas)}</div>
              </div>
              <div style={{ background: colors.cotton, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Por cobrar</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: posEcon.ventasPendientes > 0 ? colors.terracotta : colors.olive }}>
                  {formatearMonedaDash(posEcon.ventasPendientes)}
                </div>
              </div>
              <div style={{ background: colors.cotton, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Por cobrar maquila</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: posEcon.porCobrarMaquila > 0 ? colors.terracotta : colors.olive }}>
                  {formatearMonedaDash(posEcon.porCobrarMaquila)}
                </div>
              </div>
              <div style={{ background: colors.cotton, borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance caja</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: posEcon.balanceCaja >= 0 ? colors.sidebarBg : colors.terracotta }}>
                  {formatearMonedaDash(posEcon.balanceCaja)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
            Cargando posición económica...
          </div>
        )}
      </div>

      {/* PROYECCIONES */}
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

// Componente para renderizar campos dinámicos
const CampoDinamico = ({ campo, valor, onChange, colors }) => {
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #DA9F17',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: colors.cream
  };

  switch (campo.tipo_campo) {
    case 'text':
      return (
        <input
          type="text"
          value={valor || ''}
          onChange={(e) => onChange(campo.nombre_campo, e.target.value)}
          placeholder={campo.nombre_display}
          style={inputStyle}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={valor || ''}
          onChange={(e) => onChange(campo.nombre_campo, e.target.value)}
          placeholder={campo.nombre_display}
          style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={valor || ''}
          onChange={(e) => onChange(campo.nombre_campo, parseFloat(e.target.value) || 0)}
          placeholder="0"
          style={inputStyle}
        />
      );

    case 'decimal':
      return (
        <input
          type="number"
          step="0.01"
          value={valor || ''}
          onChange={(e) => onChange(campo.nombre_campo, parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          style={inputStyle}
        />
      );

    case 'select':
      const opciones = campo.opciones || [];
      return (
        <select
          value={valor || ''}
          onChange={(e) => onChange(campo.nombre_campo, e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">Seleccionar...</option>
          {opciones.map((opcion, idx) => (
            <option key={idx} value={opcion}>{opcion}</option>
          ))}
        </select>
      );

    case 'boolean':
      return (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          background: valor ? 'rgba(171,213,94,0.2)' : colors.cream,
          border: `2px solid ${valor ? colors.olive : '#DA9F17'}`,
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}>
          <input
            type="checkbox"
            checked={valor || false}
            onChange={(e) => onChange(campo.nombre_campo, e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ color: colors.espresso, fontSize: '14px' }}>
            {campo.nombre_display}
          </span>
        </label>
      );

    default:
      return (
        <input
          type="text"
          value={valor || ''}
          onChange={(e) => onChange(campo.nombre_campo, e.target.value)}
          style={inputStyle}
        />
      );
  }
};

// Vista Productos
const ProductosView = ({ isAdmin }) => {
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
  const [hoverEditar, setHoverEditar] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [productosGuardados, setProductosGuardados] = useState([]);
  const [configEnvioId, setConfigEnvioId] = useState(null);
  const [productoEditandoId, setProductoEditandoId] = useState(null); // ID del producto que se está editando
  const [subiendoArchivo, setSubiendoArchivo] = useState({});
  const [expandirArchivos, setExpandirArchivos] = useState({});
  const [imagenPopup, setImagenPopup] = useState(null); // { url, nombre } para mostrar en popup
  const [hoverVerBtn, setHoverVerBtn] = useState({}); // Estado para hover de botones "Ver"

  // Estados para categorías jerárquicas
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [camposCategoria, setCamposCategoria] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);
  const [camposDinamicos, setCamposDinamicos] = useState({});
  const [mostrarAgregarCategoria, setMostrarAgregarCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', icono: '📦' });
  const [hoverCategorias, setHoverCategorias] = useState({});

  // Estados para variantes de producto
  const [productoVariantes, setProductoVariantes] = useState(null); // Producto seleccionado para ver variantes
  const [variantes, setVariantes] = useState([]);
  const [mostrarFormVariante, setMostrarFormVariante] = useState(false);
  const [varianteEditando, setVarianteEditando] = useState(null);
  const [formVariante, setFormVariante] = useState({
    material: '',
    color: '',
    talla: '',
    stock: 0,
    costo_unitario: 0,
    precio_venta: 0,
    imagen_url: ''
  });
  const [subiendoImagenVariante, setSubiendoImagenVariante] = useState(false);

  // Estados para configuración de corte
  const [mostrarConfigCorte, setMostrarConfigCorte] = useState(false);
  const [varianteConfigCorte, setVarianteConfigCorte] = useState(null); // Variante para configurar corte
  const [configCorteActual, setConfigCorteActual] = useState(null);
  const [historialPrecios, setHistorialPrecios] = useState([]);
  const [formConfigCorte, setFormConfigCorte] = useState({
    nombre: '',
    metros_sabana_plana: 0,
    incluye_sabana_plana: true,
    metros_sabana_cajon: 0,
    incluye_sabana_cajon: true,
    metros_fundas: 0,
    cantidad_fundas: 2,
    incluye_fundas: true,
    porcentaje_desperdicio: 10,
    precio_tela_metro: 0,
    costo_confeccion: 0,
    costo_empaque: 0
  });

  // Cargar datos de Supabase al montar
  useEffect(() => {
    const cargarDatos = async () => {
      // Cargar categorías
      const { data: categoriasData } = await getCategorias();
      if (categoriasData && categoriasData.length > 0) {
        setCategorias(categoriasData);
        // Seleccionar primera categoría (Totebags) por defecto
        const primeraCategoria = categoriasData[0];
        setCategoriaActiva(primeraCategoria);

        // Cargar subcategorías de la primera categoría
        const { data: subcatsData } = await getSubcategorias(primeraCategoria.id);
        if (subcatsData) {
          setSubcategorias(subcatsData);
        }

        // Cargar campos dinámicos de la primera categoría
        const { data: camposData } = await getCamposCategoria(primeraCategoria.id);
        if (camposData) {
          setCamposCategoria(camposData);
        }
      }

      // Cargar tipos de tela
      const { data: telasData } = await getTiposTela();
      if (telasData && telasData.length > 0) {
        setAnchosTela(telasData.map(t => ({
          id: t.id,
          nombre: t.nombre,
          ancho: parseFloat(t.ancho),
          precio: parseFloat(t.precio_metro)
        })));
      }

      // Cargar configuración de envío
      const { data: envioData } = await getConfigEnvio();
      if (envioData && envioData.length > 0) {
        const config = envioData[0];
        setConfigEnvioId(config.id);
        setFormProducto(prev => ({
          ...prev,
          envio: parseFloat(config.costo_envio),
          minPiezasEnvio: config.min_piezas
        }));
      }

      // Cargar productos guardados
      const { data: productosData } = await getProductos();
      if (productosData) {
        setProductosGuardados(productosData);
      }
    };

    if (isSupabaseConfigured) {
      cargarDatos();
    }
  }, []);

  // Cambiar categoría activa
  const cambiarCategoria = async (categoria) => {
    setCategoriaActiva(categoria);
    setSubcategoriaActiva(null);
    setCamposDinamicos({});

    // Cargar subcategorías
    const { data: subcatsData } = await getSubcategorias(categoria.id);
    if (subcatsData) {
      setSubcategorias(subcatsData);
    } else {
      setSubcategorias([]);
    }

    // Cargar campos dinámicos
    const { data: camposData } = await getCamposCategoria(categoria.id);
    if (camposData) {
      setCamposCategoria(camposData);
    } else {
      setCamposCategoria([]);
    }

    // Recargar productos filtrados por categoría
    const { data: productosData } = await getProductos(categoria.id);
    if (productosData) {
      setProductosGuardados(productosData);
    }
  };

  // Cambiar subcategoría activa
  const cambiarSubcategoria = async (subcategoria) => {
    setSubcategoriaActiva(subcategoria);

    // Recargar productos filtrados por subcategoría
    const { data: productosData } = await getProductos(categoriaActiva?.id, subcategoria?.id);
    if (productosData) {
      setProductosGuardados(productosData);
    }
  };

  // Actualizar campo dinámico
  const actualizarCampoDinamico = (nombreCampo, valor) => {
    setCamposDinamicos(prev => ({
      ...prev,
      [nombreCampo]: valor
    }));
  };

  // Agregar nueva categoría
  const agregarCategoria = async () => {
    console.log('agregarCategoria llamada, nombre:', nuevaCategoria.nombre);
    if (!nuevaCategoria.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un nombre para la categoría' });
      return;
    }

    setGuardando(true);
    const slug = nuevaCategoria.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      console.log('Creando categoría:', { nombre: nuevaCategoria.nombre, slug, icono: nuevaCategoria.icono });
      const { data, error } = await createCategoria({
        nombre: nuevaCategoria.nombre,
        slug,
        icono: nuevaCategoria.icono,
        orden: categorias.length + 1
      });
      console.log('Resultado createCategoria:', { data, error });

      if (error) {
        console.error('Error al crear categoría:', error);
        const msg = error.message || '';
        if (error.code === '23505' || msg.includes('duplicate') || msg.includes('already exists') || msg.includes('unique')) {
          // La categoría ya existe - intentar cargarla
          const { data: existentes } = await getCategorias();
          if (existentes) {
            setCategorias(existentes);
            const existente = existentes.find(c => c.slug === slug || c.nombre === nuevaCategoria.nombre);
            if (existente) {
              setNuevaCategoria({ nombre: '', icono: '📦' });
              setMostrarAgregarCategoria(false);
              cambiarCategoria(existente);
              setMensaje({ tipo: 'exito', texto: 'Categoría "' + existente.nombre + '" ya existía, seleccionada.' });
              setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
              return;
            }
          }
          setMensaje({ tipo: 'error', texto: 'Ya existe una categoría con ese nombre.' });
        } else {
          setMensaje({ tipo: 'error', texto: 'Error al crear categoría: ' + (msg || JSON.stringify(error)) });
        }
        return;
      }

      if (!data) {
        setMensaje({ tipo: 'error', texto: 'No se pudo crear la categoría. Verifica permisos de administrador.' });
        return;
      }

      setCategorias([...categorias, data]);
      setNuevaCategoria({ nombre: '', icono: '📦' });
      setMostrarAgregarCategoria(false);
      cambiarCategoria(data);
      setMensaje({ tipo: 'exito', texto: 'Categoría "' + data.nombre + '" creada correctamente' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      console.error('Error inesperado al crear categoría:', err);
      setMensaje({ tipo: 'error', texto: 'Error inesperado: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar categoría (solo admin)
  const eliminarCategoriaHandler = async (categoriaId, categoriaNombre) => {
    if (!isAdmin) return;

    // No permitir eliminar Totebags (categoría base)
    const cat = categorias.find(c => c.id === categoriaId);
    if (cat?.slug === 'totebags') {
      setMensaje({ tipo: 'error', texto: 'No se puede eliminar la categoría principal Totebags' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      return;
    }

    if (!window.confirm(`¿Eliminar la categoría "${categoriaNombre}"? Los productos de esta categoría quedarán sin categoría.`)) {
      return;
    }

    const { error } = await deleteCategoria(categoriaId);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar: ' + error.message });
    } else {
      setCategorias(categorias.filter(c => c.id !== categoriaId));
      // Si la categoría eliminada era la activa, cambiar a la primera
      if (categoriaActiva?.id === categoriaId) {
        const nuevaActiva = categorias.find(c => c.id !== categoriaId);
        if (nuevaActiva) cambiarCategoria(nuevaActiva);
      }
      setMensaje({ tipo: 'exito', texto: 'Categoría eliminada' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
  };

  // Eliminar subcategoría (solo admin)
  const eliminarSubcategoriaHandler = async (subcategoriaId, subcategoriaNombre) => {
    if (!isAdmin) return;

    if (!window.confirm(`¿Eliminar la subcategoría "${subcategoriaNombre}"?`)) {
      return;
    }

    const { error } = await deleteSubcategoria(subcategoriaId);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar: ' + error.message });
    } else {
      setSubcategorias(subcategorias.filter(s => s.id !== subcategoriaId));
      if (subcategoriaActiva?.id === subcategoriaId) {
        setSubcategoriaActiva(null);
      }
      setMensaje({ tipo: 'exito', texto: 'Subcategoría eliminada' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
  };

  // Eliminar producto (solo admin)
  const eliminarProductoHandler = async (productoId, productoNombre) => {
    if (!isAdmin) return;

    if (!window.confirm(`¿Eliminar el producto "${productoNombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    const { error } = await deleteProducto(productoId);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar: ' + error.message });
    } else {
      setProductosGuardados(productosGuardados.filter(p => p.id !== productoId));
      setMensaje({ tipo: 'exito', texto: 'Producto eliminado' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
  };

  // ==================== FUNCIONES PARA VARIANTES ====================

  // Abrir modal de variantes para un producto
  const abrirVariantes = async (producto) => {
    setProductoVariantes(producto);
    const { data } = await getVariantes(producto.id);
    setVariantes(data || []);
  };

  // Cerrar modal de variantes
  const cerrarVariantes = () => {
    setProductoVariantes(null);
    setVariantes([]);
    setMostrarFormVariante(false);
    setVarianteEditando(null);
    setFormVariante({ material: '', color: '', talla: '', stock: 0, costo_unitario: 0, precio_venta: 0 });
  };

  // Abrir formulario para nueva variante
  const nuevaVarianteHandler = () => {
    setVarianteEditando(null);
    setFormVariante({
      material: '',
      color: '',
      talla: '',
      stock: 0,
      costo_unitario: productoVariantes?.costo_total_1_tinta || 0,
      precio_venta: productoVariantes?.precio_venta || 0
    });
    setMostrarFormVariante(true);
  };

  // Editar variante existente
  const editarVarianteHandler = (variante) => {
    setVarianteEditando(variante);
    setFormVariante({
      material: variante.material || '',
      color: variante.color || '',
      talla: variante.talla || '',
      stock: variante.stock || 0,
      costo_unitario: parseFloat(variante.costo_unitario) || 0,
      precio_venta: parseFloat(variante.precio_venta) || 0,
      imagen_url: variante.imagen_url || ''
    });
    setMostrarFormVariante(true);
  };

  // Guardar variante (crear o actualizar)
  const guardarVariante = async () => {
    if (!formVariante.material && !formVariante.color && !formVariante.talla) {
      setMensaje({ tipo: 'error', texto: 'Ingresa al menos un atributo (material, color o talla)' });
      return;
    }

    setGuardando(true);
    try {
      const varianteData = {
        producto_id: productoVariantes.id,
        material: formVariante.material || null,
        color: formVariante.color || null,
        talla: formVariante.talla || null,
        stock: parseInt(formVariante.stock) || 0,
        costo_unitario: parseFloat(formVariante.costo_unitario) || 0,
        precio_venta: parseFloat(formVariante.precio_venta) || 0
      };

      let result;
      if (varianteEditando) {
        result = await updateVariante(varianteEditando.id, varianteData);
      } else {
        result = await createVariante(varianteData);
      }

      if (result.error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + result.error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: varianteEditando ? 'Variante actualizada' : 'Variante creada' });
        // Recargar variantes
        const { data } = await getVariantes(productoVariantes.id);
        setVariantes(data || []);
        setMostrarFormVariante(false);
        setVarianteEditando(null);
        setFormVariante({ material: '', color: '', talla: '', stock: 0, costo_unitario: 0, precio_venta: 0 });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar variante
  const eliminarVarianteHandler = async (varianteId) => {
    if (!window.confirm('¿Eliminar esta variante?')) return;

    const { error } = await deleteVariante(varianteId);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
    } else {
      setVariantes(variantes.filter(v => v.id !== varianteId));
      setMensaje({ tipo: 'exito', texto: 'Variante eliminada' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
  };

  // Actualizar stock de variante rápido
  const actualizarStockVariante = async (varianteId, nuevoStock) => {
    const { error } = await updateStockVariante(varianteId, parseInt(nuevoStock) || 0);
    if (!error) {
      setVariantes(variantes.map(v => v.id === varianteId ? { ...v, stock: parseInt(nuevoStock) || 0 } : v));
    }
  };

  // ==================== FUNCIONES PARA CONFIGURACIÓN DE CORTE ====================

  // Abrir configuración de corte para una variante
  const abrirConfigCorte = async (variante) => {
    setVarianteConfigCorte(variante);
    setMostrarConfigCorte(true);

    // Cargar configuración actual si existe
    const { data: config } = await getConfiguracionActual(productoVariantes.id, variante.id);
    if (config) {
      setConfigCorteActual(config);
      setFormConfigCorte({
        nombre: config.nombre || '',
        metros_sabana_plana: config.metros_sabana_plana || 0,
        incluye_sabana_plana: config.incluye_sabana_plana ?? true,
        metros_sabana_cajon: config.metros_sabana_cajon || 0,
        incluye_sabana_cajon: config.incluye_sabana_cajon ?? true,
        metros_fundas: config.metros_fundas || 0,
        cantidad_fundas: config.cantidad_fundas || 2,
        incluye_fundas: config.incluye_fundas ?? true,
        porcentaje_desperdicio: config.porcentaje_desperdicio || 10,
        precio_tela_metro: config.precio_tela_metro || 0,
        costo_confeccion: config.costo_confeccion || 0,
        costo_empaque: config.costo_empaque || 0
      });
    } else {
      setConfigCorteActual(null);
      setFormConfigCorte({
        nombre: `${productoVariantes?.linea_nombre || ''} - ${variante.material || ''} ${variante.talla || ''}`.trim(),
        metros_sabana_plana: 0, incluye_sabana_plana: true,
        metros_sabana_cajon: 0, incluye_sabana_cajon: true,
        metros_fundas: 0, cantidad_fundas: 2, incluye_fundas: true,
        porcentaje_desperdicio: 10,
        precio_tela_metro: 0, costo_confeccion: 0, costo_empaque: 0
      });
    }

    // Cargar historial de precios
    const { data: historial } = await getHistorialPrecios(productoVariantes.id, variante.id);
    setHistorialPrecios(historial || []);
  };

  // Cerrar configuración de corte
  const cerrarConfigCorte = () => {
    setMostrarConfigCorte(false);
    setVarianteConfigCorte(null);
    setConfigCorteActual(null);
    setHistorialPrecios([]);
  };

  // Calcular metros y costos en tiempo real
  const calcularCorteTemporal = () => {
    const f = formConfigCorte;

    // Metros lineales por pieza
    const mSabanaPlana = f.incluye_sabana_plana ? parseFloat(f.metros_sabana_plana) || 0 : 0;
    const mSabanaCajon = f.incluye_sabana_cajon ? parseFloat(f.metros_sabana_cajon) || 0 : 0;
    const mFundas = f.incluye_fundas ? (parseFloat(f.metros_fundas) || 0) * (parseInt(f.cantidad_fundas) || 1) : 0;

    // Total metros lineales (con desperdicio)
    const subtotalMetros = mSabanaPlana + mSabanaCajon + mFundas;
    const metrosConDesperdicio = subtotalMetros * (1 + (parseFloat(f.porcentaje_desperdicio) || 0) / 100);

    // Costos
    const costoMaterial = metrosConDesperdicio * (parseFloat(f.precio_tela_metro) || 0);
    const costoTotal = costoMaterial + parseFloat(f.costo_confeccion || 0) + parseFloat(f.costo_empaque || 0);

    return {
      mSabanaPlana: mSabanaPlana.toFixed(2),
      mSabanaCajon: mSabanaCajon.toFixed(2),
      mFundas: mFundas.toFixed(2),
      subtotalMetros: subtotalMetros.toFixed(2),
      metrosConDesperdicio: metrosConDesperdicio.toFixed(2),
      costoMaterial: costoMaterial.toFixed(2),
      costoTotal: costoTotal.toFixed(2)
    };
  };

  // Guardar configuración de corte
  const guardarConfigCorte = async () => {
    if (!formConfigCorte.nombre) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un nombre para la configuración' });
      return;
    }

    setGuardando(true);
    try {
      const configData = {
        producto_id: productoVariantes.id,
        variante_id: varianteConfigCorte.id,
        nombre: formConfigCorte.nombre,
        metros_sabana_plana: parseFloat(formConfigCorte.metros_sabana_plana) || 0,
        incluye_sabana_plana: formConfigCorte.incluye_sabana_plana,
        metros_sabana_cajon: parseFloat(formConfigCorte.metros_sabana_cajon) || 0,
        incluye_sabana_cajon: formConfigCorte.incluye_sabana_cajon,
        metros_fundas: parseFloat(formConfigCorte.metros_fundas) || 0,
        cantidad_fundas: parseInt(formConfigCorte.cantidad_fundas) || 2,
        incluye_fundas: formConfigCorte.incluye_fundas,
        porcentaje_desperdicio: parseFloat(formConfigCorte.porcentaje_desperdicio) || 0,
        precio_tela_metro: parseFloat(formConfigCorte.precio_tela_metro) || 0,
        costo_confeccion: parseFloat(formConfigCorte.costo_confeccion) || 0,
        costo_empaque: parseFloat(formConfigCorte.costo_empaque) || 0,
        es_configuracion_actual: true
      };

      let result;
      if (configCorteActual) {
        result = await updateConfiguracionCorte(configCorteActual.id, configData);
      } else {
        result = await createConfiguracionCorte(configData);
      }

      if (result.error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + result.error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: 'Configuración guardada' });
        setConfigCorteActual(result.data);

        // Actualizar costo en la variante
        const calculos = calcularCorteTemporal();
        await updateVariante(varianteConfigCorte.id, {
          costo_unitario: parseFloat(calculos.costoTotal)
        });
        setVariantes(variantes.map(v =>
          v.id === varianteConfigCorte.id ? { ...v, costo_unitario: parseFloat(calculos.costoTotal) } : v
        ));

        // Recargar historial
        const { data: historial } = await getHistorialPrecios(productoVariantes.id, varianteConfigCorte.id);
        setHistorialPrecios(historial || []);

        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Actualizar solo el precio (crear nueva entrada en historial)
  const actualizarPrecioTela = async () => {
    if (!configCorteActual) {
      setMensaje({ tipo: 'error', texto: 'Primero guarda una configuración base' });
      return;
    }

    const nuevoPrecio = parseFloat(formConfigCorte.precio_tela_metro);
    if (nuevoPrecio === parseFloat(configCorteActual.precio_tela_metro)) {
      setMensaje({ tipo: 'error', texto: 'El precio es igual al actual' });
      return;
    }

    setGuardando(true);
    try {
      const { data, error } = await duplicarConfiguracionConNuevoPrecio(configCorteActual.id, nuevoPrecio);

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: 'Precio actualizado (historial guardado)' });
        setConfigCorteActual(data);

        // Recargar historial
        const { data: historial } = await getHistorialPrecios(productoVariantes.id, varianteConfigCorte.id);
        setHistorialPrecios(historial || []);

        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Verificar si es categoría Totebags (usa formulario legacy)
  const esCategoriaLegacy = () => {
    return categoriaActiva?.slug === 'totebags';
  };

  // Agrupar campos por sección
  const camposPorSeccion = camposCategoria.reduce((acc, campo) => {
    const seccion = campo.seccion || 'general';
    if (!acc[seccion]) acc[seccion] = [];
    acc[seccion].push(campo);
    return acc;
  }, {});

  // Estado para anchos de tela disponibles (editables por admin)
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
    serigrafia4: 0,
    empaque: 0,
    tipoEntrega: 'envio', // 'envio' o 'recolecta'
    envio: 0,
    minPiezasEnvio: 20,
    precioVenta: 0 // Precio de venta sugerido
  });

  // Cálculos automáticos
  const calcularCostos = () => {
    const tela = anchosTela.find(t => t.id === formProducto.telaSeleccionada);
    const costoTela = tela ? (tela.precio * formProducto.cantidadTela) / formProducto.piezasPorCorte : 0;
    const subtotal = costoTela + formProducto.costoMaquila + formProducto.insumos;
    const conMerma = subtotal * (1 + formProducto.merma / 100);

    // Costo base (producción + empaque, SIN envío, SIN serigrafía)
    const costoBase = conMerma + formProducto.empaque;

    // Envío por pieza (solo si es envío, no recolecta)
    const envioPorPieza = formProducto.tipoEntrega === 'envio' && formProducto.minPiezasEnvio > 0
      ? formProducto.envio / formProducto.minPiezasEnvio
      : 0;

    // Base con envío (si aplica)
    const baseConEnvio = costoBase + envioPorPieza;

    return {
      costoTela: costoTela.toFixed(2),
      subtotal: subtotal.toFixed(2),
      conMerma: conMerma.toFixed(2),
      empaque: formProducto.empaque.toFixed(2),
      costoBase: costoBase.toFixed(2), // SIN envío, SIN serigrafía
      envioPorPieza: envioPorPieza.toFixed(2),
      baseConEnvio: baseConEnvio.toFixed(2),
      // Totales con serigrafía (usando base según tipo de entrega)
      total1Tinta: (baseConEnvio + formProducto.serigrafia1).toFixed(2),
      total2Tintas: (baseConEnvio + formProducto.serigrafia2).toFixed(2),
      total3Tintas: (baseConEnvio + formProducto.serigrafia3).toFixed(2),
      total4Tintas: (baseConEnvio + formProducto.serigrafia4).toFixed(2),
      // Totales SIN envío (recolecta local)
      total1TintaSinEnvio: (costoBase + formProducto.serigrafia1).toFixed(2),
      total2TintasSinEnvio: (costoBase + formProducto.serigrafia2).toFixed(2),
      total3TintasSinEnvio: (costoBase + formProducto.serigrafia3).toFixed(2),
      total4TintasSinEnvio: (costoBase + formProducto.serigrafia4).toFixed(2)
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
    setMensaje({ tipo: '', texto: '' });

    // Buscar si ya existe un producto para esta línea
    const productoExistente = productosGuardados.find(p => p.linea_id === linea.id);

    if (productoExistente) {
      // Cargar datos del producto existente
      setProductoEditandoId(productoExistente.id);
      setFormProducto({
        descripcion: productoExistente.descripcion || '',
        telaSeleccionada: productoExistente.tipo_tela_id || anchosTela[0]?.id || null,
        cantidadTela: parseFloat(productoExistente.cantidad_tela) || 0,
        piezasPorCorte: productoExistente.piezas_por_corte || 1,
        costoMaquila: parseFloat(productoExistente.costo_maquila) || 0,
        insumos: parseFloat(productoExistente.insumos) || 0,
        merma: parseFloat(productoExistente.merma) || 5,
        serigrafia1: parseFloat(productoExistente.serigrafia_1_tinta) || 0,
        serigrafia2: parseFloat(productoExistente.serigrafia_2_tintas) || 0,
        serigrafia3: parseFloat(productoExistente.serigrafia_3_tintas) || 0,
        serigrafia4: parseFloat(productoExistente.serigrafia_4_tintas) || 0,
        empaque: parseFloat(productoExistente.empaque) || 0,
        tipoEntrega: productoExistente.tipo_entrega || 'envio',
        envio: formProducto.envio || 0,
        minPiezasEnvio: formProducto.minPiezasEnvio || 20,
        precioVenta: parseFloat(productoExistente.precio_venta) || 0
      });
    } else {
      // Nuevo producto - valores por defecto
      setProductoEditandoId(null);
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
        serigrafia4: 0,
        empaque: 0,
        tipoEntrega: 'envio',
        envio: formProducto.envio || 0,
        minPiezasEnvio: formProducto.minPiezasEnvio || 20,
        precioVenta: 0
      });
    }
  };

  // Editar producto directamente desde la tarjeta
  const editarProductoDirecto = async (producto) => {
    // Crear objeto de línea desde el producto
    const linea = {
      id: producto.linea_id,
      nombre: producto.linea_nombre,
      medidas: producto.linea_medidas
    };

    setLineaSeleccionada(linea);
    setProductoEditandoId(producto.id);
    setMensaje({ tipo: '', texto: '' });

    // Cargar campos dinámicos si existen
    if (producto.campos_dinamicos) {
      setCamposDinamicos(producto.campos_dinamicos);
    } else {
      setCamposDinamicos({});
    }

    // Si el producto tiene categoría, cargar los campos de esa categoría
    if (producto.categoria_id) {
      const catEncontrada = categorias.find(c => c.id === producto.categoria_id);
      if (catEncontrada) {
        setCategoriaActiva(catEncontrada);
        const { data: camposData } = await getCamposCategoria(producto.categoria_id);
        if (camposData) {
          setCamposCategoria(camposData);
        }
      }
    }

    // Si el producto tiene subcategoría
    if (producto.subcategoria_id) {
      const subcatEncontrada = subcategorias.find(s => s.id === producto.subcategoria_id);
      if (subcatEncontrada) {
        setSubcategoriaActiva(subcatEncontrada);
      }
    }

    setFormProducto({
      descripcion: producto.descripcion || '',
      telaSeleccionada: producto.tipo_tela_id || anchosTela[0]?.id || null,
      cantidadTela: parseFloat(producto.cantidad_tela) || 0,
      piezasPorCorte: producto.piezas_por_corte || 1,
      costoMaquila: parseFloat(producto.costo_maquila) || 0,
      insumos: parseFloat(producto.insumos) || 0,
      merma: parseFloat(producto.merma) || 5,
      serigrafia1: parseFloat(producto.serigrafia_1_tinta) || 0,
      serigrafia2: parseFloat(producto.serigrafia_2_tintas) || 0,
      serigrafia3: parseFloat(producto.serigrafia_3_tintas) || 0,
      serigrafia4: parseFloat(producto.serigrafia_4_tintas) || 0,
      empaque: parseFloat(producto.empaque) || 0,
      tipoEntrega: producto.tipo_entrega || 'envio',
      envio: formProducto.envio || 0,
      minPiezasEnvio: formProducto.minPiezasEnvio || 20
    });
  };

  // Guardar producto en Supabase
  const guardarProducto = async () => {
    if (!lineaSeleccionada) return;

    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const costosCalculados = calcularCostos();

      // Datos base del producto
      const productoData = {
        linea_id: lineaSeleccionada.id,
        linea_nombre: lineaSeleccionada.nombre,
        linea_medidas: lineaSeleccionada.medidas,
        descripcion: formProducto.descripcion,
        categoria_id: categoriaActiva?.id || null,
        subcategoria_id: subcategoriaActiva?.id || null,
        campos_dinamicos: Object.keys(camposDinamicos).length > 0 ? camposDinamicos : {},
        precio_venta: parseFloat(formProducto.precioVenta) || 0
      };

      // Si es categoría legacy (Totebags), incluir campos específicos
      if (esCategoriaLegacy()) {
        Object.assign(productoData, {
          tipo_tela_id: formProducto.telaSeleccionada,
          cantidad_tela: formProducto.cantidadTela,
          piezas_por_corte: formProducto.piezasPorCorte,
          costo_maquila: formProducto.costoMaquila,
          insumos: formProducto.insumos,
          merma: formProducto.merma,
          serigrafia_1_tinta: formProducto.serigrafia1,
          serigrafia_2_tintas: formProducto.serigrafia2,
          serigrafia_3_tintas: formProducto.serigrafia3,
          serigrafia_4_tintas: formProducto.serigrafia4,
          tipo_entrega: formProducto.tipoEntrega,
          empaque: formProducto.empaque,
          envio_id: configEnvioId,
          costo_total_1_tinta: parseFloat(costosCalculados.total1Tinta),
          costo_total_2_tintas: parseFloat(costosCalculados.total2Tintas),
          costo_total_3_tintas: parseFloat(costosCalculados.total3Tintas),
          costo_total_4_tintas: parseFloat(costosCalculados.total4Tintas)
        });
      } else {
        // Para categorías nuevas (Ropa de Cama, etc.), calcular costos desde campos dinámicos
        const costoMaterial = parseFloat(camposDinamicos.costo_material) || 0;
        const costoConfeccion = parseFloat(camposDinamicos.costo_confeccion) || 0;
        const costoEmpaque = parseFloat(camposDinamicos.costo_empaque) || 0;
        const costoTotal = costoMaterial + costoConfeccion + costoEmpaque;

        Object.assign(productoData, {
          costo_total_1_tinta: costoTotal,
          costo_total_2_tintas: costoTotal,
          costo_total_3_tintas: costoTotal,
          costo_total_4_tintas: costoTotal
        });
      }

      let data, error;

      if (productoEditandoId) {
        // Actualizar producto existente
        const result = await updateProducto(productoEditandoId, productoData);
        data = result.data;
        error = result.error;
      } else {
        // Crear nuevo producto
        const result = await createProducto(productoData);
        data = result.data;
        error = result.error;
      }

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error al guardar: ' + error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: productoEditandoId ? 'Producto actualizado correctamente' : 'Producto guardado correctamente' });

        // Actualizar lista de productos
        if (productoEditandoId) {
          setProductosGuardados(productosGuardados.map(p => p.id === productoEditandoId ? data : p));
        } else {
          setProductosGuardados([data, ...productosGuardados]);
        }

        // Limpiar formulario después de 2 segundos
        setTimeout(() => {
          setLineaSeleccionada(null);
          setProductoEditandoId(null);
          setCamposDinamicos({});
          setMensaje({ tipo: '', texto: '' });
        }, 2000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error inesperado: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Guardar tipos de tela (solo admin)
  const guardarTiposTela = async () => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo admin puede guardar' });
      return;
    }

    setMensaje({ tipo: '', texto: 'Guardando...' });

    try {
      let errores = [];
      for (const tela of anchosTela) {
        const { error } = await updateTipoTela(tela.id, {
          nombre: tela.nombre,
          ancho: tela.ancho,
          precio_metro: tela.precio
        });
        if (error) errores.push(error.message || error);
      }

      if (errores.length > 0) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + errores.join(', ') });
      } else {
        setMensaje({ tipo: 'exito', texto: 'Tipos de tela actualizados correctamente' });
      }
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      console.error('Error guardando telas:', err);
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    }
  };

  // Guardar configuración de envío (solo admin)
  const guardarConfigEnvio = async () => {
    if (!isAdmin || !configEnvioId) return;

    await updateConfigEnvio(configEnvioId, {
      costo_envio: formProducto.envio,
      min_piezas: formProducto.minPiezasEnvio
    });
    setMensaje({ tipo: 'exito', texto: 'Configuración de envío actualizada' });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
  };

  // Manejar subida de imagen
  const handleImagenUpload = async (productoId, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMensaje({ tipo: 'error', texto: 'Solo se permiten imágenes (JPG, PNG, WEBP)' });
      return;
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'La imagen no debe superar 5MB' });
      return;
    }

    setSubiendoArchivo({ ...subiendoArchivo, [`img-${productoId}`]: true });

    try {
      const { data, error } = await uploadImagenProducto(productoId, file);

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error subiendo imagen: ' + error.message });
      } else {
        // Actualizar producto con URL de imagen
        await updateProducto(productoId, {
          imagen_url: data.url,
          imagen_nombre: data.nombre
        });

        // Actualizar estado local
        setProductosGuardados(productosGuardados.map(p =>
          p.id === productoId ? { ...p, imagen_url: data.url, imagen_nombre: data.nombre } : p
        ));

        setMensaje({ tipo: 'exito', texto: 'Imagen subida correctamente' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setSubiendoArchivo({ ...subiendoArchivo, [`img-${productoId}`]: false });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  // Manejar subida de PDF
  const handlePdfUpload = async (productoId, tipo, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      setMensaje({ tipo: 'error', texto: 'Solo se permiten archivos PDF' });
      return;
    }

    // Validar tamaño (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMensaje({ tipo: 'error', texto: 'El PDF no debe superar 10MB' });
      return;
    }

    setSubiendoArchivo({ ...subiendoArchivo, [`${tipo}-${productoId}`]: true });

    try {
      const { data, error } = await uploadPdfProducto(productoId, file, tipo);

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error subiendo PDF: ' + error.message });
      } else {
        // Campos a actualizar segun tipo
        const updateFields = tipo === 'patron'
          ? { pdf_patron_url: data.path, pdf_patron_nombre: data.nombre }
          : { pdf_instrucciones_url: data.path, pdf_instrucciones_nombre: data.nombre };

        await updateProducto(productoId, updateFields);

        // Actualizar estado local
        setProductosGuardados(productosGuardados.map(p =>
          p.id === productoId ? { ...p, ...updateFields } : p
        ));

        setMensaje({ tipo: 'exito', texto: `PDF de ${tipo === 'patron' ? 'patrón' : 'instrucciones'} subido correctamente` });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setSubiendoArchivo({ ...subiendoArchivo, [`${tipo}-${productoId}`]: false });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    }
  };

  // Abrir PDF con URL firmada
  const abrirPdf = async (filePath) => {
    const { data, error } = await getSignedPdfUrl(filePath);
    if (data) {
      window.open(data, '_blank');
    } else {
      setMensaje({ tipo: 'error', texto: 'Error abriendo PDF' });
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #DA9F17',
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
    color: colors.sidebarBg
  };

  const sectionStyle = {
    background: colors.cream,
    border: '2px solid #DA9F17',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  };

  return (
    <div>
      {/* Popup para ver imagen en grande */}
      {imagenPopup && (
        <div
          onClick={() => setImagenPopup(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            cursor: 'pointer',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: colors.cotton,
              borderRadius: '12px',
              padding: '20px',
              maxWidth: 'calc(100vw - 40px)',
              maxHeight: 'calc(100vh - 40px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              flexShrink: 0
            }}>
              <h3 style={{ margin: 0, color: colors.espresso, fontSize: '18px' }}>
                {imagenPopup.nombre}
              </h3>
              <button
                onClick={() => setImagenPopup(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: colors.camel,
                  padding: '5px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img
                src={imagenPopup.url}
                alt={imagenPopup.nombre}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(100vh - 140px)',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: `2px solid ${colors.sand}`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Header con título y botón agregar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
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

      {/* Selector de Categorías */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {categorias.map((cat) => (
          <div
            key={cat.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <button
              onClick={() => cambiarCategoria(cat)}
              onMouseEnter={() => setHoverCategorias({ ...hoverCategorias, [cat.id]: true })}
              onMouseLeave={() => setHoverCategorias({ ...hoverCategorias, [cat.id]: false })}
              style={{
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: categoriaActiva?.id === cat.id ? '600' : '400',
                background: categoriaActiva?.id === cat.id
                  ? colors.sidebarBg
                  : (hoverCategorias[cat.id] ? colors.sand : colors.cream),
                color: categoriaActiva?.id === cat.id ? colors.sidebarText : colors.espresso,
                border: `2px solid ${categoriaActiva?.id === cat.id ? colors.sidebarBg : colors.sand}`,
                borderRadius: '25px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{cat.icono}</span>
              <span>{cat.nombre}</span>
            </button>
            {/* Botón eliminar categoría (solo admin, no para Totebags) */}
            {isAdmin && cat.slug !== 'totebags' && (
              <button
                onClick={(e) => { e.stopPropagation(); eliminarCategoriaHandler(cat.id, cat.nombre); }}
                title="Eliminar categoría"
                style={{
                  width: '24px',
                  height: '24px',
                  padding: 0,
                  background: colors.terracotta,
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.8,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = 1}
                onMouseLeave={(e) => e.target.style.opacity = 0.8}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Botón para agregar nueva categoría (solo admin) */}
        {isAdmin && (
          <button
            onClick={() => setMostrarAgregarCategoria(!mostrarAgregarCategoria)}
            style={{
              padding: '10px 15px',
              fontSize: '14px',
              background: 'transparent',
              color: colors.camel,
              border: `2px dashed ${colors.camel}`,
              borderRadius: '25px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            + Nueva Categoría
          </button>
        )}
      </div>

      {/* Formulario para agregar categoría (solo admin) */}
      {mostrarAgregarCategoria && isAdmin && (
        <div style={{
          background: colors.cream,
          border: `2px solid ${colors.sand}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Nombre de categoría"
            value={nuevaCategoria.nombre}
            onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
            style={{
              padding: '8px 12px',
              border: `1px solid ${colors.sand}`,
              borderRadius: '4px',
              fontSize: '14px',
              flex: 1,
              minWidth: '150px'
            }}
          />
          <select
            value={nuevaCategoria.icono}
            onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, icono: e.target.value })}
            style={{
              padding: '8px 12px',
              border: `1px solid ${colors.sand}`,
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="📦">📦 Caja</option>
            <option value="🛍️">🛍️ Bolsa</option>
            <option value="🛏️">🛏️ Cama</option>
            <option value="👕">👕 Ropa</option>
            <option value="🧵">🧵 Textil</option>
            <option value="🎁">🎁 Regalo</option>
            <option value="✨">✨ Especial</option>
          </select>
          <button
            onClick={agregarCategoria}
            style={{
              padding: '8px 16px',
              background: colors.sidebarBg,
              color: colors.sidebarText,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Crear
          </button>
          <button
            onClick={() => { setMostrarAgregarCategoria(false); setNuevaCategoria({ nombre: '', icono: '📦' }); }}
            style={{
              padding: '8px 16px',
              background: colors.sand,
              color: colors.espresso,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Mensaje global (visible fuera del formulario de producto) */}
      {mensaje.texto && !lineaSeleccionada && (
        <div style={{
          marginBottom: '15px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.15)' : 'rgba(196,120,74,0.15)',
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive : colors.terracotta}`,
          color: mensaje.tipo === 'exito' ? colors.olive : colors.terracotta,
          textAlign: 'center',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Selector de Subcategorías (si existen) */}
      {subcategorias.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => cambiarSubcategoria(null)}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              background: subcategoriaActiva === null ? colors.olive : 'transparent',
              color: subcategoriaActiva === null ? 'white' : colors.espresso,
              border: `1px solid ${subcategoriaActiva === null ? colors.olive : colors.sand}`,
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Todos
          </button>
          {subcategorias.map((subcat) => (
            <div key={subcat.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                onClick={() => cambiarSubcategoria(subcat)}
                style={{
                  padding: '8px 14px',
                  fontSize: '13px',
                  background: subcategoriaActiva?.id === subcat.id ? colors.olive : 'transparent',
                  color: subcategoriaActiva?.id === subcat.id ? 'white' : colors.espresso,
                  border: `1px solid ${subcategoriaActiva?.id === subcat.id ? colors.olive : colors.sand}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {subcat.nombre}
              </button>
              {/* Botón eliminar subcategoría (solo admin) */}
              {isAdmin && (
                <button
                  onClick={(e) => { e.stopPropagation(); eliminarSubcategoriaHandler(subcat.id, subcat.nombre); }}
                  title="Eliminar subcategoría"
                  style={{
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    background: colors.terracotta,
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = 1}
                  onMouseLeave={(e) => e.target.style.opacity = 0.7}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Popup para seleccionar línea de producto */}
      {mostrarPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: colors.cotton, borderRadius: '12px', padding: isMobile ? '16px' : '30px',
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
              {lineasProducto.map((linea) => {
                const tieneProducto = productosGuardados.some(p => p.linea_id === linea.id);
                return (
                  <div key={linea.id} onClick={() => seleccionarLinea(linea)}
                    onMouseEnter={() => setHoverItems({ ...hoverItems, [linea.id]: true })}
                    onMouseLeave={() => setHoverItems({ ...hoverItems, [linea.id]: false })}
                    style={{
                      padding: '18px 20px',
                      background: tieneProducto
                        ? (hoverItems[linea.id] ? colors.olive : 'rgba(171,213,94,0.15)')
                        : (hoverItems[linea.id] ? colors.sidebarBg : colors.cream),
                      color: hoverItems[linea.id] ? colors.sidebarText : colors.espresso,
                      border: `2px solid ${tieneProducto ? colors.olive : (hoverItems[linea.id] ? colors.sidebarBg : colors.sand)}`,
                      borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s ease',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {linea.nombre}
                        {tieneProducto && (
                          <span style={{
                            fontSize: '11px',
                            background: colors.olive,
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontWeight: '500'
                          }}>
                            Configurado
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '4px', color: hoverItems[linea.id] ? 'rgba(171,213,94,0.8)' : colors.camel }}>
                        {linea.medidas} {tieneProducto ? '• Click para editar' : '• Click para configurar'}
                      </div>
                    </div>
                    <span style={{ fontSize: '20px' }}>{tieneProducto ? '✓' : '🛍️'}</span>
                  </div>
                );
              })}
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
        <div style={{ background: colors.cotton, border: `1px solid ${colors.sand}`, padding: isMobile ? '16px' : '30px', borderRadius: '8px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h3 style={{ margin: 0, color: colors.espresso, fontSize: '20px' }}>{lineaSeleccionada.nombre}</h3>
              <p style={{ margin: '5px 0 0', color: colors.camel, fontSize: '14px' }}>
                {lineaSeleccionada.medidas}
                {categoriaActiva && (
                  <span style={{ marginLeft: '10px', background: colors.sand, padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                    {categoriaActiva.icono} {categoriaActiva.nombre}
                  </span>
                )}
                {subcategoriaActiva && (
                  <span style={{ marginLeft: '5px', background: colors.olive, color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>
                    {subcategoriaActiva.nombre}
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => { setLineaSeleccionada(null); setCamposDinamicos({}); }}
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

          {/* Campos dinámicos para categorías nuevas (no Totebags) */}
          {!esCategoriaLegacy() && camposCategoria.length > 0 && (
            <>
              {/* Agrupar campos por sección */}
              {Object.entries(camposPorSeccion).map(([seccion, campos]) => (
                <div key={seccion} style={sectionStyle}>
                  <label style={{ ...labelStyle, fontSize: '15px', marginBottom: '15px', textTransform: 'capitalize' }}>
                    {seccion === 'medidas' && '📏 '}
                    {seccion === 'caracteristicas' && '✨ '}
                    {seccion === 'costos' && '💰 '}
                    {seccion === 'produccion' && '🏭 '}
                    {seccion === 'general' && '📝 '}
                    {seccion.replace(/_/g, ' ')}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    {campos.map((campo) => (
                      <div key={campo.id}>
                        {campo.tipo_campo !== 'boolean' && (
                          <label style={labelStyle}>
                            {campo.nombre_display}
                            {campo.es_requerido && <span style={{ color: colors.terracotta }}> *</span>}
                          </label>
                        )}
                        <CampoDinamico
                          campo={campo}
                          valor={camposDinamicos[campo.nombre_campo]}
                          onChange={actualizarCampoDinamico}
                          colors={colors}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Resumen de costos para categorías nuevas */}
              {camposPorSeccion.costos && (
                <div style={{ background: colors.sidebarBg, borderRadius: '8px', padding: '25px', color: colors.sidebarText }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', letterSpacing: '1px' }}>
                    RESUMEN DE COSTOS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                    {camposPorSeccion.costos.map((campo) => (
                      <div key={campo.id} style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>{campo.nombre_display}</div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                          ${(parseFloat(camposDinamicos[campo.nombre_campo]) || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>COSTO TOTAL</div>
                    <div style={{ fontSize: '28px', fontWeight: '700' }}>
                      ${(
                        (parseFloat(camposDinamicos.costo_material) || 0) +
                        (parseFloat(camposDinamicos.costo_confeccion) || 0) +
                        (parseFloat(camposDinamicos.costo_empaque) || 0)
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Formulario básico para categorías nuevas sin campos dinámicos */}
          {!esCategoriaLegacy() && camposCategoria.length === 0 && (
            <div style={{ background: colors.sidebarBg, borderRadius: '8px', padding: '25px', color: colors.sidebarText }}>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', letterSpacing: '1px' }}>
                PRECIO DE VENTA
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>PRECIO DE VENTA</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formProducto.precioVenta}
                    onChange={(e) => setFormProducto({ ...formProducto, precioVenta: parseFloat(e.target.value) || 0 })}
                    disabled={!isAdmin}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '18px',
                      fontWeight: '600',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      color: colors.sidebarText,
                      textAlign: 'center'
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '12px' }}>
                Puedes agregar campos personalizados desde la configuración de categoría.
              </div>
            </div>
          )}

          {/* Formulario legacy para Totebags */}
          {esCategoriaLegacy() && (
          <>
          {/* 2. Parámetros de Producción */}
          <div style={sectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <label style={{ ...labelStyle, margin: 0, fontSize: '15px' }}>2. Parámetros de Producción</label>
              {isAdmin && (
                <button onClick={() => setEditandoAnchos(!editandoAnchos)}
                  style={{ padding: '6px 12px', background: editandoAnchos ? colors.sidebarBg : colors.sand,
                    color: editandoAnchos ? colors.sidebarText : colors.espresso,
                    border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  {editandoAnchos ? 'Cerrar Editor' : 'Editar Telas (Admin)'}
                </button>
              )}
            </div>

            {/* Editor de anchos de tela - SOLO ADMIN */}
            {editandoAnchos && isAdmin && (
              <div style={{ background: colors.cotton, border: `2px solid ${colors.terracotta}`, borderRadius: '6px', padding: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: colors.terracotta }}>
                    Anchos de Tela Disponibles (Solo Admin)
                  </div>
                  <button onClick={guardarTiposTela}
                    style={{ padding: '6px 12px', background: colors.terracotta, color: 'white',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>
                    Guardar Cambios
                  </button>
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
            <label style={{ ...labelStyle, fontSize: '15px', marginBottom: '15px' }}>3. Serigrafía (costo por pieza)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
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
              <div>
                <label style={labelStyle}>4 Tintas ($)</label>
                <input type="number" value={formProducto.serigrafia4} step="0.5"
                  onChange={(e) => setFormProducto({ ...formProducto, serigrafia4: parseFloat(e.target.value) || 0 })}
                  style={inputStyle} />
              </div>
            </div>
          </div>

          {/* 4. Empaque */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, fontSize: '15px', marginBottom: '15px' }}>4. Empaque</label>
            <div style={{ maxWidth: '250px' }}>
              <label style={labelStyle}>Costo por pieza ($)</label>
              <input type="number" value={formProducto.empaque} step="0.5"
                onChange={(e) => setFormProducto({ ...formProducto, empaque: parseFloat(e.target.value) || 0 })}
                style={inputStyle} />
            </div>
          </div>

          {/* 5. Tipo de Entrega */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, fontSize: '15px', marginBottom: '15px' }}>5. Tipo de Entrega</label>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <label style={{
                flex: 1,
                padding: '15px',
                background: formProducto.tipoEntrega === 'recolecta' ? colors.sidebarBg : colors.cream,
                color: formProducto.tipoEntrega === 'recolecta' ? colors.sidebarText : colors.espresso,
                border: `2px solid ${formProducto.tipoEntrega === 'recolecta' ? colors.sidebarBg : colors.sand}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}>
                <input type="radio" name="tipoEntrega" value="recolecta"
                  checked={formProducto.tipoEntrega === 'recolecta'}
                  onChange={() => setFormProducto({ ...formProducto, tipoEntrega: 'recolecta' })}
                  style={{ display: 'none' }} />
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Recolecta Local</div>
                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Blacksheep (Sin costo de envío)</div>
              </label>
              <label style={{
                flex: 1,
                padding: '15px',
                background: formProducto.tipoEntrega === 'envio' ? colors.sidebarBg : colors.cream,
                color: formProducto.tipoEntrega === 'envio' ? colors.sidebarText : colors.espresso,
                border: `2px solid ${formProducto.tipoEntrega === 'envio' ? colors.sidebarBg : colors.sand}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}>
                <input type="radio" name="tipoEntrega" value="envio"
                  checked={formProducto.tipoEntrega === 'envio'}
                  onChange={() => setFormProducto({ ...formProducto, tipoEntrega: 'envio' })}
                  style={{ display: 'none' }} />
                <div style={{ fontWeight: '600', fontSize: '14px' }}>Envío</div>
                <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Zona Conurbada Puebla</div>
              </label>
            </div>

            {/* Configuración de envío (solo visible si es envío) */}
            {formProducto.tipoEntrega === 'envio' && (
              <div style={{
                background: isAdmin ? 'rgba(196, 120, 74, 0.1)' : colors.cotton,
                border: `1px solid ${isAdmin ? colors.terracotta : colors.sand}`,
                borderRadius: '8px',
                padding: '15px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '13px', color: colors.espresso }}>
                    <strong>Condición:</strong> Mínimo de piezas por envío para garantizar rentabilidad.
                  </div>
                  {isAdmin && (
                    <button onClick={guardarConfigEnvio}
                      style={{ padding: '6px 12px', background: colors.terracotta, color: 'white',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>
                      Guardar Config
                    </button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={labelStyle}>Costo Total Envío ($) {isAdmin && <span style={{ color: colors.terracotta, fontSize: '10px' }}>(Admin)</span>}</label>
                    <input type="number" value={formProducto.envio} step="1"
                      onChange={(e) => setFormProducto({ ...formProducto, envio: parseFloat(e.target.value) || 0 })}
                      disabled={!isAdmin}
                      style={{ ...inputStyle, background: isAdmin ? colors.cream : colors.sand, cursor: isAdmin ? 'text' : 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={labelStyle}>Mínimo Piezas {isAdmin && <span style={{ color: colors.terracotta, fontSize: '10px' }}>(Admin)</span>}</label>
                    <input type="number" value={formProducto.minPiezasEnvio} min="1"
                      onChange={(e) => setFormProducto({ ...formProducto, minPiezasEnvio: parseInt(e.target.value) || 1 })}
                      disabled={!isAdmin}
                      style={{ ...inputStyle, background: isAdmin ? colors.cream : colors.sand, cursor: isAdmin ? 'text' : 'not-allowed' }} />
                  </div>
                  <div style={{
                    background: colors.sidebarBg,
                    padding: '12px',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: colors.sidebarText, opacity: 0.8 }}>Envío por Pieza</div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: colors.sidebarText }}>${costos.envioPorPieza}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Resumen de Costos */}
          <div style={{ background: colors.sidebarBg, borderRadius: '8px', padding: '25px', color: colors.sidebarText }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', letterSpacing: '1px' }}>
              RESUMEN DE COSTOS {formProducto.tipoEntrega === 'recolecta' ? '(Recolecta Local)' : '(Con Envío)'}
            </div>

            {/* Desglose de costos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Costo Tela</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>${costos.costoTela}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Subtotal</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>${costos.subtotal}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Con Merma ({formProducto.merma}%)</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>${costos.conMerma}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>Empaque</div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>${costos.empaque}</div>
              </div>
              {formProducto.tipoEntrega === 'envio' && (
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>Envío/pza (mín {formProducto.minPiezasEnvio})</div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>${costos.envioPorPieza}</div>
                </div>
              )}
            </div>

            {/* Costo Base (SIN serigrafía) */}
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '15px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>
                COSTO BASE (Sin Serigrafía, {formProducto.tipoEntrega === 'recolecta' ? 'Sin Envío' : 'Con Envío'})
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>
                ${formProducto.tipoEntrega === 'recolecta' ? costos.costoBase : costos.baseConEnvio}
              </div>
            </div>

            {/* Totales con Serigrafía */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
              <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '15px', textAlign: 'center' }}>
                COSTOS TOTALES CON SERIGRAFÍA
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'rgba(171,213,94,0.2)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>1 TINTA</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '5px' }}>${costos.total1Tinta}</div>
                </div>
                <div style={{ background: 'rgba(171,213,94,0.3)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>2 TINTAS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '5px' }}>${costos.total2Tintas}</div>
                </div>
                <div style={{ background: 'rgba(171,213,94,0.4)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>3 TINTAS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '5px' }}>${costos.total3Tintas}</div>
                </div>
                <div style={{ background: 'rgba(171,213,94,0.5)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', opacity: 0.9 }}>4 TINTAS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '5px' }}>${costos.total4Tintas}</div>
                </div>
              </div>
            </div>

            {/* Precio de Venta */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px' }}>PRECIO DE VENTA SUGERIDO</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formProducto.precioVenta}
                    onChange={(e) => setFormProducto({ ...formProducto, precioVenta: parseFloat(e.target.value) || 0 })}
                    disabled={!isAdmin}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '18px',
                      fontWeight: '600',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.1)',
                      color: colors.sidebarText,
                      textAlign: 'center'
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div style={{ textAlign: 'center', padding: '10px' }}>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>Margen estimado</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: colors.olive }}>
                    {formProducto.precioVenta > 0 && parseFloat(costos.total1Tinta) > 0
                      ? `${(((formProducto.precioVenta - parseFloat(costos.total1Tinta)) / parseFloat(costos.total1Tinta)) * 100).toFixed(0)}%`
                      : '--'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
          {/* Fin formulario legacy Totebags */}

          {/* Mensaje de estado */}
          {mensaje.texto && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              borderRadius: '6px',
              background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
              border: `1px solid ${mensaje.tipo === 'exito' ? colors.sidebarText : colors.terracotta}`,
              color: mensaje.tipo === 'exito' ? colors.olive : colors.terracotta,
              textAlign: 'center',
              fontWeight: '500'
            }}>
              {mensaje.texto}
            </div>
          )}

          {/* Botón Guardar */}
          <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => { setLineaSeleccionada(null); setCamposDinamicos({}); }}
              disabled={guardando}
              style={{ padding: '12px 25px', background: colors.sand, color: colors.espresso,
                border: 'none', borderRadius: '6px', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: '14px',
                opacity: guardando ? 0.6 : 1 }}>
              Cancelar
            </button>
            <button onClick={guardarProducto}
              disabled={guardando}
              style={{ padding: '12px 25px', background: guardando ? colors.camel : colors.sidebarBg, color: colors.sidebarText,
                border: 'none', borderRadius: '6px', cursor: guardando ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '500',
                opacity: guardando ? 0.8 : 1 }}>
              {guardando ? 'Guardando...' : (productoEditandoId ? 'Actualizar Producto' : 'Guardar Producto')}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Lista de productos guardados */}
          {productosGuardados.length > 0 ? (
            <div>
              <div style={{ display: 'grid', gap: '15px' }}>
                {productosGuardados.map((prod) => (
                  <div key={prod.id} style={{
                    background: colors.cotton,
                    border: '2px solid #DA9F17',
                    padding: '20px',
                    borderRadius: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ margin: 0, color: colors.espresso, fontSize: '16px' }}>
                          {prod.linea_nombre}
                          {prod.categoria && (
                            <span style={{
                              marginLeft: '10px',
                              background: colors.sand,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '400'
                            }}>
                              {prod.categoria.icono} {prod.categoria.nombre}
                            </span>
                          )}
                          {prod.subcategoria && (
                            <span style={{
                              marginLeft: '5px',
                              background: colors.olive,
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '400'
                            }}>
                              {prod.subcategoria.nombre}
                            </span>
                          )}
                        </h4>
                        <p style={{ margin: '5px 0', color: colors.camel, fontSize: '13px' }}>{prod.linea_medidas}</p>
                        {prod.descripcion && <p style={{ margin: '5px 0', color: colors.espresso, fontSize: '13px' }}>{prod.descripcion}</p>}
                        {/* Mostrar campos dinámicos si existen */}
                        {prod.campos_dinamicos && Object.keys(prod.campos_dinamicos).length > 0 && (
                          <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {prod.campos_dinamicos.talla_cama && (
                              <span style={{ fontSize: '11px', background: colors.cream, padding: '3px 8px', borderRadius: '4px', color: colors.espresso }}>
                                Talla: {prod.campos_dinamicos.talla_cama}
                              </span>
                            )}
                            {prod.campos_dinamicos.hilos && (
                              <span style={{ fontSize: '11px', background: colors.cream, padding: '3px 8px', borderRadius: '4px', color: colors.espresso }}>
                                {prod.campos_dinamicos.hilos} hilos
                              </span>
                            )}
                            {prod.campos_dinamicos.composicion && (
                              <span style={{ fontSize: '11px', background: colors.cream, padding: '3px 8px', borderRadius: '4px', color: colors.espresso }}>
                                {prod.campos_dinamicos.composicion}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: colors.camel }}>
                          {prod.categoria?.slug === 'totebags' ? 'Costo Total (1 tinta)' : 'Costo Total'}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '600', color: colors.sidebarBg }}>${prod.costo_total_1_tinta?.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Indicadores de Stock */}
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginTop: '15px',
                      padding: '12px',
                      background: colors.cream,
                      borderRadius: '6px',
                      border: `1px solid ${colors.sand}`
                    }}>
                      {(() => {
                        // Usar stock de variantes si el producto tiene variantes
                        const stockTaller = prod.tiene_variantes ? (prod.stock_variantes || 0) : (prod.stock || 0);
                        const stockConsig = prod.tiene_variantes ? (prod.stock_consignacion_variantes || 0) : (prod.stock_consignacion || 0);
                        const stockTotal = stockTaller + stockConsig;
                        return (
                          <>
                            <div style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: '8px',
                              background: colors.cotton,
                              borderRadius: '4px',
                              border: `1px solid ${stockTaller > 0 ? colors.olive : colors.sand}`
                            }}>
                              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '4px' }}>
                                Stock Taller {prod.tiene_variantes && <span style={{ fontSize: '9px' }}>(var)</span>}
                              </div>
                              <div style={{
                                fontSize: '22px',
                                fontWeight: '700',
                                color: stockTaller > 0 ? colors.olive : colors.camel
                              }}>
                                {stockTaller}
                              </div>
                              <div style={{ fontSize: '10px', color: colors.camel }}>unidades</div>
                            </div>
                            <div style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: '8px',
                              background: colors.cotton,
                              borderRadius: '4px',
                              border: `1px solid ${stockConsig > 0 ? colors.terracotta : colors.sand}`
                            }}>
                              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '4px' }}>
                                Consignacion {prod.tiene_variantes && <span style={{ fontSize: '9px' }}>(var)</span>}
                              </div>
                              <div style={{
                                fontSize: '22px',
                                fontWeight: '700',
                                color: stockConsig > 0 ? colors.terracotta : colors.camel
                              }}>
                                {stockConsig}
                              </div>
                              <div style={{ fontSize: '10px', color: colors.camel }}>unidades</div>
                            </div>
                            <div style={{
                              flex: 1,
                              textAlign: 'center',
                              padding: '8px',
                              background: stockTotal > 0 ? 'rgba(171,213,94,0.15)' : colors.cotton,
                              borderRadius: '4px',
                              border: `1px solid ${colors.sidebarBg}`
                            }}>
                              <div style={{ fontSize: '11px', color: colors.sidebarBg, marginBottom: '4px' }}>Total</div>
                              <div style={{
                                fontSize: '22px',
                                fontWeight: '700',
                                color: colors.sidebarBg
                              }}>
                                {stockTotal}
                              </div>
                              <div style={{ fontSize: '10px', color: colors.sidebarBg }}>disponible</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Seccion de Archivos (Imagen y PDFs) */}
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      background: colors.cream,
                      borderRadius: '6px',
                      border: `1px solid ${colors.sand}`
                    }}>
                      <div
                        onClick={() => setExpandirArchivos({ ...expandirArchivos, [prod.id]: !expandirArchivos[prod.id] })}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso }}>
                          Archivos del Producto
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {prod.imagen_url && <span style={{ fontSize: '14px' }}>🖼️</span>}
                          {prod.pdf_patron_url && <span style={{ fontSize: '14px' }}>📐</span>}
                          {prod.pdf_instrucciones_url && <span style={{ fontSize: '14px' }}>📋</span>}
                          <span style={{ fontSize: '16px', color: colors.camel }}>
                            {expandirArchivos[prod.id] ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {expandirArchivos[prod.id] && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Imagen del producto */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            background: colors.cotton,
                            borderRadius: '4px',
                            border: `1px solid ${prod.imagen_url ? colors.olive : colors.sand}`
                          }}>
                            {prod.imagen_url ? (
                              <img
                                src={prod.imagen_url}
                                alt={prod.linea_nombre}
                                style={{
                                  width: '60px',
                                  height: '60px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  border: `1px solid ${colors.sand}`
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '60px',
                                height: '60px',
                                background: colors.sand,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '24px'
                              }}>
                                🖼️
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: '500', color: colors.espresso }}>
                                Imagen del Producto
                              </div>
                              <div style={{ fontSize: '11px', color: colors.camel }}>
                                {prod.imagen_nombre || 'Sin imagen'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {prod.imagen_url && (
                                <button
                                  onClick={() => setImagenPopup({ url: prod.imagen_url, nombre: prod.linea_nombre })}
                                  onMouseEnter={() => setHoverVerBtn({ ...hoverVerBtn, [`img-${prod.id}`]: true })}
                                  onMouseLeave={() => setHoverVerBtn({ ...hoverVerBtn, [`img-${prod.id}`]: false })}
                                  style={{
                                    padding: '6px 10px',
                                    background: hoverVerBtn[`img-${prod.id}`] ? colors.sidebarBg : '#DA9F17',
                                    color: hoverVerBtn[`img-${prod.id}`] ? '#DA9F17' : colors.sidebarBg,
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  Ver
                                </button>
                              )}
                              {isAdmin && (
                                <label style={{
                                  padding: '6px 12px',
                                  background: subiendoArchivo[`img-${prod.id}`] ? colors.sand : colors.sidebarBg,
                                  color: colors.sidebarText,
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: subiendoArchivo[`img-${prod.id}`] ? 'wait' : 'pointer',
                                  fontWeight: '500'
                                }}>
                                  {subiendoArchivo[`img-${prod.id}`] ? 'Subiendo...' : (prod.imagen_url ? 'Cambiar' : 'Subir')}
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={(e) => handleImagenUpload(prod.id, e)}
                                    style={{ display: 'none' }}
                                    disabled={subiendoArchivo[`img-${prod.id}`]}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* PDF Patron de corte */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            background: colors.cotton,
                            borderRadius: '4px',
                            border: `1px solid ${prod.pdf_patron_url ? colors.terracotta : colors.sand}`
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: prod.pdf_patron_url ? 'rgba(196,120,74,0.15)' : colors.sand,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px'
                            }}>
                              📐
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: '500', color: colors.espresso }}>
                                Patron de Corte
                              </div>
                              <div style={{ fontSize: '11px', color: colors.camel }}>
                                {prod.pdf_patron_nombre || 'Sin archivo'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {prod.pdf_patron_url && (
                                <button
                                  onClick={() => abrirPdf(prod.pdf_patron_url)}
                                  onMouseEnter={() => setHoverVerBtn({ ...hoverVerBtn, [`patron-${prod.id}`]: true })}
                                  onMouseLeave={() => setHoverVerBtn({ ...hoverVerBtn, [`patron-${prod.id}`]: false })}
                                  style={{
                                    padding: '6px 10px',
                                    background: hoverVerBtn[`patron-${prod.id}`] ? colors.sidebarBg : '#DA9F17',
                                    color: hoverVerBtn[`patron-${prod.id}`] ? '#DA9F17' : colors.sidebarBg,
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  Ver
                                </button>
                              )}
                              {isAdmin && (
                                <label style={{
                                  padding: '6px 10px',
                                  background: subiendoArchivo[`patron-${prod.id}`] ? colors.sand : colors.sidebarBg,
                                  color: colors.sidebarText,
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: subiendoArchivo[`patron-${prod.id}`] ? 'wait' : 'pointer',
                                  fontWeight: '500'
                                }}>
                                  {subiendoArchivo[`patron-${prod.id}`] ? '...' : (prod.pdf_patron_url ? 'Cambiar' : 'Subir')}
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => handlePdfUpload(prod.id, 'patron', e)}
                                    style={{ display: 'none' }}
                                    disabled={subiendoArchivo[`patron-${prod.id}`]}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          {/* PDF Instrucciones de confeccion */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            background: colors.cotton,
                            borderRadius: '4px',
                            border: `1px solid ${prod.pdf_instrucciones_url ? colors.sidebarBg : colors.sand}`
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              background: prod.pdf_instrucciones_url ? 'rgba(0,95,132,0.15)' : colors.sand,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px'
                            }}>
                              📋
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: '500', color: colors.espresso }}>
                                Instrucciones de Confeccion
                              </div>
                              <div style={{ fontSize: '11px', color: colors.camel }}>
                                {prod.pdf_instrucciones_nombre || 'Sin archivo'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {prod.pdf_instrucciones_url && (
                                <button
                                  onClick={() => abrirPdf(prod.pdf_instrucciones_url)}
                                  onMouseEnter={() => setHoverVerBtn({ ...hoverVerBtn, [`instr-${prod.id}`]: true })}
                                  onMouseLeave={() => setHoverVerBtn({ ...hoverVerBtn, [`instr-${prod.id}`]: false })}
                                  style={{
                                    padding: '6px 10px',
                                    background: hoverVerBtn[`instr-${prod.id}`] ? colors.sidebarBg : '#DA9F17',
                                    color: hoverVerBtn[`instr-${prod.id}`] ? '#DA9F17' : colors.sidebarBg,
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    transition: 'all 0.3s ease'
                                  }}
                                >
                                  Ver
                                </button>
                              )}
                              {isAdmin && (
                                <label style={{
                                  padding: '6px 10px',
                                  background: subiendoArchivo[`instrucciones-${prod.id}`] ? colors.sand : colors.olive,
                                  color: 'white',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: subiendoArchivo[`instrucciones-${prod.id}`] ? 'wait' : 'pointer',
                                  fontWeight: '500'
                                }}>
                                  {subiendoArchivo[`instrucciones-${prod.id}`] ? '...' : (prod.pdf_instrucciones_url ? 'Cambiar' : 'Subir')}
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => handlePdfUpload(prod.id, 'instrucciones', e)}
                                    style={{ display: 'none' }}
                                    disabled={subiendoArchivo[`instrucciones-${prod.id}`]}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: colors.camel }}>
                        <span>2 tintas: ${prod.costo_total_2_tintas?.toFixed(2)}</span>
                        <span>3 tintas: ${prod.costo_total_3_tintas?.toFixed(2)}</span>
                        {prod.costo_total_4_tintas > 0 && <span>4 tintas: ${prod.costo_total_4_tintas?.toFixed(2)}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Botón Variantes */}
                        <button
                          onClick={() => abrirVariantes(prod)}
                          onMouseEnter={() => setHoverEditar({ ...hoverEditar, [`var-${prod.id}`]: true })}
                          onMouseLeave={() => setHoverEditar({ ...hoverEditar, [`var-${prod.id}`]: false })}
                          style={{
                            padding: '8px 14px',
                            background: hoverEditar[`var-${prod.id}`] ? '#9b59b6' : '#8e44ad',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                          }}>
                          Variantes
                        </button>
                        <button
                          onClick={() => editarProductoDirecto(prod)}
                          onMouseEnter={() => setHoverEditar({ ...hoverEditar, [prod.id]: true })}
                          onMouseLeave={() => setHoverEditar({ ...hoverEditar, [prod.id]: false })}
                          style={{
                            padding: '8px 18px',
                            background: hoverEditar[prod.id] ? colors.sidebarText : colors.sidebarBg,
                            color: hoverEditar[prod.id] ? colors.sidebarBg : colors.sidebarText,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                          }}>
                          Editar
                        </button>
                        {/* Botón eliminar producto (solo admin) */}
                        {isAdmin && (
                          <button
                            onClick={() => eliminarProductoHandler(prod.id, prod.linea_nombre)}
                            onMouseEnter={() => setHoverEditar({ ...hoverEditar, [`del-${prod.id}`]: true })}
                            onMouseLeave={() => setHoverEditar({ ...hoverEditar, [`del-${prod.id}`]: false })}
                            style={{
                              padding: '8px 14px',
                              background: hoverEditar[`del-${prod.id}`] ? '#c0392b' : colors.terracotta,
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              transition: 'all 0.3s ease'
                            }}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: colors.cotton, border: '2px solid #DA9F17', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
              <span style={{ fontSize: '48px' }}>🛍️</span>
              <h3 style={{ margin: '20px 0 10px', color: colors.espresso }}>Sin productos registrados</h3>
              <p style={{ color: colors.camel, fontSize: '14px' }}>Haz clic en "+ Agregar" para crear tu primer producto</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Variantes */}
      {productoVariantes && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: colors.cotton, borderRadius: '12px', padding: isMobile ? '16px' : '25px',
            maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.espresso }}>Variantes: {productoVariantes.linea_nombre}</h3>
                <p style={{ margin: '5px 0 0', fontSize: '13px', color: colors.camel }}>{productoVariantes.linea_medidas}</p>
              </div>
              <button onClick={cerrarVariantes} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: colors.camel }}>×</button>
            </div>

            {/* Mensaje */}
            {mensaje.texto && (
              <div style={{
                marginBottom: '15px', padding: '12px', borderRadius: '6px',
                background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
                color: mensaje.tipo === 'exito' ? colors.olive : colors.terracotta,
                textAlign: 'center', fontSize: '14px'
              }}>
                {mensaje.texto}
              </div>
            )}

            {/* Botón agregar variante */}
            {isAdmin && !mostrarFormVariante && (
              <button
                onClick={nuevaVarianteHandler}
                style={{
                  marginBottom: '20px', padding: '10px 20px',
                  background: colors.sidebarBg, color: colors.sidebarText,
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500'
                }}
              >
                + Nueva Variante
              </button>
            )}

            {/* Formulario de variante */}
            {mostrarFormVariante && (
              <div style={{
                background: colors.cream, padding: '20px', borderRadius: '8px',
                marginBottom: '20px', border: `2px solid ${colors.sidebarBg}`
              }}>
                <h4 style={{ margin: '0 0 15px', color: colors.sidebarBg }}>
                  {varianteEditando ? 'Editar Variante' : 'Nueva Variante'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Material</label>
                    <input
                      type="text"
                      value={formVariante.material}
                      onChange={(e) => setFormVariante({ ...formVariante, material: e.target.value })}
                      placeholder="Ej: Franela, Algodón..."
                      style={{ width: '100%', padding: '10px', border: `2px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Color</label>
                    <input
                      type="text"
                      value={formVariante.color}
                      onChange={(e) => setFormVariante({ ...formVariante, color: e.target.value })}
                      placeholder="Ej: Azul, Rojo..."
                      style={{ width: '100%', padding: '10px', border: `2px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Talla</label>
                    <input
                      type="text"
                      value={formVariante.talla}
                      onChange={(e) => setFormVariante({ ...formVariante, talla: e.target.value })}
                      placeholder="Ej: Matrimonial, Queen..."
                      style={{ width: '100%', padding: '10px', border: `2px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={formVariante.stock}
                      onChange={(e) => setFormVariante({ ...formVariante, stock: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: `2px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Costo Unitario</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formVariante.costo_unitario}
                      onChange={(e) => setFormVariante({ ...formVariante, costo_unitario: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: `2px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Precio Venta</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formVariante.precio_venta}
                      onChange={(e) => setFormVariante({ ...formVariante, precio_venta: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: `2px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Imagen de la variante */}
                <div style={{ marginTop: '15px', padding: '15px', background: colors.cotton, borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '10px', fontWeight: '600' }}>
                    Imagen de la Variante
                  </label>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Preview de imagen actual */}
                    {formVariante.imagen_url && (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={formVariante.imagen_url}
                          alt="Variante"
                          style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: `2px solid ${colors.sand}` }}
                        />
                        <button
                          onClick={async () => {
                            if (varianteEditando && formVariante.imagen_url) {
                              await deleteImagenVariante(varianteEditando.id, formVariante.imagen_url);
                              setFormVariante({ ...formVariante, imagen_url: '' });
                              setVariantes(variantes.map(v => v.id === varianteEditando.id ? { ...v, imagen_url: null } : v));
                            } else {
                              setFormVariante({ ...formVariante, imagen_url: '' });
                            }
                          }}
                          style={{
                            position: 'absolute', top: '-8px', right: '-8px',
                            background: colors.terracotta, color: 'white',
                            border: 'none', borderRadius: '50%', width: '24px', height: '24px',
                            cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                    {/* Input para subir imagen */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={subiendoImagenVariante || !varianteEditando}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && varianteEditando) {
                            setSubiendoImagenVariante(true);
                            const { url, error } = await uploadImagenVariante(file, varianteEditando.id);
                            if (url) {
                              setFormVariante({ ...formVariante, imagen_url: url });
                              setVariantes(variantes.map(v => v.id === varianteEditando.id ? { ...v, imagen_url: url } : v));
                              setMensaje({ tipo: 'exito', texto: 'Imagen subida correctamente' });
                            } else {
                              setMensaje({ tipo: 'error', texto: 'Error al subir imagen: ' + (error || 'Desconocido') });
                            }
                            setSubiendoImagenVariante(false);
                            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
                          }
                          e.target.value = '';
                        }}
                        style={{ display: 'block', marginBottom: '8px' }}
                      />
                      {subiendoImagenVariante && (
                        <div style={{ color: colors.camel, fontSize: '12px' }}>Subiendo imagen...</div>
                      )}
                      {!varianteEditando && (
                        <div style={{ color: colors.camel, fontSize: '12px' }}>
                          Guarda la variante primero para poder subir imagen
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button
                    onClick={() => { setMostrarFormVariante(false); setVarianteEditando(null); }}
                    style={{ padding: '10px 20px', background: colors.sand, color: colors.espresso, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardarVariante}
                    disabled={guardando}
                    style={{ padding: '10px 20px', background: colors.sidebarBg, color: colors.sidebarText, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    {guardando ? 'Guardando...' : (varianteEditando ? 'Actualizar' : 'Guardar')}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de variantes */}
            {variantes.length > 0 ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {variantes.map((v) => (
                  <div key={v.id} style={{
                    background: colors.cream, border: `2px solid ${colors.sand}`,
                    borderRadius: '8px', padding: '15px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: '10px'
                  }}>
                    {/* Imagen de la variante */}
                    <div style={{ width: '70px', height: '70px', flexShrink: 0 }}>
                      {v.imagen_url ? (
                        <img
                          src={v.imagen_url}
                          alt={`${v.material || ''} ${v.color || ''}`}
                          style={{
                            width: '70px', height: '70px', objectFit: 'cover',
                            borderRadius: '8px', border: `2px solid ${colors.sand}`
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '70px', height: '70px', background: colors.cotton,
                          borderRadius: '8px', border: `2px dashed ${colors.sand}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '24px', color: colors.camel
                        }}>
                          📷
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                        {v.material && (
                          <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                            {v.material}
                          </span>
                        )}
                        {v.color && (
                          <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                            {v.color}
                          </span>
                        )}
                        {v.talla && (
                          <span style={{ background: '#fce4ec', color: '#c2185b', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                            {v.talla}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.camel }}>
                        SKU: {v.sku || 'Pendiente'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: colors.camel }}>STOCK</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: v.stock > 0 ? colors.olive : colors.terracotta }}>{v.stock}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: colors.camel }}>COSTO</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: colors.espresso }}>${parseFloat(v.costo_unitario || 0).toFixed(2)}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: colors.camel }}>PRECIO</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: colors.sidebarBg }}>${parseFloat(v.precio_venta || 0).toFixed(2)}</div>
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => abrirConfigCorte(v)}
                          style={{ padding: '6px 12px', background: '#16a085', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Corte
                        </button>
                        <button
                          onClick={() => editarVarianteHandler(v)}
                          style={{ padding: '6px 12px', background: colors.sidebarBg, color: colors.sidebarText, border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarVarianteHandler(v.id)}
                          style={{ padding: '6px 12px', background: colors.terracotta, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: colors.camel }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
                <p>No hay variantes registradas para este producto</p>
                {isAdmin && <p style={{ fontSize: '13px' }}>Haz clic en "+ Nueva Variante" para agregar</p>}
              </div>
            )}

            {/* Resumen de stock total */}
            {variantes.length > 0 && (
              <div style={{
                marginTop: '20px', padding: '15px', background: colors.sidebarBg,
                borderRadius: '8px', color: colors.sidebarText,
                display: 'flex', justifyContent: 'space-around', textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>VARIANTES</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{variantes.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>STOCK TOTAL</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{variantes.reduce((sum, v) => sum + (v.stock || 0), 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>VALOR INVENTARIO</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>
                    ${variantes.reduce((sum, v) => sum + ((v.stock || 0) * (parseFloat(v.costo_unitario) || 0)), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Configuración de Corte */}
      {mostrarConfigCorte && varianteConfigCorte && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1100
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', width: '900px', maxWidth: '95vw', maxHeight: '90vh',
            overflow: 'auto', padding: isMobile ? '16px' : '25px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: colors.olivo }}>
                Configuración de Corte - {varianteConfigCorte.material} {varianteConfigCorte.talla}
              </h3>
              <button onClick={cerrarConfigCorte} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Nombre de la configuración */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: colors.olivo }}>Nombre de configuración</label>
              <input
                type="text"
                value={formConfigCorte.nombre}
                onChange={(e) => setFormConfigCorte({ ...formConfigCorte, nombre: e.target.value })}
                placeholder="Ej: Juego Matrimonial Franela Estándar"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Columna izquierda: Metros Lineales */}
              <div>
                {/* Sábana Plana */}
                <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: colors.olivo }}>Sábana Plana</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formConfigCorte.incluye_sabana_plana}
                        onChange={(e) => setFormConfigCorte({ ...formConfigCorte, incluye_sabana_plana: e.target.checked })}
                      />
                      Incluir
                    </label>
                  </div>
                  {formConfigCorte.incluye_sabana_plana && (
                    <div>
                      <label style={{ fontSize: '12px', color: '#666' }}>Metros de tela</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formConfigCorte.metros_sabana_plana}
                        onChange={(e) => setFormConfigCorte({ ...formConfigCorte, metros_sabana_plana: e.target.value })}
                        placeholder="Ej: 2.5"
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Sábana de Cajón */}
                <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: colors.olivo }}>Sábana de Cajón (Ajustable)</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formConfigCorte.incluye_sabana_cajon}
                        onChange={(e) => setFormConfigCorte({ ...formConfigCorte, incluye_sabana_cajon: e.target.checked })}
                      />
                      Incluir
                    </label>
                  </div>
                  {formConfigCorte.incluye_sabana_cajon && (
                    <div>
                      <label style={{ fontSize: '12px', color: '#666' }}>Metros de tela</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formConfigCorte.metros_sabana_cajon}
                        onChange={(e) => setFormConfigCorte({ ...formConfigCorte, metros_sabana_cajon: e.target.value })}
                        placeholder="Ej: 2.0"
                        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                      />
                    </div>
                  )}
                </div>

                {/* Fundas */}
                <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: colors.olivo }}>Fundas</h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formConfigCorte.incluye_fundas}
                        onChange={(e) => setFormConfigCorte({ ...formConfigCorte, incluye_fundas: e.target.checked })}
                      />
                      Incluir
                    </label>
                  </div>
                  {formConfigCorte.incluye_fundas && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#666' }}>Metros por funda</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formConfigCorte.metros_fundas}
                          onChange={(e) => setFormConfigCorte({ ...formConfigCorte, metros_fundas: e.target.value })}
                          placeholder="Ej: 0.5"
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '12px', color: '#666' }}>Cantidad</label>
                        <input
                          type="number"
                          value={formConfigCorte.cantidad_fundas}
                          onChange={(e) => setFormConfigCorte({ ...formConfigCorte, cantidad_fundas: e.target.value })}
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* % Desperdicio */}
                <div style={{ background: colors.cremaClaro, padding: '15px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: colors.olivo }}>Ajustes</h4>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666' }}>% Desperdicio / Merma</label>
                    <input
                      type="number"
                      value={formConfigCorte.porcentaje_desperdicio}
                      onChange={(e) => setFormConfigCorte({ ...formConfigCorte, porcentaje_desperdicio: e.target.value })}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Columna derecha: Cálculos y Costos */}
              <div>
                {/* Cálculos en tiempo real */}
                <div style={{ background: colors.sidebarBg, padding: '15px', borderRadius: '8px', marginBottom: '15px', color: 'white' }}>
                  <h4 style={{ margin: '0 0 15px 0' }}>Resumen de Tela</h4>
                  {(() => {
                    const calc = calcularCorteTemporal();
                    return (
                      <div style={{ fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: 0.9 }}>
                          <span>Sábana Plana:</span>
                          <span>{calc.mSabanaPlana} m</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: 0.9 }}>
                          <span>Sábana Cajón:</span>
                          <span>{calc.mSabanaCajon} m</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: 0.9 }}>
                          <span>Fundas ({formConfigCorte.cantidad_fundas}x):</span>
                          <span>{calc.mFundas} m</span>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.3)', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span>Subtotal:</span>
                          <span>{calc.subtotalMetros} m</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', opacity: 0.8, fontSize: '12px' }}>
                          <span>+ {formConfigCorte.porcentaje_desperdicio}% desperdicio</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '4px' }}>
                          <span>TOTAL:</span>
                          <span>{calc.metrosConDesperdicio} m</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Costos */}
                <div style={{ background: '#f8f8f8', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: colors.olivo }}>Costos</h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: '#666' }}>Precio tela por metro ($)</label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input
                          type="number"
                          step="0.01"
                          value={formConfigCorte.precio_tela_metro}
                          onChange={(e) => setFormConfigCorte({ ...formConfigCorte, precio_tela_metro: e.target.value })}
                          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        {configCorteActual && (
                          <button
                            onClick={actualizarPrecioTela}
                            disabled={guardando}
                            style={{
                              padding: '8px 12px', background: colors.camel, color: 'white',
                              border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                            }}
                            title="Actualizar precio (guarda historial)"
                          >
                            Actualizar
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#666' }}>Costo confección ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formConfigCorte.costo_confeccion}
                        onChange={(e) => setFormConfigCorte({ ...formConfigCorte, costo_confeccion: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#666' }}>Costo empaque ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formConfigCorte.costo_empaque}
                        onChange={(e) => setFormConfigCorte({ ...formConfigCorte, costo_empaque: e.target.value })}
                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                      />
                    </div>
                  </div>

                  {/* Resumen de costos */}
                  {(() => {
                    const calc = calcularCorteTemporal();
                    return (
                      <div style={{ marginTop: '15px', padding: '10px', background: 'white', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span>Costo Material:</span>
                          <span>${calc.costoMaterial}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span>Confección:</span>
                          <span>${formConfigCorte.costo_confeccion || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span>Empaque:</span>
                          <span>${formConfigCorte.costo_empaque || 0}</span>
                        </div>
                        <hr style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', color: colors.olivo }}>
                          <span>COSTO TOTAL:</span>
                          <span>${calc.costoTotal}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Historial de precios */}
                {historialPrecios.length > 0 && (
                  <div style={{ background: '#fff9e6', padding: '15px', borderRadius: '8px', border: '1px solid #ffd54f' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: colors.camel }}>Historial de Precios</h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {historialPrecios.map((h, idx) => (
                        <div key={idx} style={{
                          display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                          borderBottom: idx < historialPrecios.length - 1 ? '1px solid #eee' : 'none',
                          fontSize: '13px'
                        }}>
                          <span>{new Date(h.fecha_vigencia).toLocaleDateString()}</span>
                          <span>${h.precio_tela_metro}/m</span>
                          <span style={{ fontWeight: '600' }}>${h.costo_total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mensaje y botones */}
            {mensaje.texto && (
              <div style={{
                marginTop: '15px', padding: '10px', borderRadius: '6px', textAlign: 'center',
                background: mensaje.tipo === 'error' ? '#fee' : '#efe',
                color: mensaje.tipo === 'error' ? '#c00' : '#060'
              }}>
                {mensaje.texto}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={cerrarConfigCorte}
                style={{ padding: '10px 20px', background: '#ddd', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarConfigCorte}
                disabled={guardando}
                style={{
                  padding: '10px 25px', background: colors.olivo, color: 'white',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                }}
              >
                {guardando ? 'Guardando...' : (configCorteActual ? 'Actualizar' : 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Vista Stocks
const StocksView = ({ isAdmin }) => {
  const [productosGuardados, setProductosGuardados] = useState([]);
  const [cantidadAgregar, setCantidadAgregar] = useState({});
  const [cantidadVariante, setCantidadVariante] = useState({}); // Para variantes: { varianteId: cantidad }
  const [cantidadConsigVariante, setCantidadConsigVariante] = useState({}); // Para consignación: { varianteId: cantidad }
  const [expandido, setExpandido] = useState({}); // Productos expandidos para ver variantes
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [hoverGuardar, setHoverGuardar] = useState({});

  // Cargar productos al montar
  useEffect(() => {
    const cargarProductos = async () => {
      if (isSupabaseConfigured) {
        const { data } = await getProductos();
        if (data) {
          setProductosGuardados(data);
          // Inicializar cantidad a agregar en 0 para todos
          const cantidadInicial = {};
          const cantidadVarianteInicial = {};
          data.forEach(prod => {
            cantidadInicial[prod.id] = 0;
            // Inicializar cantidades de variantes
            if (prod.variantes) {
              prod.variantes.forEach(v => {
                cantidadVarianteInicial[v.id] = 0;
              });
            }
          });
          setCantidadAgregar(cantidadInicial);
          setCantidadVariante(cantidadVarianteInicial);
        }
      }
    };
    cargarProductos();
  }, []);

  // Guardar stock de una variante (taller y/o consignación)
  const guardarStockVariante = async (variante, productoId) => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo administradores pueden modificar el stock' });
      return;
    }

    const cantTaller = parseInt(cantidadVariante[variante.id]) || 0;
    const cantConsig = parseInt(cantidadConsigVariante[variante.id]) || 0;

    if (cantTaller === 0 && cantConsig === 0) {
      setMensaje({ tipo: 'info', texto: 'No hay cambios' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      return;
    }

    // Consignación automática: sumar a consig resta del taller y viceversa
    // cantTaller: ajuste directo al taller (ej: entrada de producción)
    // cantConsig: mueve entre taller y consignación (+consig = -taller, -consig = +taller)
    const nuevoStock = (variante.stock || 0) + cantTaller - cantConsig;
    const nuevaConsig = (variante.stock_consignacion || 0) + cantConsig;

    if (nuevoStock < 0) {
      setMensaje({ tipo: 'error', texto: `Stock insuficiente en taller. Disponible: ${variante.stock || 0}` });
      return;
    }
    if (nuevaConsig < 0) {
      setMensaje({ tipo: 'error', texto: 'El stock en consignación no puede ser negativo' });
      return;
    }

    setGuardando(true);
    try {
      const { error } = await updateStockVariante(variante.id, nuevoStock, nuevaConsig);
      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        const cambios = [];
        cambios.push(`Taller: ${variante.stock || 0} → ${nuevoStock}`);
        cambios.push(`Consig: ${variante.stock_consignacion || 0} → ${nuevaConsig}`);
        setMensaje({ tipo: 'exito', texto: `Stock actualizado. ${cambios.join(' | ')}` });
        // Actualizar lista local
        setProductosGuardados(productosGuardados.map(p => {
          if (p.id === productoId && p.variantes) {
            const nuevasVariantes = p.variantes.map(v =>
              v.id === variante.id ? { ...v, stock: nuevoStock, stock_consignacion: nuevaConsig } : v
            );
            const variantesActivas = nuevasVariantes.filter(v => v.activo !== false);
            return {
              ...p,
              variantes: nuevasVariantes,
              stock_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0),
              stock_consignacion_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock_consignacion || 0), 0)
            };
          }
          return p;
        }));
        setCantidadVariante({ ...cantidadVariante, [variante.id]: 0 });
        setCantidadConsigVariante({ ...cantidadConsigVariante, [variante.id]: 0 });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Guardar stock de un producto (suma al stock actual)
  const guardarStock = async (productoId) => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo administradores pueden modificar el stock' });
      return;
    }

    const cantidad = parseInt(cantidadAgregar[productoId]) || 0;

    // Validar si hay cambios
    if (cantidad === 0) {
      setMensaje({ tipo: 'info', texto: 'No hay cambios' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      return;
    }

    setGuardando(true);
    try {
      const producto = productosGuardados.find(p => p.id === productoId);
      const stockActual = producto?.stock || 0;
      const nuevoStock = stockActual + cantidad;

      // No permitir stock negativo
      if (nuevoStock < 0) {
        setMensaje({ tipo: 'error', texto: 'El stock no puede ser negativo' });
        setGuardando(false);
        return;
      }

      const { error } = await updateProducto(productoId, {
        stock: nuevoStock
      });

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error al guardar: ' + error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: `Stock actualizado: ${stockActual} + ${cantidad} = ${nuevoStock}` });
        // Actualizar lista local
        setProductosGuardados(productosGuardados.map(p =>
          p.id === productoId ? { ...p, stock: nuevoStock } : p
        ));
        // Resetear campo de cantidad a 0
        setCantidadAgregar({ ...cantidadAgregar, [productoId]: 0 });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  const inputStyle = {
    width: '80px',
    padding: '8px 12px',
    border: '2px solid #DA9F17',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
    background: colors.cream
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
          Stocks
        </h2>
        {!isAdmin && (
          <span style={{ fontSize: '12px', color: colors.terracotta, background: 'rgba(196,120,74,0.1)', padding: '6px 12px', borderRadius: '4px' }}>
            Solo lectura (Admin requerido)
          </span>
        )}
      </div>

      {/* Resumen de inventario detallado por categoría > producto > variante */}
      {productosGuardados.length > 0 && (() => {
        // Agrupar por categoría y producto
        const estructura = {};
        let totalGeneral = { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 };

        productosGuardados.forEach(prod => {
          const catNombre = prod.categoria?.nombre || 'Sin Categoría';
          if (!estructura[catNombre]) {
            estructura[catNombre] = { productos: [], totales: { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 } };
          }

          const productoData = {
            nombre: prod.linea_nombre,
            variantes: [],
            totales: { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 }
          };

          if (prod.tiene_variantes) {
            const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
            variantesActivas.forEach(v => {
              const stock = v.stock || 0;
              const consig = v.stock_consignacion || 0;
              const costo = parseFloat(v.costo_unitario) || 0;
              const nombreVariante = [v.material, v.color, v.talla].filter(Boolean).join(' / ') || 'Sin especificar';

              productoData.variantes.push({
                nombre: nombreVariante,
                imagen: v.imagen_url,
                taller: stock,
                consignacion: consig,
                valorTaller: stock * costo,
                valorConsig: consig * costo
              });

              productoData.totales.taller += stock;
              productoData.totales.consignacion += consig;
              productoData.totales.valorTaller += stock * costo;
              productoData.totales.valorConsig += consig * costo;
            });
          } else {
            const stock = prod.stock || 0;
            const consig = prod.stock_consignacion || 0;
            const costo = parseFloat(prod.costo_total_1_tinta) || 0;

            productoData.totales.taller = stock;
            productoData.totales.consignacion = consig;
            productoData.totales.valorTaller = stock * costo;
            productoData.totales.valorConsig = consig * costo;
          }

          estructura[catNombre].productos.push(productoData);
          estructura[catNombre].totales.taller += productoData.totales.taller;
          estructura[catNombre].totales.consignacion += productoData.totales.consignacion;
          estructura[catNombre].totales.valorTaller += productoData.totales.valorTaller;
          estructura[catNombre].totales.valorConsig += productoData.totales.valorConsig;

          totalGeneral.taller += productoData.totales.taller;
          totalGeneral.consignacion += productoData.totales.consignacion;
          totalGeneral.valorTaller += productoData.totales.valorTaller;
          totalGeneral.valorConsig += productoData.totales.valorConsig;
        });

        const categorias = Object.keys(estructura);

        return (
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              background: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              border: `2px solid ${colors.sand}`
            }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: colors.sidebarBg, color: 'white' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>CATEGORÍA / PRODUCTO / VARIANTE</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '70px' }}>TALLER</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '100px' }}>VALOR</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '70px' }}>CONSIG.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '100px' }}>VALOR</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '110px', background: '#16a085' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((cat) => {
                    const catData = estructura[cat];
                    return (
                      <React.Fragment key={cat}>
                        {/* Fila de categoría */}
                        <tr style={{ background: colors.sand }}>
                          <td colSpan={6} style={{ padding: '10px 12px', fontWeight: '700', color: colors.sidebarBg, fontSize: '14px' }}>
                            📁 {cat}
                          </td>
                        </tr>
                        {/* Productos de esta categoría */}
                        {catData.productos.map((prod, pIdx) => (
                          <React.Fragment key={pIdx}>
                            {/* Fila de producto */}
                            <tr style={{ background: colors.cotton }}>
                              <td style={{ padding: '8px 12px', paddingLeft: '25px', fontWeight: '600', color: colors.espresso }}>
                                {prod.nombre}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.olive, fontWeight: '600' }}>{prod.totales.taller}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.olive }}>${prod.totales.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.terracotta, fontWeight: '600' }}>{prod.totales.consignacion}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.terracotta }}>${prod.totales.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#16a085' }}>
                                ${(prod.totales.valorTaller + prod.totales.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                            {/* Variantes del producto */}
                            {prod.variantes.map((v, vIdx) => (
                              <tr key={vIdx} style={{ background: 'white' }}>
                                <td style={{ padding: '6px 12px', paddingLeft: '45px', color: colors.camel, fontSize: '12px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    {v.imagen && <img src={v.imagen} alt="" onClick={() => setImagenPopup({ url: v.imagen, nombre: v.nombre })} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }} />}
                                    ↳ {v.nombre}
                                  </span>
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.olive, fontSize: '12px' }}>{v.taller}</td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.olive, fontSize: '12px' }}>${v.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.terracotta, fontSize: '12px' }}>{v.consignacion}</td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.terracotta, fontSize: '12px' }}>${v.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td style={{ padding: '6px', textAlign: 'center', fontSize: '12px', color: '#16a085' }}>
                                  ${(v.valorTaller + v.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                        {/* Subtotal de categoría */}
                        <tr style={{ background: 'rgba(22,160,133,0.15)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '700', color: '#16a085' }}>
                            Subtotal {cat}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: colors.olive }}>{catData.totales.taller}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: colors.olive }}>${catData.totales.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: colors.terracotta }}>{catData.totales.consignacion}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: colors.terracotta }}>${catData.totales.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#16a085', fontSize: '14px' }}>
                            ${(catData.totales.valorTaller + catData.totales.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {/* TOTAL GENERAL */}
                  <tr style={{ background: colors.sidebarBg, color: 'white', fontWeight: '700' }}>
                    <td style={{ padding: '12px' }}>TOTAL GENERAL</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{totalGeneral.taller}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>${totalGeneral.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{totalGeneral.consignacion}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>${totalGeneral.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '12px', textAlign: 'center', background: '#16a085', fontSize: '15px' }}>
                      ${(totalGeneral.valorTaller + totalGeneral.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          </div>
        );
      })()}

      {/* Mensaje de estado */}
      {mensaje.texto && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          borderRadius: '6px',
          background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' :
                      mensaje.tipo === 'info' ? 'rgba(50,205,50,0.15)' : 'rgba(196,120,74,0.2)',
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive :
                              mensaje.tipo === 'info' ? '#32CD32' : colors.terracotta}`,
          color: mensaje.tipo === 'exito' ? colors.olive :
                 mensaje.tipo === 'info' ? '#32CD32' : colors.terracotta,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Lista de productos con stock */}
      {productosGuardados.length > 0 ? (
        <div style={{ display: 'grid', gap: '15px' }}>
          {productosGuardados.map((prod) => {
            // Determinar stock según si tiene variantes o no
            const tieneVariantes = prod.tiene_variantes;
            const stockTaller = tieneVariantes ? (prod.stock_variantes || 0) : (prod.stock || 0);
            const stockConsig = tieneVariantes ? (prod.stock_consignacion_variantes || 0) : (prod.stock_consignacion || 0);
            const stockTotal = stockTaller + stockConsig;
            const numVariantes = prod.variantes?.filter(v => v.activo !== false)?.length || 0;

            // Calcular valor del inventario
            let valorInventario = 0;
            if (tieneVariantes) {
              const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
              variantesActivas.forEach(v => {
                valorInventario += ((v.stock || 0) + (v.stock_consignacion || 0)) * (parseFloat(v.costo_unitario) || 0);
              });
            } else {
              valorInventario = stockTotal * (parseFloat(prod.costo_total_1_tinta) || 0);
            }

            return (
            <React.Fragment key={prod.id}>
            <div style={{
              background: colors.cotton,
              border: `2px solid ${tieneVariantes ? '#16a085' : '#DA9F17'}`,
              padding: '20px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              {/* Info del producto */}
              <div style={{ flex: '1', minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: 0, color: colors.sidebarBg, fontSize: '16px', fontWeight: '600' }}>
                    {prod.linea_nombre}
                  </h4>
                  {tieneVariantes && (
                    <span style={{
                      background: '#16a085', color: 'white', padding: '2px 8px',
                      borderRadius: '10px', fontSize: '10px', fontWeight: '600'
                    }}>
                      {numVariantes} variantes
                    </span>
                  )}
                </div>
                <p style={{ margin: '5px 0 0', color: colors.camel, fontSize: '13px' }}>
                  {prod.categoria?.nombre && <span style={{ fontWeight: '500' }}>{prod.categoria.nombre}</span>}
                  {prod.linea_medidas && ` • ${prod.linea_medidas}`}
                </p>
              </div>

              {/* Stock para productos CON variantes */}
              {tieneVariantes ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TALLER</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.olive }}>
                      {stockTaller}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>CONSIG.</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.terracotta }}>
                      {stockConsig}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TOTAL</label>
                    <div style={{ padding: '6px 12px', background: colors.sidebarBg, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: 'white' }}>
                      {stockTotal}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>VALOR</label>
                    <div style={{ padding: '6px 12px', background: '#1abc9c', borderRadius: '4px', fontSize: '14px', fontWeight: '600', color: 'white' }}>
                      ${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  {/* Botón expandir variantes */}
                  {isAdmin && (
                    <button
                      onClick={() => setExpandido({ ...expandido, [prod.id]: !expandido[prod.id] })}
                      style={{
                        padding: '8px 15px', background: expandido[prod.id] ? colors.terracotta : '#16a085',
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500'
                      }}
                    >
                      {expandido[prod.id] ? '▲ Cerrar' : '▼ Editar Stock'}
                    </button>
                  )}
                  {/* Indicador visual */}
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: stockTotal > 10 ? colors.olive : stockTotal > 0 ? '#F7B731' : colors.terracotta
                  }} title={stockTotal > 10 ? 'Stock OK' : stockTotal > 0 ? 'Stock bajo' : 'Sin stock'} />
                </div>
              ) : (
                /* Stock para productos SIN variantes */
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TALLER</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.olive }}>
                      {stockTaller}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>CONSIG.</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.terracotta }}>
                      {stockConsig}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TOTAL</label>
                    <div style={{ padding: '6px 12px', background: colors.sidebarBg, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: 'white' }}>
                      {stockTotal}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>VALOR</label>
                    <div style={{ padding: '6px 12px', background: '#1abc9c', borderRadius: '4px', fontSize: '14px', fontWeight: '600', color: 'white' }}>
                      ${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ textAlign: 'center' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: colors.sidebarBg, marginBottom: '5px' }}>
                        AGREGAR (+/-)
                      </label>
                      <input
                        type="number"
                        value={cantidadAgregar[prod.id] || 0}
                        onChange={(e) => setCantidadAgregar({ ...cantidadAgregar, [prod.id]: e.target.value })}
                        style={inputStyle}
                        placeholder="0"
                      />
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => guardarStock(prod.id)}
                      onMouseEnter={() => setHoverGuardar({ ...hoverGuardar, [prod.id]: true })}
                      onMouseLeave={() => setHoverGuardar({ ...hoverGuardar, [prod.id]: false })}
                      disabled={guardando}
                      style={{
                        padding: '10px 20px',
                        background: hoverGuardar[prod.id] ? colors.sidebarText : colors.sidebarBg,
                        color: hoverGuardar[prod.id] ? colors.sidebarBg : colors.sidebarText,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: guardando ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        opacity: guardando ? 0.7 : 1
                      }}
                    >
                      Guardar
                    </button>
                  )}

                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: stockTotal > 10 ? colors.olive : stockTotal > 0 ? '#F7B731' : colors.terracotta
                  }} title={stockTotal > 10 ? 'Stock OK' : stockTotal > 0 ? 'Stock bajo' : 'Sin stock'} />
                </div>
              )}
            </div>

            {/* Panel expandible de variantes */}
            {tieneVariantes && expandido[prod.id] && (
              <div style={{
                background: '#f0faf8',
                border: '2px solid #16a085',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '15px',
                marginTop: '-8px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#16a085', marginBottom: '10px' }}>
                  Editar stock por variante:
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {(prod.variantes || []).filter(v => v.activo !== false).map(v => {
                    const nombreVar = [v.material, v.color, v.talla].filter(Boolean).join(' / ') || 'Sin especificar';
                    return (
                      <div key={v.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: 'white', padding: '10px 12px', borderRadius: '6px',
                        border: '1px solid #ddd'
                      }}>
                        {/* Imagen miniatura */}
                        {v.imagen_url ? (
                          <img src={v.imagen_url} alt="" onClick={() => setImagenPopup({ url: v.imagen_url, nombre: nombreVar })} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📦</div>
                        )}
                        {/* Nombre variante */}
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: colors.espresso }}>{nombreVar}</div>
                          <div style={{ fontSize: '10px', color: colors.camel }}>SKU: {v.sku || '-'}</div>
                        </div>
                        {/* Stock taller */}
                        <div style={{ textAlign: 'center', minWidth: '50px' }}>
                          <div style={{ fontSize: '10px', color: colors.camel }}>TALLER</div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.olive }}>{v.stock || 0}</div>
                        </div>
                        {/* Input agregar taller */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: colors.sidebarBg }}>+/- TALLER</div>
                          <input
                            type="number"
                            value={cantidadVariante[v.id] || 0}
                            onChange={(e) => setCantidadVariante({ ...cantidadVariante, [v.id]: e.target.value })}
                            style={{
                              width: '65px', padding: '6px', border: '2px solid #16a085',
                              borderRadius: '4px', fontSize: '14px', textAlign: 'center'
                            }}
                          />
                        </div>
                        {/* Stock consignación */}
                        <div style={{ textAlign: 'center', minWidth: '50px' }}>
                          <div style={{ fontSize: '10px', color: colors.camel }}>CONSIG.</div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.terracotta }}>{v.stock_consignacion || 0}</div>
                        </div>
                        {/* Input agregar consignación */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#e67e22' }}>+/- CONSIG.</div>
                          <input
                            type="number"
                            value={cantidadConsigVariante[v.id] || 0}
                            onChange={(e) => setCantidadConsigVariante({ ...cantidadConsigVariante, [v.id]: e.target.value })}
                            style={{
                              width: '65px', padding: '6px', border: '2px solid #e67e22',
                              borderRadius: '4px', fontSize: '14px', textAlign: 'center'
                            }}
                          />
                        </div>
                        {/* Botón guardar */}
                        <button
                          onClick={() => guardarStockVariante(v, prod.id)}
                          disabled={guardando}
                          style={{
                            padding: '8px 12px', background: '#16a085', color: 'white',
                            border: 'none', borderRadius: '4px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '500'
                          }}
                        >
                          Guardar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </React.Fragment>
          );
          })}
        </div>
      ) : (
        <div style={{ background: colors.cotton, border: '2px solid #DA9F17', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px' }}>📋</span>
          <h3 style={{ margin: '20px 0 10px', color: colors.espresso }}>Sin productos definidos</h3>
          <p style={{ color: colors.camel, fontSize: '14px' }}>Primero define productos en la sección "Productos"</p>
        </div>
      )}
    </div>
  );
};


// Vista Salidas (Consignación y Pedidos Directos)
const SalidasView = ({ isAdmin }) => {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [hoverBtn, setHoverBtn] = useState({});
  const [clienteHistorial, setClienteHistorial] = useState(null); // Cliente para ver historial
  const [confirmEliminar, setConfirmEliminar] = useState(null); // ID del movimiento a eliminar

  // Formulario de nueva salida
  const [formSalida, setFormSalida] = useState({
    productoId: '',
    varianteId: '',
    clienteId: '',
    tipoMovimiento: 'consignacion',
    cantidad: 0,
    precioUnitario: 0, // Para consignaciones: precio de venta sugerido
    notas: ''
  });

  // Formulario de nuevo cliente
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    tipo: 'directo',
    contacto: '',
    notas: ''
  });

  // Cargar datos al montar
  useEffect(() => {
    const cargarDatos = async () => {
      if (isSupabaseConfigured) {
        const [prodRes, cliRes, movRes] = await Promise.all([
          getProductos(),
          getClientes(),
          getMovimientosStock()
        ]);
        if (prodRes.data) setProductos(prodRes.data);
        if (cliRes.data) setClientes(cliRes.data);
        if (movRes.data) setMovimientos(movRes.data);
      }
    };
    cargarDatos();
  }, []);

  // Calcular resumen por producto
  const calcularResumen = (productoId) => {
    const movsProd = movimientos.filter(m => m.producto_id === productoId);
    let enConsignacion = 0;
    let vendidoDirecto = 0;
    let vendidoConsignacion = 0;
    let devuelto = 0;

    movsProd.forEach(mov => {
      switch (mov.tipo_movimiento) {
        case 'consignacion':
          enConsignacion += mov.cantidad;
          break;
        case 'venta_directa':
          vendidoDirecto += mov.cantidad;
          break;
        case 'venta_consignacion':
          vendidoConsignacion += mov.cantidad;
          enConsignacion -= mov.cantidad;
          break;
        case 'devolucion':
          devuelto += mov.cantidad;
          enConsignacion -= mov.cantidad;
          break;
      }
    });

    return { enConsignacion, vendidoDirecto, vendidoConsignacion, devuelto };
  };

  // Registrar salida
  const registrarSalida = async () => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo admin puede registrar salidas' });
      return;
    }

    if (!formSalida.productoId || !formSalida.clienteId || !formSalida.cantidad) {
      setMensaje({ tipo: 'error', texto: 'Completa todos los campos requeridos' });
      return;
    }

    const producto = productos.find(p => p.id === parseInt(formSalida.productoId));

    // Si tiene variantes, debe seleccionar una
    if (producto?.tiene_variantes && !formSalida.varianteId) {
      setMensaje({ tipo: 'error', texto: 'Selecciona una variante del producto' });
      return;
    }

    const cantidad = parseInt(formSalida.cantidad);
    if (cantidad <= 0) {
      setMensaje({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0' });
      return;
    }

    // Verificar stock disponible segun tipo de movimiento
    const variante = producto?.tiene_variantes
      ? (producto.variantes || []).find(v => v.id === parseInt(formSalida.varianteId))
      : null;
    const stockTaller = variante ? (variante.stock || 0) : (producto?.stock || 0);
    const stockConsignacion = variante ? (variante.stock_consignacion || 0) : (producto?.stock_consignacion || 0);

    // Validar segun tipo de movimiento
    if (formSalida.tipoMovimiento === 'consignacion' || formSalida.tipoMovimiento === 'venta_directa') {
      // Necesita stock en taller
      if (cantidad > stockTaller) {
        setMensaje({ tipo: 'error', texto: `Stock en taller insuficiente. Disponible: ${stockTaller}` });
        return;
      }
    } else if (formSalida.tipoMovimiento === 'venta_consignacion' || formSalida.tipoMovimiento === 'devolucion') {
      // Necesita stock en consignacion
      if (cantidad > stockConsignacion) {
        setMensaje({ tipo: 'error', texto: `Stock en consignacion insuficiente. Disponible: ${stockConsignacion}` });
        return;
      }
    }

    setGuardando(true);
    try {
      const movimiento = {
        producto_id: parseInt(formSalida.productoId),
        cliente_id: parseInt(formSalida.clienteId),
        tipo_movimiento: formSalida.tipoMovimiento,
        cantidad: cantidad,
        notas: formSalida.notas,
        ...(formSalida.varianteId ? { variante_id: parseInt(formSalida.varianteId) } : {})
      };

      let result;
      const cliente = clientes.find(c => c.id === parseInt(formSalida.clienteId));

      // Manejar según tipo de movimiento
      if (formSalida.tipoMovimiento === 'consignacion') {
        // Consignación: crear movimiento + venta pendiente
        const nombreVariante = variante ? [variante.material, variante.color, variante.talla].filter(Boolean).join(' / ') : '';
        const datosVenta = {
          producto_id: parseInt(formSalida.productoId),
          cliente_id: parseInt(formSalida.clienteId),
          producto_nombre: (producto?.linea_nombre || 'Producto') + (nombreVariante ? ` - ${nombreVariante}` : ''),
          producto_medidas: producto?.linea_medidas || '',
          cliente_nombre: cliente?.nombre || 'Cliente',
          cantidad: cantidad,
          precio_unitario: parseFloat(formSalida.precioUnitario) || 0,
          costo_unitario: variante ? (parseFloat(variante.costo_unitario) || 0) : (parseFloat(producto?.costo_total_1_tinta) || 0),
          notas: formSalida.notas,
          ...(formSalida.varianteId ? { variante_id: parseInt(formSalida.varianteId) } : {})
        };
        result = await createConsignacionConVenta(movimiento, datosVenta);
      } else if (formSalida.tipoMovimiento === 'venta_consignacion') {
        // Venta de consignación: crear movimiento + registrar pago en ventas pendientes
        const datosVenta = {
          producto_id: parseInt(formSalida.productoId),
          cliente_id: parseInt(formSalida.clienteId),
          cantidad: cantidad
        };
        result = await registrarVentaConsignacion(movimiento, datosVenta);
      } else if (formSalida.tipoMovimiento === 'devolucion') {
        // Devolución: crear movimiento + reducir/cancelar ventas pendientes
        const datosDevolucion = {
          producto_id: parseInt(formSalida.productoId),
          cliente_id: parseInt(formSalida.clienteId),
          cantidad: cantidad
        };
        result = await registrarDevolucionConsignacion(movimiento, datosDevolucion);
      } else if (formSalida.tipoMovimiento === 'venta_directa') {
        // Venta directa: crear movimiento + venta pagada
        result = await createMovimientoStock(movimiento);

        if (!result.error) {
          const nombreVariante = variante ? [variante.material, variante.color, variante.talla].filter(Boolean).join(' / ') : '';
          const ventaDirecta = {
            producto_id: parseInt(formSalida.productoId),
            cliente_id: parseInt(formSalida.clienteId),
            movimiento_id: result.data?.id,
            producto_nombre: (producto?.linea_nombre || 'Producto') + (nombreVariante ? ` - ${nombreVariante}` : ''),
            producto_medidas: producto?.linea_medidas || '',
            cliente_nombre: cliente?.nombre || 'Cliente',
            cantidad: cantidad,
            precio_unitario: parseFloat(formSalida.precioUnitario) || 0,
            total: cantidad * (parseFloat(formSalida.precioUnitario) || 0),
            costo_unitario: variante ? (parseFloat(variante.costo_unitario) || 0) : (parseFloat(producto?.costo_total_1_tinta) || 0),
            tipo_venta: 'directa',
            estado_pago: 'pagado',
            monto_pagado: cantidad * (parseFloat(formSalida.precioUnitario) || 0),
            metodo_pago: 'efectivo',
            notas: formSalida.notas || `Venta directa - ${new Date().toLocaleDateString('es-MX')}`,
            ...(formSalida.varianteId ? { variante_id: parseInt(formSalida.varianteId) } : {})
          };
          const ventaResult = await createVenta(ventaDirecta);

          // Registrar ingreso automático en caja
          if (!ventaResult.error && ventaDirecta.total > 0) {
            await createMovimientoCaja({
              tipo: 'ingreso',
              monto: ventaDirecta.total,
              venta_id: ventaResult.data?.id || null,
              categoria: 'venta',
              metodo_pago: 'efectivo',
              descripcion: `Venta directa - ${ventaDirecta.producto_nombre} - ${cantidad} pzas`
            });
          }
        }
      } else {
        // Otros: solo crear movimiento
        result = await createMovimientoStock(movimiento);
      }

      const { data, error } = result;

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        // Actualizar stock segun tipo de movimiento
        const productoId = parseInt(formSalida.productoId);

        if (variante) {
          // Producto CON variantes: actualizar stock de la variante
          const vStockActual = variante.stock || 0;
          const vConsigActual = variante.stock_consignacion || 0;
          let nuevoStock = vStockActual;
          let nuevaConsig = vConsigActual;

          if (formSalida.tipoMovimiento === 'venta_directa') {
            nuevoStock = vStockActual - cantidad;
          } else if (formSalida.tipoMovimiento === 'consignacion') {
            nuevoStock = vStockActual - cantidad;
            nuevaConsig = vConsigActual + cantidad;
          } else if (formSalida.tipoMovimiento === 'venta_consignacion') {
            nuevaConsig = vConsigActual - cantidad;
          } else if (formSalida.tipoMovimiento === 'devolucion') {
            nuevoStock = vStockActual + cantidad;
            nuevaConsig = vConsigActual - cantidad;
          }

          await updateStockVariante(variante.id, nuevoStock, nuevaConsig);

          // Actualizar estado local
          setProductos(productos.map(p => {
            if (p.id !== productoId) return p;
            const nuevasVariantes = (p.variantes || []).map(v =>
              v.id === variante.id ? { ...v, stock: nuevoStock, stock_consignacion: nuevaConsig } : v
            );
            const variantesActivas = nuevasVariantes.filter(v => v.activo !== false);
            return {
              ...p,
              variantes: nuevasVariantes,
              stock_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0),
              stock_consignacion_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock_consignacion || 0), 0)
            };
          }));
        } else {
          // Producto SIN variantes: actualizar stock del producto
          const stockActual = producto?.stock || 0;
          const consignacionActual = producto?.stock_consignacion || 0;

          if (formSalida.tipoMovimiento === 'venta_directa') {
            await updateProducto(productoId, { stock: stockActual - cantidad });
            setProductos(productos.map(p =>
              p.id === productoId ? { ...p, stock: stockActual - cantidad } : p
            ));
          } else if (formSalida.tipoMovimiento === 'consignacion') {
            await updateProducto(productoId, {
              stock: stockActual - cantidad,
              stock_consignacion: consignacionActual + cantidad
            });
            setProductos(productos.map(p =>
              p.id === productoId ? {
                ...p,
                stock: stockActual - cantidad,
                stock_consignacion: consignacionActual + cantidad
              } : p
            ));
          } else if (formSalida.tipoMovimiento === 'venta_consignacion') {
            await updateProducto(productoId, { stock_consignacion: consignacionActual - cantidad });
            setProductos(productos.map(p =>
              p.id === productoId ? { ...p, stock_consignacion: consignacionActual - cantidad } : p
            ));
          } else if (formSalida.tipoMovimiento === 'devolucion') {
            await updateProducto(productoId, {
              stock: stockActual + cantidad,
              stock_consignacion: consignacionActual - cantidad
            });
            setProductos(productos.map(p =>
              p.id === productoId ? {
                ...p,
                stock: stockActual + cantidad,
                stock_consignacion: consignacionActual - cantidad
              } : p
            ));
          }
        }

        setMensaje({ tipo: 'exito', texto: 'Salida registrada correctamente' });

        // Recargar movimientos
        const { data: newMovs } = await getMovimientosStock();
        if (newMovs) setMovimientos(newMovs);

        // Resetear formulario
        setFormSalida({ productoId: '', varianteId: '', clienteId: '', tipoMovimiento: 'consignacion', cantidad: 0, precioUnitario: 0, notas: '' });
        setMostrarFormulario(false);
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Crear nuevo cliente
  const crearCliente = async () => {
    if (!formCliente.nombre.trim()) {
      setMensaje({ tipo: 'error', texto: 'El nombre es requerido' });
      return;
    }

    setGuardando(true);
    try {
      const { data, error } = await createCliente(formCliente);
      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        setClientes([...clientes, data]);
        setFormCliente({ nombre: '', tipo: 'directo', contacto: '', notas: '' });
        setMostrarNuevoCliente(false);
        setMensaje({ tipo: 'exito', texto: 'Cliente agregado' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar movimiento de stock (y venta asociada si es consignación)
  const eliminarMovimiento = async (mov) => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo administradores pueden eliminar movimientos' });
      return;
    }

    setGuardando(true);
    try {
      // 1. Revertir el stock antes de eliminar
      const producto = productos.find(p => p.id === mov.producto_id);
      const cantidad = mov.cantidad || 0;

      if (mov.variante_id && producto?.tiene_variantes) {
        // Revertir stock de la variante
        const variante = (producto.variantes || []).find(v => v.id === mov.variante_id);
        if (variante) {
          let nuevoStock = variante.stock || 0;
          let nuevaConsig = variante.stock_consignacion || 0;

          if (mov.tipo_movimiento === 'venta_directa') {
            nuevoStock += cantidad; // devolver al taller
          } else if (mov.tipo_movimiento === 'consignacion') {
            nuevoStock += cantidad; // devolver al taller
            nuevaConsig -= cantidad; // quitar de consignación
          } else if (mov.tipo_movimiento === 'venta_consignacion') {
            nuevaConsig += cantidad; // devolver a consignación
          } else if (mov.tipo_movimiento === 'devolucion') {
            nuevoStock -= cantidad; // quitar del taller
            nuevaConsig += cantidad; // devolver a consignación
          }

          await updateStockVariante(variante.id, Math.max(0, nuevoStock), Math.max(0, nuevaConsig));

          // Actualizar estado local
          setProductos(productos.map(p => {
            if (p.id !== mov.producto_id) return p;
            const nuevasVariantes = (p.variantes || []).map(v =>
              v.id === variante.id ? { ...v, stock: Math.max(0, nuevoStock), stock_consignacion: Math.max(0, nuevaConsig) } : v
            );
            const variantesActivas = nuevasVariantes.filter(v => v.activo !== false);
            return {
              ...p,
              variantes: nuevasVariantes,
              stock_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0),
              stock_consignacion_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock_consignacion || 0), 0)
            };
          }));
        }
      } else if (producto) {
        // Revertir stock del producto padre
        let nuevoStock = producto.stock || 0;
        let nuevaConsig = producto.stock_consignacion || 0;

        if (mov.tipo_movimiento === 'venta_directa') {
          nuevoStock += cantidad;
        } else if (mov.tipo_movimiento === 'consignacion') {
          nuevoStock += cantidad;
          nuevaConsig -= cantidad;
        } else if (mov.tipo_movimiento === 'venta_consignacion') {
          nuevaConsig += cantidad;
        } else if (mov.tipo_movimiento === 'devolucion') {
          nuevoStock -= cantidad;
          nuevaConsig += cantidad;
        }

        await updateProducto(mov.producto_id, {
          stock: Math.max(0, nuevoStock),
          stock_consignacion: Math.max(0, nuevaConsig)
        });

        setProductos(productos.map(p =>
          p.id === mov.producto_id ? { ...p, stock: Math.max(0, nuevoStock), stock_consignacion: Math.max(0, nuevaConsig) } : p
        ));
      }

      // 2. Eliminar la venta asociada (consignación o venta directa)
      if (mov.tipo_movimiento === 'consignacion' || mov.tipo_movimiento === 'venta_directa') {
        await deleteVentaPorMovimiento(mov.id);
      }

      // 3. Eliminar el movimiento
      const { error } = await deleteMovimientoStock(mov.id);
      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: 'Movimiento eliminado y stock revertido correctamente' });
        setMovimientos(movimientos.filter(m => m.id !== mov.id));
        setConfirmEliminar(null);
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  const tiposMovimiento = [
    { id: 'consignacion', nombre: 'Consignación', desc: 'Entregas producto al cliente, queda como cuenta por cobrar (pendiente de pago)' },
    { id: 'venta_directa', nombre: 'Venta Directa', desc: 'El cliente paga al momento, se registra como venta cobrada' },
    { id: 'venta_consignacion', nombre: 'Cobro de Consignación', desc: 'El cliente paga piezas que ya tenía en consignación (debe existir una consignación previa)' },
    { id: 'devolucion', nombre: 'Devolución', desc: 'El cliente regresa piezas que tenía en consignación, vuelven al taller' }
  ];

  // Obtener historial de un cliente
  const getClienteHistorial = (clienteId) => {
    const movsCliente = movimientos.filter(m => m.cliente_id === clienteId);

    // Agrupar por tipo
    const consignaciones = movsCliente.filter(m => m.tipo_movimiento === 'consignacion');
    const ventasDirectas = movsCliente.filter(m => m.tipo_movimiento === 'venta_directa');
    const ventasConsignacion = movsCliente.filter(m => m.tipo_movimiento === 'venta_consignacion');
    const devoluciones = movsCliente.filter(m => m.tipo_movimiento === 'devolucion');

    // Calcular totales
    const totalConsignacion = consignaciones.reduce((sum, m) => sum + m.cantidad, 0);
    const totalVentaDirecta = ventasDirectas.reduce((sum, m) => sum + m.cantidad, 0);
    const totalVentaConsignacion = ventasConsignacion.reduce((sum, m) => sum + m.cantidad, 0);
    const totalDevolucion = devoluciones.reduce((sum, m) => sum + m.cantidad, 0);

    return {
      consignaciones,
      ventasDirectas,
      ventasConsignacion,
      devoluciones,
      totales: {
        consignacion: totalConsignacion,
        ventaDirecta: totalVentaDirecta,
        ventaConsignacion: totalVentaConsignacion,
        devolucion: totalDevolucion,
        enConsignacionActual: totalConsignacion - totalVentaConsignacion - totalDevolucion
      }
    };
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #DA9F17',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: colors.cream
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
          Salidas
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setMostrarNuevoCliente(true)}
            onMouseEnter={() => setHoverBtn({ ...hoverBtn, cliente: true })}
            onMouseLeave={() => setHoverBtn({ ...hoverBtn, cliente: false })}
            style={{
              padding: '10px 20px',
              background: hoverBtn.cliente ? colors.sidebarText : 'transparent',
              color: hoverBtn.cliente ? colors.sidebarBg : colors.sidebarBg,
              border: `2px solid ${colors.sidebarBg}`,
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            + Cliente
          </button>
          {isAdmin && (
            <button
              onClick={() => setMostrarFormulario(true)}
              onMouseEnter={() => setHoverBtn({ ...hoverBtn, salida: true })}
              onMouseLeave={() => setHoverBtn({ ...hoverBtn, salida: false })}
              style={{
                padding: '10px 20px',
                background: hoverBtn.salida ? colors.sidebarText : colors.sidebarBg,
                color: hoverBtn.salida ? colors.sidebarBg : colors.sidebarText,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.3s ease'
              }}
            >
              + Nueva Salida
            </button>
          )}
        </div>
      </div>

      {/* Mensaje */}
      {mensaje.texto && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          borderRadius: '6px',
          background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive : colors.terracotta}`,
          color: mensaje.tipo === 'exito' ? colors.olive : colors.terracotta,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Resumen de Stock */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '16px', color: colors.sidebarBg }}>Resumen de Inventario</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {productos.map(prod => {
            const resumen = calcularResumen(prod.id);
            const stockTaller = prod.tiene_variantes ? (prod.stock_variantes || 0) : (prod.stock || 0);
            const stockConsignacion = prod.tiene_variantes ? (prod.stock_consignacion_variantes || 0) : (prod.stock_consignacion || 0);
            const disponible = stockTaller + stockConsignacion;
            return (
              <div key={prod.id} style={{
                background: colors.cotton,
                border: '2px solid #DA9F17',
                padding: '15px 20px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: colors.sidebarBg }}>{prod.linea_nombre}</div>
                  <div style={{ fontSize: '12px', color: colors.camel }}>{prod.linea_medidas}</div>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: colors.camel }}>TALLER</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: colors.espresso }}>{stockTaller}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: colors.camel }}>CONSIGNACIÓN</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#F39C12' }}>{stockConsignacion}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: colors.camel }}>VENDIDO</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: colors.olive }}>{resumen.vendidoDirecto + resumen.vendidoConsignacion}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: colors.camel }}>DISPONIBLE</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: disponible > 0 ? colors.sidebarBg : colors.terracotta }}>{disponible}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Nueva Salida */}
      {mostrarFormulario && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.cotton, borderRadius: '12px', padding: isMobile ? '16px' : '30px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: colors.sidebarBg }}>Nueva Salida</h3>
              <button onClick={() => setMostrarFormulario(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.camel }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Producto *</label>
                <select
                  value={formSalida.productoId}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    const prod = productos.find(p => p.id === parseInt(prodId));
                    // Auto-llenar precio sugerido desde precio_venta del producto
                    const precioSugerido = parseFloat(prod?.precio_venta) || (prod?.costo_total_1_tinta ? parseFloat(prod.costo_total_1_tinta) * 2 : 0);
                    setFormSalida({ ...formSalida, productoId: prodId, varianteId: '', precioUnitario: precioSugerido });
                  }}
                  style={inputStyle}
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => {
                    const stockDisp = p.tiene_variantes ? (p.stock_variantes || 0) : (p.stock || 0);
                    return <option key={p.id} value={p.id}>{p.linea_nombre} ({stockDisp} en taller)</option>;
                  })}
                </select>
              </div>

              {/* Selector de variante - solo si el producto tiene variantes */}
              {(() => {
                const prodSel = productos.find(p => p.id === parseInt(formSalida.productoId));
                if (!prodSel?.tiene_variantes) return null;
                const variantesActivas = (prodSel.variantes || []).filter(v => v.activo !== false);
                return (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Variante *</label>
                    <select
                      value={formSalida.varianteId}
                      onChange={(e) => {
                        const varId = e.target.value;
                        const v = variantesActivas.find(va => va.id === parseInt(varId));
                        const precioSugerido = parseFloat(v?.precio_venta) || parseFloat(v?.costo_unitario) * 2 || 0;
                        setFormSalida({ ...formSalida, varianteId: varId, precioUnitario: precioSugerido });
                      }}
                      style={inputStyle}
                    >
                      <option value="">Seleccionar variante...</option>
                      {variantesActivas.map(v => {
                        const nombre = [v.material, v.color, v.talla].filter(Boolean).join(' / ') || 'Sin especificar';
                        return <option key={v.id} value={v.id}>{nombre} (Taller: {v.stock || 0} | Consig: {v.stock_consignacion || 0})</option>;
                      })}
                    </select>
                  </div>
                );
              })()}

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Cliente/Negocio *</label>
                <select value={formSalida.clienteId} onChange={(e) => setFormSalida({ ...formSalida, clienteId: e.target.value })} style={inputStyle}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Tipo de Movimiento *</label>
                <select value={formSalida.tipoMovimiento} onChange={(e) => setFormSalida({ ...formSalida, tipoMovimiento: e.target.value })} style={inputStyle}>
                  {tiposMovimiento.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: colors.camel, marginTop: '5px' }}>
                  {tiposMovimiento.find(t => t.id === formSalida.tipoMovimiento)?.desc}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Cantidad *</label>
                <input type="number" min="1" value={formSalida.cantidad} onChange={(e) => setFormSalida({ ...formSalida, cantidad: e.target.value })} style={inputStyle} />
              </div>

              {/* Precio unitario - para consignaciones y ventas directas */}
              {(formSalida.tipoMovimiento === 'consignacion' || formSalida.tipoMovimiento === 'venta_directa') && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>
                    Precio de Venta Unitario *
                    <span style={{ color: colors.camel, fontWeight: 'normal' }}>
                      {formSalida.tipoMovimiento === 'consignacion' ? ' (para cuenta por cobrar)' : ' (precio de venta)'}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formSalida.precioUnitario}
                    onChange={(e) => setFormSalida({ ...formSalida, precioUnitario: e.target.value })}
                    style={inputStyle}
                    placeholder="Precio al que se venderá"
                  />
                  {formSalida.cantidad > 0 && formSalida.precioUnitario > 0 && (
                    <div style={{ fontSize: '12px', color: colors.olive, marginTop: '5px', fontWeight: '600' }}>
                      {formSalida.tipoMovimiento === 'consignacion' ? 'Total por cobrar' : 'Total venta'}: ${(parseFloat(formSalida.cantidad) * parseFloat(formSalida.precioUnitario)).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Notas</label>
                <textarea value={formSalida.notas} onChange={(e) => setFormSalida({ ...formSalida, notas: e.target.value })} style={{ ...inputStyle, minHeight: '60px' }} placeholder="Observaciones..." />
              </div>

              <button onClick={registrarSalida} disabled={guardando} style={{
                padding: '12px',
                background: colors.sidebarBg,
                color: colors.sidebarText,
                border: 'none',
                borderRadius: '6px',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: guardando ? 0.7 : 1
              }}>
                {guardando ? 'Guardando...' : 'Registrar Salida'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {mostrarNuevoCliente && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.cotton, borderRadius: '12px', padding: isMobile ? '16px' : '30px', maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: colors.sidebarBg }}>Nuevo Cliente</h3>
              <button onClick={() => setMostrarNuevoCliente(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.camel }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Nombre *</label>
                <input type="text" value={formCliente.nombre} onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })} style={inputStyle} placeholder="Nombre del negocio/cliente" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Tipo</label>
                <select value={formCliente.tipo} onChange={(e) => setFormCliente({ ...formCliente, tipo: e.target.value })} style={inputStyle}>
                  <option value="directo">Pedido Directo</option>
                  <option value="consignacion">Consignación</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: colors.sidebarBg, marginBottom: '5px' }}>Contacto</label>
                <input type="text" value={formCliente.contacto} onChange={(e) => setFormCliente({ ...formCliente, contacto: e.target.value })} style={inputStyle} placeholder="Teléfono, email, etc." />
              </div>

              <button onClick={crearCliente} disabled={guardando} style={{
                padding: '12px',
                background: colors.sidebarBg,
                color: colors.sidebarText,
                border: 'none',
                borderRadius: '6px',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {guardando ? 'Guardando...' : 'Agregar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial del Cliente */}
      {clienteHistorial && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.cotton, borderRadius: '12px', padding: isMobile ? '16px' : '30px', maxWidth: '700px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.sidebarBg }}>{clienteHistorial.nombre}</h3>
                <div style={{ fontSize: '12px', color: colors.camel, marginTop: '5px' }}>
                  {clienteHistorial.tipo === 'consignacion' ? 'Cliente de Consignación' : 'Cliente Directo'}
                  {clienteHistorial.contacto && ` • ${clienteHistorial.contacto}`}
                </div>
              </div>
              <button onClick={() => setClienteHistorial(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.camel }}>×</button>
            </div>

            {(() => {
              const historial = getClienteHistorial(clienteHistorial.id);
              return (
                <>
                  {/* Resumen de totales */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: '#FEF3E2', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#F39C12', fontWeight: '600' }}>CONSIGNACIÓN</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#F39C12' }}>{historial.totales.consignacion}</div>
                    </div>
                    <div style={{ background: '#E8F5E9', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: colors.olive, fontWeight: '600' }}>VENTA DIRECTA</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: colors.olive }}>{historial.totales.ventaDirecta}</div>
                    </div>
                    <div style={{ background: '#E3F2FD', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#1976D2', fontWeight: '600' }}>VENTA CONSIG.</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#1976D2' }}>{historial.totales.ventaConsignacion}</div>
                    </div>
                    <div style={{ background: '#FFEBEE', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: colors.terracotta, fontWeight: '600' }}>DEVOLUCION</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: colors.terracotta }}>{historial.totales.devolucion}</div>
                    </div>
                  </div>

                  {/* Indicador de piezas en consignación activa */}
                  {historial.totales.enConsignacionActual > 0 && (
                    <div style={{
                      background: `linear-gradient(135deg, #FEF3E2, ${colors.cotton})`,
                      border: '2px solid #F39C12',
                      padding: '15px',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '11px', color: '#F39C12', fontWeight: '600' }}>PIEZAS EN CONSIGNACIÓN ACTIVA</div>
                      <div style={{ fontSize: '32px', fontWeight: '700', color: '#F39C12' }}>{historial.totales.enConsignacionActual}</div>
                      <div style={{ fontSize: '11px', color: colors.camel }}>piezas pendientes de venta o devolución</div>
                    </div>
                  )}

                  {/* Secciones por tipo de movimiento */}
                  {historial.consignaciones.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#F39C12', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ background: '#FEF3E2', padding: '2px 8px', borderRadius: '12px' }}>Consignaciones ({historial.consignaciones.length})</span>
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {historial.consignaciones.map(mov => (
                          <div key={mov.id} style={{ background: '#FEF3E2', padding: '10px 15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '500', color: colors.espresso, fontSize: '13px' }}>{mov.producto?.linea_nombre}{mov.variante && <span style={{ fontWeight: '400', color: colors.camel }}>{' - '}{[mov.variante.material, mov.variante.color, mov.variante.talla].filter(Boolean).join(' / ')}</span>}</div>
                              <div style={{ fontSize: '11px', color: colors.camel }}>{new Date(mov.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '16px', color: '#F39C12' }}>{mov.cantidad} pzas</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {historial.ventasDirectas.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: colors.olive, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ background: '#E8F5E9', padding: '2px 8px', borderRadius: '12px' }}>Ventas Directas - Efectivo ({historial.ventasDirectas.length})</span>
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {historial.ventasDirectas.map(mov => (
                          <div key={mov.id} style={{ background: '#E8F5E9', padding: '10px 15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '500', color: colors.espresso, fontSize: '13px' }}>{mov.producto?.linea_nombre}{mov.variante && <span style={{ fontWeight: '400', color: colors.camel }}>{' - '}{[mov.variante.material, mov.variante.color, mov.variante.talla].filter(Boolean).join(' / ')}</span>}</div>
                              <div style={{ fontSize: '11px', color: colors.camel }}>{new Date(mov.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '16px', color: colors.olive }}>{mov.cantidad} pzas</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {historial.ventasConsignacion.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: '#1976D2', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ background: '#E3F2FD', padding: '2px 8px', borderRadius: '12px' }}>Ventas en Consignación - Crédito ({historial.ventasConsignacion.length})</span>
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {historial.ventasConsignacion.map(mov => (
                          <div key={mov.id} style={{ background: '#E3F2FD', padding: '10px 15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '500', color: colors.espresso, fontSize: '13px' }}>{mov.producto?.linea_nombre}{mov.variante && <span style={{ fontWeight: '400', color: colors.camel }}>{' - '}{[mov.variante.material, mov.variante.color, mov.variante.talla].filter(Boolean).join(' / ')}</span>}</div>
                              <div style={{ fontSize: '11px', color: colors.camel }}>{new Date(mov.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '16px', color: '#1976D2' }}>{mov.cantidad} pzas</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {historial.devoluciones.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: colors.terracotta, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ background: '#FFEBEE', padding: '2px 8px', borderRadius: '12px' }}>Devoluciones ({historial.devoluciones.length})</span>
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {historial.devoluciones.map(mov => (
                          <div key={mov.id} style={{ background: '#FFEBEE', padding: '10px 15px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontWeight: '500', color: colors.espresso, fontSize: '13px' }}>{mov.producto?.linea_nombre}{mov.variante && <span style={{ fontWeight: '400', color: colors.camel }}>{' - '}{[mov.variante.material, mov.variante.color, mov.variante.talla].filter(Boolean).join(' / ')}</span>}</div>
                              <div style={{ fontSize: '11px', color: colors.camel }}>{new Date(mov.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '16px', color: colors.terracotta }}>+{mov.cantidad} pzas</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Si no hay movimientos */}
                  {historial.consignaciones.length === 0 && historial.ventasDirectas.length === 0 &&
                   historial.ventasConsignacion.length === 0 && historial.devoluciones.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', color: colors.camel }}>
                      <span style={{ fontSize: '36px' }}>📋</span>
                      <p style={{ marginTop: '10px' }}>No hay movimientos registrados para este cliente</p>
                    </div>
                  )}
                </>
              );
            })()}

            <button
              onClick={() => setClienteHistorial(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: colors.sidebarBg,
                color: colors.sidebarText,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginTop: '15px'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Historial de Movimientos */}
      <div>
        <h3 style={{ margin: '0 0 15px', fontSize: '16px', color: colors.sidebarBg }}>Historial de Movimientos</h3>
        {movimientos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {movimientos.slice(0, 20).map(mov => (
              <div key={mov.id} style={{
                background: colors.cream,
                border: `1px solid ${colors.sand}`,
                padding: '12px 15px',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <div style={{ fontWeight: '500', color: colors.espresso }}>
                    {mov.producto?.linea_nombre}
                    {mov.variante && (
                      <span style={{ fontWeight: '400', color: colors.camel, fontSize: '13px' }}>
                        {' - '}{[mov.variante.material, mov.variante.color, mov.variante.talla].filter(Boolean).join(' / ')}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.camel }}>
                    <span
                      onClick={() => setClienteHistorial(mov.cliente)}
                      style={{
                        color: colors.sidebarBg,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontWeight: '500'
                      }}
                      onMouseEnter={(e) => e.target.style.color = '#DA9F17'}
                      onMouseLeave={(e) => e.target.style.color = colors.sidebarBg}
                    >
                      {mov.cliente?.nombre}
                    </span>
                    {' • '}{new Date(mov.fecha).toLocaleDateString('es-MX')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    background: mov.tipo_movimiento === 'consignacion' ? '#FEF3E2' :
                               mov.tipo_movimiento === 'venta_directa' ? '#E8F5E9' :
                               mov.tipo_movimiento === 'venta_consignacion' ? '#E3F2FD' : '#FFEBEE',
                    color: mov.tipo_movimiento === 'consignacion' ? '#F39C12' :
                           mov.tipo_movimiento === 'venta_directa' ? colors.olive :
                           mov.tipo_movimiento === 'venta_consignacion' ? '#1976D2' : colors.terracotta
                  }}>
                    {tiposMovimiento.find(t => t.id === mov.tipo_movimiento)?.nombre || mov.tipo_movimiento}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '16px', color: colors.sidebarBg }}>
                    {mov.tipo_movimiento === 'devolucion' ? '+' : '-'}{mov.cantidad}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => setConfirmEliminar(mov)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '16px', color: colors.terracotta, padding: '4px',
                        opacity: 0.6, transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.6}
                      title="Eliminar movimiento"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: colors.cotton, border: '2px solid #DA9F17', padding: '30px', textAlign: 'center', borderRadius: '8px' }}>
            <span style={{ fontSize: '36px' }}>📤</span>
            <p style={{ margin: '15px 0 0', color: colors.camel }}>No hay movimientos registrados</p>
          </div>
        )}
      </div>

      {/* Modal Confirmar Eliminación */}
      {confirmEliminar && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.cotton, borderRadius: '12px', padding: isMobile ? '16px' : '30px', maxWidth: '450px', width: '90%' }}>
            <h3 style={{ margin: '0 0 15px', color: colors.terracotta, fontSize: '18px' }}>Eliminar Movimiento</h3>
            <div style={{ background: '#FFEBEE', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', color: colors.espresso, marginBottom: '5px' }}>
                {confirmEliminar.producto?.linea_nombre}
              </div>
              <div style={{ fontSize: '13px', color: colors.camel }}>
                Cliente: {confirmEliminar.cliente?.nombre} | Tipo: {tiposMovimiento.find(t => t.id === confirmEliminar.tipo_movimiento)?.nombre}
              </div>
              <div style={{ fontSize: '13px', color: colors.camel }}>
                Cantidad: {confirmEliminar.cantidad} pzas | Fecha: {new Date(confirmEliminar.fecha).toLocaleDateString('es-MX')}
              </div>
              {(confirmEliminar.tipo_movimiento === 'consignacion' || confirmEliminar.tipo_movimiento === 'venta_directa') && (
                <div style={{ fontSize: '12px', color: colors.terracotta, marginTop: '8px', fontWeight: '500' }}>
                  Nota: También se eliminará el registro de venta asociado.
                </div>
              )}
            </div>
            <p style={{ fontSize: '14px', color: colors.espresso, marginBottom: '20px' }}>
              Este movimiento se eliminará permanentemente y el stock se revertirá automáticamente a su estado anterior.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirmEliminar(null)}
                style={{
                  flex: 1, padding: '12px', background: 'transparent',
                  border: `2px solid ${colors.camel}`, borderRadius: '6px',
                  cursor: 'pointer', fontSize: '14px', color: colors.camel
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarMovimiento(confirmEliminar)}
                disabled={guardando}
                style={{
                  flex: 1, padding: '12px', background: colors.terracotta,
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: guardando ? 'not-allowed' : 'pointer', fontSize: '14px',
                  fontWeight: '500', opacity: guardando ? 0.7 : 1
                }}
              >
                {guardando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// Vista Ventas
const VentasView = ({ isAdmin }) => {
  const [ventas, setVentas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [hoverBtn, setHoverBtn] = useState({});
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes'); // hoy, semana, mes, todo
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [ventaEditando, setVentaEditando] = useState(null);
  const [mostrarPago, setMostrarPago] = useState(null); // ID de venta para registrar pago
  const [clienteDesglose, setClienteDesglose] = useState(null); // ID cliente para ver desglose de deuda

  // Formulario de nueva venta
  const [formVenta, setFormVenta] = useState({
    productoId: '',
    clienteId: '',
    cantidad: 1,
    precioUnitario: 0,
    descuentoPorcentaje: 0,
    metodoPago: 'efectivo',
    estadoPago: 'pagado',
    tipoVenta: 'directa',
    notas: ''
  });

  // Calcular fechas según período
  const getFechasPeriodo = () => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    switch (filtroPeriodo) {
      case 'hoy':
        return { inicio: hoyStr, fin: hoyStr };
      case 'semana':
        const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { inicio: hace7Dias.toISOString().split('T')[0], fin: hoyStr };
      case 'mes':
        const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { inicio: hace30Dias.toISOString().split('T')[0], fin: hoyStr };
      case 'todo':
      default:
        return { inicio: null, fin: null };
    }
  };

  // Cargar datos
  const cargarDatos = async () => {
    if (!isSupabaseConfigured) return;

    const fechas = getFechasPeriodo();

    const [prodRes, cliRes, ventasRes, resumenRes, serviciosRes] = await Promise.all([
      getProductos(),
      getClientes(),
      getVentas({
        fechaInicio: fechas.inicio,
        fechaFin: fechas.fin,
        estadoPago: filtroEstado !== 'todos' ? filtroEstado : null
      }),
      getResumenVentas(fechas.inicio, fechas.fin),
      getServiciosMaquila()
    ]);

    if (prodRes.data) setProductos(prodRes.data);
    if (cliRes.data) setClientes(cliRes.data);
    if (ventasRes.data) setVentas(ventasRes.data);
    if (resumenRes.data) setResumen(resumenRes.data);
    if (serviciosRes.data) setServicios(serviciosRes.data);
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, filtroPeriodo]);

  // Calcular total de venta
  const calcularTotal = () => {
    const subtotal = formVenta.cantidad * formVenta.precioUnitario;
    const descuento = subtotal * (formVenta.descuentoPorcentaje / 100);
    return subtotal - descuento;
  };

  // Seleccionar producto y cargar precio sugerido
  const seleccionarProducto = (productoId) => {
    const producto = productos.find(p => p.id === parseInt(productoId));
    if (producto) {
      // Usar precio_venta si existe, sino costo * 2
      const precioSugerido = parseFloat(producto.precio_venta) || (parseFloat(producto.costo_total_1_tinta) * 2) || 0;
      setFormVenta({
        ...formVenta,
        productoId,
        precioUnitario: precioSugerido
      });
    }
  };

  // Abrir formulario para editar venta existente
  const editarVenta = (venta) => {
    setVentaEditando(venta);
    setFormVenta({
      productoId: venta.producto_id?.toString() || '',
      clienteId: venta.cliente_id?.toString() || '',
      cantidad: venta.cantidad || 1,
      precioUnitario: parseFloat(venta.precio_unitario) || 0,
      descuentoPorcentaje: parseFloat(venta.descuento_porcentaje) || 0,
      metodoPago: venta.metodo_pago || 'efectivo',
      estadoPago: venta.estado_pago || 'pendiente',
      tipoVenta: venta.tipo_venta || 'directa',
      notas: venta.notas || ''
    });
    setMostrarFormulario(true);
  };

  // Guardar venta (crear o actualizar)
  const guardarVenta = async () => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo admin puede modificar ventas' });
      return;
    }

    if (!formVenta.productoId || !formVenta.cantidad || !formVenta.precioUnitario) {
      setMensaje({ tipo: 'error', texto: 'Completa producto, cantidad y precio' });
      return;
    }

    setGuardando(true);
    try {
      const producto = productos.find(p => p.id === parseInt(formVenta.productoId));
      const cliente = clientes.find(c => c.id === parseInt(formVenta.clienteId));
      const total = calcularTotal();

      const ventaData = {
        producto_id: parseInt(formVenta.productoId),
        cliente_id: formVenta.clienteId ? parseInt(formVenta.clienteId) : null,
        producto_nombre: producto?.linea_nombre || '',
        producto_medidas: producto?.linea_medidas || '',
        cliente_nombre: cliente?.nombre || 'Venta directa',
        cantidad: parseInt(formVenta.cantidad),
        precio_unitario: parseFloat(formVenta.precioUnitario),
        descuento_porcentaje: parseFloat(formVenta.descuentoPorcentaje) || 0,
        descuento_monto: (formVenta.cantidad * formVenta.precioUnitario) * (formVenta.descuentoPorcentaje / 100),
        total: total,
        costo_unitario: parseFloat(producto?.costo_total_1_tinta) || 0,
        metodo_pago: formVenta.metodoPago,
        estado_pago: formVenta.estadoPago,
        monto_pagado: formVenta.estadoPago === 'pagado' ? total : (ventaEditando?.monto_pagado || 0),
        tipo_venta: formVenta.tipoVenta,
        notas: formVenta.notas
      };

      let result;
      if (ventaEditando) {
        // Actualizar venta existente
        result = await updateVenta(ventaEditando.id, ventaData);
      } else {
        // Crear nueva venta
        result = await createVenta(ventaData);
      }

      if (result.error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + result.error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: ventaEditando ? 'Venta actualizada' : 'Venta registrada' });
        cerrarFormulario();
        cargarDatos();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Cerrar formulario y limpiar
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setVentaEditando(null);
    setFormVenta({
      productoId: '',
      clienteId: '',
      cantidad: 1,
      precioUnitario: 0,
      descuentoPorcentaje: 0,
      metodoPago: 'efectivo',
      estadoPago: 'pagado',
      tipoVenta: 'directa',
      notas: ''
    });
  };

  // Registrar venta
  const registrarVenta = async () => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo admin puede registrar ventas' });
      return;
    }

    if (!formVenta.productoId || !formVenta.cantidad || !formVenta.precioUnitario) {
      setMensaje({ tipo: 'error', texto: 'Completa producto, cantidad y precio' });
      return;
    }

    setGuardando(true);
    try {
      const producto = productos.find(p => p.id === parseInt(formVenta.productoId));
      const cliente = clientes.find(c => c.id === parseInt(formVenta.clienteId));
      const total = calcularTotal();

      const ventaData = {
        producto_id: parseInt(formVenta.productoId),
        cliente_id: formVenta.clienteId ? parseInt(formVenta.clienteId) : null,
        producto_nombre: producto?.linea_nombre || '',
        producto_medidas: producto?.linea_medidas || '',
        cliente_nombre: cliente?.nombre || 'Venta directa',
        cantidad: parseInt(formVenta.cantidad),
        precio_unitario: parseFloat(formVenta.precioUnitario),
        descuento_porcentaje: parseFloat(formVenta.descuentoPorcentaje) || 0,
        descuento_monto: (formVenta.cantidad * formVenta.precioUnitario) * (formVenta.descuentoPorcentaje / 100),
        total: total,
        costo_unitario: parseFloat(producto?.costo_total_1_tinta) || 0,
        metodo_pago: formVenta.metodoPago,
        estado_pago: formVenta.estadoPago,
        monto_pagado: formVenta.estadoPago === 'pagado' ? total : 0,
        tipo_venta: formVenta.tipoVenta,
        notas: formVenta.notas
      };

      const { data, error } = await createVenta(ventaData);

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        // Registrar ingreso automático en caja si la venta está pagada
        if (formVenta.estadoPago === 'pagado' && total > 0) {
          await createMovimientoCaja({
            tipo: 'ingreso',
            monto: total,
            venta_id: data?.id || null,
            categoria: 'venta',
            metodo_pago: formVenta.metodoPago || 'efectivo',
            descripcion: `Venta - ${producto?.linea_nombre || 'Producto'} - ${formVenta.cantidad} pzas`
          });
        }

        setMensaje({ tipo: 'exito', texto: 'Venta registrada correctamente' });
        setMostrarFormulario(false);
        setFormVenta({
          productoId: '',
          clienteId: '',
          cantidad: 1,
          precioUnitario: 0,
          descuentoPorcentaje: 0,
          metodoPago: 'efectivo',
          estadoPago: 'pagado',
          tipoVenta: 'directa',
          notas: ''
        });
        cargarDatos();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Registrar pago
  const hacerPagoCliente = async (clienteId, monto, ventasCliente) => {
    if (!monto || monto <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un monto válido' });
      return;
    }

    setGuardando(true);
    try {
      let montoRestante = parseFloat(monto);
      const ventasOrdenadas = [...ventasCliente].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      for (const venta of ventasOrdenadas) {
        if (montoRestante <= 0) break;
        const pendiente = (venta.total || 0) - (venta.monto_pagado || 0);
        if (pendiente <= 0) continue;
        const montoAplicar = Math.min(montoRestante, pendiente);
        const { error } = await registrarPagoVenta(venta.id, montoAplicar);
        if (error) {
          setMensaje({ tipo: 'error', texto: 'Error en pago: ' + error.message });
          cargarDatos();
          return;
        }
        montoRestante -= montoAplicar;
      }

      setMensaje({ tipo: 'exito', texto: 'Pago registrado' });
      setMostrarPago(null);
      cargarDatos();
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar venta
  const eliminarVentaHandler = async (ventaId) => {
    if (!window.confirm('¿Eliminar esta venta?')) return;

    const { error } = await deleteVenta(ventaId);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Venta eliminada' });
      cargarDatos();
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatearMoneda = (monto) => {
    return '$' + (parseFloat(monto) || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #DA9F17',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    background: colors.cream
  };

  const cardStyle = {
    background: colors.cotton,
    border: `2px solid ${colors.sand}`,
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center'
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
          Ventas
        </h2>
        {isAdmin && (
          <button
            onClick={() => setMostrarFormulario(true)}
            onMouseEnter={() => setHoverBtn({ ...hoverBtn, nueva: true })}
            onMouseLeave={() => setHoverBtn({ ...hoverBtn, nueva: false })}
            style={{
              padding: '10px 20px',
              background: hoverBtn.nueva ? colors.sidebarText : colors.sidebarBg,
              color: hoverBtn.nueva ? colors.sidebarBg : colors.sidebarText,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            + Nueva Venta
          </button>
        )}
      </div>

      {/* Mensaje */}
      {mensaje.texto && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          borderRadius: '6px',
          background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive : colors.terracotta}`,
          color: mensaje.tipo === 'exito' ? colors.olive : colors.terracotta,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Dashboard de resumen */}
      {resumen && (() => {
        const serviciosTotales = servicios.reduce((acc, s) => ({
          total: acc.total + (parseFloat(s.total) || 0),
          cobrado: acc.cobrado + (parseFloat(s.monto_pagado) || 0),
          pendiente: acc.pendiente + Math.max(0, (parseFloat(s.total) || 0) - (parseFloat(s.monto_pagado) || 0))
        }), { total: 0, cobrado: 0, pendiente: 0 });

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ ...cardStyle, borderColor: colors.sidebarBg }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '5px' }}>VENTAS HOY</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(resumen.ventasHoy)}</div>
              <div style={{ fontSize: '12px', color: colors.camel }}>{resumen.piezasHoy} piezas</div>
            </div>
            <div style={{ ...cardStyle, borderColor: colors.olive }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '5px' }}>VENTAS PERÍODO</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.olive }}>{formatearMoneda(resumen.totalVentas)}</div>
              <div style={{ fontSize: '12px', color: colors.camel }}>{resumen.totalPiezas} piezas</div>
            </div>
            <div style={{ ...cardStyle, borderColor: colors.sage }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '5px' }}>SERVICIOS MAQUILA</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.sage }}>{formatearMoneda(serviciosTotales.total)}</div>
              <div style={{ fontSize: '12px', color: colors.camel }}>{servicios.length} servicios</div>
            </div>
            <div style={{ ...cardStyle, borderColor: '#27ae60' }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '5px' }}>COBRADO</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#27ae60' }}>{formatearMoneda(resumen.totalCobrado + serviciosTotales.cobrado)}</div>
            </div>
            <div style={{ ...cardStyle, borderColor: colors.terracotta }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '5px' }}>POR COBRAR</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.terracotta }}>{formatearMoneda(resumen.totalPorCobrar + serviciosTotales.pendiente)}</div>
            </div>
            <div style={{ ...cardStyle, borderColor: '#9b59b6' }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '5px' }}>UTILIDAD</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#9b59b6' }}>{formatearMoneda(resumen.totalUtilidad)}</div>
            </div>
          </div>
        );
      })()}

      {/* Cuentas por Cobrar por Cliente */}
      {(() => {
        const ventasPendientes = ventas.filter(v => v.estado_pago === 'pendiente' || v.estado_pago === 'parcial');
        const serviciosPendientes = servicios.filter(s => s.estado_pago === 'pendiente' || s.estado_pago === 'parcial');
        if (ventasPendientes.length === 0 && serviciosPendientes.length === 0) return null;

        // Agrupar por cliente
        const porCliente = {};
        ventasPendientes.forEach(v => {
          const cId = v.cliente_id || 0;
          const cNombre = v.cliente_nombre || 'Sin cliente';
          if (!porCliente[cId]) {
            porCliente[cId] = { nombre: cNombre, piezas: 0, montoPorCobrar: 0, ventas: [], ultimaFecha: null };
          }
          const pendiente = (v.total || 0) - (v.monto_pagado || 0);
          porCliente[cId].piezas += v.cantidad || 0;
          porCliente[cId].montoPorCobrar += pendiente;
          porCliente[cId].ventas.push(v);
          const fecha = v.created_at;
          if (!porCliente[cId].ultimaFecha || fecha > porCliente[cId].ultimaFecha) {
            porCliente[cId].ultimaFecha = fecha;
          }
        });

        // Agregar servicios pendientes
        serviciosPendientes.forEach(s => {
          const cId = s.cliente_id || 0;
          const cNombre = s.cliente_nombre || 'Sin cliente';
          if (!porCliente[cId]) {
            porCliente[cId] = { nombre: cNombre, piezas: 0, montoPorCobrar: 0, ventas: [], ultimaFecha: null };
          }
          const pendiente = (parseFloat(s.total) || 0) - (parseFloat(s.monto_pagado) || 0);
          porCliente[cId].piezas += s.cantidad || 0;
          porCliente[cId].montoPorCobrar += pendiente;
          // Agregar como venta virtual para mostrar en el desglose
          porCliente[cId].ventas.push({
            ...s,
            producto_nombre: `Maquila: ${s.maquila} - ${s.tipo_producto}`,
            _es_servicio: true
          });
          const fecha = s.fecha || s.created_at;
          if (!porCliente[cId].ultimaFecha || fecha > porCliente[cId].ultimaFecha) {
            porCliente[cId].ultimaFecha = fecha;
          }
        });

        const clientesOrdenados = Object.entries(porCliente).sort((a, b) => b[1].montoPorCobrar - a[1].montoPorCobrar);
        const totalPiezas = clientesOrdenados.reduce((sum, [, c]) => sum + c.piezas, 0);
        const totalMonto = clientesOrdenados.reduce((sum, [, c]) => sum + c.montoPorCobrar, 0);

        return (
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px', fontSize: '16px', color: colors.terracotta, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Cuentas por Cobrar
              <span style={{ background: 'rgba(196,120,74,0.15)', padding: '2px 10px', borderRadius: '12px', fontSize: '13px' }}>
                {clientesOrdenados.length} cliente{clientesOrdenados.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', border: `2px solid ${colors.terracotta}` }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: colors.terracotta, color: 'white' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>CLIENTE</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '80px' }}>PIEZAS</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '130px' }}>POR COBRAR</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '120px' }}>ÚLTIMA ACTIVIDAD</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {clientesOrdenados.map(([cId, cliente]) => (
                    <React.Fragment key={cId}>
                      <tr
                        style={{ borderBottom: `1px solid ${colors.sand}`, cursor: 'pointer' }}
                        onClick={() => setClienteDesglose(clienteDesglose === cId ? null : cId)}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: '500', color: colors.espresso }}>{cliente.nombre}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', color: '#F39C12' }}>{cliente.piezas}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: colors.terracotta }}>{formatearMoneda(cliente.montoPorCobrar)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: colors.camel }}>{formatearFecha(cliente.ultimaFecha)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setMostrarPago(mostrarPago === cId ? null : cId); }}
                              style={{
                                padding: '4px 10px',
                                background: '#27ae60',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                      {clienteDesglose === cId && (
                        <tr>
                          <td colSpan="5" style={{ padding: '0' }}>
                            <div style={{ background: '#FFF8F0', padding: '12px 15px' }}>
                              {cliente.ventas.map(v => (
                                <div key={v.id} style={{
                                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  padding: '8px 10px', borderBottom: `1px solid ${colors.sand}`,
                                  fontSize: '12px'
                                }}>
                                  <div>
                                    <span style={{ fontWeight: '500', color: colors.espresso }}>{v.producto_nombre}</span>
                                    <span style={{ color: colors.camel }}> • {v.cantidad} pzas • {formatearFecha(v.created_at)}</span>
                                  </div>
                                  <div style={{ fontWeight: '600', color: colors.terracotta }}>
                                    {formatearMoneda((v.total || 0) - (v.monto_pagado || 0))}
                                  </div>
                                </div>
                              ))}
                              {mostrarPago === cId && (
                                <div style={{
                                  padding: '12px 10px',
                                  background: colors.cream,
                                  display: 'flex',
                                  gap: '10px',
                                  alignItems: 'center',
                                  flexWrap: 'wrap'
                                }}>
                                  <span style={{ fontSize: '13px', color: colors.espresso, fontWeight: '500' }}>
                                    Total: {formatearMoneda(cliente.montoPorCobrar)}
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Monto a pagar"
                                    id={`pago-cliente-${cId}`}
                                    defaultValue={cliente.montoPorCobrar.toFixed(2)}
                                    style={{ ...inputStyle, width: '130px', fontSize: '13px' }}
                                  />
                                  <button
                                    onClick={() => {
                                      const input = document.getElementById(`pago-cliente-${cId}`);
                                      hacerPagoCliente(cId, input.value, cliente.ventas);
                                    }}
                                    disabled={guardando}
                                    style={{
                                      padding: '8px 16px',
                                      background: colors.sidebarBg,
                                      color: colors.sidebarText,
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    {guardando ? 'Procesando...' : 'Confirmar'}
                                  </button>
                                  <button
                                    onClick={() => setMostrarPago(null)}
                                    style={{
                                      padding: '8px 12px',
                                      background: colors.sand,
                                      color: colors.espresso,
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {/* Fila total */}
                  <tr style={{ background: colors.terracotta }}>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: 'white' }}>TOTAL</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: 'white' }}>{totalPiezas}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: 'white' }}>{formatearMoneda(totalMonto)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          </div>
        );
      })()}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '120px' }}
        >
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Últimos 30 días</option>
          <option value="todo">Todo</option>
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '120px' }}
        >
          <option value="todos">Todos los estados</option>
          <option value="pagado">Pagados</option>
          <option value="pendiente">Pendientes</option>
          <option value="parcial">Pago parcial</option>
        </select>
        <select
          value={filtroCliente}
          onChange={(e) => setFiltroCliente(e.target.value)}
          style={{ ...inputStyle, width: 'auto', minWidth: '150px' }}
        >
          <option value="todos">Todos los clientes</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Formulario nueva venta */}
      {mostrarFormulario && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: colors.cotton, borderRadius: '12px', padding: isMobile ? '16px' : '30px',
            maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: colors.espresso }}>{ventaEditando ? 'Editar Venta' : 'Nueva Venta'}</h3>
              <button onClick={cerrarFormulario}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.camel }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Producto */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Producto *</label>
                <select
                  value={formVenta.productoId}
                  onChange={(e) => seleccionarProducto(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Seleccionar producto...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.linea_nombre} - {p.linea_medidas} (Stock: {p.stock || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Cliente (opcional)</label>
                <select
                  value={formVenta.clienteId}
                  onChange={(e) => setFormVenta({ ...formVenta, clienteId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Venta directa (sin cliente)</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad y Precio */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    value={formVenta.cantidad}
                    onChange={(e) => setFormVenta({ ...formVenta, cantidad: parseInt(e.target.value) || 1 })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Precio Unitario *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formVenta.precioUnitario}
                    onChange={(e) => setFormVenta({ ...formVenta, precioUnitario: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Descuento */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Descuento (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formVenta.descuentoPorcentaje}
                  onChange={(e) => setFormVenta({ ...formVenta, descuentoPorcentaje: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>

              {/* Resumen */}
              <div style={{ background: colors.sidebarBg, padding: '15px', borderRadius: '8px', color: colors.sidebarText }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Subtotal:</span>
                  <span>{formatearMoneda(formVenta.cantidad * formVenta.precioUnitario)}</span>
                </div>
                {formVenta.descuentoPorcentaje > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#F7B731' }}>
                    <span>Descuento ({formVenta.descuentoPorcentaje}%):</span>
                    <span>-{formatearMoneda((formVenta.cantidad * formVenta.precioUnitario) * (formVenta.descuentoPorcentaje / 100))}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
                  <span>TOTAL:</span>
                  <span>{formatearMoneda(calcularTotal())}</span>
                </div>
              </div>

              {/* Método y Estado de pago */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Método de Pago</label>
                  <select
                    value={formVenta.metodoPago}
                    onChange={(e) => setFormVenta({ ...formVenta, metodoPago: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="credito">Crédito</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Estado</label>
                  <select
                    value={formVenta.estadoPago}
                    onChange={(e) => setFormVenta({ ...formVenta, estadoPago: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                  </select>
                </div>
              </div>

              {/* Tipo de venta */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Tipo de Venta</label>
                <select
                  value={formVenta.tipoVenta}
                  onChange={(e) => setFormVenta({ ...formVenta, tipoVenta: e.target.value })}
                  style={inputStyle}
                >
                  <option value="directa">Venta Directa</option>
                  <option value="consignacion">Consignación</option>
                  <option value="mayoreo">Mayoreo</option>
                  <option value="ecommerce">E-commerce</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: colors.espresso }}>Notas</label>
                <textarea
                  value={formVenta.notas}
                  onChange={(e) => setFormVenta({ ...formVenta, notas: e.target.value })}
                  style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={cerrarFormulario}
                  style={{ flex: 1, padding: '12px', background: colors.sand, color: colors.espresso, border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarVenta}
                  disabled={guardando}
                  style={{ flex: 1, padding: '12px', background: colors.sidebarBg, color: colors.sidebarText, border: 'none', borderRadius: '6px', cursor: guardando ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                >
                  {guardando ? 'Guardando...' : (ventaEditando ? 'Actualizar Venta' : 'Registrar Venta')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de ventas + servicios */}
      {(() => {
        // Combinar ventas y servicios
        const registrosVentas = ventas.map(v => ({ ...v, _tipo_registro: 'venta' }));
        const registrosServicios = servicios
          .filter(s => {
            if (filtroEstado !== 'todos' && s.estado_pago !== filtroEstado) return false;
            return true;
          })
          .map(s => ({
            ...s,
            _tipo_registro: 'servicio',
            producto_nombre: `Maquila: ${s.maquila} - ${s.tipo_producto}`,
            created_at: s.fecha || s.created_at
          }));

        const todosRegistros = [...registrosVentas, ...registrosServicios];
        const registrosFiltrados = filtroCliente === 'todos'
          ? todosRegistros
          : todosRegistros.filter(r => r.cliente_id === parseInt(filtroCliente));

        // Ordenar por fecha más reciente
        registrosFiltrados.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return registrosFiltrados.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {registrosFiltrados.map((registro) => {
            const esServicio = registro._tipo_registro === 'servicio';
            const pendiente = (parseFloat(registro.total) || 0) - (parseFloat(registro.monto_pagado) || 0);
            return (
              <div key={`${registro._tipo_registro}-${registro.id}`} style={{
                background: colors.cotton,
                border: `2px solid ${registro.estado_pago === 'pagado' ? colors.olive : registro.estado_pago === 'parcial' ? '#F7B731' : colors.terracotta}`,
                borderRadius: '8px',
                padding: '15px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: '600', color: colors.espresso }}>{registro.producto_nombre}</span>
                      {esServicio && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          background: 'rgba(156,175,136,0.2)',
                          color: colors.sage
                        }}>
                          Servicio
                        </span>
                      )}
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        background: registro.estado_pago === 'pagado' ? 'rgba(171,213,94,0.2)' :
                                    registro.estado_pago === 'parcial' ? 'rgba(247,183,49,0.2)' : 'rgba(196,120,74,0.2)',
                        color: registro.estado_pago === 'pagado' ? colors.olive :
                               registro.estado_pago === 'parcial' ? '#F7B731' : colors.terracotta
                      }}>
                        {registro.estado_pago === 'pagado' ? 'Pagado' : registro.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: colors.camel }}>
                      {registro.cliente_nombre || 'Venta directa'} • {registro.cantidad} pzas • {formatearFecha(registro.created_at)}
                    </div>
                    {registro.notas && <div style={{ fontSize: '12px', color: colors.camel, marginTop: '5px', fontStyle: 'italic' }}>{registro.notas}</div>}
                  </div>

                  {/* Montos */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(registro.total)}</div>
                    {registro.estado_pago !== 'pagado' && (
                      <div style={{ fontSize: '12px', color: colors.terracotta }}>
                        Pendiente: {formatearMoneda(pendiente)}
                      </div>
                    )}
                    {!esServicio && <div style={{ fontSize: '11px', color: '#9b59b6' }}>Utilidad: {formatearMoneda(registro.utilidad)}</div>}
                    {esServicio && registro.estado_pago === 'parcial' && (
                      <div style={{ fontSize: '11px', color: colors.olive }}>Pagado: {formatearMoneda(registro.monto_pagado)}</div>
                    )}
                  </div>

                  {/* Acciones */}
                  {isAdmin && !esServicio && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => editarVenta(registro)}
                        style={{
                          padding: '6px 12px',
                          background: colors.sidebarBg,
                          color: colors.sidebarText,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarVentaHandler(registro.id)}
                        style={{
                          padding: '6px 12px',
                          background: colors.terracotta,
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: colors.cotton, border: '2px solid #DA9F17', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px' }}>💵</span>
          <h3 style={{ margin: '20px 0 10px', color: colors.espresso }}>Sin ventas registradas</h3>
          <p style={{ color: colors.camel, fontSize: '14px' }}>
            {filtroCliente !== 'todos' ? 'No hay ventas para este cliente en el período seleccionado' : 'Haz clic en "+ Nueva Venta" para registrar tu primera venta'}
          </p>
        </div>
      );
      })()}
    </div>
  );
};


// Vista Caja
const CajaView = ({ isAdmin }) => {
  const [movimientos, setMovimientos] = useState([]);
  const [balance, setBalance] = useState({ totalIngresos: 0, totalEgresos: 0, balance: 0 });
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormEgreso, setMostrarFormEgreso] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const [formEgreso, setFormEgreso] = useState({
    monto: '',
    categoria: 'gasto_operativo',
    metodoPago: 'efectivo',
    descripcion: '',
    referencia: ''
  });

  const categoriasEgreso = [
    { value: 'compra_material', label: 'Compra de material' },
    { value: 'gasto_operativo', label: 'Gasto operativo' },
    { value: 'gasto_envio', label: 'Gasto de envío' },
    { value: 'gasto_produccion', label: 'Gasto de producción' },
    { value: 'retiro', label: 'Retiro' },
    { value: 'otro', label: 'Otro' }
  ];

  const categoriasLabel = {
    venta: 'Venta',
    pago_consignacion: 'Pago consignación',
    pago_cliente: 'Pago cliente',
    compra_material: 'Compra material',
    gasto_operativo: 'Gasto operativo',
    gasto_envio: 'Gasto envío',
    gasto_produccion: 'Gasto producción',
    retiro: 'Retiro',
    otro: 'Otro'
  };

  const metodosPagoLabel = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    otro: 'Otro'
  };

  const getFiltroFechas = () => {
    const hoy = new Date();
    let fechaInicio = null;
    let fechaFin = hoy.toISOString().split('T')[0];

    switch (filtroPeriodo) {
      case 'hoy':
        fechaInicio = hoy.toISOString().split('T')[0];
        break;
      case 'semana': {
        const hace7 = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
        fechaInicio = hace7.toISOString().split('T')[0];
        break;
      }
      case 'mes': {
        const hace30 = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        fechaInicio = hace30.toISOString().split('T')[0];
        break;
      }
      case 'todo':
        fechaInicio = null;
        fechaFin = null;
        break;
      default:
        break;
    }
    return { fechaInicio, fechaFin };
  };

  const cargarDatos = async () => {
    setCargando(true);
    const { fechaInicio, fechaFin } = getFiltroFechas();

    const filtros = {};
    if (fechaInicio) filtros.fechaInicio = fechaInicio;
    if (fechaFin) filtros.fechaFin = fechaFin;
    if (filtroTipo !== 'todos') filtros.tipo = filtroTipo;

    const [movRes, balRes] = await Promise.all([
      getMovimientosCaja(filtros),
      getBalanceCaja(fechaInicio, fechaFin)
    ]);

    setMovimientos(movRes.data || []);
    if (balRes.data) setBalance(balRes.data);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroPeriodo, filtroTipo]);

  const formatearMoneda = (monto) => {
    return '$' + (parseFloat(monto) || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRegistrarEgreso = async () => {
    if (!formEgreso.monto || parseFloat(formEgreso.monto) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un monto válido' });
      return;
    }
    if (!formEgreso.descripcion.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa una descripción' });
      return;
    }

    setGuardando(true);
    try {
      const { error } = await createMovimientoCaja({
        tipo: 'egreso',
        monto: parseFloat(formEgreso.monto),
        categoria: formEgreso.categoria,
        metodo_pago: formEgreso.metodoPago,
        descripcion: formEgreso.descripcion.trim(),
        referencia: formEgreso.referencia.trim() || null
      });

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: 'Egreso registrado' });
        setMostrarFormEgreso(false);
        setFormEgreso({ monto: '', categoria: 'gasto_operativo', metodoPago: 'efectivo', descripcion: '', referencia: '' });
        cargarDatos();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este movimiento de caja?')) return;

    const { error } = await deleteMovimientoCaja(id);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Movimiento eliminado' });
      cargarDatos();
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${colors.sand}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    boxSizing: 'border-box'
  };

  return (
    <div>
      <h2 style={{ color: colors.espresso, marginBottom: '20px' }}>Caja</h2>

      {/* Mensaje */}
      {mensaje.texto && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
          color: mensaje.tipo === 'exito' ? colors.olive : colors.terracotta,
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive : colors.terracotta}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          background: colors.cotton,
          borderRadius: '12px',
          padding: '20px',
          border: `2px solid ${colors.sidebarBg}`,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Balance</div>
          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color: balance.balance >= 0 ? colors.sidebarBg : colors.terracotta
          }}>
            {formatearMoneda(balance.balance)}
          </div>
        </div>

        <div style={{
          background: colors.cotton,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Ingresos</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.olive }}>
            {formatearMoneda(balance.totalIngresos)}
          </div>
        </div>

        <div style={{
          background: colors.cotton,
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Egresos</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.terracotta }}>
            {formatearMoneda(balance.totalEgresos)}
          </div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        {isAdmin && (
          <button
            onClick={() => setMostrarFormEgreso(!mostrarFormEgreso)}
            style={{
              padding: '10px 20px',
              background: colors.terracotta,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            {mostrarFormEgreso ? 'Cancelar' : '+ Registrar Egreso'}
          </button>
        )}

        <div style={{ display: 'flex', gap: '4px', background: colors.cotton, borderRadius: '8px', padding: '4px' }}>
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'semana', label: 'Semana' },
            { id: 'mes', label: 'Mes' },
            { id: 'todo', label: 'Todo' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setFiltroPeriodo(p.id)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filtroPeriodo === p.id ? '700' : '400',
                background: filtroPeriodo === p.id ? colors.sidebarBg : 'transparent',
                color: filtroPeriodo === p.id ? 'white' : colors.espresso
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', background: colors.cotton, borderRadius: '8px', padding: '4px' }}>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'ingreso', label: 'Ingresos' },
            { id: 'egreso', label: 'Egresos' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFiltroTipo(t.id)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filtroTipo === t.id ? '700' : '400',
                background: filtroTipo === t.id ? colors.sidebarBg : 'transparent',
                color: filtroTipo === t.id ? 'white' : colors.espresso
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Formulario de Egreso */}
      {mostrarFormEgreso && isAdmin && (
        <div style={{
          background: colors.cotton,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: `1px solid ${colors.sand}`
        }}>
          <h3 style={{ color: colors.espresso, marginTop: 0, marginBottom: '16px' }}>Registrar Egreso</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Monto *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formEgreso.monto}
                onChange={e => setFormEgreso({ ...formEgreso, monto: e.target.value })}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Categoría</label>
              <select
                value={formEgreso.categoria}
                onChange={e => setFormEgreso({ ...formEgreso, categoria: e.target.value })}
                style={inputStyle}
              >
                {categoriasEgreso.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Método de pago</label>
              <select
                value={formEgreso.metodoPago}
                onChange={e => setFormEgreso({ ...formEgreso, metodoPago: e.target.value })}
                style={inputStyle}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Referencia</label>
              <input
                type="text"
                value={formEgreso.referencia}
                onChange={e => setFormEgreso({ ...formEgreso, referencia: e.target.value })}
                placeholder="Nº factura, recibo, etc."
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Descripción *</label>
            <textarea
              value={formEgreso.descripcion}
              onChange={e => setFormEgreso({ ...formEgreso, descripcion: e.target.value })}
              placeholder="Descripción del gasto..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleRegistrarEgreso}
              disabled={guardando}
              style={{
                padding: '10px 24px',
                background: colors.terracotta,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: guardando ? 0.6 : 1
              }}
            >
              {guardando ? 'Guardando...' : 'Registrar Egreso'}
            </button>
            <button
              onClick={() => setMostrarFormEgreso(false)}
              style={{
                padding: '10px 24px',
                background: colors.sand,
                color: colors.espresso,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de movimientos */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.camel }}>Cargando...</div>
      ) : movimientos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: colors.camel,
          background: colors.cotton,
          borderRadius: '12px'
        }}>
          No hay movimientos en este periodo
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {movimientos.map(mov => (
            <div key={mov.id} style={{
              background: colors.cotton,
              border: `1px solid ${mov.tipo === 'ingreso' ? 'rgba(171,213,94,0.4)' : 'rgba(196,120,74,0.4)'}`,
              borderRadius: '10px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    padding: '2px 10px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: mov.tipo === 'ingreso' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
                    color: mov.tipo === 'ingreso' ? colors.olive : colors.terracotta
                  }}>
                    {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    background: colors.sand,
                    color: colors.espresso
                  }}>
                    {categoriasLabel[mov.categoria] || mov.categoria}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    background: 'rgba(0,95,132,0.1)',
                    color: colors.sidebarBg
                  }}>
                    {metodosPagoLabel[mov.metodo_pago] || mov.metodo_pago}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: colors.espresso }}>
                  {mov.descripcion || '-'}
                </div>
                <div style={{ fontSize: '12px', color: colors.camel, marginTop: '2px' }}>
                  {formatearFecha(mov.fecha)}
                  {mov.referencia ? ` • Ref: ${mov.referencia}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: mov.tipo === 'ingreso' ? colors.olive : colors.terracotta
                }}>
                  {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMoneda(mov.monto)}
                </div>
                {isAdmin && mov.tipo === 'egreso' && !mov.venta_id && (
                  <button
                    onClick={() => handleEliminar(mov.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(196,120,74,0.1)',
                      color: colors.terracotta,
                      border: `1px solid ${colors.terracotta}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// Vista Balance - Cuentas por cobrar por cliente (ventas + servicios maquila)
const BalanceView = ({ isAdmin }) => {
  const [ventas, setVentas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('todos');
  const [expandido, setExpandido] = useState(null);

  const cargarDatos = async () => {
    setCargando(true);
    const [ventasRes, serviciosRes, clientesRes] = await Promise.all([
      getVentas(),
      getServiciosMaquila(),
      getClientes()
    ]);
    setVentas(ventasRes.data || []);
    setServicios(serviciosRes.data || []);
    setClientes(clientesRes.data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const formatearMoneda = (monto) => {
    return '$' + (parseFloat(monto) || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Agrupar ventas + servicios por cliente
  const resumenPorCliente = () => {
    const mapa = {};

    // Procesar ventas
    ventas.forEach(v => {
      const clienteId = v.cliente_id || 'sin_cliente';
      const clienteNombre = v.cliente_nombre || 'Venta directa (sin cliente)';

      if (!mapa[clienteId]) {
        mapa[clienteId] = {
          id: clienteId,
          nombre: clienteNombre,
          registros: [],
          totalVendido: 0,
          totalCobrado: 0,
          totalPendiente: 0,
          totalServicios: 0,
          totalServiciosPagado: 0,
          totalServiciosPendiente: 0,
          numVentas: 0,
          numServicios: 0
        };
      }

      mapa[clienteId].registros.push({ ...v, _tipo_registro: 'venta' });
      mapa[clienteId].numVentas += 1;
      mapa[clienteId].totalVendido += parseFloat(v.total) || 0;
      mapa[clienteId].totalCobrado += parseFloat(v.monto_pagado) || 0;
      mapa[clienteId].totalPendiente += Math.max(0, (parseFloat(v.total) || 0) - (parseFloat(v.monto_pagado) || 0));
    });

    // Procesar servicios de maquila
    servicios.forEach(s => {
      const clienteId = s.cliente_id || 'sin_cliente';
      const clienteNombre = s.cliente_nombre || 'Sin cliente asignado';

      if (!mapa[clienteId]) {
        mapa[clienteId] = {
          id: clienteId,
          nombre: clienteNombre,
          registros: [],
          totalVendido: 0,
          totalCobrado: 0,
          totalPendiente: 0,
          totalServicios: 0,
          totalServiciosPagado: 0,
          totalServiciosPendiente: 0,
          numVentas: 0,
          numServicios: 0
        };
      }

      mapa[clienteId].registros.push({ ...s, _tipo_registro: 'servicio' });
      mapa[clienteId].numServicios += 1;
      mapa[clienteId].totalServicios += parseFloat(s.total) || 0;
      mapa[clienteId].totalServiciosPagado += parseFloat(s.monto_pagado) || 0;
      mapa[clienteId].totalServiciosPendiente += Math.max(0, (parseFloat(s.total) || 0) - (parseFloat(s.monto_pagado) || 0));
    });

    return Object.values(mapa).sort((a, b) => {
      const deudaA = a.totalPendiente + a.totalServiciosPendiente;
      const deudaB = b.totalPendiente + b.totalServiciosPendiente;
      return deudaB - deudaA;
    });
  };

  const clientesConDatos = resumenPorCliente();

  // Filtrar por cliente seleccionado
  const clientesFiltrados = clienteSeleccionado === 'todos'
    ? clientesConDatos
    : clientesConDatos.filter(c => String(c.id) === clienteSeleccionado);

  // Totales globales
  const totales = clientesConDatos.reduce((acc, c) => ({
    vendido: acc.vendido + c.totalVendido,
    cobrado: acc.cobrado + c.totalCobrado,
    pendiente: acc.pendiente + c.totalPendiente,
    servicios: acc.servicios + c.totalServicios,
    serviciosPagado: acc.serviciosPagado + c.totalServiciosPagado,
    serviciosPendiente: acc.serviciosPendiente + c.totalServiciosPendiente
  }), { vendido: 0, cobrado: 0, pendiente: 0, servicios: 0, serviciosPagado: 0, serviciosPendiente: 0 });

  const deudaTotal = totales.pendiente + totales.serviciosPendiente;
  const clientesConDeuda = clientesConDatos.filter(c => (c.totalPendiente + c.totalServiciosPendiente) > 0).length;

  const estadoBadge = (estado) => {
    const estilos = {
      pagado: { bg: 'rgba(171,213,94,0.2)', color: colors.olive, label: 'Pagado' },
      parcial: { bg: 'rgba(247,183,49,0.2)', color: '#F7B731', label: 'Parcial' },
      pendiente: { bg: 'rgba(196,120,74,0.2)', color: colors.terracotta, label: 'Pendiente' },
      cancelado: { bg: 'rgba(150,150,150,0.2)', color: '#999', label: 'Cancelado' }
    };
    const e = estilos[estado] || estilos.pendiente;
    return (
      <span style={{
        padding: '2px 10px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: '600',
        background: e.bg,
        color: e.color
      }}>
        {e.label}
      </span>
    );
  };

  const tipoBadge = (tipoRegistro, tipoVenta) => {
    if (tipoRegistro === 'servicio') {
      return (
        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', background: 'rgba(156,175,136,0.2)', color: colors.sage }}>
          Maquila
        </span>
      );
    }
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        background: tipoVenta === 'consignacion' ? 'rgba(0,95,132,0.1)' : 'rgba(171,213,94,0.15)',
        color: tipoVenta === 'consignacion' ? colors.sidebarBg : colors.olive
      }}>
        {tipoVenta === 'consignacion' ? 'Consignación' : 'Directa'}
      </span>
    );
  };

  if (cargando) {
    return <div style={{ textAlign: 'center', padding: '60px', color: colors.camel }}>Cargando...</div>;
  }

  return (
    <div>
      <h2 style={{ color: colors.espresso, marginBottom: '20px' }}>Balance de Cuentas</h2>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Total ventas</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(totales.vendido)}</div>
        </div>
        <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Cobrado ventas</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: colors.olive }}>{formatearMoneda(totales.cobrado)}</div>
        </div>
        <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Total maquila</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(totales.servicios)}</div>
        </div>
        <div style={{
          background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center',
          border: deudaTotal > 0 ? `2px solid ${colors.terracotta}` : `1px solid ${colors.sand}`
        }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Total por cobrar</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: deudaTotal > 0 ? colors.terracotta : colors.olive }}>
            {formatearMoneda(deudaTotal)}
          </div>
          {deudaTotal > 0 && (
            <div style={{ fontSize: '11px', color: colors.camel, marginTop: '4px' }}>
              Ventas: {formatearMoneda(totales.pendiente)} • Maquila: {formatearMoneda(totales.serviciosPendiente)}
            </div>
          )}
        </div>
        <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Clientes con deuda</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: clientesConDeuda > 0 ? colors.terracotta : colors.olive }}>
            {clientesConDeuda}
          </div>
        </div>
      </div>

      {/* Filtro por cliente */}
      <div style={{ marginBottom: '20px' }}>
        <select
          value={clienteSeleccionado}
          onChange={e => { setClienteSeleccionado(e.target.value); setExpandido(null); }}
          style={{
            padding: '10px 14px',
            border: `1px solid ${colors.sand}`,
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            minWidth: '250px'
          }}
        >
          <option value="todos">Todos los clientes</option>
          {clientesConDatos
            .filter(c => c.id !== 'sin_cliente')
            .map(c => {
              const deuda = c.totalPendiente + c.totalServiciosPendiente;
              return (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre} {deuda > 0 ? `(debe ${formatearMoneda(deuda)})` : '(al corriente)'}
                </option>
              );
            })}
        </select>
      </div>

      {/* Lista de clientes */}
      {clientesFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
          No hay datos para mostrar
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {clientesFiltrados.map(cliente => {
            const deudaCliente = cliente.totalPendiente + cliente.totalServiciosPendiente;
            const totalGeneral = cliente.totalVendido + cliente.totalServicios;
            const totalCobradoGeneral = cliente.totalCobrado + cliente.totalServiciosPagado;

            return (
              <div key={cliente.id} style={{
                background: colors.cotton,
                borderRadius: '12px',
                border: `1px solid ${deudaCliente > 0 ? colors.terracotta : colors.sand}`,
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div
                  onClick={() => setExpandido(expandido === cliente.id ? null : cliente.id)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px',
                    background: expandido === cliente.id ? colors.linen : 'transparent'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: colors.espresso }}>
                      {cliente.nombre}
                    </div>
                    <div style={{ fontSize: '13px', color: colors.camel, marginTop: '2px' }}>
                      {cliente.numVentas > 0 && `${cliente.numVentas} venta${cliente.numVentas !== 1 ? 's' : ''}`}
                      {cliente.numVentas > 0 && cliente.numServicios > 0 && ' • '}
                      {cliente.numServicios > 0 && `${cliente.numServicios} servicio${cliente.numServicios !== 1 ? 's' : ''}`}
                      {` • Total: ${formatearMoneda(totalGeneral)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: colors.olive }}>
                        Cobrado/Pagado: {formatearMoneda(totalCobradoGeneral)}
                      </div>
                      {deudaCliente > 0 ? (
                        <div style={{ fontSize: '16px', fontWeight: '700', color: colors.terracotta }}>
                          Debe: {formatearMoneda(deudaCliente)}
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', fontWeight: '600', color: colors.olive }}>
                          Al corriente
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '18px', color: colors.camel, transition: 'transform 0.2s', transform: expandido === cliente.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* Detalle expandido */}
                {expandido === cliente.id && (
                  <div style={{ padding: '0 20px 16px' }}>
                    {/* Barra de progreso */}
                    {totalGeneral > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>
                          <span>Progreso de cobro/pago</span>
                          <span>{Math.round((totalCobradoGeneral / totalGeneral) * 100)}%</span>
                        </div>
                        <div style={{ background: colors.sand, borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(100, (totalCobradoGeneral / totalGeneral) * 100)}%`,
                            height: '100%',
                            background: deudaCliente > 0 ? colors.terracotta : colors.olive,
                            borderRadius: '4px',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Resumen por tipo si tiene ambos */}
                    {cliente.numVentas > 0 && cliente.numServicios > 0 && (
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <div style={{ padding: '10px 16px', background: 'rgba(0,95,132,0.05)', borderRadius: '8px', fontSize: '13px' }}>
                          <strong>Ventas:</strong> {formatearMoneda(cliente.totalVendido)} total • {formatearMoneda(cliente.totalCobrado)} cobrado • <span style={{ color: cliente.totalPendiente > 0 ? colors.terracotta : colors.olive }}>{formatearMoneda(cliente.totalPendiente)} pendiente</span>
                        </div>
                        <div style={{ padding: '10px 16px', background: 'rgba(156,175,136,0.1)', borderRadius: '8px', fontSize: '13px' }}>
                          <strong>Maquila:</strong> {formatearMoneda(cliente.totalServicios)} total • {formatearMoneda(cliente.totalServiciosPagado)} pagado • <span style={{ color: cliente.totalServiciosPendiente > 0 ? colors.terracotta : colors.olive }}>{formatearMoneda(cliente.totalServiciosPendiente)} pendiente</span>
                        </div>
                      </div>
                    )}

                    {/* Tabla combinada */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${colors.sand}` }}>
                            <th style={{ padding: '8px', textAlign: 'left', color: colors.camel, fontWeight: '600' }}>Fecha</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: colors.camel, fontWeight: '600' }}>Concepto</th>
                            <th style={{ padding: '8px', textAlign: 'center', color: colors.camel, fontWeight: '600' }}>Tipo</th>
                            <th style={{ padding: '8px', textAlign: 'center', color: colors.camel, fontWeight: '600' }}>Cant.</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: colors.camel, fontWeight: '600' }}>Total</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: colors.camel, fontWeight: '600' }}>Pagado</th>
                            <th style={{ padding: '8px', textAlign: 'right', color: colors.camel, fontWeight: '600' }}>Pendiente</th>
                            <th style={{ padding: '8px', textAlign: 'center', color: colors.camel, fontWeight: '600' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cliente.registros
                            .sort((a, b) => new Date(b.created_at || b.fecha) - new Date(a.created_at || a.fecha))
                            .map(r => {
                              const esServicio = r._tipo_registro === 'servicio';
                              const total = parseFloat(r.total) || 0;
                              const pagado = parseFloat(r.monto_pagado) || 0;
                              const pendiente = Math.max(0, total - pagado);
                              const fecha = esServicio ? r.fecha : r.created_at;
                              const concepto = esServicio
                                ? `${r.maquila} - ${r.tipo_producto}`
                                : `${r.producto_nombre || '-'}${r.producto_medidas ? ` (${r.producto_medidas})` : ''}`;

                              return (
                                <tr key={`${r._tipo_registro}-${r.id}`} style={{ borderBottom: `1px solid ${colors.sand}` }}>
                                  <td style={{ padding: '10px 8px', color: colors.espresso }}>{formatearFecha(fecha)}</td>
                                  <td style={{ padding: '10px 8px', color: colors.espresso }}>{concepto}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                    {tipoBadge(r._tipo_registro, r.tipo_venta)}
                                  </td>
                                  <td style={{ padding: '10px 8px', textAlign: 'center', color: colors.espresso }}>{r.cantidad}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', color: colors.espresso }}>{formatearMoneda(total)}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', color: colors.olive }}>{formatearMoneda(pagado)}</td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', color: pendiente > 0 ? colors.terracotta : colors.olive }}>
                                    {pendiente > 0 ? formatearMoneda(pendiente) : '-'}
                                  </td>
                                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>{estadoBadge(r.estado_pago)}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// Vista Servicios de Maquila
const ServiciosView = ({ isAdmin }) => {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCliente, setFiltroCliente] = useState('todos');
  const [mostrarPago, setMostrarPago] = useState(null);
  const [montoPago, setMontoPago] = useState('');
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({
    maquila: '',
    tipoProducto: '',
    clienteId: '',
    cantidad: '',
    costoUnitario: '',
    metodoPago: 'efectivo',
    estadoPago: 'pendiente',
    notas: ''
  });

  const cargarDatos = async () => {
    setCargando(true);
    const filtros = {};
    if (filtroEstado !== 'todos') filtros.estadoPago = filtroEstado;
    if (filtroCliente !== 'todos') filtros.clienteId = filtroCliente;

    const [servRes, cliRes] = await Promise.all([
      getServiciosMaquila(filtros),
      getClientes()
    ]);
    setServicios(servRes.data || []);
    setClientes(cliRes.data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroEstado, filtroCliente]);

  const formatearMoneda = (monto) => {
    return '$' + (parseFloat(monto) || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalCalculado = () => {
    const cant = parseInt(form.cantidad) || 0;
    const costo = parseFloat(form.costoUnitario) || 0;
    return cant * costo;
  };

  const resetForm = () => {
    setForm({ maquila: '', tipoProducto: '', clienteId: '', cantidad: '', costoUnitario: '', metodoPago: 'efectivo', estadoPago: 'pendiente', notas: '' });
    setEditando(null);
  };

  const handleGuardar = async () => {
    if (!form.maquila.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa la descripción del servicio' });
      return;
    }
    if (!form.tipoProducto.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa el tipo de producto' });
      return;
    }
    if (!form.cantidad || parseInt(form.cantidad) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa una cantidad válida' });
      return;
    }
    if (!form.costoUnitario || parseFloat(form.costoUnitario) < 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un costo unitario válido' });
      return;
    }

    setGuardando(true);
    try {
      const total = totalCalculado();
      const cliente = clientes.find(c => c.id === parseInt(form.clienteId));

      const datos = {
        maquila: form.maquila.trim(),
        tipo_producto: form.tipoProducto.trim(),
        cliente_id: form.clienteId ? parseInt(form.clienteId) : null,
        cliente_nombre: cliente?.nombre || null,
        cantidad: parseInt(form.cantidad),
        costo_unitario: parseFloat(form.costoUnitario),
        total: total,
        estado_pago: form.estadoPago,
        monto_pagado: form.estadoPago === 'pagado' ? total : 0,
        metodo_pago: form.metodoPago,
        notas: form.notas.trim() || null
      };

      let result;
      if (editando) {
        result = await updateServicioMaquila(editando, datos);
      } else {
        result = await createServicioMaquila(datos);
      }

      if (result.error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + result.error.message });
      } else {
        // Si se cobró al crear, registrar ingreso en caja
        if (!editando && form.estadoPago === 'pagado' && total > 0) {
          await createMovimientoCaja({
            tipo: 'ingreso',
            monto: total,
            categoria: 'venta',
            metodo_pago: form.metodoPago,
            descripcion: `Cobro servicio maquila - ${form.maquila} - ${form.tipoProducto} - ${form.cantidad} pzas`
          });
        }

        setMensaje({ tipo: 'exito', texto: editando ? 'Servicio actualizado' : 'Servicio registrado' });
        setMostrarForm(false);
        resetForm();
        cargarDatos();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  const handleEditar = (servicio) => {
    setForm({
      maquila: servicio.maquila,
      tipoProducto: servicio.tipo_producto,
      clienteId: servicio.cliente_id ? String(servicio.cliente_id) : '',
      cantidad: String(servicio.cantidad),
      costoUnitario: String(servicio.costo_unitario),
      metodoPago: servicio.metodo_pago || 'efectivo',
      estadoPago: servicio.estado_pago,
      notas: servicio.notas || ''
    });
    setEditando(servicio.id);
    setMostrarForm(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return;
    const { error } = await deleteServicioMaquila(id);
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Servicio eliminado' });
      cargarDatos();
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
    }
  };

  const handlePago = async (servicioId) => {
    const monto = parseFloat(montoPago);
    if (!monto || monto <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un monto válido' });
      return;
    }
    setGuardando(true);
    try {
      const { error } = await registrarPagoServicio(servicioId, monto);
      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: 'Pago registrado' });
        setMostrarPago(null);
        setMontoPago('');
        cargarDatos();
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Totales
  const totales = servicios.reduce((acc, s) => ({
    total: acc.total + (parseFloat(s.total) || 0),
    pagado: acc.pagado + (parseFloat(s.monto_pagado) || 0),
    pendiente: acc.pendiente + Math.max(0, (parseFloat(s.total) || 0) - (parseFloat(s.monto_pagado) || 0))
  }), { total: 0, pagado: 0, pendiente: 0 });

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${colors.sand}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    boxSizing: 'border-box'
  };

  const estadoBadge = (estado) => {
    const estilos = {
      pagado: { bg: 'rgba(171,213,94,0.2)', color: colors.olive, label: 'Pagado' },
      parcial: { bg: 'rgba(247,183,49,0.2)', color: '#F7B731', label: 'Parcial' },
      pendiente: { bg: 'rgba(196,120,74,0.2)', color: colors.terracotta, label: 'Pendiente' }
    };
    const e = estilos[estado] || estilos.pendiente;
    return (
      <span style={{
        padding: '2px 10px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: '600',
        background: e.bg,
        color: e.color
      }}>
        {e.label}
      </span>
    );
  };

  return (
    <div>
      <h2 style={{ color: colors.espresso, marginBottom: '20px' }}>Servicios de Maquila</h2>

      {/* Mensaje */}
      {mensaje.texto && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
          color: mensaje.tipo === 'exito' ? colors.olive : colors.terracotta,
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive : colors.terracotta}`
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Total servicios</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(totales.total)}</div>
        </div>
        <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Pagado</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.olive }}>{formatearMoneda(totales.pagado)}</div>
        </div>
        <div style={{
          background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center',
          border: totales.pendiente > 0 ? `2px solid ${colors.terracotta}` : `1px solid ${colors.sand}`
        }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Por cobrar</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: totales.pendiente > 0 ? colors.terracotta : colors.olive }}>
            {formatearMoneda(totales.pendiente)}
          </div>
        </div>
        <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '8px' }}>Registros</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: colors.espresso }}>{servicios.length}</div>
        </div>
      </div>

      {/* Controles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        {isAdmin && (
          <button
            onClick={() => { setMostrarForm(!mostrarForm); if (mostrarForm) resetForm(); }}
            style={{
              padding: '10px 20px',
              background: colors.sidebarBg,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            {mostrarForm ? 'Cancelar' : '+ Nuevo Servicio'}
          </button>
        )}

        <div style={{ display: 'flex', gap: '4px', background: colors.cotton, borderRadius: '8px', padding: '4px' }}>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'parcial', label: 'Parciales' },
            { id: 'pagado', label: 'Pagados' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFiltroEstado(f.id)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: filtroEstado === f.id ? '700' : '400',
                background: filtroEstado === f.id ? colors.sidebarBg : 'transparent',
                color: filtroEstado === f.id ? 'white' : colors.espresso
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={filtroCliente}
          onChange={e => setFiltroCliente(e.target.value)}
          style={{
            padding: '8px 12px',
            border: `1px solid ${colors.sand}`,
            borderRadius: '8px',
            fontSize: '13px',
            background: 'white'
          }}
        >
          <option value="todos">Todos los clientes</option>
          {clientes.map(c => (
            <option key={c.id} value={String(c.id)}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Formulario */}
      {mostrarForm && isAdmin && (
        <div style={{
          background: colors.cotton,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: `1px solid ${colors.sand}`
        }}>
          <h3 style={{ color: colors.espresso, marginTop: 0, marginBottom: '16px' }}>
            {editando ? 'Editar Servicio' : 'Nuevo Servicio de Maquila'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Servicio *</label>
              <input
                type="text"
                value={form.maquila}
                onChange={e => setForm({ ...form, maquila: e.target.value })}
                placeholder="Descripción del servicio"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Tipo de producto *</label>
              <input
                type="text"
                value={form.tipoProducto}
                onChange={e => setForm({ ...form, tipoProducto: e.target.value })}
                placeholder="Ej: Totebag Eco, Sábana King..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Cliente</label>
              <select
                value={form.clienteId}
                onChange={e => setForm({ ...form, clienteId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Sin cliente</option>
                {clientes.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Cantidad *</label>
              <input
                type="number"
                min="1"
                value={form.cantidad}
                onChange={e => setForm({ ...form, cantidad: e.target.value })}
                placeholder="0"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Precio por unidad *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.costoUnitario}
                onChange={e => setForm({ ...form, costoUnitario: e.target.value })}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Total</label>
              <div style={{
                ...inputStyle,
                background: colors.linen,
                fontWeight: '700',
                color: colors.sidebarBg,
                display: 'flex',
                alignItems: 'center'
              }}>
                {formatearMoneda(totalCalculado())}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Estado de pago</label>
              <select
                value={form.estadoPago}
                onChange={e => setForm({ ...form, estadoPago: e.target.value })}
                style={inputStyle}
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Método de pago</label>
              <select
                value={form.metodoPago}
                onChange={e => setForm({ ...form, metodoPago: e.target.value })}
                style={inputStyle}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Notas</label>
            <textarea
              value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              style={{
                padding: '10px 24px',
                background: colors.sidebarBg,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                opacity: guardando ? 0.6 : 1
              }}
            >
              {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar Servicio'}
            </button>
            <button
              onClick={() => { setMostrarForm(false); resetForm(); }}
              style={{
                padding: '10px 24px',
                background: colors.sand,
                color: colors.espresso,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de servicios */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.camel }}>Cargando...</div>
      ) : servicios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
          No hay servicios registrados
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {servicios.map(s => {
            const pendiente = Math.max(0, (parseFloat(s.total) || 0) - (parseFloat(s.monto_pagado) || 0));
            return (
              <div key={s.id} style={{
                background: colors.cotton,
                border: `1px solid ${s.estado_pago === 'pagado' ? colors.sand : s.estado_pago === 'parcial' ? '#F7B731' : colors.terracotta}`,
                borderRadius: '10px',
                padding: '16px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: colors.espresso }}>{s.maquila}</span>
                      {estadoBadge(s.estado_pago)}
                    </div>
                    <div style={{ fontSize: '14px', color: colors.sidebarBg, marginBottom: '2px' }}>
                      {s.tipo_producto}
                    </div>
                    <div style={{ fontSize: '13px', color: colors.camel }}>
                      {s.cantidad} pzas × {formatearMoneda(s.costo_unitario)}
                      {s.cliente_nombre ? ` • Cliente: ${s.cliente_nombre}` : ''}
                      {` • ${formatearFecha(s.fecha)}`}
                    </div>
                    {s.notas && (
                      <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px', fontStyle: 'italic' }}>
                        {s.notas}
                      </div>
                    )}
                  </div>

                  {/* Montos y acciones */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.espresso }}>
                      {formatearMoneda(s.total)}
                    </div>
                    {s.estado_pago !== 'pagado' && (
                      <div style={{ fontSize: '12px', color: colors.terracotta }}>
                        Adeuda: {formatearMoneda(pendiente)}
                      </div>
                    )}
                    {s.estado_pago === 'parcial' && (
                      <div style={{ fontSize: '12px', color: colors.olive }}>
                        Pagado: {formatearMoneda(s.monto_pagado)}
                      </div>
                    )}

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', justifyContent: 'flex-end' }}>
                        {s.estado_pago !== 'pagado' && (
                          <button
                            onClick={() => { setMostrarPago(mostrarPago === s.id ? null : s.id); setMontoPago(''); }}
                            style={{
                              padding: '5px 12px',
                              background: 'rgba(171,213,94,0.15)',
                              color: colors.olive,
                              border: `1px solid ${colors.olive}`,
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Registrar pago
                          </button>
                        )}
                        <button
                          onClick={() => handleEditar(s)}
                          style={{
                            padding: '5px 12px',
                            background: 'rgba(0,95,132,0.1)',
                            color: colors.sidebarBg,
                            border: `1px solid ${colors.sidebarBg}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(s.id)}
                          style={{
                            padding: '5px 12px',
                            background: 'rgba(196,120,74,0.1)',
                            color: colors.terracotta,
                            border: `1px solid ${colors.terracotta}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Formulario de pago inline */}
                {mostrarPago === s.id && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: `1px solid ${colors.sand}`,
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '13px', color: colors.camel }}>Monto a pagar:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={pendiente}
                      value={montoPago}
                      onChange={e => setMontoPago(e.target.value)}
                      placeholder={`Máx ${formatearMoneda(pendiente)}`}
                      style={{ ...inputStyle, width: '160px' }}
                    />
                    <button
                      onClick={() => handlePago(s.id)}
                      disabled={guardando}
                      style={{
                        padding: '8px 16px',
                        background: colors.olive,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: guardando ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      {guardando ? 'Procesando...' : 'Pagar'}
                    </button>
                    <button
                      onClick={() => { setMostrarPago(null); setMontoPago(''); }}
                      style={{
                        padding: '8px 16px',
                        background: colors.sand,
                        color: colors.espresso,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
        <div style={{ overflowX: 'auto' }}>
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
      </div>

      {/* Escala por volumen */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>
          DESCUENTOS POR VOLUMEN (Base: ${linea.precioMayoreo})
        </h3>
        <div style={{ overflowX: 'auto' }}>
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

// Vista E-commerce - AMAZON
const EcommerceView = ({ productosActualizados, costosAmazon, setCostosAmazon, isAdmin }) => {
  const [editandoCostos, setEditandoCostos] = useState(false);
  const [editandoMayoreo, setEditandoMayoreo] = useState(false);
  const [guardandoCostos, setGuardandoCostos] = useState(false);
  const [mensajeCostos, setMensajeCostos] = useState({ tipo: '', texto: '' });
  const [costosTemp, setCostosTemp] = useState(costosAmazon || COSTOS_AMAZON_DEFAULT);

  // Usar costos actuales o defaults
  const costos = costosAmazon || COSTOS_AMAZON_DEFAULT;
  const costoProduccion = calcularCostoProduccion(costos);
  const amazonPreciosData = generarAmazonPreciosData(costos);
  const amazonMayoreoData = generarAmazonMayoreoData(costos);

  const handleGuardarCostos = async () => {
    setGuardandoCostos(true);
    setMensajeCostos({ tipo: '', texto: '' });

    try {
      // Guardar en Supabase
      const { error } = await saveCostosAmazon(costosTemp);

      if (error) {
        console.error('Error guardando costos:', error);
        setMensajeCostos({ tipo: 'error', texto: 'Error al guardar costos' });
      } else {
        // Actualizar estado local
        if (setCostosAmazon) {
          setCostosAmazon(costosTemp);
        }
        setMensajeCostos({ tipo: 'exito', texto: 'Costos guardados correctamente' });
        setEditandoCostos(false);
        setEditandoMayoreo(false);

        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMensajeCostos({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      console.error('Error guardando costos:', err);
      setMensajeCostos({ tipo: 'error', texto: 'Error al guardar costos' });
    } finally {
      setGuardandoCostos(false);
    }
  };

  const handleCancelar = () => {
    setCostosTemp(costos);
    setEditandoCostos(false);
    setMensajeCostos({ tipo: '', texto: '' });
  };

  const inputStyle = {
    width: '80px',
    padding: '8px',
    border: `1px solid ${colors.camel}`,
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '600'
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 25px', fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
        Amazon — Análisis de Costos y Mayoreo
      </h2>

      {/* Parámetros Base */}
      <div style={{
        background: `linear-gradient(135deg, #FF9900 0%, #FF9900 100%)`,
        padding: '20px',
        marginBottom: '25px',
        borderRadius: '8px',
        color: '#232F3E'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <span style={{ fontSize: '28px' }}>📦</span>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
            AMAZON — Parámetros de Costo (Manta Cruda)
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>COSTO PRODUCCIÓN</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#232F3E' }}>${costoProduccion.toFixed(2)}</div>
            <div style={{ fontSize: '9px', color: '#888' }}>Material + Maquila + Insumos</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>COMISIÓN AMAZON</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#E47911' }}>{costos.amazonComision}%</div>
            <div style={{ fontSize: '9px', color: '#888' }}>Del valor de venta</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>TARIFA FBA</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#232F3E' }}>${costos.amazonFbaFee}</div>
            <div style={{ fontSize: '9px', color: '#888' }}>Gestión por envío</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>ENVÍO BODEGA</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#232F3E' }}>${costos.amazonEnvioBodega}</div>
            <div style={{ fontSize: '9px', color: '#888' }}>Prorrateado</div>
          </div>
        </div>
      </div>

      {/* Análisis de Precios Amazon */}
      <div style={{ background: colors.cotton, padding: '20px', border: `2px solid #FF9900`, marginBottom: '25px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: '#232F3E' }}>
          ANÁLISIS DE RENTABILIDAD POR PRECIO — Amazon FBA
        </h3>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#232F3E', color: 'white' }}>
              {['Precio Venta', `Comisión ${costos.amazonComision}%`, 'Costo Total', 'Utilidad/pza', 'Margen %'].map(h => (
                <th key={h} style={{ padding: '12px', textAlign: 'center', fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {amazonPreciosData.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#232F3E' }}>${row.precioVenta}</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#E47911' }}>${row.comision}</td>
                <td style={{ padding: '12px', textAlign: 'center', color: colors.camel }}>${row.costoTotal}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: parseFloat(row.utilidad) > 0 ? colors.olive : colors.terracotta }}>
                  ${row.utilidad}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: parseFloat(row.margen) >= 50 ? colors.olive : parseFloat(row.margen) >= 30 ? '#F39C12' : colors.terracotta }}>
                  {row.margen}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div style={{ marginTop: '15px', padding: '10px', background: '#FFF3CD', borderRadius: '4px', fontSize: '11px', color: '#856404' }}>
          <strong>Nota:</strong> Costo FBA y envío a bodega prorrateados por {costos.piezasPorEnvioFBA} piezas. Para mejor margen, envía lotes de 20+ piezas.
        </div>
      </div>

      {/* Tabla de Mayoreo Amazon - Mínimo 20 piezas - EDITABLE */}
      <div style={{ background: colors.cotton, padding: '20px', border: `2px solid ${editandoMayoreo ? colors.sidebarBg : '#DA9F17'}`, marginBottom: '25px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🏷️</span>
            <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>
              TABLA DE PRECIOS MAYOREO — Mínimo {amazonMayoreoData[0]?.cantidad || 20} piezas (Precio Base: ${editandoMayoreo ? costosTemp.precioBaseMayoreo : costos.precioBaseMayoreo})
              {isAdmin && <span style={{ fontSize: '10px', color: colors.sidebarBg, marginLeft: '10px' }}>(Admin: Editable)</span>}
            </h3>
          </div>
          {isAdmin && !editandoMayoreo && !editandoCostos && (
            <button
              onClick={() => setEditandoMayoreo(true)}
              style={{
                background: '#DA9F17',
                color: colors.sidebarBg,
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Editar Tabla
            </button>
          )}
          {isAdmin && editandoMayoreo && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleGuardarCostos}
                disabled={guardandoCostos}
                style={{
                  background: guardandoCostos ? colors.camel : colors.olive,
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: guardandoCostos ? 'wait' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                {guardandoCostos ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => { setCostosTemp(costos); setEditandoMayoreo(false); }}
                style={{
                  background: colors.terracotta,
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Precio Base Editable */}
        {editandoMayoreo && (
          <div style={{ marginBottom: '15px', padding: '15px', background: '#DA9F1720', borderRadius: '6px', border: '1px solid #DA9F17' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '11px', color: colors.sidebarBg, display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Precio Base por Pieza ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={costosTemp.precioBaseMayoreo}
                  onChange={(e) => setCostosTemp({ ...costosTemp, precioBaseMayoreo: parseFloat(e.target.value) || 0 })}
                  style={{ ...inputStyle, width: '100px' }}
                />
              </div>
              <div style={{ fontSize: '11px', color: colors.camel, maxWidth: '300px' }}>
                Este es el precio base sin descuento para la cantidad mínima (20 pzas). Los descuentos se aplican sobre este precio.
              </div>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: colors.sidebarBg, color: 'white' }}>
                {(editandoMayoreo
                  ? ['Cantidad', 'Segmento', 'Descuento %', 'Precio/pza', 'Utilidad/pza', 'Margen %', 'Ingreso Total', 'Utilidad Total']
                  : ['Cantidad', 'Descuento', 'Precio/pza', 'Utilidad/pza', 'Margen %', 'Ingreso Total', 'Utilidad Total', 'Segmento']
                ).map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'center', fontSize: '9px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(editandoMayoreo ? generarAmazonMayoreoData(costosTemp) : amazonMayoreoData).map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? colors.cotton : colors.cream }}>
                  {editandoMayoreo ? (
                    <>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input
                          type="number"
                          value={costosTemp.volumenesMayoreo[i]?.cantidad || row.cantidad}
                          onChange={(e) => {
                            const newVol = [...(costosTemp.volumenesMayoreo || COSTOS_AMAZON_DEFAULT.volumenesMayoreo)];
                            newVol[i] = { ...newVol[i], cantidad: parseInt(e.target.value) || 0 };
                            setCostosTemp({ ...costosTemp, volumenesMayoreo: newVol });
                          }}
                          style={{ ...inputStyle, width: isMobile ? '45px' : '60px', padding: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input
                          type="text"
                          value={costosTemp.volumenesMayoreo[i]?.segmento || row.segmento}
                          onChange={(e) => {
                            const newVol = [...(costosTemp.volumenesMayoreo || COSTOS_AMAZON_DEFAULT.volumenesMayoreo)];
                            newVol[i] = { ...newVol[i], segmento: e.target.value };
                            setCostosTemp({ ...costosTemp, volumenesMayoreo: newVol });
                          }}
                          style={{ ...inputStyle, width: isMobile ? '65px' : '90px', padding: '6px' }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <input
                          type="number"
                          step="1"
                          value={costosTemp.volumenesMayoreo[i]?.descuento || 0}
                          onChange={(e) => {
                            const newVol = [...(costosTemp.volumenesMayoreo || COSTOS_AMAZON_DEFAULT.volumenesMayoreo)];
                            newVol[i] = { ...newVol[i], descuento: parseFloat(e.target.value) || 0 };
                            setCostosTemp({ ...costosTemp, volumenesMayoreo: newVol });
                          }}
                          style={{ ...inputStyle, width: isMobile ? '40px' : '50px', padding: '6px' }}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: colors.sidebarBg }}>{row.cantidad} pzas</td>
                      <td style={{ padding: '10px', textAlign: 'center', color: '#E47911', fontWeight: '600' }}>{row.descuento}%</td>
                    </>
                  )}
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: '#232F3E' }}>${row.precioUnit}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: parseFloat(row.utilidadUnit) > 0 ? colors.olive : colors.terracotta }}>${row.utilidadUnit}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: parseFloat(row.margen) >= 50 ? colors.olive : parseFloat(row.margen) >= 20 ? '#F39C12' : colors.terracotta }}>
                    {row.margen}%
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', color: colors.camel }}>${row.ingresoTotal}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '700', color: colors.olive }}>${row.utilidadTotal}</td>
                  {!editandoMayoreo && (
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '10px', color: colors.espresso }}>{row.segmento}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de rentabilidad */}
        <div style={{ marginTop: '15px', padding: '12px', background: colors.sidebarBg, borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ color: 'white', fontSize: '12px' }}>
            <strong>Costo Producción:</strong> ${costoProduccion.toFixed(2)} | <strong>Precio Mín:</strong> ${costos.precioBaseMayoreo} | <strong>Utilidad Mín:</strong> ${(costos.precioBaseMayoreo - costoProduccion).toFixed(2)}
          </div>
          <div style={{ color: '#ABD55E', fontSize: '14px', fontWeight: '700' }}>
            Margen Mínimo: {(((costos.precioBaseMayoreo - costoProduccion) / costoProduccion) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Gráfico comparativo - Utilidad por volumen */}
      <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '25px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>UTILIDAD TOTAL POR VOLUMEN</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={amazonMayoreoData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
            <XAxis dataKey="cantidad" stroke={colors.camel} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v} pzas`} />
            <YAxis stroke={colors.camel} tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: colors.cotton, border: `1px solid ${colors.camel}` }}
              formatter={(value, name) => [`$${value}`, name]}
            />
            <Bar dataKey="utilidadTotal" fill={colors.olive} name="Utilidad Total" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Desglose de Costos - EDITABLE POR ADMIN */}
      <div style={{ background: `${colors.cream}`, padding: '20px', border: `2px solid ${isAdmin ? colors.sidebarBg : colors.sand}`, marginBottom: '25px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>
            DESGLOSE DE COSTOS — Manta Cruda (Tote Bag 35x40 cm)
            {isAdmin && <span style={{ fontSize: '10px', color: colors.sidebarBg, marginLeft: '10px' }}>(Admin: Editable)</span>}
          </h3>
          {isAdmin && !editandoCostos && (
            <button
              onClick={() => { setCostosTemp(costos); setEditandoCostos(true); }}
              style={{
                background: colors.sidebarBg,
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Editar Costos
            </button>
          )}
          {isAdmin && editandoCostos && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handleGuardarCostos}
                disabled={guardandoCostos}
                style={{
                  background: guardandoCostos ? colors.camel : colors.olive,
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: guardandoCostos ? 'wait' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  opacity: guardandoCostos ? 0.7 : 1
                }}
              >
                {guardandoCostos ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancelar}
                disabled={guardandoCostos}
                style={{
                  background: colors.terracotta,
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: guardandoCostos ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Mensaje de éxito/error */}
        {mensajeCostos.texto && (
          <div style={{
            marginBottom: '15px',
            padding: '12px',
            borderRadius: '6px',
            background: mensajeCostos.tipo === 'exito' ? 'rgba(171,213,94,0.2)' : 'rgba(196,120,74,0.2)',
            border: `1px solid ${mensajeCostos.tipo === 'exito' ? colors.olive : colors.terracotta}`,
            color: mensajeCostos.tipo === 'exito' ? colors.olive : colors.terracotta,
            textAlign: 'center',
            fontWeight: '500',
            fontSize: '13px'
          }}>
            {mensajeCostos.texto}
          </div>
        )}

        {/* Costos de Producción */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ background: colors.cotton, padding: '15px', borderRadius: '6px', border: `1px solid ${colors.sand}` }}>
            <div style={{ fontSize: '11px', color: colors.sidebarBg, marginBottom: '8px', fontWeight: '600' }}>MATERIAL (Manta)</div>
            {editandoCostos ? (
              <input
                type="number"
                step="0.01"
                value={costosTemp.material}
                onChange={(e) => setCostosTemp({ ...costosTemp, material: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            ) : (
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.espresso }}>${costos.material.toFixed(2)}/bolsa</div>
            )}
            <div style={{ fontSize: '9px', color: colors.camel, marginTop: '5px' }}>0.5m para 2 bolsas</div>
          </div>
          <div style={{ background: colors.cotton, padding: '15px', borderRadius: '6px', border: `1px solid ${colors.sand}` }}>
            <div style={{ fontSize: '11px', color: colors.sidebarBg, marginBottom: '8px', fontWeight: '600' }}>MAQUILA (Corte + Confección)</div>
            {editandoCostos ? (
              <input
                type="number"
                step="0.01"
                value={costosTemp.maquila}
                onChange={(e) => setCostosTemp({ ...costosTemp, maquila: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            ) : (
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.espresso }}>${costos.maquila.toFixed(2)}/bolsa</div>
            )}
            <div style={{ fontSize: '9px', color: colors.camel, marginTop: '5px' }}>Chiautempan/Texmelucan</div>
          </div>
          <div style={{ background: colors.cotton, padding: '15px', borderRadius: '6px', border: `1px solid ${colors.sand}` }}>
            <div style={{ fontSize: '11px', color: colors.sidebarBg, marginBottom: '8px', fontWeight: '600' }}>INSUMOS (Hilo + Etiqueta)</div>
            {editandoCostos ? (
              <input
                type="number"
                step="0.01"
                value={costosTemp.insumos}
                onChange={(e) => setCostosTemp({ ...costosTemp, insumos: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            ) : (
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.espresso }}>${costos.insumos.toFixed(2)}/bolsa</div>
            )}
            <div style={{ fontSize: '9px', color: colors.camel, marginTop: '5px' }}>Hilo calibre 30/2</div>
          </div>
          <div style={{ background: colors.cotton, padding: '15px', borderRadius: '6px', border: `1px solid ${colors.sand}` }}>
            <div style={{ fontSize: '11px', color: colors.sidebarBg, marginBottom: '8px', fontWeight: '600' }}>MERMA (5%)</div>
            {editandoCostos ? (
              <input
                type="number"
                step="0.01"
                value={costosTemp.merma}
                onChange={(e) => setCostosTemp({ ...costosTemp, merma: parseFloat(e.target.value) || 0 })}
                style={inputStyle}
              />
            ) : (
              <div style={{ fontSize: '18px', fontWeight: '700', color: colors.espresso }}>${costos.merma.toFixed(2)}/bolsa</div>
            )}
            <div style={{ fontSize: '9px', color: colors.camel, marginTop: '5px' }}>Margen de error</div>
          </div>
        </div>

        {/* Costos Amazon */}
        {editandoCostos && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#FF990015', borderRadius: '6px', border: '1px solid #FF9900' }}>
            <h4 style={{ margin: '0 0 15px', fontSize: '12px', color: '#232F3E', fontWeight: '700' }}>PARÁMETROS AMAZON</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '10px', color: colors.sidebarBg, display: 'block', marginBottom: '5px' }}>Comisión Amazon (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={costosTemp.amazonComision}
                  onChange={(e) => setCostosTemp({ ...costosTemp, amazonComision: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: colors.sidebarBg, display: 'block', marginBottom: '5px' }}>Tarifa FBA ($)</label>
                <input
                  type="number"
                  step="1"
                  value={costosTemp.amazonFbaFee}
                  onChange={(e) => setCostosTemp({ ...costosTemp, amazonFbaFee: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: colors.sidebarBg, display: 'block', marginBottom: '5px' }}>Envío Bodega ($)</label>
                <input
                  type="number"
                  step="1"
                  value={costosTemp.amazonEnvioBodega}
                  onChange={(e) => setCostosTemp({ ...costosTemp, amazonEnvioBodega: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: colors.sidebarBg, display: 'block', marginBottom: '5px' }}>Precio Base Mayoreo ($)</label>
                <input
                  type="number"
                  step="1"
                  value={costosTemp.precioBaseMayoreo}
                  onChange={(e) => setCostosTemp({ ...costosTemp, precioBaseMayoreo: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: colors.sidebarBg, display: 'block', marginBottom: '5px' }}>Piezas por Envío FBA</label>
                <input
                  type="number"
                  step="1"
                  value={costosTemp.piezasPorEnvioFBA}
                  onChange={(e) => setCostosTemp({ ...costosTemp, piezasPorEnvioFBA: parseInt(e.target.value) || 1 })}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '15px', padding: '15px', background: colors.sidebarBg, borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>COSTO TOTAL DE PRODUCCIÓN</div>
          <div style={{ color: '#ABD55E', fontSize: '24px', fontWeight: '700' }}>
            ${editandoCostos ? calcularCostoProduccion(costosTemp).toFixed(2) : costoProduccion.toFixed(2)} MXN
          </div>
        </div>
      </div>

      {/* Recomendaciones Amazon */}
      <div style={{ background: `#FF990020`, padding: '20px', border: `2px solid #FF9900`, borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: '#232F3E' }}>
          RECOMENDACIONES AMAZON
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
          {[
            { titulo: 'PRECIO MÍNIMO RENTABLE', desc: `Vende a $199+ para mantener margen >50%. Precio ideal: $249-$299 para competir.` },
            { titulo: 'MAYOREO MÍNIMO 20 PZAS', desc: `El mínimo para mantener rentabilidad es 20 piezas a $${costos.precioBaseMayoreo}/pza.` },
            { titulo: 'ENVÍO A BODEGA', desc: `Envía lotes de ${costos.piezasPorEnvioFBA}+ piezas a Amazon FBA para diluir costos de envío.` },
            { titulo: `COMISIÓN ${costos.amazonComision}%`, desc: `Amazon cobra ${costos.amazonComision}% del precio de venta. Factor en tu precio final.` },
          ].map((rec, i) => (
            <div key={i} style={{ background: colors.cotton, padding: '15px', borderRadius: '6px', border: `1px solid #FF9900` }}>
              <div style={{ fontWeight: '700', color: '#232F3E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#FF9900', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{i + 1}</span>
                {rec.titulo}
              </div>
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
        <div style={{ overflowX: 'auto' }}>
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
        <div style={{ overflowX: 'auto' }}>
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
      </div>

      {/* Costos de envío */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>🏍️ ENVÍO LOCAL — PUEBLA</h3>
          <div style={{ overflowX: 'auto' }}>
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
        </div>

        <div style={{ background: colors.cotton, padding: '20px', border: `1px solid ${colors.sand}` }}>
          <h3 style={{ margin: '0 0 15px', fontSize: '14px', letterSpacing: '1px', color: colors.espresso }}>📦 ENVÍO NACIONAL</h3>
          <div style={{ overflowX: 'auto' }}>
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

  const [seccionActiva, setSeccionActiva] = useState('productos');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [hoverHeader, setHoverHeader] = useState(false);

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

  // Estado para costos Amazon (editables por admin)
  const [costosAmazon, setCostosAmazon] = useState(COSTOS_AMAZON_DEFAULT);

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
        // Cargar datos del dashboard y costos Amazon en paralelo
        const [resultado, costosRes] = await Promise.all([
          cargarDatosDashboard(),
          getCostosAmazon()
        ]);

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

        // Cargar costos Amazon si existen
        if (costosRes.data) {
          setCostosAmazon(costosRes.data);
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
          isAdmin={isAdmin}
        />
      );
      case 'stocks': return <StocksView isAdmin={isAdmin} />;
      case 'salidas': return <SalidasView isAdmin={isAdmin} />;
      case 'ventas': return <VentasView isAdmin={isAdmin} />;
      case 'caja': return <CajaView isAdmin={isAdmin} />;
      case 'balance': return <BalanceView isAdmin={isAdmin} />;
      case 'servicios': return <ServiciosView isAdmin={isAdmin} />;
      case 'mayoreo': return <MayoreoView productosActualizados={productosActualizados} todasCondiciones={todasCondiciones} />;
      case 'ecommerce': return <EcommerceView productosActualizados={productosActualizados} todasCondiciones={todasCondiciones} datosDB={datosDB} costosAmazon={costosAmazon} setCostosAmazon={setCostosAmazon} isAdmin={isAdmin} />;
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

        {/* Header desktop - Sticky */}
        <div
          onMouseEnter={() => setHoverHeader(true)}
          onMouseLeave={() => setHoverHeader(false)}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            marginBottom: isMobile ? '20px' : '30px',
            padding: isMobile ? '15px' : '20px 25px',
            background: hoverHeader ? colors.sidebarBg : colors.cotton,
            border: '2px solid #DA9F17',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? '10px' : '0',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
            <img
              src="/Yolotl_logo_OK.png"
              alt="Yolotl Logo"
              style={{
                height: isMobile ? '45px' : '60px',
                width: 'auto',
                objectFit: 'contain',
                borderRadius: '12px'
              }}
            />
            <div>
              <div style={{
                fontSize: isMobile ? '9px' : '10px',
                letterSpacing: '3px',
                color: hoverHeader ? '#F7E836' : colors.sidebarBg,
                marginBottom: '5px',
                transition: 'color 0.3s ease'
              }}>
                HECHO A MANO EN PUEBLA, MÉXICO
              </div>
              <h1 style={{
                margin: 0,
                fontSize: isMobile ? '16px' : '24px',
                fontWeight: '300',
                letterSpacing: '2px',
                color: hoverHeader ? '#F7E836' : colors.sidebarBg,
                transition: 'color 0.3s ease'
              }}>
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

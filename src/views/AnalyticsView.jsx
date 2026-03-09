import React, { useState, useEffect, useMemo } from 'react';
import { colors } from '../utils/colors';
import { formatearMoneda } from '../utils/formatearMoneda';
import {
  getVentas,
  getMovimientosCaja,
  getServiciosMaquila,
} from '../supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, Cell
} from 'recharts';

const AnalyticsView = ({ isAdmin }) => {
  const [tabActivo, setTabActivo] = useState('ventas');
  const [periodo, setPeriodo] = useState('30d');
  const [ventas, setVentas] = useState([]);
  const [movimientosCaja, setMovimientosCaja] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const periodos = [
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: '90d', label: '90 dias' },
    { id: '6m', label: '6 meses' },
    { id: '1y', label: '1 ano' },
    { id: 'todo', label: 'Todo' },
  ];

  const tabs = [
    { id: 'ventas', nombre: 'Ventas', icon: '📈' },
    { id: 'productos', nombre: 'Productos', icon: '🏆' },
    { id: 'clientes', nombre: 'Clientes', icon: '👥' },
    { id: 'flujo', nombre: 'Ingresos vs Egresos', icon: '💰' },
    { id: 'margenes', nombre: 'Margenes', icon: '📊' },
  ];

  const getFechaInicio = () => {
    const hoy = new Date();
    switch (periodo) {
      case '7d': return new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '30d': return new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '90d': return new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '6m': return new Date(hoy.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case '1y': return new Date(hoy.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      case 'todo': return null;
      default: return null;
    }
  };

  const cargarDatos = async () => {
    setCargando(true);
    const fechaInicio = getFechaInicio();
    const fechaFin = new Date().toISOString().split('T')[0];

    const filtrosVentas = {};
    const filtrosCaja = {};
    if (fechaInicio) {
      filtrosVentas.fechaInicio = fechaInicio;
      filtrosVentas.fechaFin = fechaFin;
      filtrosCaja.fechaInicio = fechaInicio;
      filtrosCaja.fechaFin = fechaFin;
    }

    const [ventasRes, cajaRes, serviciosRes] = await Promise.all([
      getVentas(filtrosVentas),
      getMovimientosCaja(filtrosCaja),
      getServiciosMaquila(),
    ]);

    setVentas((ventasRes.data || []).filter(v => v.estado_pago !== 'cancelado'));
    setMovimientosCaja(cajaRes.data || []);
    setServicios(serviciosRes.data || []);
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, [periodo]);

  // --- Helpers de agrupacion ---
  const agruparPorPeriodo = (datos, campoFecha, campoValor, campoCantidad) => {
    const grupos = {};
    const diasTotal = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 365;
    const agruparPor = diasTotal <= 30 ? 'dia' : diasTotal <= 90 ? 'semana' : 'mes';

    datos.forEach(d => {
      const fecha = new Date(d[campoFecha]);
      let key;
      if (agruparPor === 'dia') {
        key = fecha.toISOString().split('T')[0];
      } else if (agruparPor === 'semana') {
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        key = inicioSemana.toISOString().split('T')[0];
      } else {
        key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grupos[key]) grupos[key] = { periodo: key, monto: 0, cantidad: 0, count: 0 };
      grupos[key].monto += parseFloat(d[campoValor]) || 0;
      if (campoCantidad) grupos[key].cantidad += parseInt(d[campoCantidad]) || 0;
      grupos[key].count += 1;
    });

    return Object.values(grupos).sort((a, b) => a.periodo.localeCompare(b.periodo));
  };

  const formatLabel = (key) => {
    if (key.length === 7) { // mes: 2026-03
      const [y, m] = key.split('-');
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${meses[parseInt(m) - 1]} ${y.slice(2)}`;
    }
    // dia o semana
    const d = new Date(key + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  };

  // --- Datos calculados ---
  const datosVentasPeriodo = useMemo(() => {
    const agrupado = agruparPorPeriodo(ventas, 'created_at', 'total', 'cantidad');
    return agrupado.map(g => ({ ...g, label: formatLabel(g.periodo) }));
  }, [ventas, periodo]);

  const topProductos = useMemo(() => {
    const porProducto = {};
    ventas.forEach(v => {
      const nombre = v.producto_nombre || v.producto?.linea_nombre || 'Sin nombre';
      if (!porProducto[nombre]) porProducto[nombre] = { nombre, piezas: 0, monto: 0, costo: 0 };
      porProducto[nombre].piezas += v.cantidad || 0;
      porProducto[nombre].monto += parseFloat(v.total) || 0;
      porProducto[nombre].costo += (parseFloat(v.costo_unitario) || 0) * (v.cantidad || 0);
    });
    return Object.values(porProducto).sort((a, b) => b.monto - a.monto);
  }, [ventas]);

  const topClientes = useMemo(() => {
    const porCliente = {};
    ventas.forEach(v => {
      const nombre = v.cliente_nombre || v.cliente?.nombre || 'Sin cliente';
      const id = v.cliente_id || 0;
      if (!porCliente[id]) porCliente[id] = { id, nombre, piezas: 0, monto: 0, cobrado: 0, tipo: v.cliente?.tipo || '' };
      porCliente[id].piezas += v.cantidad || 0;
      porCliente[id].monto += parseFloat(v.total) || 0;
      porCliente[id].cobrado += parseFloat(v.monto_pagado) || 0;
    });
    return Object.values(porCliente).sort((a, b) => b.monto - a.monto);
  }, [ventas]);

  const datosFlujo = useMemo(() => {
    const grupos = {};
    const diasTotal = periodo === '7d' ? 7 : periodo === '30d' ? 30 : periodo === '90d' ? 90 : 365;
    const agruparPor = diasTotal <= 30 ? 'dia' : diasTotal <= 90 ? 'semana' : 'mes';

    movimientosCaja.forEach(m => {
      const fecha = new Date(m.fecha);
      let key;
      if (agruparPor === 'dia') {
        key = fecha.toISOString().split('T')[0];
      } else if (agruparPor === 'semana') {
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        key = inicioSemana.toISOString().split('T')[0];
      } else {
        key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grupos[key]) grupos[key] = { periodo: key, ingresos: 0, egresos: 0 };
      const monto = parseFloat(m.monto) || 0;
      if (m.tipo === 'ingreso') grupos[key].ingresos += monto;
      else grupos[key].egresos += monto;
    });

    return Object.values(grupos)
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map(g => ({ ...g, balance: g.ingresos - g.egresos, label: formatLabel(g.periodo) }));
  }, [movimientosCaja, periodo]);

  const margenes = useMemo(() => {
    return topProductos
      .filter(p => p.monto > 0)
      .map(p => {
        const utilidad = p.monto - p.costo;
        const margen = p.monto > 0 ? (utilidad / p.monto) * 100 : 0;
        return { ...p, utilidad, margen: Math.round(margen * 10) / 10 };
      })
      .sort((a, b) => b.utilidad - a.utilidad);
  }, [topProductos]);

  // Resumen general
  const resumen = useMemo(() => {
    const totalVentas = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0);
    const totalPiezas = ventas.reduce((s, v) => s + (v.cantidad || 0), 0);
    const totalCobrado = ventas.reduce((s, v) => s + (parseFloat(v.monto_pagado) || 0), 0);
    const ticketPromedio = ventas.length > 0 ? totalVentas / ventas.length : 0;
    const totalIngresos = movimientosCaja.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
    const totalEgresos = movimientosCaja.filter(m => m.tipo === 'egreso').reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);
    return { totalVentas, totalPiezas, totalCobrado, ticketPromedio, numVentas: ventas.length, totalIngresos, totalEgresos };
  }, [ventas, movimientosCaja]);

  // --- Estilos ---
  const cardStyle = {
    background: colors.cotton, borderRadius: '12px', padding: '16px',
    textAlign: 'center', border: `1px solid ${colors.sand}`
  };

  const margenColor = (m) => m >= 30 ? colors.olive : m >= 15 ? '#F7B731' : colors.terracotta;

  const tooltipStyle = {
    contentStyle: { background: colors.cotton, border: `1px solid ${colors.sand}`, borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: colors.espresso, fontWeight: '600' }
  };

  // ==================== RENDER ====================
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: colors.espresso, fontWeight: '600', margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '28px' }}>
          Analisis Historico
        </h2>
      </div>

      {/* Selector de periodo */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', background: colors.sand, borderRadius: '10px', padding: '4px', flexWrap: 'wrap' }}>
        {periodos.map(p => (
          <button key={p.id} onClick={() => setPeriodo(p.id)} style={{
            padding: '8px 14px', border: 'none', borderRadius: '8px', cursor: 'pointer',
            background: periodo === p.id ? colors.sidebarBg : 'transparent',
            color: periodo === p.id ? '#fff' : colors.espresso,
            fontWeight: periodo === p.id ? '700' : '400', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s'
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: colors.sand, borderRadius: '10px', padding: '4px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTabActivo(t.id)} style={{
            flex: 1, minWidth: '100px', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
            background: tabActivo === t.id ? colors.sidebarBg : 'transparent',
            color: tabActivo === t.id ? '#fff' : colors.espresso,
            fontWeight: tabActivo === t.id ? '700' : '400', fontSize: '13px', fontFamily: 'inherit', transition: 'all 0.2s'
          }}>
            {t.icon} {t.nombre}
          </button>
        ))}
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '50px', color: colors.camel }}>Cargando datos...</div>
      ) : (
        <>
          {/* ========== TAB VENTAS POR PERIODO ========== */}
          {tabActivo === 'ventas' && (
            <div>
              {/* Cards resumen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={cardStyle}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Ventas totales</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(resumen.totalVentas)}</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Piezas vendidas</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: colors.sidebarBg }}>{resumen.totalPiezas.toLocaleString('es-MX')}</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Ticket promedio</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: colors.olive }}>{formatearMoneda(resumen.ticketPromedio)}</div>
                </div>
                <div style={cardStyle}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Operaciones</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: colors.camel }}>{resumen.numVentas}</div>
                </div>
              </div>

              {/* Grafica */}
              {datosVentasPeriodo.length > 0 ? (
                <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.sand}` }}>
                  <h3 style={{ margin: '0 0 16px', color: colors.espresso, fontSize: '16px' }}>Ventas por periodo</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={datosVentasPeriodo}>
                      <defs>
                        <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.sidebarBg} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={colors.sidebarBg} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.camel }} />
                      <YAxis tick={{ fontSize: 11, fill: colors.camel }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...tooltipStyle} formatter={(v) => [formatearMoneda(v), 'Monto']} />
                      <Area type="monotone" dataKey="monto" stroke={colors.sidebarBg} fill="url(#gradVentas)" strokeWidth={2} name="Ventas" />
                    </AreaChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ margin: '0 0 8px', color: colors.espresso, fontSize: '14px' }}>Piezas vendidas</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={datosVentasPeriodo}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.camel }} />
                        <YAxis tick={{ fontSize: 11, fill: colors.camel }} />
                        <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Piezas']} />
                        <Bar dataKey="cantidad" fill={colors.olive} radius={[4, 4, 0, 0]} name="Piezas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
                  No hay datos de ventas en este periodo
                </div>
              )}
            </div>
          )}

          {/* ========== TAB TOP PRODUCTOS ========== */}
          {tabActivo === 'productos' && (
            <div>
              {topProductos.length > 0 ? (
                <>
                  <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.espresso, fontSize: '16px' }}>Top productos por ingreso</h3>
                    <ResponsiveContainer width="100%" height={Math.max(250, topProductos.slice(0, 15).length * 35)}>
                      <BarChart data={topProductos.slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: colors.camel }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="nombre" width={150} tick={{ fontSize: 11, fill: colors.espresso }} />
                        <Tooltip {...tooltipStyle} formatter={(v) => [formatearMoneda(v), 'Ingreso']} />
                        <Bar dataKey="monto" fill={colors.sidebarBg} radius={[0, 4, 4, 0]} name="Ingreso" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabla */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: colors.sand }}>
                          {['#', 'Producto', 'Piezas', 'Ingreso', '% del total'].map(h => (
                            <th key={h} style={{ padding: '10px 8px', textAlign: h === 'Producto' ? 'left' : 'center', color: colors.espresso, fontWeight: '600', borderBottom: `2px solid ${colors.camel}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {topProductos.map((p, i) => {
                          const pct = resumen.totalVentas > 0 ? ((p.monto / resumen.totalVentas) * 100).toFixed(1) : '0';
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${colors.sand}` }}>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.camel, fontWeight: '600' }}>{i + 1}</td>
                              <td style={{ padding: '8px', fontWeight: '500', color: colors.espresso }}>{p.nombre}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{p.piezas.toLocaleString('es-MX')}</td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: colors.sidebarBg }}>{formatearMoneda(p.monto)}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                  <div style={{ width: '60px', height: '6px', background: colors.sand, borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(100, parseFloat(pct))}%`, height: '100%', background: colors.sidebarBg, borderRadius: '3px' }} />
                                  </div>
                                  <span style={{ fontSize: '12px', color: colors.camel }}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
                  No hay datos de productos en este periodo
                </div>
              )}
            </div>
          )}

          {/* ========== TAB TOP CLIENTES ========== */}
          {tabActivo === 'clientes' && (
            <div>
              {topClientes.length > 0 ? (
                <>
                  <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.espresso, fontSize: '16px' }}>Top clientes por ingreso</h3>
                    <ResponsiveContainer width="100%" height={Math.max(250, topClientes.slice(0, 10).length * 40)}>
                      <BarChart data={topClientes.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: colors.camel }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 11, fill: colors.espresso }} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="monto" fill={colors.olive} radius={[0, 4, 4, 0]} name="Total" />
                        <Bar dataKey="cobrado" fill={colors.sidebarBg} radius={[0, 4, 4, 0]} name="Cobrado" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabla */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: colors.sand }}>
                          {['#', 'Cliente', 'Piezas', 'Total', 'Cobrado', 'Pendiente', '% cobro'].map(h => (
                            <th key={h} style={{ padding: '10px 8px', textAlign: h === 'Cliente' ? 'left' : 'center', color: colors.espresso, fontWeight: '600', borderBottom: `2px solid ${colors.camel}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {topClientes.map((c, i) => {
                          const pendiente = Math.max(0, c.monto - c.cobrado);
                          const pctCobro = c.monto > 0 ? ((c.cobrado / c.monto) * 100).toFixed(0) : '100';
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${colors.sand}` }}>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.camel, fontWeight: '600' }}>{i + 1}</td>
                              <td style={{ padding: '8px', fontWeight: '500', color: colors.espresso }}>{c.nombre}</td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>{c.piezas.toLocaleString('es-MX')}</td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: colors.sidebarBg }}>{formatearMoneda(c.monto)}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.olive }}>{formatearMoneda(c.cobrado)}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: pendiente > 0 ? colors.terracotta : colors.olive, fontWeight: pendiente > 0 ? '600' : '400' }}>
                                {formatearMoneda(pendiente)}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                                  background: parseInt(pctCobro) >= 100 ? 'rgba(171,213,94,0.2)' : parseInt(pctCobro) >= 50 ? 'rgba(247,183,49,0.2)' : 'rgba(196,120,74,0.2)',
                                  color: parseInt(pctCobro) >= 100 ? colors.olive : parseInt(pctCobro) >= 50 ? '#F7B731' : colors.terracotta
                                }}>
                                  {pctCobro}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
                  No hay datos de clientes en este periodo
                </div>
              )}
            </div>
          )}

          {/* ========== TAB INGRESOS VS EGRESOS ========== */}
          {tabActivo === 'flujo' && (
            <div>
              {/* Cards resumen */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ ...cardStyle, borderColor: colors.olive }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Total ingresos</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: colors.olive }}>{formatearMoneda(resumen.totalIngresos)}</div>
                </div>
                <div style={{ ...cardStyle, borderColor: colors.terracotta }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Total egresos</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: colors.terracotta }}>{formatearMoneda(resumen.totalEgresos)}</div>
                </div>
                <div style={{ ...cardStyle, borderColor: colors.sidebarBg }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Balance neto</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: (resumen.totalIngresos - resumen.totalEgresos) >= 0 ? colors.sidebarBg : colors.terracotta }}>
                    {formatearMoneda(resumen.totalIngresos - resumen.totalEgresos)}
                  </div>
                </div>
              </div>

              {datosFlujo.length > 0 ? (
                <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.sand}` }}>
                  <h3 style={{ margin: '0 0 16px', color: colors.espresso, fontSize: '16px' }}>Ingresos vs Egresos</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={datosFlujo}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.camel }} />
                      <YAxis tick={{ fontSize: 11, fill: colors.camel }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip {...tooltipStyle} formatter={(v, name) => [formatearMoneda(v), name]} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="ingresos" fill={colors.olive} radius={[4, 4, 0, 0]} name="Ingresos" />
                      <Bar dataKey="egresos" fill={colors.terracotta} radius={[4, 4, 0, 0]} name="Egresos" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ margin: '0 0 8px', color: colors.espresso, fontSize: '14px' }}>Balance neto</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={datosFlujo}>
                        <defs>
                          <linearGradient id="gradBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors.sidebarBg} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={colors.sidebarBg} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.camel }} />
                        <YAxis tick={{ fontSize: 11, fill: colors.camel }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip {...tooltipStyle} formatter={(v) => [formatearMoneda(v), 'Balance']} />
                        <Area type="monotone" dataKey="balance" stroke={colors.sidebarBg} fill="url(#gradBalance)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
                  No hay movimientos de caja en este periodo
                </div>
              )}
            </div>
          )}

          {/* ========== TAB MARGENES ========== */}
          {tabActivo === 'margenes' && (
            <div>
              {margenes.length > 0 ? (
                <>
                  <div style={{ background: colors.cotton, borderRadius: '12px', padding: '20px', border: `1px solid ${colors.sand}`, marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.espresso, fontSize: '16px' }}>Margen de utilidad por producto</h3>
                    <ResponsiveContainer width="100%" height={Math.max(250, margenes.slice(0, 15).length * 35)}>
                      <BarChart data={margenes.slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.sand} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: colors.camel }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="nombre" width={150} tick={{ fontSize: 11, fill: colors.espresso }} />
                        <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Margen']} />
                        <Bar dataKey="margen" radius={[0, 4, 4, 0]} name="Margen %">
                          {margenes.slice(0, 15).map((entry, i) => (
                            <Cell key={i} fill={margenColor(entry.margen)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabla */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: colors.sand }}>
                          {['Producto', 'Ingreso', 'Costo', 'Utilidad', 'Margen'].map(h => (
                            <th key={h} style={{ padding: '10px 8px', textAlign: h === 'Producto' ? 'left' : 'center', color: colors.espresso, fontWeight: '600', borderBottom: `2px solid ${colors.camel}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {margenes.map((p, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${colors.sand}` }}>
                            <td style={{ padding: '8px', fontWeight: '500', color: colors.espresso }}>{p.nombre}</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: colors.sidebarBg }}>{formatearMoneda(p.monto)}</td>
                            <td style={{ padding: '8px', textAlign: 'center', color: colors.camel }}>{formatearMoneda(p.costo)}</td>
                            <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: colors.olive }}>{formatearMoneda(p.utilidad)}</td>
                            <td style={{ padding: '8px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                                background: p.margen >= 30 ? 'rgba(171,213,94,0.2)' : p.margen >= 15 ? 'rgba(247,183,49,0.2)' : 'rgba(196,120,74,0.2)',
                                color: margenColor(p.margen)
                              }}>
                                {p.margen}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: `2px solid ${colors.espresso}` }}>
                          <td style={{ padding: '10px 8px', fontWeight: '700', color: colors.espresso }}>Total</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(margenes.reduce((s, p) => s + p.monto, 0))}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', color: colors.camel }}>{formatearMoneda(margenes.reduce((s, p) => s + p.costo, 0))}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '700', color: colors.olive }}>{formatearMoneda(margenes.reduce((s, p) => s + p.utilidad, 0))}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            {(() => {
                              const totalM = margenes.reduce((s, p) => s + p.monto, 0);
                              const totalC = margenes.reduce((s, p) => s + p.costo, 0);
                              const margenGlobal = totalM > 0 ? Math.round(((totalM - totalC) / totalM) * 1000) / 10 : 0;
                              return (
                                <span style={{
                                  padding: '3px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                                  background: margenGlobal >= 30 ? 'rgba(171,213,94,0.2)' : margenGlobal >= 15 ? 'rgba(247,183,49,0.2)' : 'rgba(196,120,74,0.2)',
                                  color: margenColor(margenGlobal)
                                }}>
                                  {margenGlobal}%
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
                  No hay datos suficientes para calcular margenes
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsView;

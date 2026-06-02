import React, { useState, useEffect, useMemo } from 'react';
import { getProductos } from '../supabaseClient';
import { colors } from '../utils/colors';

// Paleta extendida para energía visual
const energyColors = {
  ...colors,
  electric: '#00D1FF',
  success: '#2ECC71',
  warning: '#F1C40F',
  danger: '#E74C3C',
  purple: '#9B59B6',
  white: '#FFFFFF',
  dark: '#2C3E50',
};

const money = (n) =>
  '$' + (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = (n) =>
  '$' + Math.round(Number(n) || 0).toLocaleString('es-MX');

function infoProducto(prod, varianteId) {
  const variantesActivas = (prod.variantes || []).filter((v) => v.activo);
  const variante = varianteId
    ? variantesActivas.find((v) => v.id === varianteId)
    : variantesActivas[0];

  const configs = (prod.configuraciones_corte || []).filter(
    (c) => c.es_configuracion_actual && c.activo
  );
  const config = variante
    ? configs.find((c) => c.variante_id === variante.id) ||
      configs.find((c) => c.variante_id === null) ||
      configs[0]
    : configs.find((c) => c.variante_id === null) || configs[0];

  const manoObra = config
    ? (parseFloat(config.costo_confeccion) || 0) + (parseFloat(config.costo_empaque) || 0)
    : 0;

  const costo = variante
    ? parseFloat(variante.costo_unitario) || 0
    : parseFloat(prod.costo_total_1_tinta) || 0;

  const precio = variante
    ? parseFloat(variante.precio_venta) || 0
    : parseFloat(prod.precio_venta) || 0;

  return { variante, variantesActivas, precio, costo, manoObra };
}

const CalculadoraMeta = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [meta, setMeta] = useState(4000);
  const [filas, setFilas] = useState({});
  const [checklist, setChecklist] = useState([]);
  const [mostrarChecklist, setMostrarChecklist] = useState(false);

  useEffect(() => {
    (async () => {
      setCargando(true);
      const { data } = await getProductos();
      setProductos((data || []).filter((p) => p.activo !== false));
      setCargando(false);
    })();
  }, []);

  const setFila = (id, patch) =>
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const limpiar = () => {
    setFilas({});
    setChecklist([]);
  };

  const { lineas, totales, porCategoria } = useMemo(() => {
    const lineas = [];
    const totales = { cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, manoObra: 0 };
    const porCategoria = {};

    for (const prod of productos) {
      const fila = filas[prod.id];
      const cantidad = parseInt(fila?.cantidad) || 0;
      if (cantidad <= 0) continue;

      const info = infoProducto(prod, fila?.varianteId);
      const precio = fila?.precio != null && fila.precio !== '' ? parseFloat(fila.precio) : info.precio;
      const costo = info.costo;
      const manoObra = info.manoObra;

      const ingreso = precio * cantidad;
      const utilidad = (precio - costo) * cantidad;
      const manoObraTotal = manoObra * cantidad;

      const cat = prod.categoria?.nombre || 'Sin categoría';
      lineas.push({
        id: prod.id,
        nombre: prod.linea_nombre,
        categoria: cat,
        variante: info.variante,
        cantidad,
        precio,
        costo,
        manoObra,
        ingreso,
        utilidad,
        manoObraTotal,
      });

      totales.cantidad += cantidad;
      totales.ingreso += ingreso;
      totales.costo += costo * cantidad;
      totales.utilidad += utilidad;
      totales.manoObra += manoObraTotal;

      porCategoria[cat] = porCategoria[cat] || { cantidad: 0, utilidad: 0 };
      porCategoria[cat].cantidad += cantidad;
      porCategoria[cat].utilidad += utilidad;
    }
    return { lineas, totales, porCategoria };
  }, [productos, filas]);

  const generarChecklist = () => {
    const items = lineas.map(l => ({
      id: `${l.id}-${l.variante?.id || 'base'}`,
      texto: `${l.cantidad}x ${l.nombre} ${l.variante ? `(${[l.variante.material, l.variante.talla].filter(Boolean).join(' ')})` : ''}`,
      completado: false
    }));
    setChecklist(items);
    setMostrarChecklist(true);
  };

  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completado: !item.completado } : item
    ));
  };

  const grupos = useMemo(() => {
    const g = {};
    for (const p of productos) {
      const cat = p.categoria?.nombre || 'Sin categoría';
      (g[cat] = g[cat] || []).push(p);
    }
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [productos]);

  const pctMeta = meta > 0 ? (totales.utilidad / meta) * 100 : 0;

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: energyColors.electric }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 2s linear infinite' }}>⚙️</div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '20px', fontWeight: 600 }}>Cargando Energía...</div>
      </div>
    );
  }

  const bigCard = (titulo, valor, sub, color, icon) => (
    <div
      style={{
        flex: '1 1 240px',
        background: energyColors.white,
        borderBottom: `4px solid ${color}`,
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s ease',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ fontSize: '40px', position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1, transform: 'rotate(-15deg)' }}>{icon}</div>
      <div style={{ fontSize: '14px', color: energyColors.camel, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{titulo}</div>
      <div style={{ fontSize: '32px', fontWeight: 900, color: energyColors.espresso }}>{valor}</div>
      {sub && <div style={{ fontSize: '13px', color: color, fontWeight: 600, marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", color: energyColors.espresso, padding: '10px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap');
        .progress-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
      `}</style>

      {/* Header Explosivo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '42px', fontWeight: 900, background: `linear-gradient(45deg, ${energyColors.sidebarBg}, ${energyColors.electric})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            META SEMANAL 🚀
          </h1>
          <p style={{ margin: '5px 0 0', fontSize: '16px', color: energyColors.camel, fontWeight: 500 }}>
            Visualiza tu éxito, planifica tu producción y rompe tus récords.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={generarChecklist}
            disabled={lineas.length === 0}
            style={{
              background: lineas.length > 0 ? energyColors.success : energyColors.sand,
              color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px',
              fontWeight: 700, cursor: lineas.length > 0 ? 'pointer' : 'not-allowed',
              boxShadow: lineas.length > 0 ? '0 4px 15px rgba(46, 204, 113, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            📋 Generar Check-list
          </button>
          <button
            onClick={limpiar}
            style={{
              background: 'transparent', border: `2px solid ${energyColors.terracotta}`, color: energyColors.terracotta,
              borderRadius: '12px', padding: '12px 20px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Limpiar Todo
          </button>
        </div>
      </div>

      {/* Dashboard de Impacto */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        {bigCard('Proyección Ingresos', money0(totales.ingreso), `De ${totales.cantidad} piezas a entregar`, energyColors.electric, '💰')}
        {bigCard('Tu Ganancia Real', money0(totales.utilidad), '¡Dinero directo a tu bolsa!', energyColors.success, '💎')}
        {bigCard('Pago a Maquila', money0(totales.manoObra), 'Mano de obra garantizada', energyColors.terracotta, '🧵')}
        {bigCard('Inversión Material', money0(totales.costo), 'Costo total de producción', energyColors.warning, '📦')}
      </div>

      {/* Meta Visual Extrema */}
      <div
        style={{
          background: energyColors.white, borderRadius: '24px', padding: '30px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.08)', marginBottom: '40px',
          border: `2px solid ${pctMeta >= 100 ? energyColors.success : energyColors.white}`
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '32px' }}>🎯</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: energyColors.camel, textTransform: 'uppercase' }}>Objetivo de Utilidad</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900 }}>$</span>
                <input
                  type="number"
                  value={meta}
                  onChange={(e) => setMeta(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '180px', fontSize: '28px', fontWeight: 900, border: 'none',
                    borderBottom: `3px solid ${energyColors.electric}`, color: energyColors.espresso,
                    padding: '2px 5px', outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '48px', fontWeight: 900, color: pctMeta >= 100 ? energyColors.success : energyColors.electric }}>
              {pctMeta.toFixed(1)}%
            </div>
            <div style={{ fontWeight: 700, color: energyColors.camel }}>COMPLETADO</div>
          </div>
        </div>

        <div style={{ position: 'relative', height: '35px', background: '#F0F2F5', borderRadius: '17px', overflow: 'hidden', marginBottom: '15px', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.1)' }}>
          <div
            className={pctMeta > 0 && pctMeta < 100 ? 'progress-pulse' : ''}
            style={{
              height: '100%', width: `${Math.min(pctMeta, 100)}%`,
              background: `linear-gradient(90deg, ${energyColors.sidebarBg}, ${pctMeta >= 100 ? energyColors.success : energyColors.electric})`,
              transition: 'width 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '15px'
            }}
          >
            {pctMeta > 10 && <span style={{ color: 'white', fontWeight: 900, fontSize: '14px' }}>🔥</span>}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '18px', fontWeight: 700 }}>
          {pctMeta >= 100 ? (
            <div style={{ color: energyColors.success, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎊 ¡META SUPERADA POR {money0(totales.utilidad - meta)}! 🎊
            </div>
          ) : (
            <div style={{ color: energyColors.espresso }}>
              Te faltan <span style={{ color: energyColors.danger, fontSize: '22px' }}>{money0(meta - totales.utilidad)}</span> para alcanzar la gloria.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        {/* Lado Izquierdo: Configuración de Producción */}
        <div style={{ flex: '1 1 600px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '20px', color: energyColors.sidebarBg, display: 'flex', alignItems: 'center', gap: '10px' }}>
            ⚙️ Plan de Producción
          </h3>
          
          {grupos.map(([cat, prods]) => (
            <div key={cat} style={{ background: energyColors.white, borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: `2px solid ${energyColors.cotton}`, paddingBottom: '10px' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: energyColors.espresso }}>{cat}</span>
                {porCategoria[cat] && (
                  <span style={{ background: energyColors.sidebarBg, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                    {porCategoria[cat].cantidad} pz · {money0(porCategoria[cat].utilidad)} util.
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {prods.map((prod) => {
                  const fila = filas[prod.id] || {};
                  const info = infoProducto(prod, fila.varianteId);
                  const precioVal = fila.precio != null && fila.precio !== '' ? fila.precio : info.precio;
                  const cantidad = parseInt(fila.cantidad) || 0;
                  const utilidadFila = ((parseFloat(precioVal) || 0) - info.costo) * cantidad;
                  const activa = cantidad > 0;

                  return (
                    <div 
                      key={prod.id} 
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', 
                        borderRadius: '12px', background: activa ? `${energyColors.electric}10` : 'transparent',
                        border: `1px solid ${activa ? energyColors.electric : 'transparent'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{prod.linea_nombre}</div>
                        <div style={{ fontSize: '12px', color: energyColors.camel }}>
                          {info.variantesActivas.length > 1 ? (
                            <select
                              value={fila.varianteId || info.variante?.id || ''}
                              onChange={(e) => setFila(prod.id, { varianteId: Number(e.target.value), precio: '' })}
                              style={{ padding: '2px 5px', borderRadius: '5px', border: '1px solid #ddd', background: 'white', marginTop: '4px' }}
                            >
                              {info.variantesActivas.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {[v.material, v.talla].filter(Boolean).join(' ') || v.sku || `Var ${v.id}`}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{info.variante ? [info.variante.material, info.variante.talla].filter(Boolean).join(' ') : 'Base'}</span>
                          )}
                        </div>
                      </div>

                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: energyColors.camel, fontWeight: 700 }}>PRECIO</div>
                        <input
                          type="number"
                          value={precioVal}
                          onChange={(e) => setFila(prod.id, { precio: e.target.value })}
                          style={{ width: '100%', padding: '5px', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 700 }}
                        />
                      </div>

                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: energyColors.camel, fontWeight: 700 }}>CANTIDAD</div>
                        <input
                          type="number"
                          min="0"
                          value={fila.cantidad || ''}
                          placeholder="0"
                          onChange={(e) => setFila(prod.id, { cantidad: e.target.value })}
                          style={{ width: '100%', padding: '5px', borderRadius: '8px', border: `2px solid ${activa ? energyColors.electric : '#ddd'}`, textAlign: 'right', fontWeight: 900 }}
                        />
                      </div>

                      <div style={{ flex: 1, textAlign: 'right', minWidth: '90px' }}>
                        <div style={{ fontSize: '11px', color: energyColors.camel, fontWeight: 700 }}>UTILIDAD</div>
                        <div style={{ fontWeight: 900, color: utilidadFila < 0 ? energyColors.danger : energyColors.success }}>
                          {activa ? money0(utilidadFila) : '—'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Lado Derecho: Check-list e Información Extra */}
        <div style={{ flex: '1 1 350px' }}>
          {mostrarChecklist && (
            <div style={{ background: energyColors.white, borderRadius: '24px', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: `2px solid ${energyColors.success}`, position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: energyColors.success }}>✅ CHECK-LIST TAREAS</h4>
                <button 
                  onClick={() => setMostrarChecklist(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >✕</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {checklist.length > 0 ? checklist.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => toggleCheck(item.id)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', 
                      borderRadius: '12px', background: item.completado ? '#F0FFF4' : '#F8F9FA',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: `1px solid ${item.completado ? '#C6F6D5' : '#E2E8F0'}`
                    }}
                  >
                    <div style={{ 
                      width: '24px', height: '24px', borderRadius: '6px', 
                      border: `2px solid ${item.completado ? energyColors.success : energyColors.camel}`,
                      background: item.completado ? energyColors.success : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '14px', fontWeight: 900
                    }}>
                      {item.completado && '✓'}
                    </div>
                    <span style={{ 
                      fontSize: '15px', fontWeight: 600, 
                      textDecoration: item.completado ? 'line-through' : 'none',
                      color: item.completado ? '#A0AEC0' : energyColors.espresso
                    }}>
                      {item.texto}
                    </span>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', color: energyColors.camel, padding: '20px' }}>
                    Agrega productos al plan para generar tu lista de éxito.
                  </div>
                )}
              </div>

              {checklist.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #EEE', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: energyColors.camel, fontWeight: 700, marginBottom: '5px' }}>
                    PROGRESO DE TAREAS
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '24px', color: energyColors.success }}>
                    {Math.round((checklist.filter(i => i.completado).length / checklist.length) * 100)}%
                  </div>
                </div>
              )}
            </div>
          )}

          {!mostrarChecklist && (
            <div style={{ background: `${energyColors.sidebarBg}10`, borderRadius: '24px', padding: '30px', border: `2px dashed ${energyColors.sidebarBg}40`, textAlign: 'center' }}>
              <div style={{ fontSize: '50px', marginBottom: '15px' }}>📈</div>
              <h4 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800 }}>Tu Próxima Gran Victoria</h4>
              <p style={{ margin: 0, fontSize: '14px', color: energyColors.camel, lineHeight: '1.6' }}>
                Define tus cantidades a la izquierda y presiona "Generar Check-list" para convertir tu plan en acción. 
                ¡Cada pieza cuenta para tu meta!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculadoraMeta;


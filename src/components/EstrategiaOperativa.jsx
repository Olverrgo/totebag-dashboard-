import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';

// Simulador de Estrategia Operativa — modelo de vendedores / consignación.
// Parametrizable (no toca Supabase). Valores base del modelo de Blancos Sinaí.
// Capital por vendedor = piezas × costo unitario. Línea roja = costo de un N2 (38 pz).
// Enganche futuro: conectar a vendedores/consignaciones reales de Supabase (fase 2).

const energyColors = {
  ...colors,
  electric: '#00D1FF',
  success: '#2ECC71',
  warning: '#F1C40F',
  danger: '#E74C3C',
  white: '#FFFFFF',
};

const money = (n) =>
  '$' + Math.round(Number(n) || 0).toLocaleString('es-MX');
const money2 = (n) =>
  '$' + (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Niveles del modelo (piezas/sem por nivel)
const NIVELES = [
  { id: 'N1', nombre: 'Nuevo', piezas: 20, plazo: '7 días estricto', regla: 'Sin colchón · paga antes de resurtir', color: energyColors.camel, icon: '🌱' },
  { id: 'N2', nombre: 'Establecido', piezas: 38, plazo: '7-10 días', regla: 'Tope adeudo 1 semana', color: energyColors.sidebarBg, icon: '⭐' },
  { id: 'N3', nombre: 'Estrella', piezas: 57, plazo: 'hasta 14 días', regla: '+50% colchón fijo · tope 1 sem', color: energyColors.olive, icon: '🏆' },
];

const PIEZAS_BENCH = 38; // vendedor sano (N2 / Fabiola) = 38 pz, $2,500/sem

const load = (key, def) => {
  try {
    const v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : def;
  } catch { return def; }
};

const EstrategiaOperativa = () => {
  // Parámetros base (editables) — defaults del modelo
  const [params, setParams] = useState(() => load('estrategia_params', {
    precioPz: 65.40,
    material: 42.16,
    manoObra: 5.93,
    metaSemanal: 4000,
    capitalDisponible: 83000,
  }));

  // Portafolio de vendedores por nivel (arranque escalonado 4/3/3)
  const [portafolio, setPortafolio] = useState(() => load('estrategia_portafolio', { N1: 4, N2: 3, N3: 3 }));

  useEffect(() => { localStorage.setItem('estrategia_params', JSON.stringify(params)); }, [params]);
  useEffect(() => { localStorage.setItem('estrategia_portafolio', JSON.stringify(portafolio)); }, [portafolio]);

  const setParam = (k, v) => setParams(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const setNivel = (id, v) => setPortafolio(p => ({ ...p, [id]: Math.max(0, parseInt(v) || 0) }));

  // Derivados base
  const costoPz = params.material + params.manoObra;
  const utilidadPz = params.precioPz - costoPz;
  const margen = params.precioPz > 0 ? (utilidadPz / params.precioPz) * 100 : 0;
  const lineaRoja = PIEZAS_BENCH * costoPz; // costo de un vendedor estándar

  // Vendedor benchmark (sano)
  const ventaVend = PIEZAS_BENCH * params.precioPz;
  const utilidadVend = PIEZAS_BENCH * utilidadPz;

  // Meta y capacidad
  const vendedoresNec = utilidadVend > 0 ? Math.ceil(params.metaSemanal / utilidadVend) : 0;
  const ventasNec = vendedoresNec * ventaVend;
  const piezasNec = vendedoresNec * PIEZAS_BENCH;

  // Simulador de portafolio
  const tot = NIVELES.reduce((acc, n) => {
    const q = portafolio[n.id] || 0;
    acc.vendedores += q;
    acc.piezas += q * n.piezas;
    acc.ventas += q * n.piezas * params.precioPz;
    acc.utilidad += q * n.piezas * utilidadPz;
    acc.capital += q * n.piezas * costoPz;
    return acc;
  }, { vendedores: 0, piezas: 0, ventas: 0, utilidad: 0, capital: 0 });

  const pctMeta = params.metaSemanal > 0 ? (tot.utilidad / params.metaSemanal) * 100 : 0;
  const excedente = tot.utilidad - params.metaSemanal;
  const capitalOk = tot.capital <= params.capitalDisponible;

  // estilos reutilizables
  const card = (extra = {}) => ({
    background: energyColors.white, borderRadius: '16px', padding: '20px',
    border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', ...extra,
  });
  const inputStyle = {
    width: '100%', padding: '8px 10px', borderRadius: '8px', border: `1px solid ${energyColors.sand}`,
    fontWeight: 700, fontSize: '15px', color: energyColors.espresso, textAlign: 'right', boxSizing: 'border-box',
  };
  const labelChip = { fontSize: '11px', color: energyColors.camel, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", color: energyColors.espresso, padding: '10px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '38px', fontWeight: 900, background: `linear-gradient(45deg, ${energyColors.sidebarBg}, ${energyColors.olive})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎯 Estrategia Operativa
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: '15px', color: energyColors.camel, fontWeight: 500 }}>
          Simula tu red de vendedores en consignación sin descapitalizarte. Modelo Blancos Sinaí.
        </p>
      </div>

      {/* Parámetros base */}
      <div style={{ ...card(), marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>⚙️ Parámetros base (por pieza)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
          {[
            { k: 'precioPz', label: 'Precio venta' },
            { k: 'material', label: 'Costo material' },
            { k: 'manoObra', label: 'Mano de obra' },
            { k: 'metaSemanal', label: 'Meta utilidad/sem' },
            { k: 'capitalDisponible', label: 'Capital disponible' },
          ].map(f => (
            <div key={f.k}>
              <div style={labelChip}>{f.label}</div>
              <input type="number" value={params[f.k]} onChange={e => setParam(f.k, e.target.value)} style={{ ...inputStyle, marginTop: '4px' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${energyColors.cotton}`, fontSize: '14px' }}>
          <span><strong style={{ color: energyColors.olive }}>Utilidad/pz:</strong> {money2(utilidadPz)}</span>
          <span><strong style={{ color: energyColors.sidebarBg }}>Costo/pz:</strong> {money2(costoPz)}</span>
          <span><strong>Margen:</strong> {margen.toFixed(1)}%</span>
          <span><strong style={{ color: energyColors.danger }}>Línea roja/vend:</strong> {money(lineaRoja)}/sem</span>
        </div>
      </div>

      {/* Meta y capacidad */}
      <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>📐 Meta y capacidad</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        {[
          { label: 'Vendedores necesarios', valor: vendedoresNec, sub: `a ${PIEZAS_BENCH} pz/sem c/u`, color: energyColors.electric, icon: '👥' },
          { label: 'Ventas requeridas/sem', valor: money(ventasNec), sub: `para ${money(params.metaSemanal)} de utilidad`, color: energyColors.olive, icon: '💵' },
          { label: 'Piezas requeridas/sem', valor: piezasNec, sub: 'producción semanal', color: energyColors.terracotta, icon: '📦' },
          { label: 'Utilidad por vendedor', valor: money(utilidadVend), sub: `vende ${money(ventaVend)}/sem`, color: energyColors.success, icon: '🌟' },
        ].map((c, i) => (
          <div key={i} style={card({ textAlign: 'center', borderTop: `4px solid ${c.color}` })}>
            <div style={{ fontSize: '26px' }}>{c.icon}</div>
            <div style={{ ...labelChip, marginTop: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: energyColors.espresso, margin: '4px 0' }}>{c.valor}</div>
            <div style={{ fontSize: '12px', color: c.color, fontWeight: 600 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Simulador de portafolio */}
      <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>🧮 Simulador de portafolio</div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '30px' }}>
        {/* Inputs por nivel */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {NIVELES.map(n => {
            const q = portafolio[n.id] || 0;
            return (
              <div key={n.id} style={card({ borderLeft: `5px solid ${n.color}`, display: 'flex', alignItems: 'center', gap: '14px' })}>
                <div style={{ fontSize: '28px' }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{n.id} · {n.nombre}</div>
                  <div style={{ fontSize: '12px', color: energyColors.camel }}>{n.piezas} pz · {money(n.piezas * params.precioPz)}/sem · cap {money(n.piezas * costoPz)}/vend</div>
                  <div style={{ fontSize: '11px', color: energyColors.camel, fontStyle: 'italic' }}>{n.plazo} · {n.regla}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => setNivel(n.id, q - 1)} disabled={q <= 0} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: q > 0 ? energyColors.cotton : '#EEE', fontSize: '18px', fontWeight: 900, cursor: q > 0 ? 'pointer' : 'not-allowed' }}>−</button>
                  <input type="number" min="0" value={q} onChange={e => setNivel(n.id, e.target.value)} style={{ width: '48px', textAlign: 'center', padding: '6px', borderRadius: '8px', border: `2px solid ${n.color}`, fontWeight: 900, fontSize: '16px' }} />
                  <button onClick={() => setNivel(n.id, q + 1)} style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: n.color, color: 'white', fontSize: '18px', fontWeight: 900, cursor: 'pointer' }}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resultado del portafolio */}
        <div style={{ flex: '1 1 320px' }}>
          <div style={card({ background: `linear-gradient(135deg, ${energyColors.sidebarBg}, #0087BA)`, color: 'white' })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Utilidad proyectada/sem</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{tot.vendedores} vend · {tot.piezas} pz</span>
            </div>
            <div style={{ fontSize: '40px', fontWeight: 900, margin: '4px 0' }}>{money(tot.utilidad)}</div>
            {/* barra vs meta */}
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.25)', borderRadius: '6px', overflow: 'hidden', margin: '10px 0 6px' }}>
              <div style={{ height: '100%', width: `${Math.min(pctMeta, 100)}%`, background: pctMeta >= 100 ? energyColors.success : energyColors.warning, transition: 'width .4s' }} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>
              {pctMeta.toFixed(0)}% de la meta {pctMeta >= 100 ? `· excedente ${money(excedente)}/sem 🚀` : `· faltan ${money(-excedente)}/sem`}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div style={card({ textAlign: 'center' })}>
              <div style={labelChip}>Ventas/sem</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: energyColors.olive }}>{money(tot.ventas)}</div>
            </div>
            <div style={card({ textAlign: 'center', border: `2px solid ${capitalOk ? energyColors.success : energyColors.danger}` })}>
              <div style={labelChip}>Capital en la calle</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: capitalOk ? energyColors.success : energyColors.danger }}>{money(tot.capital)}</div>
              <div style={{ fontSize: '11px', color: energyColors.camel, fontWeight: 600 }}>
                {capitalOk ? `✓ cabe en tu capital (${money(params.capitalDisponible)})` : `⚠ excede tu capital (${money(params.capitalDisponible)})`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nota línea roja */}
      <div style={{ ...card({ background: `${energyColors.danger}10`, border: `1px solid ${energyColors.danger}40` }) }}>
        <strong style={{ color: energyColors.danger }}>🚦 Línea roja de caja:</strong> cada vendedor debe ingresar mínimo <strong>{money(lineaRoja)}/sem</strong> (su costo material + mano de obra). Por debajo de eso, descapitalizas. Sano + crecer = {money(PIEZAS_BENCH * params.precioPz)}/sem (paga lo que vende). <strong>Regla de oro:</strong> resurtir = lo vendido y pagado, nunca tope ciego.
      </div>
    </div>
  );
};

export default EstrategiaOperativa;

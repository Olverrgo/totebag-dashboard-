import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';

// Proyección financiera de la red de vendedores en consignación (modelo Blancos Sinaí).
// Parametrizable (no toca Supabase). Responde: cuántos vendedores, capital mínimo para no
// descapitalizar, entrada mínima por vendedor (línea roja), punto de equilibrio y
// días máximos de consignación sin riesgo.
// Capital por vendedor = piezas × costo unitario. Línea roja = costo de un N2 (38 pz).
// La meta es utilidad NETA (después de gastos fijos).

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
const TOPE_POLITICA_DIAS = 7; // regla del modelo: tope adeudo 1 semana

const DEFAULT_PARAMS = {
  precioPz: 65.40,
  material: 42.16,
  manoObra: 5.93,
  metaSemanal: 4000,   // utilidad NETA objetivo
  sueldo: 2300,        // gasto fijo semanal
  operacion: 1000,     // gasto fijo semanal (gasolina, etc.)
  capitalDisponible: 83000,
};

const load = (key, def) => {
  try {
    const v = localStorage.getItem(key);
    return v != null ? JSON.parse(v) : def;
  } catch { return def; }
};

const EstrategiaOperativa = () => {
  // Parámetros base (editables) — merge con defaults para tolerar versiones viejas guardadas
  const [params, setParams] = useState(() => ({ ...DEFAULT_PARAMS, ...load('estrategia_params', {}) }));
  // Portafolio de vendedores por nivel (arranque escalonado 4/3/3)
  const [portafolio, setPortafolio] = useState(() => load('estrategia_portafolio', { N1: 4, N2: 3, N3: 3 }));

  useEffect(() => { localStorage.setItem('estrategia_params', JSON.stringify(params)); }, [params]);
  useEffect(() => { localStorage.setItem('estrategia_portafolio', JSON.stringify(portafolio)); }, [portafolio]);

  const setParam = (k, v) => setParams(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const setNivel = (id, v) => setPortafolio(p => ({ ...p, [id]: Math.max(0, parseInt(v) || 0) }));

  // ---- Derivados base ----
  const costoPz = params.material + params.manoObra;
  const utilidadPz = params.precioPz - costoPz;
  const margen = params.precioPz > 0 ? (utilidadPz / params.precioPz) * 100 : 0;
  const gastosFijos = params.sueldo + params.operacion;
  const lineaRoja = PIEZAS_BENCH * costoPz; // costo de un vendedor estándar

  // Vendedor benchmark (sano)
  const ventaVend = PIEZAS_BENCH * params.precioPz;
  const utilidadVend = PIEZAS_BENCH * utilidadPz; // contribución bruta por vendedor

  // ---- Punto de equilibrio (cubrir gastos fijos) ----
  const vendedoresEquilibrio = utilidadVend > 0 ? Math.ceil(gastosFijos / utilidadVend) : 0;
  const ventasEquilibrio = vendedoresEquilibrio * ventaVend;
  const piezasEquilibrio = vendedoresEquilibrio * PIEZAS_BENCH;

  // ---- Vendedores para la meta NETA (gastos fijos + meta) ----
  const contribObjetivo = gastosFijos + params.metaSemanal;
  const vendedoresNec = utilidadVend > 0 ? Math.ceil(contribObjetivo / utilidadVend) : 0;
  const ventasNec = vendedoresNec * ventaVend;
  const piezasNec = vendedoresNec * PIEZAS_BENCH;

  // ---- Simulador de portafolio ----
  const tot = NIVELES.reduce((acc, n) => {
    const q = portafolio[n.id] || 0;
    acc.vendedores += q;
    acc.piezas += q * n.piezas;
    acc.ventas += q * n.piezas * params.precioPz;
    acc.contribucion += q * n.piezas * utilidadPz;
    acc.capital += q * n.piezas * costoPz;
    return acc;
  }, { vendedores: 0, piezas: 0, ventas: 0, contribucion: 0, capital: 0 });

  const utilidadNeta = tot.contribucion - gastosFijos;
  const pctMeta = params.metaSemanal > 0 ? (utilidadNeta / params.metaSemanal) * 100 : 0;
  const excedente = utilidadNeta - params.metaSemanal;
  const capitalOk = tot.capital <= params.capitalDisponible;

  // ---- Días máximos de consignación sin descapitalizar ----
  // Capital flotando = reposición semanal a costo × (plazo/7). Tope: ≤ capital disponible.
  const diasMaxConsig = tot.capital > 0 ? (params.capitalDisponible / tot.capital) * 7 : 0;
  const consigOk = diasMaxConsig >= TOPE_POLITICA_DIAS;

  // ---- estilos ----
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
          Proyección financiera de tu red de vendedores en consignación, sin descapitalizarte.
        </p>
      </div>

      {/* Parámetros base */}
      <div style={{ ...card(), marginBottom: '24px' }}>
        <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>⚙️ Parámetros</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px' }}>
          {[
            { k: 'precioPz', label: 'Precio venta/pz' },
            { k: 'material', label: 'Costo material/pz' },
            { k: 'manoObra', label: 'Mano de obra/pz' },
            { k: 'metaSemanal', label: 'Meta neta/sem' },
            { k: 'sueldo', label: 'Sueldo/sem' },
            { k: 'operacion', label: 'Operación/sem' },
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
          <span><strong>Gastos fijos:</strong> {money(gastosFijos)}/sem</span>
          <span><strong style={{ color: energyColors.danger }}>Línea roja/vend:</strong> {money(lineaRoja)}/sem</span>
        </div>
      </div>

      {/* Punto de equilibrio + meta */}
      <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>📐 Punto de equilibrio y meta</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '14px' }}>
        {[
          { label: 'Equilibrio (vendedores)', valor: vendedoresEquilibrio, sub: `cubren los ${money(gastosFijos)} de gastos fijos`, color: energyColors.warning, icon: '⚖️' },
          { label: 'Vendedores para tu meta', valor: vendedoresNec, sub: `para ${money(params.metaSemanal)} neto/sem`, color: energyColors.electric, icon: '👥' },
          { label: 'Ventas requeridas/sem', valor: money(ventasNec), sub: `${piezasNec} piezas/sem`, color: energyColors.olive, icon: '💵' },
          { label: 'Utilidad por vendedor', valor: money(utilidadVend), sub: `vende ${money(ventaVend)}/sem (${PIEZAS_BENCH} pz)`, color: energyColors.success, icon: '🌟' },
        ].map((c, i) => (
          <div key={i} style={card({ textAlign: 'center', borderTop: `4px solid ${c.color}` })}>
            <div style={{ fontSize: '26px' }}>{c.icon}</div>
            <div style={{ ...labelChip, marginTop: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: energyColors.espresso, margin: '4px 0' }}>{c.valor}</div>
            <div style={{ fontSize: '12px', color: c.color, fontWeight: 600 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card({ background: `${energyColors.warning}12`, border: `1px solid ${energyColors.warning}40`, marginBottom: '30px', fontSize: '14px' }) }}>
        💡 Los primeros <strong>{vendedoresEquilibrio} vendedores</strong> solo cubren tus gastos fijos (no ganas todavía). A partir del vendedor <strong>{vendedoresEquilibrio + 1}</strong> cada uno suma <strong>{money(utilidadVend)}/sem</strong> de utilidad neta. Llegas a tu meta de {money(params.metaSemanal)} con <strong>{vendedoresNec}</strong>.
      </div>

      {/* Simulador de portafolio */}
      <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>🧮 Simulador de portafolio</div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
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
              <span style={{ fontSize: '13px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>Utilidad neta/sem</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>{tot.vendedores} vend · {tot.piezas} pz</span>
            </div>
            <div style={{ fontSize: '40px', fontWeight: 900, margin: '4px 0', color: utilidadNeta >= 0 ? energyColors.white : '#FFD2CC' }}>{money(utilidadNeta)}</div>
            {/* desglose */}
            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '8px' }}>
              Contribución {money(tot.contribucion)} − gastos fijos {money(gastosFijos)}
            </div>
            {/* barra vs meta */}
            <div style={{ height: '12px', background: 'rgba(255,255,255,0.25)', borderRadius: '6px', overflow: 'hidden', margin: '4px 0 6px' }}>
              <div style={{ height: '100%', width: `${Math.min(Math.max(pctMeta, 0), 100)}%`, background: pctMeta >= 100 ? energyColors.success : energyColors.warning, transition: 'width .4s' }} />
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
                {capitalOk ? `✓ cabe en ${money(params.capitalDisponible)}` : `⚠ excede tu capital`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Días máximos de consignación */}
      <div style={{ ...card({ borderLeft: `6px solid ${consigOk ? energyColors.success : energyColors.danger}`, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }) }}>
        <div style={{ fontSize: '34px' }}>⏳</div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={labelChip}>Días máximos de consignación sin riesgo</div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: consigOk ? energyColors.success : energyColors.danger }}>
            {Math.floor(diasMaxConsig)} días
          </div>
          <div style={{ fontSize: '12px', color: energyColors.camel, fontWeight: 500 }}>
            Tu capital ({money(params.capitalDisponible)}) financia ~{(diasMaxConsig / 7).toFixed(1)} semanas de mercancía flotando. Política del modelo: tope {TOPE_POLITICA_DIAS} días.
          </div>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: consigOk ? energyColors.success : energyColors.danger, textAlign: 'right' }}>
          {consigOk
            ? `✓ Holgura de ${Math.floor(diasMaxConsig) - TOPE_POLITICA_DIAS} días sobre tu tope`
            : `⚠ Por debajo del tope de ${TOPE_POLITICA_DIAS} días — riesgo de descapitalizar`}
        </div>
      </div>

      {/* Nota línea roja */}
      <div style={{ ...card({ background: `${energyColors.danger}10`, border: `1px solid ${energyColors.danger}40` }) }}>
        <strong style={{ color: energyColors.danger }}>🚦 Línea roja de caja:</strong> cada vendedor debe ingresar mínimo <strong>{money(lineaRoja)}/sem</strong> (su costo material + mano de obra). Por debajo de eso, descapitalizas. Sano + crecer = {money(ventaVend)}/sem (paga lo que vende). <strong>Regla de oro:</strong> resurtir = lo vendido y pagado, nunca tope ciego.
      </div>
    </div>
  );
};

export default EstrategiaOperativa;

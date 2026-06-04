import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';
import { getMercanciaEnCalle } from '../supabaseClient';

// Proyección financiera de la red de vendedores en consignación (modelo Blancos Sinaí).
// Parametrizable (no toca Supabase). Responde: cuántos vendedores, flujo mínimo de cobranza
// para ganar utilidad ya descontando costos totales, entrada mínima por vendedor (línea roja),
// punto de equilibrio, capital pipeline y días máximos de consignación sin descapitalizar.
// La meta es utilidad NETA (después de gastos fijos). Capital pipeline = materia prima + stock.

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
  metaSemanal: 4000,    // utilidad NETA objetivo
  sueldo: 2300,         // gasto fijo semanal
  operacion: 1000,      // gasto fijo semanal (gasolina, etc.)
  materiaPrima: 63000,  // capital en tela
  stockTerminado: 7000, // capital en producto terminado
  exposicion: 70,       // % de la tela que puede flotar en la calle
  efectivo: 2700,       // efectivo líquido para pagar mano de obra
  lineaRojaObjetivo: 1500, // línea roja total por vendedor que se busca (modo objetivo)
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

  // Mercancía real en la calle (desde Supabase)
  const [real, setReal] = useState(null);
  const [cargandoReal, setCargandoReal] = useState(true);

  useEffect(() => { localStorage.setItem('estrategia_params', JSON.stringify(params)); }, [params]);
  useEffect(() => { localStorage.setItem('estrategia_portafolio', JSON.stringify(portafolio)); }, [portafolio]);

  useEffect(() => {
    (async () => {
      setCargandoReal(true);
      const { data } = await getMercanciaEnCalle();
      setReal(data || null);
      setCargandoReal(false);
    })();
  }, []);

  const setParam = (k, v) => setParams(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const setNivel = (id, v) => setPortafolio(p => ({ ...p, [id]: Math.max(0, parseInt(v) || 0) }));

  // ---- Derivados base ----
  const costoPz = params.material + params.manoObra;
  const utilidadPz = params.precioPz - costoPz;
  const margen = params.precioPz > 0 ? (utilidadPz / params.precioPz) * 100 : 0;
  const gastosFijos = params.sueldo + params.operacion;
  const telaFlotante = params.materiaPrima * (params.exposicion / 100) + params.stockTerminado; // tela que puede exponerse
  const lineaRojaVar = PIEZAS_BENCH * costoPz; // costo de un vendedor estándar (solo mercancía)

  // Vendedor benchmark (sano)
  const ventaVend = PIEZAS_BENCH * params.precioPz;
  const utilidadVend = PIEZAS_BENCH * utilidadPz; // contribución bruta por vendedor

  // ---- Punto de equilibrio (cubrir gastos fijos) ----
  const vendedoresEquilibrio = utilidadVend > 0 ? Math.ceil(gastosFijos / utilidadVend) : 0;

  // ---- Vendedores para la meta NETA (gastos fijos + meta) ----
  const contribObjetivo = gastosFijos + params.metaSemanal;
  const vendedoresNec = utilidadVend > 0 ? Math.ceil(contribObjetivo / utilidadVend) : 0;
  const ventasNec = vendedoresNec * ventaVend;
  const piezasNec = vendedoresNec * PIEZAS_BENCH;

  // ---- MODO OBJETIVO: defines la línea roja por vendedor → tamaño de la red ----
  // Piezas totales para la meta son fijas: (meta + fijos) / utilidadPz, sin importar el reparto.
  // Línea roja total = P × (costoPz + fijos/totalPiezasMeta) → P es lineal respecto a la línea roja.
  const totalPiezasMeta = utilidadPz > 0 ? (params.metaSemanal + gastosFijos) / utilidadPz : 0;
  const factorPorPieza = costoPz + (totalPiezasMeta > 0 ? gastosFijos / totalPiezasMeta : 0);
  const obj = {};
  obj.piezasPorVend = factorPorPieza > 0 ? Math.max(1, Math.round(params.lineaRojaObjetivo / factorPorPieza)) : 0;
  obj.vendedores = obj.piezasPorVend > 0 ? Math.ceil(totalPiezasMeta / obj.piezasPorVend) : 0;
  obj.totalPiezas = obj.vendedores * obj.piezasPorVend;
  obj.lineaRojaReal = obj.piezasPorVend * costoPz + (obj.vendedores > 0 ? gastosFijos / obj.vendedores : 0);
  obj.exposicion = obj.totalPiezas * costoPz;
  obj.efectivoReq = obj.totalPiezas * params.manoObra; // mano de obra flotando a 7 días
  obj.efectivoOk = obj.efectivoReq <= params.efectivo;
  obj.utilidadNeta = obj.totalPiezas * utilidadPz - gastosFijos;
  obj.maxVendEfectivo = (obj.piezasPorVend > 0 && params.manoObra > 0) ? Math.floor(params.efectivo / (obj.piezasPorVend * params.manoObra)) : 0;

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
  const capitalOk = tot.capital <= telaFlotante;

  // ---- Flujo de efectivo semanal ----
  // Mínimo a cobrar para NO perder = reposición de mercancía + gastos fijos.
  const flujoMinimo = tot.capital + gastosFijos;
  // Línea roja por vendedor "completa": su costo + su parte de gastos fijos.
  const gastosFijosPorVend = tot.vendedores > 0 ? gastosFijos / tot.vendedores : 0;
  const lineaRojaTotal = lineaRojaVar + gastosFijosPorVend;

  // ---- Días máximos de consignación sin descapitalizar (el MENOR de dos límites) ----
  // Mercancía flotando se descompone en material (lo financia la tela) y mano de obra (efectivo).
  const materialSemanal = tot.piezas * params.material; // tela consumida por semana
  const laborSemanal = tot.piezas * params.manoObra;     // mano de obra por semana (efectivo)
  const diasTela = materialSemanal > 0 ? (telaFlotante / materialSemanal) * 7 : Infinity;
  const diasEfectivo = laborSemanal > 0 ? (params.efectivo / laborSemanal) * 7 : Infinity;
  const diasMaxConsig = Math.min(diasTela, diasEfectivo);
  const limitante = diasEfectivo <= diasTela ? 'efectivo' : 'tela';
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
          Proyección financiera: cuántos vendedores y qué flujo mínimo te dejan utilidad, sin descapitalizarte.
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
            { k: 'materiaPrima', label: 'Materia prima ($)' },
            { k: 'stockTerminado', label: 'Stock terminado ($)' },
            { k: 'exposicion', label: '% tela expuesta' },
            { k: 'efectivo', label: 'Efectivo líquido ($)' },
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
          <span><strong>Tela flotante:</strong> {money(telaFlotante)} ({params.exposicion}%)</span>
        </div>
      </div>

      {/* Mercancía REAL en la calle (desde la base) */}
      <div style={{ ...card({ borderLeft: `6px solid ${energyColors.electric}`, marginBottom: '24px' }) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: energyColors.sidebarBg }}>📡 Mercancía en la calle — HOY (real, desde la base)</div>
          {cargandoReal && <span style={{ fontSize: '12px', color: energyColors.camel }}>cargando…</span>}
        </div>
        {!cargandoReal && real ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginTop: '12px' }}>
            <div><div style={labelChip}>Piezas en consignación</div><div style={{ fontSize: '24px', fontWeight: 900 }}>{real.piezas}</div></div>
            <div><div style={labelChip}>Capital en la calle (costo)</div><div style={{ fontSize: '24px', fontWeight: 900, color: energyColors.danger }}>{money(real.costoTotal)}</div></div>
            <div><div style={labelChip}>Cobranza potencial (venta)</div><div style={{ fontSize: '24px', fontWeight: 900, color: energyColors.olive }}>{money(real.valorVenta)}</div></div>
            <div><div style={labelChip}>vs. tu tela flotante</div><div style={{ fontSize: '24px', fontWeight: 900, color: real.costoTotal <= telaFlotante ? energyColors.success : energyColors.danger }}>{telaFlotante > 0 ? Math.round((real.costoTotal / telaFlotante) * 100) : 0}%</div></div>
          </div>
        ) : !cargandoReal ? (
          <div style={{ fontSize: '13px', color: energyColors.camel, marginTop: '8px' }}>
            Sin datos de consignación (o sin conexión a la base). Se usa el simulador de abajo.
          </div>
        ) : null}
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
        💡 Los primeros <strong>{vendedoresEquilibrio} vendedores</strong> solo cubren tus gastos fijos (no ganas todavía). A partir de ahí cada uno suma <strong>{money(utilidadVend)}/sem</strong> de utilidad neta. Llegas a tu meta de {money(params.metaSemanal)} con <strong>{vendedoresNec}</strong>.
      </div>

      {/* MODO OBJETIVO */}
      <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', color: energyColors.sidebarBg }}>🎯 Modo objetivo — baja la línea roja, gana alcance</div>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: energyColors.camel }}>
        Más vendedores con cargas más chicas = entrada más accesible por vendedor + más puntos de venta. Define la línea roja que quieres y te dimensiono la red.
      </p>
      <div style={{ ...card({ borderTop: `4px solid ${energyColors.purple || '#9B59B6'}`, marginBottom: '30px' }) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div>
            <div style={labelChip}>Línea roja objetivo / vendedor</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: 900 }}>$</span>
              <input type="number" value={params.lineaRojaObjetivo} onChange={e => setParam('lineaRojaObjetivo', e.target.value)}
                style={{ width: '130px', fontSize: '22px', fontWeight: 900, border: 'none', borderBottom: `3px solid ${energyColors.sidebarBg}`, color: energyColors.espresso, padding: '2px 4px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '180px', fontSize: '13px', color: energyColors.camel, fontWeight: 500 }}>
            Tu línea roja actual de referencia (38 pz) es {money(lineaRojaTotal)}/vend. Baja el objetivo para repartir en más vendedores.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
          <div style={card({ textAlign: 'center', background: energyColors.cotton })}>
            <div style={labelChip}>Piezas por vendedor</div>
            <div style={{ fontSize: '26px', fontWeight: 900 }}>{obj.piezasPorVend}</div>
          </div>
          <div style={card({ textAlign: 'center', background: energyColors.cotton })}>
            <div style={labelChip}>Vendedores para la meta</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: energyColors.electric }}>{obj.vendedores}</div>
          </div>
          <div style={card({ textAlign: 'center', background: energyColors.cotton })}>
            <div style={labelChip}>Línea roja real/vend</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: energyColors.danger }}>{money(obj.lineaRojaReal)}</div>
          </div>
          <div style={card({ textAlign: 'center', background: energyColors.cotton })}>
            <div style={labelChip}>Utilidad neta/sem</div>
            <div style={{ fontSize: '26px', fontWeight: 900, color: obj.utilidadNeta >= 0 ? energyColors.success : energyColors.danger }}>{money(obj.utilidadNeta)}</div>
          </div>
        </div>
        <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', background: obj.efectivoOk ? `${energyColors.success}15` : `${energyColors.danger}15`, border: `1px solid ${obj.efectivoOk ? energyColors.success : energyColors.danger}40`, fontSize: '14px' }}>
          {obj.efectivoOk
            ? <span><strong style={{ color: energyColors.success }}>✓ Cabe en tu efectivo.</strong> Necesitas {money(obj.efectivoReq)} de mano de obra flotando ({money(params.efectivo)} disponibles). A esta carga tu efectivo soporta hasta <strong>{obj.maxVendEfectivo} vendedores</strong>.</span>
            : <span><strong style={{ color: energyColors.danger }}>⚠ No cabe en tu efectivo.</strong> Necesitas {money(obj.efectivoReq)} de mano de obra flotando, pero solo tienes {money(params.efectivo)}. A esta carga tu efectivo soporta máximo <strong>{obj.maxVendEfectivo} vendedores</strong> (no {obj.vendedores}). Sube efectivo o reactiva maquila.</span>}
        </div>
      </div>

      {/* Simulador de portafolio */}
      <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>🧮 Simulador de portafolio</div>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
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
            <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '8px' }}>
              Cobranza {money(tot.ventas)} − reposición {money(tot.capital)} − gastos fijos {money(gastosFijos)}
            </div>
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
                {capitalOk ? `✓ cabe en tela flotante ${money(telaFlotante)}` : `⚠ excede tu tela flotante`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flujo de efectivo semanal */}
      <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '14px', color: energyColors.sidebarBg }}>💸 Flujo de efectivo semanal</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={card({ textAlign: 'center', borderTop: `4px solid ${energyColors.danger}` })}>
          <div style={labelChip}>Flujo mínimo a cobrar/sem</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: energyColors.danger, margin: '4px 0' }}>{money(flujoMinimo)}</div>
          <div style={{ fontSize: '12px', color: energyColors.camel, fontWeight: 600 }}>reposición + gastos fijos · debajo de esto pierdes</div>
        </div>
        <div style={card({ textAlign: 'center', borderTop: `4px solid ${energyColors.olive}` })}>
          <div style={labelChip}>Cobranza potencial/sem</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: energyColors.olive, margin: '4px 0' }}>{money(tot.ventas)}</div>
          <div style={{ fontSize: '12px', color: energyColors.camel, fontWeight: 600 }}>si se vende y paga todo lo entregado</div>
        </div>
        <div style={card({ textAlign: 'center', borderTop: `4px solid ${energyColors.danger}` })}>
          <div style={labelChip}>Línea roja TOTAL/vendedor</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: energyColors.danger, margin: '4px 0' }}>{money(lineaRojaTotal)}</div>
          <div style={{ fontSize: '12px', color: energyColors.camel, fontWeight: 600 }}>su costo {money(lineaRojaVar)} + parte de fijos {money(gastosFijosPorVend)}</div>
        </div>
      </div>

      {/* Días máximos de consignación */}
      <div style={{ ...card({ borderLeft: `6px solid ${consigOk ? energyColors.success : energyColors.danger}`, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }) }}>
        <div style={{ fontSize: '34px' }}>⏳</div>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={labelChip}>Días máximos de consignación sin riesgo</div>
          <div style={{ fontSize: '30px', fontWeight: 900, color: consigOk ? energyColors.success : energyColors.danger }}>
            {Number.isFinite(diasMaxConsig) ? Math.floor(diasMaxConsig) : '∞'} días
            <span style={{ fontSize: '13px', fontWeight: 700, color: energyColors.camel, marginLeft: '8px' }}>te frena: {limitante === 'efectivo' ? '💵 efectivo' : '🧵 tela'}</span>
          </div>
          <div style={{ fontSize: '12px', color: energyColors.camel, fontWeight: 500 }}>
            Pista de tela {Number.isFinite(diasTela) ? Math.floor(diasTela) : '∞'} días ({money(telaFlotante)}) · pista de efectivo {Number.isFinite(diasEfectivo) ? Math.floor(diasEfectivo) : '∞'} días ({money(params.efectivo)} para mano de obra). Política: tope {TOPE_POLITICA_DIAS} días.
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
        <strong style={{ color: energyColors.danger }}>🚦 Línea roja de caja:</strong> para no descapitalizar la <em>mercancía</em>, cada vendedor regresa mínimo <strong>{money(lineaRojaVar)}/sem</strong> (su costo material + mano de obra). Para que el <em>negocio completo</em> no pierda, debe regresar <strong>{money(lineaRojaTotal)}/sem</strong> (incluye su parte de gastos fijos). <strong>Regla de oro:</strong> resurtir = lo vendido y pagado, nunca tope ciego.
      </div>
    </div>
  );
};

export default EstrategiaOperativa;

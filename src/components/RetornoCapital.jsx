import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';
import { getProductos } from '../supabaseClient';

// Calculadora de Retorno de Capital / Plan de pago de consignación.
// Eliges productos (costo REAL desde Supabase), cantidad, precio a vendedor y precio cliente,
// el número de pagos y el modo (parejo / recupera costo primero). Devuelve el calendario
// semanal y cuándo recuperas tu capital + el % de retorno.

const energyColors = {
  ...colors,
  electric: '#00D1FF',
  success: '#2ECC71',
  warning: '#F1C40F',
  danger: '#E74C3C',
  white: '#FFFFFF',
};

const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-MX');

const load = (key, def) => {
  try { const v = localStorage.getItem(key); return v != null ? JSON.parse(v) : def; } catch { return def; }
};

const descVariante = (v) => [v.material, v.color, v.talla].filter(Boolean).join(' ') || v.sku || `Var ${v.id}`;

const RetornoCapital = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [lineas, setLineas] = useState(() => load('retorno_lineas', []));
  const [numPagos, setNumPagos] = useState(() => load('retorno_numpagos', 2));
  const [modo, setModo] = useState(() => load('retorno_modo', 'protegido')); // 'parejo' | 'protegido'

  useEffect(() => {
    (async () => {
      setCargando(true);
      const { data } = await getProductos();
      setProductos((data || []).filter(p => p.activo !== false));
      setCargando(false);
    })();
  }, []);

  useEffect(() => { localStorage.setItem('retorno_lineas', JSON.stringify(lineas)); }, [lineas]);
  useEffect(() => { localStorage.setItem('retorno_numpagos', JSON.stringify(numPagos)); }, [numPagos]);
  useEffect(() => { localStorage.setItem('retorno_modo', JSON.stringify(modo)); }, [modo]);

  const lineaDeProducto = (prod) => {
    const variantes = (prod.variantes || []).filter(v => v.activo !== false);
    const v = variantes[0] || null;
    const costo = v ? (parseFloat(v.costo_unitario) || 0) : (parseFloat(prod.costo_total_1_tinta) || 0);
    const precioVendedor = v ? (parseFloat(v.precio_venta) || 0) : 0;
    return {
      id: Date.now() + Math.random(),
      productoId: prod.id,
      varianteId: v?.id || null,
      nombre: prod.linea_nombre,
      costo,
      cantidad: 1,
      precioVendedor,
      precioCliente: precioVendedor ? Math.round(precioVendedor * 1.5) : 0,
    };
  };

  const agregarProducto = (prodId) => {
    const prod = productos.find(p => String(p.id) === String(prodId));
    if (prod) setLineas(prev => [...prev, lineaDeProducto(prod)]);
  };

  const setLinea = (id, patch) => setLineas(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  const quitarLinea = (id) => setLineas(prev => prev.filter(l => l.id !== id));

  const cambiarVariante = (id, varianteId) => {
    const l = lineas.find(x => x.id === id);
    const prod = productos.find(p => String(p.id) === String(l.productoId));
    const v = (prod?.variantes || []).find(x => String(x.id) === String(varianteId));
    if (v) setLinea(id, { varianteId: v.id, costo: parseFloat(v.costo_unitario) || 0, precioVendedor: parseFloat(v.precio_venta) || l.precioVendedor });
  };

  // ---- Cálculos ----
  const calc = lineas.map(l => {
    const costoTotal = l.costo * l.cantidad;
    const cobrar = l.precioVendedor * l.cantidad;       // lo que el vendedor te paga
    const clientePaga = l.precioCliente * l.cantidad;
    const utilidad = (l.precioVendedor - l.costo) * l.cantidad;
    return { ...l, costoTotal, cobrar, clientePaga, utilidad };
  });
  const capitalArriesgado = calc.reduce((a, l) => a + l.costoTotal, 0);
  const totalCobrar = calc.reduce((a, l) => a + l.cobrar, 0);
  const clienteTotal = calc.reduce((a, l) => a + l.clientePaga, 0);
  const utilidadTotal = calc.reduce((a, l) => a + l.utilidad, 0);
  const pctRetorno = capitalArriesgado > 0 ? (utilidadTotal / capitalArriesgado) * 100 : 0;

  // ---- Calendario de pagos ----
  const semanas = [];
  if (totalCobrar > 0 && numPagos > 0) {
    let saldo = totalCobrar, acum = 0;
    const pagoParejo = totalCobrar / numPagos;
    const cobroClienteSem = clienteTotal / numPagos;
    for (let s = 1; s <= numPagos; s++) {
      let pago = modo === 'protegido' ? Math.min(cobroClienteSem, saldo) : Math.min(pagoParejo, saldo);
      if (s === numPagos) pago = saldo; // liquida resto (redondeos)
      saldo -= pago; acum += pago;
      const capitalRecuperado = Math.min(acum, capitalArriesgado);
      const utilidadAcum = Math.max(0, acum - capitalArriesgado);
      semanas.push({ s, pago, acum, capitalRecuperado, utilidadAcum, enCalle: capitalArriesgado - capitalRecuperado });
    }
  }
  const semanaCosto = semanas.find(w => w.capitalRecuperado >= capitalArriesgado - 0.5)?.s;

  // ---- estilos ----
  const card = (extra = {}) => ({ background: energyColors.white, borderRadius: '16px', padding: '18px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', ...extra });
  const labelChip = { fontSize: '11px', color: energyColors.camel, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' };
  const inp = { width: '70px', padding: '6px', borderRadius: '8px', border: `1px solid ${energyColors.sand}`, fontWeight: 700, textAlign: 'right' };
  const th = { textAlign: 'right', padding: '8px 6px', fontSize: '11px', color: energyColors.camel, textTransform: 'uppercase', fontWeight: 700 };
  const td = { textAlign: 'right', padding: '8px 6px', fontSize: '13px' };

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", color: energyColors.espresso, padding: '10px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&display=swap');`}</style>

      <div style={{ marginBottom: '26px' }}>
        <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, background: `linear-gradient(45deg, ${energyColors.sidebarBg}, ${energyColors.olive})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🔄 Retorno de Capital
        </h1>
        <p style={{ margin: '5px 0 0', fontSize: '15px', color: energyColors.camel, fontWeight: 500 }}>
          Arma un pedido de consignación con costos reales de la base y simula cuándo recuperas tu capital.
        </p>
      </div>

      {/* Agregar producto */}
      <div style={{ ...card(), marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>➕ Agregar producto:</span>
        <select value="" onChange={e => { agregarProducto(e.target.value); e.target.value = ''; }} disabled={cargando}
          style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${energyColors.sand}`, fontWeight: 600, minWidth: '220px' }}>
          <option value="">{cargando ? 'Cargando productos…' : '— elige un producto —'}</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.linea_nombre}</option>)}
        </select>
        {!cargando && productos.length === 0 && <span style={{ fontSize: '13px', color: energyColors.danger }}>Sin conexión a la base.</span>}
      </div>

      {/* Líneas del pedido */}
      {lineas.length > 0 ? (
        <div style={{ ...card(), marginBottom: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${energyColors.cotton}` }}>
                <th style={{ ...th, textAlign: 'left' }}>Producto</th>
                <th style={th}>Costo (base)</th>
                <th style={th}>Cant.</th>
                <th style={th}>Precio vendedor</th>
                <th style={th}>Precio cliente</th>
                <th style={th}>Tu utilidad</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {calc.map(l => {
                const prod = productos.find(p => String(p.id) === String(l.productoId));
                const variantes = (prod?.variantes || []).filter(v => v.activo !== false);
                return (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${energyColors.cotton}` }}>
                    <td style={{ padding: '8px 6px', fontSize: '13px', textAlign: 'left' }}>
                      <div style={{ fontWeight: 700 }}>{l.nombre}</div>
                      {variantes.length > 0 && (
                        <select value={l.varianteId || ''} onChange={e => cambiarVariante(l.id, e.target.value)}
                          style={{ marginTop: '4px', padding: '3px 6px', borderRadius: '6px', border: `1px solid ${energyColors.sand}`, fontSize: '12px' }}>
                          {variantes.map(v => <option key={v.id} value={v.id}>{descVariante(v)}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ ...td, color: energyColors.camel, fontWeight: 700 }}>{money(l.costo)}</td>
                    <td style={td}><input type="number" min="1" value={l.cantidad} onChange={e => setLinea(l.id, { cantidad: Math.max(1, parseInt(e.target.value) || 1) })} style={{ ...inp, width: '60px' }} /></td>
                    <td style={td}><input type="number" value={l.precioVendedor} onChange={e => setLinea(l.id, { precioVendedor: parseFloat(e.target.value) || 0 })} style={inp} /></td>
                    <td style={td}><input type="number" value={l.precioCliente} onChange={e => setLinea(l.id, { precioCliente: parseFloat(e.target.value) || 0 })} style={inp} /></td>
                    <td style={{ ...td, fontWeight: 800, color: l.utilidad >= 0 ? energyColors.success : energyColors.danger }}>{money(l.utilidad)}</td>
                    <td style={td}><button onClick={() => quitarLinea(l.id)} style={{ border: 'none', background: 'none', color: energyColors.danger, cursor: 'pointer', fontSize: '16px' }}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ ...card({ textAlign: 'center', color: energyColors.camel, marginBottom: '20px' }) }}>
          Agrega productos al pedido para simular el retorno de capital.
        </div>
      )}

      {lineas.length > 0 && (
        <>
          {/* Resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Capital arriesgado', valor: money(capitalArriesgado), color: energyColors.danger, sub: 'tu costo total' },
              { label: 'Te deben pagar', valor: money(totalCobrar), color: energyColors.sidebarBg, sub: 'precio a vendedor' },
              { label: 'Tu utilidad', valor: money(utilidadTotal), color: energyColors.success, sub: `${pctRetorno.toFixed(0)}% sobre tu capital` },
              { label: 'Cliente paga', valor: money(clienteTotal), color: energyColors.olive, sub: 'precio final' },
            ].map((c, i) => (
              <div key={i} style={card({ textAlign: 'center', borderTop: `4px solid ${c.color}` })}>
                <div style={labelChip}>{c.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: c.color, margin: '4px 0' }}>{c.valor}</div>
                <div style={{ fontSize: '12px', color: energyColors.camel, fontWeight: 600 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Controles del plan */}
          <div style={{ ...card(), marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div>
              <span style={labelChip}>Número de pagos (semanas)</span>
              <div><input type="number" min="1" value={numPagos} onChange={e => setNumPagos(Math.max(1, parseInt(e.target.value) || 1))} style={{ ...inp, width: '70px', marginTop: '4px' }} /></div>
            </div>
            <div>
              <span style={labelChip}>Modo de pago</span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                {[{ id: 'protegido', t: 'Recupera costo primero' }, { id: 'parejo', t: 'Parejo' }].map(m => (
                  <button key={m.id} onClick={() => setModo(m.id)}
                    style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', background: modo === m.id ? energyColors.sidebarBg : energyColors.cotton, color: modo === m.id ? 'white' : energyColors.espresso }}>
                    {m.t}
                  </button>
                ))}
              </div>
            </div>
            {semanaCosto && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <span style={labelChip}>Recuperas tu capital</span>
                <div style={{ fontSize: '22px', fontWeight: 900, color: energyColors.success }}>en la semana {semanaCosto}</div>
              </div>
            )}
          </div>

          {/* Calendario */}
          <div style={{ ...card(), overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${energyColors.cotton}` }}>
                  <th style={{ ...th, textAlign: 'left' }}>Semana</th>
                  <th style={th}>Te paga</th>
                  <th style={th}>Acumulado</th>
                  <th style={th}>Capital recuperado</th>
                  <th style={th}>Utilidad acumulada</th>
                  <th style={th}>Aún en la calle</th>
                </tr>
              </thead>
              <tbody>
                {semanas.map(w => (
                  <tr key={w.s} style={{ borderBottom: `1px solid ${energyColors.cotton}`, background: w.s === semanaCosto ? `${energyColors.success}10` : 'transparent' }}>
                    <td style={{ ...td, textAlign: 'left', fontWeight: 700 }}>Semana {w.s}{w.s === semanaCosto ? ' ✓' : ''}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{money(w.pago)}</td>
                    <td style={td}>{money(w.acum)}</td>
                    <td style={{ ...td, color: energyColors.sidebarBg, fontWeight: 700 }}>{money(w.capitalRecuperado)}</td>
                    <td style={{ ...td, color: energyColors.success, fontWeight: 700 }}>{money(w.utilidadAcum)}</td>
                    <td style={{ ...td, color: w.enCalle > 0 ? energyColors.danger : energyColors.camel }}>{money(w.enCalle)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '12px', fontSize: '12px', color: energyColors.camel }}>
              {modo === 'protegido'
                ? '🛡️ El vendedor te paga primero hasta cubrir tu costo; su ganancia queda al final. Tú quedas a salvo lo antes posible.'
                : '⚖️ El vendedor te paga en partes iguales cada semana.'}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RetornoCapital;

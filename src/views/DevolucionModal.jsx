import React, { useState, useEffect } from 'react';
import { getConsignacionPendienteCliente, registrarDevolucionConsignacion } from '../supabaseClient';
import { colors } from '../utils/colors';

// Modal de Devolución centrado en el cliente.
// Eliges cliente → ve qué tiene en consignación (por producto) → devuelves hasta esa cantidad.
const DevolucionModal = ({ clientes = [], onClose, onDone }) => {
  const [clienteId, setClienteId] = useState('');
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cantidades, setCantidades] = useState({}); // { "producto_id__variante": qty }
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (!clienteId) { setPendientes([]); setCantidades({}); return; }
    (async () => {
      setCargando(true);
      const { data } = await getConsignacionPendienteCliente(parseInt(clienteId));
      setPendientes(data || []);
      setCantidades({});
      setCargando(false);
    })();
  }, [clienteId]);

  // Clave única por producto + variante (un mismo producto puede estar en la calle
  // en varias variantes y cada una se devuelve por separado).
  const keyOf = (p) => `${p.producto_id}__${p.variante_id ?? 'base'}`;

  const setCant = (key, max, val) => {
    const n = Math.max(0, Math.min(parseInt(val) || 0, max));
    setCantidades(prev => ({ ...prev, [key]: n }));
  };

  const totalADevolver = pendientes.reduce((s, p) => s + (cantidades[keyOf(p)] || 0), 0);

  const confirmar = async () => {
    const aDevolver = pendientes.filter(p => (cantidades[keyOf(p)] || 0) > 0);
    if (aDevolver.length === 0) { setMensaje({ tipo: 'error', texto: 'Indica al menos una pieza a devolver' }); return; }
    setGuardando(true);
    setMensaje(null);
    let ok = 0, fallidas = [];
    for (const p of aDevolver) {
      const cantidad = cantidades[keyOf(p)];
      const etiqueta = p.variante_label ? `${p.producto_nombre} (${p.variante_label})` : p.producto_nombre;
      const movimiento = {
        producto_id: p.producto_id,
        cliente_id: parseInt(clienteId),
        tipo_movimiento: 'devolucion',
        cantidad,
        notas: notas || `Devolución de ${cantidad} pza`,
        ...(p.variante_id != null ? { variante_id: p.variante_id } : {})
      };
      const datosDevolucion = {
        producto_id: p.producto_id,
        cliente_id: parseInt(clienteId),
        cantidad,
        ...(p.variante_id != null ? { variante_id: p.variante_id } : {})
      };
      const { error } = await registrarDevolucionConsignacion(movimiento, datosDevolucion);
      if (error) fallidas.push(etiqueta); else ok++;
    }
    setGuardando(false);

    // Si al menos UNA se registró, refrescamos la lista SIEMPRE (aunque otras
    // fallen): las exitosas desaparecen del listado, así un reintento solo cubre
    // las fallidas y no duplica las que ya pasaron.
    if (ok > 0) {
      onDone && onDone();
      const { data } = await getConsignacionPendienteCliente(parseInt(clienteId));
      setPendientes(data || []);
      setCantidades({});
      if (fallidas.length === 0) setNotas('');
    }

    if (fallidas.length === 0) {
      setMensaje({ tipo: 'ok', texto: `✓ ${ok} devolución(es) registrada(s)` });
    } else if (ok > 0) {
      setMensaje({ tipo: 'error', texto: `Se registraron ${ok}. Falló en: ${fallidas.join(', ')} — vuelve a intentar solo esa(s).` });
    } else {
      setMensaje({ tipo: 'error', texto: `Falló en: ${fallidas.join(', ')}` });
    }
  };

  const clientesConsig = [...clientes].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: `1px solid ${colors.sand}`, paddingBottom: '15px' }}>
          <div>
            <h3 style={{ margin: 0, color: colors.espresso }}>↩️ Registrar devolución</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.camel }}>El cliente regresa piezas que tenía en consignación; vuelven al taller y baja su cuenta por cobrar.</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Cliente */}
        <label style={{ fontSize: '12px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Cliente / Vendedor</label>
        <select value={clienteId} onChange={e => setClienteId(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}`, fontSize: '14px', marginBottom: '18px' }}>
          <option value="">— elige un cliente —</option>
          {clientesConsig.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        {/* Pendientes */}
        {clienteId && (
          cargando ? <p style={{ color: colors.camel }}>Cargando lo que tiene en consignación…</p> :
          pendientes.length === 0 ? (
            <div style={{ padding: '16px', background: colors.cream, borderRadius: '10px', color: colors.camel, fontSize: '14px' }}>
              Este cliente no tiene piezas pendientes en consignación.
            </div>
          ) : (
            <>
              <div style={{ fontSize: '13px', fontWeight: 700, color: colors.espresso, marginBottom: '8px' }}>En consignación (elige cuánto devuelve):</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {pendientes.map(p => {
                  const k = keyOf(p);
                  const val = cantidades[k] || 0;
                  return (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: colors.cotton, borderRadius: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.producto_nombre || `Producto ${p.producto_id}`}</div>
                      {p.variante_label && <div style={{ fontSize: '12px', color: colors.espresso }}>{p.variante_label}</div>}
                      <div style={{ fontSize: '12px', color: colors.camel }}>{p.piezas} pz pendientes</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button onClick={() => setCant(k, p.piezas, val - 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: colors.sand, fontWeight: 900, cursor: 'pointer' }}>−</button>
                      <input type="number" min="0" max={p.piezas} value={val}
                        onChange={e => setCant(k, p.piezas, e.target.value)}
                        style={{ width: '52px', textAlign: 'center', padding: '6px', borderRadius: '8px', border: `2px solid ${val > 0 ? colors.terracotta : colors.sand}`, fontWeight: 700 }} />
                      <button onClick={() => setCant(k, p.piezas, val + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: colors.terracotta, color: 'white', fontWeight: 900, cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                  );
                })}
              </div>

              <label style={{ fontSize: '12px', color: colors.camel, display: 'block', marginBottom: '4px' }}>Nota (opcional)</label>
              <input value={notas} onChange={e => setNotas(e.target.value)} placeholder="Motivo de la devolución…"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}`, fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }} />

              {mensaje && (
                <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: 600, background: mensaje.tipo === 'ok' ? '#e7f6ec' : '#fdecea', color: mensaje.tipo === 'ok' ? colors.olive : colors.terracotta }}>
                  {mensaje.texto}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: colors.espresso }}>Total a devolver: <strong>{totalADevolver} pz</strong></span>
                <button onClick={confirmar} disabled={guardando || totalADevolver === 0}
                  style={{ padding: '12px 24px', background: totalADevolver > 0 ? colors.terracotta : colors.sand, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: totalADevolver > 0 && !guardando ? 'pointer' : 'not-allowed' }}>
                  {guardando ? 'Registrando…' : '↩️ Registrar devolución'}
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default DevolucionModal;

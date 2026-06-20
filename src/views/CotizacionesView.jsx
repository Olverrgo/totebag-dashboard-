import React, { useState, useEffect } from 'react';
import {
  getTiersPrecio,
  getCotizaciones,
  getCotizacionDetalle,
  getProductos,
  getClientes,
  crearCotizacionCompleta,
  actualizarCotizacionCompleta,
  eliminarCotizacion,
  calcularPrecioSugerido,
  updateCotizacion,
  convertirCotizacionEnVenta,
  actualizarTierPrecio,
  generarOrdenesDesdeFaltantes
} from '../supabaseClient';

const ESTADOS = ['borrador', 'enviada', 'aceptada', 'rechazada', 'vencida'];

const estiloEstado = (estado) => {
  switch (estado) {
    case 'aceptada':  return { background: '#D5F5E3', color: '#27AE60' };
    case 'rechazada': return { background: '#FADBD8', color: '#C0392B' };
    case 'vencida':   return { background: '#EAECEE', color: '#7F8C8D' };
    case 'enviada':   return { background: '#D6EAF8', color: '#2471A3' };
    default:          return { background: '#FCF3CF', color: '#B7950B' }; // borrador
  }
};
import { colors } from '../utils/colors';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CotizacionesView = ({ isAdmin }) => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editarCot, setEditarCot] = useState(null); // cotización editable abierta en el wizard
  const [selectedCot, setSelectedCot] = useState(null);
  const [showTarifas, setShowTarifas] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(null); // id en proceso de conversión
  const [convertirCot, setConvertirCot] = useState(null); // cotización en modal de elección de tipo
  const [faltantesCot, setFaltantesCot] = useState(null); // { cotizacion, faltantes } → modal producir

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await getCotizaciones();
    if (res.data) setCotizaciones(res.data);
    setLoading(false);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta cotización permanentemente?')) return;
    const { error } = await eliminarCotizacion(id);
    if (!error) fetchData();
    else alert('Error: ' + error.message);
  };

  const handleEstadoChange = async (id, estado) => {
    // Optimista: pinta el nuevo estado al instante; si falla, recarga del server.
    setCotizaciones(prev => prev.map(c => (c.id === id ? { ...c, estado } : c)));
    const { error } = await updateCotizacion(id, { estado });
    if (error) { alert('No se pudo cambiar el estado: ' + error.message); fetchData(); }
  };

  // Abre el modal de elección de tipo (directa pagada / directa pendiente / consignación).
  // El tipo de operación lo decide el usuario, NO el tier (canal de precio).
  const handleConvertir = (c) => {
    if (c.venta_folio) return;
    setConvertirCot(c);
  };

  // Ejecuta la conversión con las opciones elegidas en el modal.
  const ejecutarConversion = async (c, opciones) => {
    setConvertirCot(null);
    setConvirtiendo(c.id);
    const { folio, okCount, total, faltantes, error } = await convertirCotizacionEnVenta(c, opciones);
    setConvirtiendo(null);

    if (folio && total && okCount === total) {
      // Éxito completo: las N líneas entraron y la cotización quedó sellada.
      alert(`✅ Venta ${folio} generada (${okCount} de ${total} línea(s)).`);
      fetchData();
    } else if (faltantes && faltantes.length > 0) {
      // Faltó stock terminado → ofrecer producir lo que falta (no recargamos aún;
      // la cotización sigue 'aceptada' y reconvertible cuando haya stock).
      setFaltantesCot({ cotizacion: c, faltantes });
    } else if (folio && okCount > 0) {
      // Parcial: NO se selló (todo-o-nada). Quedó como venta suelta; la cotización
      // sigue convertible. Avisar para que se revise/limpie.
      alert(`⚠️ Conversión PARCIAL: solo ${okCount} de ${total} línea(s) entraron, así que la cotización NO se marcó como vendida.\n\n${error?.message || ''}\n\nRevisa la venta ${folio} y vuelve a intentar cuando haya stock completo.`);
      fetchData();
    } else {
      // Falla total (error sin faltantes). error.message ya trae el detalle.
      alert(error?.message || 'No se pudo convertir (error desconocido)');
      fetchData();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', color: colors.espresso, margin: '0 0 5px 0', fontWeight: '300' }}>
            Cotizaciones Profesionales
          </h2>
          <p style={{ color: colors.camel, margin: 0, fontSize: '14px' }}>Gestión de propuestas para clientes</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowTarifas(true)}
            style={{
              background: 'white', color: colors.espresso, border: `1px solid ${colors.sand}`,
              padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span>⚙️</span> Tarifas
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: colors.sidebarBg, color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <span>➕</span> Nueva Cotización
          </button>
        </div>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: colors.cream, borderBottom: `1px solid ${colors.sand}` }}>
                <th style={{ padding: '15px', color: colors.espresso }}>Folio</th>
                <th style={{ padding: '15px', color: colors.espresso }}>Fecha</th>
                <th style={{ padding: '15px', color: colors.espresso }}>Cliente</th>
                <th style={{ padding: '15px', color: colors.espresso }}>Canal</th>
                <th style={{ padding: '15px', color: colors.espresso }}>Total</th>
                <th style={{ padding: '15px', color: colors.espresso }}>Estado</th>
                <th style={{ padding: '15px', color: colors.espresso }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: colors.camel }}>No hay cotizaciones</td></tr>
              ) : (
                cotizaciones.map(c => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{c.folio}</td>
                    <td style={{ padding: '15px' }}>{new Date(c.fecha).toLocaleDateString()}</td>
                    <td style={{ padding: '15px' }}>{c.clientes?.nombre || c.cliente_nombre || 'N/A'}</td>
                    <td style={{ padding: '15px' }}>{c.tiers_precio?.nombre}</td>
                    <td style={{ padding: '15px', fontWeight: '600' }}>{formatCurrency(c.total)}</td>
                    <td style={{ padding: '15px' }}>
                      {c.venta_folio ? (
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: '#D5F5E3', color: '#27AE60' }}>
                          ✓ {c.venta_folio}
                        </span>
                      ) : (
                        <select
                          value={c.estado}
                          onChange={e => handleEstadoChange(c.id, e.target.value)}
                          style={{
                            ...estiloEstado(c.estado),
                            padding: '5px 10px', borderRadius: '20px', fontSize: '11px',
                            fontWeight: '600', border: 'none', cursor: 'pointer', textTransform: 'uppercase'
                          }}
                        >
                          {ESTADOS.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <button onClick={() => setSelectedCot(c)} title="Ver detalle" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>👁️</button>
                      {!c.venta_folio && !['rechazada', 'vencida'].includes(c.estado) && (
                        <button onClick={() => setEditarCot(c)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                      )}
                      {c.estado === 'aceptada' && !c.venta_folio && (
                        <button
                          onClick={() => handleConvertir(c)}
                          disabled={convirtiendo === c.id}
                          title="Convertir en venta"
                          style={{
                            background: colors.sage, color: 'white', border: 'none', borderRadius: '6px',
                            padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                            opacity: convirtiendo === c.id ? 0.6 : 1
                          }}
                        >
                          {convirtiendo === c.id ? '…' : '💰 Vender'}
                        </button>
                      )}
                      {!c.venta_folio && (
                        <button onClick={() => handleEliminar(c.id)} title="Eliminar" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {(showModal || editarCot) && (
        <CotizacionWizard
          cotizacionEditar={editarCot}
          onClose={() => { setShowModal(false); setEditarCot(null); }}
          onSuccess={() => { setShowModal(false); setEditarCot(null); fetchData(); }}
        />
      )}

      {selectedCot && (
        <CotizacionDetailModal
          cotizacion={selectedCot}
          onClose={() => setSelectedCot(null)}
        />
      )}

      {showTarifas && (
        <TarifasModal onClose={() => setShowTarifas(false)} />
      )}

      {convertirCot && (
        <ConvertirVentaModal
          cotizacion={convertirCot}
          onClose={() => setConvertirCot(null)}
          onConfirm={(opciones) => ejecutarConversion(convertirCot, opciones)}
        />
      )}

      {faltantesCot && (
        <ProducirFaltantesModal
          cotizacion={faltantesCot.cotizacion}
          faltantes={faltantesCot.faltantes}
          onClose={() => { setFaltantesCot(null); fetchData(); }}
        />
      )}
    </div>
  );
};

// --- PRODUCIR FALTANTES (puente cotización → producción) ---
// Cuando el Vender aborta por falta de stock terminado, este modal ofrece generar
// las órdenes de producción por el FALTANTE (una por variante). Solo se crean las
// que tienen materia prima; las que no, se listan con qué material comprar.

const ProducirFaltantesModal = ({ cotizacion, faltantes, onClose }) => {
  const [generando, setGenerando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const fmtNum = (n) => Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 });

  const generar = async () => {
    setGenerando(true);
    const { data, creadas, bloqueadas, error } = await generarOrdenesDesdeFaltantes(faltantes, cotizacion);
    setGenerando(false);
    if (error) { alert('Error: ' + error.message); return; }
    setResultados({ data, creadas, bloqueadas });
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '560px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: colors.espresso }}>🏭 Producir lo que falta</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: colors.camel, fontSize: '13px', marginTop: 0 }}>
          La cotización <b>{cotizacion.folio}</b> no tiene stock terminado suficiente. Puedes generar
          órdenes de producción por el faltante (una por variante). Solo se crean las que tengan
          materia prima disponible.
        </p>

        {!resultados ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '15px 0' }}>
              {faltantes.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: colors.cream, borderRadius: '8px' }}>
                  <span style={{ color: colors.espresso, fontSize: '13px' }}>{f.nombre}</span>
                  <span style={{ color: '#C0392B', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    faltan {f.faltan} pz
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '8px', background: 'white', border: `1px solid ${colors.sand}`, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={generar} disabled={generando} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', fontWeight: '600', cursor: 'pointer', opacity: generando ? 0.6 : 1 }}>
                {generando ? 'Generando…' : `Generar ${faltantes.length} orden(es)`}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ margin: '15px 0', padding: '12px', borderRadius: '8px', background: colors.cream, fontSize: '13px', color: colors.espresso }}>
              ✅ {resultados.creadas} orden(es) creada(s){resultados.bloqueadas > 0 ? ` · 🔴 ${resultados.bloqueadas} sin materia prima` : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {resultados.data.map((r, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${colors.sand}` }}>
                  <div style={{ fontWeight: '600', color: colors.espresso, fontSize: '13px', marginBottom: '4px' }}>
                    {r.faltante.nombre} · {r.faltante.faltan} pz
                  </div>
                  {r.status === 'creada' && (
                    <div style={{ color: '#27AE60', fontSize: '12px' }}>✓ Orden de producción creada (en proceso)</div>
                  )}
                  {r.status === 'sin_materia_prima' && (
                    <div style={{ color: '#C0392B', fontSize: '12px' }}>
                      🔴 Falta materia prima — comprar:
                      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                        {r.faltantesMP.map((m, j) => (
                          <li key={j}>{m.nombre}: faltan {fmtNum(m.faltan_mp)} {m.unidad} (hay {fmtNum(m.stock_disponible)}, se necesitan {fmtNum(m.cantidad_total)})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {r.status === 'error' && (
                    <div style={{ color: '#C0392B', fontSize: '12px' }}>⚠️ {r.mensaje}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', padding: '10px', background: '#FCF3CF', borderRadius: '8px', fontSize: '12px', color: '#7D6608' }}>
              Ve a <b>Producción</b> para completar las órdenes. Al completarlas sube el stock terminado y podrás <b>Vender</b> la cotización.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', fontWeight: '600', cursor: 'pointer' }}>Listo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- CONVERTIR A VENTA (elección de tipo de operación) ---
// El usuario elige cómo se registra la venta: directa pagada, directa pendiente o
// consignación. El tier (canal de precio) solo SUGIERE un default; no decide el tipo
// de pago (un mayoreo puede ser pagado o consignación).

const ConvertirVentaModal = ({ cotizacion, onClose, onConfirm }) => {
  const slug = cotizacion.tiers_precio?.slug;
  // Default sugerido: consignación si el tier es de consignación; si no, directa pagada.
  const [opcion, setOpcion] = useState(slug === 'consignacion' ? 'consignacion' : 'directa_pagada');

  const OPCIONES = [
    { id: 'directa_pagada',   titulo: '💵 Venta directa — pagada',          desc: 'Entra a caja como ingreso. El cliente paga ahora.', opciones: { tipo_operacion: 'directa', estado_pago: 'pagado' } },
    { id: 'directa_pendiente', titulo: '🧾 Venta directa — pendiente de pago', desc: 'Queda como deuda del cliente. No entra a caja todavía.', opciones: { tipo_operacion: 'directa', estado_pago: 'pendiente' } },
    { id: 'consignacion',     titulo: '📦 Consignación',                      desc: 'La mercancía va "en la calle". El vendedor paga al vender. No cobra al entregar.', opciones: { tipo_operacion: 'consignacion' } }
  ];

  const sel = OPCIONES.find(o => o.id === opcion);
  const canalNombre = cotizacion.tiers_precio?.nombre || '—';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '520px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: colors.espresso }}>💰 Convertir en venta</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: colors.camel, fontSize: '13px', marginTop: 0 }}>
          Cotización <b>{cotizacion.folio}</b> · canal <b>{canalNombre}</b>. Elige cómo se registra la venta
          (el canal define el precio, no el tipo de pago).
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '15px 0' }}>
          {OPCIONES.map(o => (
            <label key={o.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${opcion === o.id ? colors.sidebarBg : colors.sand}`, background: opcion === o.id ? colors.cream : 'white' }}>
              <input type="radio" name="tipoConv" checked={opcion === o.id} onChange={() => setOpcion(o.id)} style={{ marginTop: '3px' }} />
              <div>
                <div style={{ fontWeight: '600', color: colors.espresso, fontSize: '14px' }}>{o.titulo}</div>
                <div style={{ fontSize: '12px', color: colors.camel }}>{o.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {!cotizacion.cliente_id && (
          <div style={{ padding: '10px', background: '#FCF3CF', borderRadius: '8px', fontSize: '12px', color: '#7D6608', marginBottom: '10px' }}>
            El cliente "{cotizacion.cliente_nombre}" no está registrado: se dará de alta automáticamente.
          </div>
        )}
        <div style={{ fontSize: '12px', color: colors.camel, marginBottom: '16px' }}>
          Se descontará stock del taller. Si falta stock, se te ofrecerá producir lo faltante.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: '8px', background: 'white', border: `1px solid ${colors.sand}`, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onConfirm(sel.opciones)} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', fontWeight: '600', cursor: 'pointer' }}>
            Convertir
          </button>
        </div>
      </div>
    </div>
  );
};

// --- TARIFAS / CANALES (editor de multiplicadores) ---

const TarifasModal = ({ onClose }) => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getTiersPrecio();
      if (res.data) setTiers(res.data);
      setLoading(false);
    };
    load();
  }, []);

  const setMult = (id, value) => {
    setTiers(prev => prev.map(t => (t.id === id ? { ...t, multiplicador: value } : t)));
  };

  const guardar = async (tier) => {
    setGuardando(tier.id);
    const { error } = await actualizarTierPrecio(tier.id, { multiplicador: tier.multiplicador });
    setGuardando(null);
    if (error) alert('Error: ' + error.message);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: colors.espresso }}>⚙️ Canales y Tarifas</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ color: colors.camel, fontSize: '13px', marginTop: 0 }}>
          El precio sugerido al cotizar = costo de producción × multiplicador del canal.
        </p>

        {loading ? <p>Cargando...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
            {tiers.map(t => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px', gap: '12px', alignItems: 'center', padding: '12px', background: colors.cream, borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: colors.espresso }}>{t.nombre}</div>
                  <div style={{ fontSize: '11px', color: colors.camel }}>{t.slug}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number" step="0.05" min="0.05"
                    value={t.multiplicador}
                    onChange={e => setMult(t.id, e.target.value)}
                    style={{ width: '70px', padding: '8px', borderRadius: '8px', border: `1px solid ${colors.sand}` }}
                  />
                  <span style={{ color: colors.camel }}>×</span>
                </div>
                <button
                  onClick={() => guardar(t)}
                  disabled={guardando === t.id}
                  style={{ padding: '8px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', cursor: 'pointer', fontWeight: '600', opacity: guardando === t.id ? 0.6 : 1 }}
                >
                  {guardando === t.id ? '…' : 'Guardar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- DETAIL COMPONENT ---

const CotizacionDetailModal = ({ cotizacion, onClose }) => {
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetalle = async () => {
      setLoading(true);
      const res = await getCotizacionDetalle(cotizacion.id);
      if (res.data) setDetalle(res.data);
      setLoading(false);
    };
    loadDetalle();
  }, [cotizacion.id]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    
    // Memberte / Header
    doc.setFillColor(colors.sidebarBg);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('BLANCOS SINAÍ', 15, 20);
    doc.setFontSize(10);
    doc.text('COTIZACIÓN PROFESIONAL - Yolotl Gestora', 15, 30);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`FOLIO: ${cotizacion.folio}`, 195, 25, { align: 'right' });
    doc.text(`FECHA: ${new Date(cotizacion.fecha).toLocaleDateString()}`, 195, 32, { align: 'right' });

    // Datos del Cliente
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nombre: ${cotizacion.clientes?.nombre || cotizacion.cliente_nombre}`, 15, 62);
    doc.text(`Vigencia: ${cotizacion.vigencia_dias} días naturales`, 15, 69);
    doc.text(`Canal de Venta: ${cotizacion.tiers_precio?.nombre}`, 15, 76);

    // Tabla de productos
    const tableData = detalle.map(it => [
      it.descripcion,
      it.cantidad,
      formatCurrency(it.precio_unitario),
      formatCurrency(it.subtotal)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Producto / Servicio', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      headStyles: { fillColor: colors.sidebarBg },
      foot: [[
        { content: 'TOTAL:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: formatCurrency(cotizacion.total), styles: { fontStyle: 'bold' } }
      ]],
      theme: 'grid'
    });

    // Notas
    const finalY = doc.lastAutoTable.finalY + 15;
    if (cotizacion.notas) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES:', 15, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const splitNotas = doc.splitTextToSize(cotizacion.notas, 180);
      doc.text(splitNotas, 15, finalY + 7);
    }

    doc.save(`cotizacion-${cotizacion.folio}.pdf`);
  };

  const shareWhatsApp = () => {
    const text = `Hola, te comparto la cotización ${cotizacion.folio} por un total de ${formatCurrency(cotizacion.total)}. En un momento te adjunto el PDF detallado.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareEmail = () => {
    const subject = `Cotización ${cotizacion.folio} - Blancos Sinaí`;
    const body = `Estimado cliente, adjunto enviamos la propuesta solicitada por un total de ${formatCurrency(cotizacion.total)}. Quedamos a sus órdenes para cualquier duda.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Detalle de Cotización: {cotizacion.folio}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ background: colors.cream, padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '11px', color: colors.camel }}>Cliente</div>
              <div style={{ fontWeight: '600' }}>{cotizacion.clientes?.nombre || cotizacion.cliente_nombre}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: colors.camel }}>Fecha</div>
              <div style={{ fontWeight: '600' }}>{new Date(cotizacion.fecha).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: colors.camel }}>Estado</div>
              <div style={{ fontWeight: '600', textTransform: 'uppercase' }}>{cotizacion.estado}</div>
            </div>
          </div>
        </div>

        {loading ? <p>Cargando detalle...</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `1px solid ${colors.sand}` }}>
                <th style={{ padding: '10px 0' }}>Producto</th>
                <th>Cant</th>
                <th>Precio</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {detalle.map(it => (
                <tr key={it.id} style={{ borderBottom: `1px solid ${colors.sand}` }}>
                  <td style={{ padding: '10px 0' }}>{it.descripcion}</td>
                  <td>{it.cantidad}</td>
                  <td>{formatCurrency(it.precio_unitario)}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" style={{ textAlign: 'right', padding: '15px 0', fontWeight: 'bold' }}>TOTAL:</td>
                <td style={{ textAlign: 'right', padding: '15px 0', fontWeight: 'bold', fontSize: '18px' }}>{formatCurrency(cotizacion.total)}</td>
              </tr>
            </tfoot>
          </table>
        )}

        {cotizacion.notas && (
          <div style={{ marginBottom: '25px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', borderLeft: `4px solid ${colors.sand}` }}>
            <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '5px' }}>Notas Comerciales</div>
            <div style={{ fontSize: '13px', fontStyle: 'italic' }}>{cotizacion.notas}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', borderTop: `1px solid ${colors.sand}`, paddingTop: '20px' }}>
          <button onClick={generarPDF} style={{ padding: '10px 20px', borderRadius: '8px', background: colors.sidebarBg, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>📄 Descargar PDF</button>
          <button onClick={shareWhatsApp} style={{ padding: '10px 20px', borderRadius: '8px', background: '#25D366', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>💬 WhatsApp</button>
          <button onClick={shareEmail} style={{ padding: '10px 20px', borderRadius: '8px', background: '#E67E22', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✉️ Email</button>
        </div>
      </div>
    </div>
  );
};

// --- WIZARD COMPONENT ---

const CotizacionWizard = ({ onClose, onSuccess, cotizacionEditar = null }) => {
  const esEdicion = !!cotizacionEditar;
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  // Form State
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [tierId, setTierId] = useState('');
  const [notas, setNotas] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadWizardData = async () => {
      const [tRes, cRes, pRes] = await Promise.all([
        getTiersPrecio(),
        getClientes(),
        getProductos()
      ]);
      if (tRes.data) setTiers(tRes.data);
      if (cRes.data) setClientes(cRes.data);
      if (pRes.data) setProductos(pRes.data.filter(p => p.es_manufacturado));
    };
    loadWizardData();
  }, []);

  // Modo edición: precargar cabecera + líneas de la cotización existente.
  useEffect(() => {
    if (!cotizacionEditar) return;
    setClienteId(cotizacionEditar.cliente_id ? String(cotizacionEditar.cliente_id) : '');
    setClienteNombre(cotizacionEditar.cliente_id ? '' : (cotizacionEditar.cliente_nombre || ''));
    setTierId(cotizacionEditar.tier_id || '');
    setNotas(cotizacionEditar.notas || '');
    const cargarDetalle = async () => {
      const { data } = await getCotizacionDetalle(cotizacionEditar.id);
      if (data) setItems(data.map(d => ({
        producto_id: d.producto_id != null ? String(d.producto_id) : '',
        variante_id: d.variante_id != null ? String(d.variante_id) : '',
        cantidad: d.cantidad,
        costo_snapshot: d.costo_snapshot,
        tier_multiplicador: d.tier_multiplicador,
        precio_unitario: d.precio_unitario,
        descripcion: d.descripcion || ''
      })));
    };
    cargarDetalle();
  }, [cotizacionEditar]);

  const selectedTier = tiers.find(t => t.id === tierId);

  const addItem = () => {
    setItems([...items, { producto_id: '', variante_id: '', cantidad: 1, costo_snapshot: 0, tier_multiplicador: selectedTier?.multiplicador || 1, precio_unitario: 0, descripcion: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];
    item[field] = value;

    if (field === 'producto_id') {
      const prod = productos.find(p => p.id === parseInt(value));
      item.descripcion = prod?.linea_nombre || '';
      item.variante_id = '';
      item.costo_snapshot = prod?.costo_desde || 0;
      item.precio_unitario = calcularPrecioSugerido(item.costo_snapshot, item.tier_multiplicador);
    }

    if (field === 'variante_id') {
      const prod = productos.find(p => p.id === parseInt(item.producto_id));
      const v = prod?.variantes?.find(v => v.id === parseInt(value));
      if (v) {
        const costoVar = prod.costo_calculado_por_variante?.[v.id]?.costo_total || v.costo_unitario || 0;
        item.costo_snapshot = costoVar;
        item.precio_unitario = calcularPrecioSugerido(costoVar, item.tier_multiplicador);
        item.descripcion = `${prod.linea_nombre} (${[v.material, v.color, v.talla].filter(Boolean).join(' - ')})`;
      }
    }

    setItems(newItems);
  };

  const total = items.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0);

  const handleGuardar = async () => {
    if (!tierId || items.length === 0) return alert('Datos incompletos');
    
    setLoading(true);
    const cabecera = {
      cliente_id: clienteId || null,
      cliente_nombre: clienteId ? clientes.find(c => c.id === parseInt(clienteId))?.nombre : clienteNombre,
      tier_id: tierId,
      notas,
      total
    };
    
    const { error } = esEdicion
      ? await actualizarCotizacionCompleta(cotizacionEditar.id, cabecera, items)
      : await crearCotizacionCompleta(cabecera, items);
    setLoading(false);
    if (!error) onSuccess();
    else alert('Error: ' + error.message);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '15px', 
        width: '95%', 
        maxWidth: '1050px', 
        maxHeight: '90vh', 
        overflowY: 'auto', 
        padding: '30px', 
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${colors.sand}`, paddingBottom: '15px' }}>
          <h3 style={{ margin: 0, color: colors.espresso }}>{esEdicion ? `Editar ${cotizacionEditar.folio}` : 'Nueva Cotización'} - Paso {paso}/3</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {paso === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '6px' }}>Cliente Registrado</label>
                <select 
                  value={clienteId} 
                  onChange={e => { setClienteId(e.target.value); setClienteNombre(''); }} 
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    border: `1px solid ${colors.sand}`,
                    height: '40px',
                    fontSize: '14px',
                    color: colors.espresso,
                    background: 'white'
                  }}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '6px' }}>O Cliente Nuevo (Nombre)</label>
                <input 
                  value={clienteNombre} 
                  onChange={e => { setClienteNombre(e.target.value); setClienteId(''); }} 
                  placeholder="Nombre del cliente" 
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    padding: '8px 12px', 
                    borderRadius: '8px', 
                    border: `1px solid ${colors.sand}`,
                    height: '40px',
                    fontSize: '14px',
                    color: colors.espresso,
                    background: 'white'
                  }} 
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: colors.camel, display: 'block', marginBottom: '8px' }}>Canal de Venta (Tier)</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {tiers.map(t => (
                  <button key={t.id} onClick={() => setTierId(t.id)} style={{
                    padding: '10px 20px', borderRadius: '25px', border: `1px solid ${tierId === t.id ? colors.sidebarBg : colors.sand}`,
                    background: tierId === t.id ? colors.sidebarBg : 'white', color: tierId === t.id ? 'white' : colors.espresso,
                    cursor: 'pointer', transition: '0.2s'
                  }}>
                    {t.nombre} ({t.multiplicador}x)
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setPaso(2)} disabled={!tierId || (!clienteId && !clienteNombre)} style={{ padding: '12px 30px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: (!tierId || (!clienteId && !clienteNombre)) ? 0.5 : 1 }}>Siguiente</button>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: colors.espresso }}>Productos a Cotizar ({selectedTier?.nombre})</h4>
              <button 
                onClick={addItem} 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  background: colors.sage, 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                + Agregar Producto
              </button>
            </div>

            {items.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2.5fr 2.5fr 0.8fr 1.5fr 0.3fr', 
                gap: '12px', 
                padding: '0 15px 8px 15px', 
                borderBottom: `1px solid ${colors.sand}`,
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: colors.camel }}>Producto</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: colors.camel }}>Variante</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: colors.camel }}>Cant.</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: colors.camel }}>Precio Unitario</div>
                <div></div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, idx) => {
                const prod = productos.find(p => p.id === parseInt(item.producto_id));
                const floor = item.costo_snapshot;
                const isUnderFloor = item.precio_unitario < floor;
                return (
                  <div key={idx} style={{ background: colors.cotton, padding: '15px', borderRadius: '10px', border: `1px solid ${isUnderFloor ? '#E74C3C' : colors.sand}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 2.5fr 0.8fr 1.5fr 0.3fr', gap: '12px', alignItems: 'start' }}>
                      <select 
                        value={item.producto_id} 
                        onChange={e => updateItem(idx, 'producto_id', e.target.value)} 
                        style={{ 
                          width: '100%', 
                          minWidth: 0, 
                          boxSizing: 'border-box', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          border: `1px solid ${colors.sand}`,
                          height: '38px',
                          fontSize: '13px',
                          color: colors.espresso,
                          background: 'white'
                        }}
                      >
                        <option value="">Producto...</option>
                        {productos.map(p => <option key={p.id} value={p.id}>{p.linea_nombre}</option>)}
                      </select>

                      <select 
                        value={item.variante_id} 
                        onChange={e => updateItem(idx, 'variante_id', e.target.value)} 
                        disabled={!item.producto_id} 
                        style={{ 
                          width: '100%', 
                          minWidth: 0, 
                          boxSizing: 'border-box', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          border: `1px solid ${colors.sand}`,
                          height: '38px',
                          fontSize: '13px',
                          color: colors.espresso,
                          background: item.producto_id ? 'white' : '#f5f5f5'
                        }}
                      >
                        <option value="">Variante...</option>
                        {prod?.variantes?.map(v => <option key={v.id} value={v.id}>{[v.material, v.color, v.talla].filter(Boolean).join(' - ') || v.sku}</option>)}
                      </select>

                      <input 
                        type="number" 
                        value={item.cantidad} 
                        onChange={e => updateItem(idx, 'cantidad', parseFloat(e.target.value))} 
                        placeholder="Cant" 
                        style={{ 
                          width: '100%', 
                          minWidth: 0, 
                          boxSizing: 'border-box', 
                          padding: '6px 10px', 
                          borderRadius: '6px', 
                          border: `1px solid ${colors.sand}`,
                          height: '38px',
                          fontSize: '13px',
                          color: colors.espresso,
                          background: 'white'
                        }} 
                      />

                      <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
                        <input 
                          type="number" 
                          value={item.precio_unitario} 
                          onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value))} 
                          style={{ 
                            width: '100%', 
                            boxSizing: 'border-box', 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            border: isUnderFloor ? '2px solid #E74C3C' : `1px solid ${colors.sand}`,
                            height: '38px',
                            fontSize: '13px',
                            color: colors.espresso,
                            background: 'white'
                          }} 
                        />
                        <div style={{ fontSize: '10px', color: colors.camel, marginTop: '3px', lineHeight: '1.2' }}>
                          Sugerido: {formatCurrency(calcularPrecioSugerido(item.costo_snapshot, item.tier_multiplicador))}
                        </div>
                        {isUnderFloor && (
                          <div style={{ fontSize: '9px', color: '#E74C3C', fontWeight: 'bold', marginTop: '2px', lineHeight: '1.2' }}>
                            BAJO COSTO (Min: {formatCurrency(floor)})
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => setItems(items.filter((_, i) => i !== idx))} 
                        style={{ 
                          border: 'none', 
                          background: 'none', 
                          color: '#E74C3C', 
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '38px',
                          padding: 0
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <label style={{ fontSize: '11px', color: colors.camel, display: 'block', marginBottom: '3px' }}>
                        Descripción (editable — aparece en la cotización y el PDF)
                      </label>
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                        placeholder="Describe el producto o variante a tu manera…"
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${colors.sand}`,
                          height: '38px',
                          fontSize: '13px',
                          color: colors.espresso,
                          background: 'white'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: `1px solid ${colors.sand}`, paddingTop: '20px' }}>
              <button onClick={() => setPaso(1)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'white', border: `1px solid ${colors.sand}` }}>Atrás</button>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: colors.camel }}>Total Estimado</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.espresso }}>{formatCurrency(total)}</div>
              </div>
              <button onClick={() => setPaso(3)} disabled={items.length === 0} style={{ padding: '12px 30px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Revisar Cotización</button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div>
            <div style={{ background: colors.cream, padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h4 style={{ marginTop: 0 }}>Resumen de Propuesta</h4>
              <p><strong>Cliente:</strong> {clienteId ? clientes.find(c => c.id === parseInt(clienteId))?.nombre : clienteNombre}</p>
              <p><strong>Canal:</strong> {selectedTier?.nombre}</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: `1px solid ${colors.sand}` }}>
                    <th>Producto</th>
                    <th>Cant</th>
                    <th>Precio</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.sand}` }}>
                      <td style={{ padding: '8px 0' }}>{it.descripcion}</td>
                      <td>{it.cantidad}</td>
                      <td>{formatCurrency(it.precio_unitario)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(it.cantidad * it.precio_unitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: '15px', fontSize: '20px', fontWeight: 'bold' }}>Total: {formatCurrency(total)}</div>
            </div>
            <textarea 
              value={notas} 
              onChange={e => setNotas(e.target.value)} 
              placeholder="Condiciones, tiempo de entrega, etc." 
              style={{ 
                width: '100%', 
                boxSizing: 'border-box', 
                padding: '12px', 
                borderRadius: '8px', 
                border: `1px solid ${colors.sand}`, 
                minHeight: '100px',
                fontSize: '14px',
                color: colors.espresso,
                fontFamily: 'inherit'
              }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={() => setPaso(2)} style={{ padding: '10px 20px', borderRadius: '8px', background: 'white', border: `1px solid ${colors.sand}` }}>Atrás</button>
              <button onClick={handleGuardar} disabled={loading} style={{ padding: '12px 40px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                {loading ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CotizacionesView;

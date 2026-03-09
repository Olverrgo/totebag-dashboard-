import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';
import { formatearMoneda } from '../utils/formatearMoneda';
import {
  getMateriales,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getProductos,
  getVariantes,
  getRecetasProducto,
  upsertRecetaLinea,
  deleteRecetaLinea,
  getOrdenesProduccion,
  createOrdenProduccion,
  updateOrdenProduccion,
  createMaterialesUsados,
  completarOrdenProduccion,
  registrarCompraMaterial,
} from '../supabaseClient';

const ProduccionView = ({ isAdmin }) => {
  const [tabActivo, setTabActivo] = useState('materiales');
  const [materiales, setMateriales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);

  // --- Materiales state ---
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [mostrarFormMaterial, setMostrarFormMaterial] = useState(false);
  const [editandoMaterial, setEditandoMaterial] = useState(null);
  const [formMaterial, setFormMaterial] = useState({
    nombre: '', descripcion: '', unidad: 'metros', stock: '', stock_minimo: '',
    costo_unitario: '', categoria: 'tela', proveedor: '', notas: ''
  });
  const [mostrarCompra, setMostrarCompra] = useState(null);
  const [formCompra, setFormCompra] = useState({ cantidad: '', costoTotal: '', metodoPago: 'efectivo' });

  // --- Recetas state ---
  const [productoReceta, setProductoReceta] = useState('');
  const [recetaLineas, setRecetaLineas] = useState([]);
  const [mostrarFormReceta, setMostrarFormReceta] = useState(false);
  const [formReceta, setFormReceta] = useState({ material_id: '', cantidad: '', notas: '' });

  // --- Producción state ---
  const [mostrarWizard, setMostrarWizard] = useState(false);
  const [pasoWizard, setPasoWizard] = useState(1);
  const [formOrden, setFormOrden] = useState({ producto_id: '', variante_id: '', cantidad: '' });
  const [materialesOrden, setMaterialesOrden] = useState([]);
  const [variantesProducto, setVariantesProducto] = useState([]);
  const [mostrarCompletar, setMostrarCompletar] = useState(null);

  const categoriasM = ['todas', 'tela', 'cierre', 'hilo', 'etiqueta', 'empaque', 'otro'];
  const unidades = ['metros', 'piezas', 'kilos', 'rollos', 'litros', 'conos'];
  const inputBase = { width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', color: colors.espresso, background: '#fff' };
  const selectBase = { width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: colors.espresso, background: '#fff' };
  const optStyle = { color: '#333', background: '#fff' };
  const tabs = [
    { id: 'materiales', nombre: 'Materiales', icon: '🧶' },
    { id: 'recetas', nombre: 'Recetas', icon: '📋' },
    { id: 'producir', nombre: 'Producir', icon: '⚙️' }
  ];


  const cargarDatos = async () => {
    setCargando(true);
    const [matRes, prodRes, ordRes] = await Promise.all([
      getMateriales(filtroCategoria !== 'todas' ? filtroCategoria : null),
      getProductos(),
      getOrdenesProduccion()
    ]);
    setMateriales(matRes.data || []);
    setProductos(prodRes.data || []);
    setOrdenes(ordRes.data || []);
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, [filtroCategoria]);

  const mostrarMsg = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  // ---- MATERIALES handlers ----
  const resetFormMaterial = () => {
    setFormMaterial({ nombre: '', descripcion: '', unidad: 'metros', stock: '', stock_minimo: '', costo_unitario: '', categoria: 'tela', proveedor: '', notas: '' });
    setEditandoMaterial(null);
  };

  const handleGuardarMaterial = async () => {
    if (!formMaterial.nombre.trim()) { mostrarMsg('error', 'Ingresa el nombre del material'); return; }
    setGuardando(true);
    try {
      const datos = {
        nombre: formMaterial.nombre.trim(),
        descripcion: formMaterial.descripcion.trim() || null,
        unidad: formMaterial.unidad,
        stock: parseFloat(formMaterial.stock) || 0,
        stock_minimo: parseFloat(formMaterial.stock_minimo) || 0,
        costo_unitario: parseFloat(formMaterial.costo_unitario) || 0,
        categoria: formMaterial.categoria,
        proveedor: formMaterial.proveedor.trim() || null,
        notas: formMaterial.notas.trim() || null
      };
      let res;
      if (editandoMaterial) {
        res = await updateMaterial(editandoMaterial.id, datos);
      } else {
        res = await createMaterial(datos);
      }
      if (res.error) { mostrarMsg('error', res.error.message || 'Error al guardar'); }
      else { mostrarMsg('ok', editandoMaterial ? 'Material actualizado' : 'Material creado'); resetFormMaterial(); setMostrarFormMaterial(false); cargarDatos(); }
    } catch (e) { mostrarMsg('error', e.message); }
    setGuardando(false);
  };

  const handleEditarMaterial = (m) => {
    setFormMaterial({
      nombre: m.nombre, descripcion: m.descripcion || '', unidad: m.unidad,
      stock: m.stock, stock_minimo: m.stock_minimo, costo_unitario: m.costo_unitario,
      categoria: m.categoria, proveedor: m.proveedor || '', notas: m.notas || ''
    });
    setEditandoMaterial(m);
    setMostrarFormMaterial(true);
  };

  const handleEliminarMaterial = async (id) => {
    if (!window.confirm('¿Eliminar este material?')) return;
    const res = await deleteMaterial(id);
    if (res.error) mostrarMsg('error', res.error.message || 'Error');
    else { mostrarMsg('ok', 'Material eliminado'); cargarDatos(); }
  };

  const handleComprar = async () => {
    if (!formCompra.cantidad || parseFloat(formCompra.cantidad) <= 0) { mostrarMsg('error', 'Ingresa cantidad válida'); return; }
    if (!formCompra.costoTotal || parseFloat(formCompra.costoTotal) <= 0) { mostrarMsg('error', 'Ingresa costo total válido'); return; }
    setGuardando(true);
    try {
      const res = await registrarCompraMaterial({
        materialId: mostrarCompra.id,
        cantidad: parseFloat(formCompra.cantidad),
        costoTotal: parseFloat(formCompra.costoTotal),
        metodoPago: formCompra.metodoPago
      });
      if (res.error) mostrarMsg('error', res.error.message || 'Error al comprar');
      else { mostrarMsg('ok', 'Compra registrada'); setMostrarCompra(null); setFormCompra({ cantidad: '', costoTotal: '', metodoPago: 'efectivo' }); cargarDatos(); }
    } catch (e) { mostrarMsg('error', e.message); }
    setGuardando(false);
  };

  // ---- RECETAS handlers ----
  const cargarReceta = async (prodId) => {
    setProductoReceta(prodId);
    if (!prodId) { setRecetaLineas([]); return; }
    const res = await getRecetasProducto(prodId);
    setRecetaLineas(res.data || []);
  };

  const handleGuardarRecetaLinea = async () => {
    if (!formReceta.material_id || !formReceta.cantidad) { mostrarMsg('error', 'Selecciona material y cantidad'); return; }
    setGuardando(true);
    try {
      const res = await upsertRecetaLinea({
        producto_id: productoReceta,
        material_id: formReceta.material_id,
        cantidad: parseFloat(formReceta.cantidad),
        notas: formReceta.notas || null
      });
      if (res.error) mostrarMsg('error', res.error.message || 'Error');
      else { mostrarMsg('ok', 'Línea guardada'); setFormReceta({ material_id: '', cantidad: '', notas: '' }); setMostrarFormReceta(false); cargarReceta(productoReceta); }
    } catch (e) { mostrarMsg('error', e.message); }
    setGuardando(false);
  };

  const handleEliminarRecetaLinea = async (id) => {
    if (!window.confirm('¿Eliminar esta línea de receta?')) return;
    const res = await deleteRecetaLinea(id);
    if (res.error) mostrarMsg('error', res.error.message || 'Error');
    else { mostrarMsg('ok', 'Línea eliminada'); cargarReceta(productoReceta); }
  };

  // ---- PRODUCCIÓN handlers ----
  const iniciarWizard = () => {
    setFormOrden({ producto_id: '', variante_id: '', cantidad: '' });
    setMaterialesOrden([]);
    setVariantesProducto([]);
    setPasoWizard(1);
    setMostrarWizard(true);
  };

  const handleSeleccionarProductoOrden = async (prodId) => {
    setFormOrden(prev => ({ ...prev, producto_id: prodId, variante_id: '' }));
    if (!prodId) { setVariantesProducto([]); return; }
    const prod = productos.find(p => p.id === prodId);
    if (prod?.tiene_variantes) {
      const varRes = await getVariantes(prodId);
      setVariantesProducto(varRes.data || []);
    } else {
      setVariantesProducto([]);
    }
  };

  const cargarRecetaParaOrden = async () => {
    if (!formOrden.producto_id) return;
    const res = await getRecetasProducto(formOrden.producto_id);
    const lineas = (res.data || []).map(r => ({
      material_id: r.material_id,
      nombre: r.material?.nombre || '',
      unidad: r.material?.unidad || '',
      cantidad_por_pieza: parseFloat(r.cantidad) || 0,
      cantidad_total: (parseFloat(r.cantidad) || 0) * (parseInt(formOrden.cantidad) || 0),
      costo_unitario: parseFloat(r.material?.costo_unitario) || 0,
      stock_disponible: parseFloat(r.material?.stock) || 0
    }));
    setMaterialesOrden(lineas);
    setPasoWizard(2);
  };

  const handleCrearOrden = async () => {
    if (!formOrden.producto_id || !formOrden.cantidad || parseInt(formOrden.cantidad) <= 0) {
      mostrarMsg('error', 'Selecciona producto y cantidad'); return;
    }
    setGuardando(true);
    try {
      const ordenData = {
        producto_id: formOrden.producto_id,
        variante_id: formOrden.variante_id || null,
        cantidad: parseInt(formOrden.cantidad),
        estado: 'en_proceso'
      };
      const resOrden = await createOrdenProduccion(ordenData);
      if (resOrden.error) { mostrarMsg('error', resOrden.error.message || 'Error al crear orden'); setGuardando(false); return; }

      const lineasMU = materialesOrden.map(m => ({
        orden_id: resOrden.data.id,
        material_id: m.material_id,
        cantidad_planeada: m.cantidad_total,
        costo_unitario: m.costo_unitario,
        costo_total: m.cantidad_total * m.costo_unitario
      }));

      if (lineasMU.length > 0) {
        const resMU = await createMaterialesUsados(lineasMU);
        if (resMU.error) { mostrarMsg('error', resMU.error.message || 'Error al registrar materiales'); setGuardando(false); return; }
      }

      mostrarMsg('ok', 'Orden de producción creada');
      setMostrarWizard(false);
      cargarDatos();
    } catch (e) { mostrarMsg('error', e.message); }
    setGuardando(false);
  };

  const handleCompletarOrden = async (ordenId) => {
    if (!window.confirm('¿Completar esta orden? Se descontará material y se sumará stock al producto.')) return;
    setGuardando(true);
    try {
      const res = await completarOrdenProduccion(ordenId);
      if (res.error) mostrarMsg('error', res.error.message || res.error || 'Error al completar');
      else { mostrarMsg('ok', 'Orden completada exitosamente'); setMostrarCompletar(null); cargarDatos(); }
    } catch (e) { mostrarMsg('error', e.message); }
    setGuardando(false);
  };

  const handleCancelarOrden = async (ordenId) => {
    if (!window.confirm('¿Cancelar esta orden?')) return;
    const res = await updateOrdenProduccion(ordenId, { estado: 'cancelada' });
    if (res.error) mostrarMsg('error', res.error.message || 'Error');
    else { mostrarMsg('ok', 'Orden cancelada'); cargarDatos(); }
  };

  // ---- Resumen stats ----
  const valorTotalMat = materiales.reduce((acc, m) => acc + (parseFloat(m.stock) || 0) * (parseFloat(m.costo_unitario) || 0), 0);
  const alertasBajas = materiales.filter(m => m.stock_minimo > 0 && m.stock <= m.stock_minimo).length;

  const badgeEstado = (estado) => {
    const colores = { borrador: '#999', en_proceso: colors.sidebarBg, completada: colors.olive, cancelada: colors.terracotta };
    const labels = { borrador: 'Borrador', en_proceso: 'En proceso', completada: 'Completada', cancelada: 'Cancelada' };
    return <span style={{ background: colores[estado] || '#999', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{labels[estado] || estado}</span>;
  };

  // ==================== RENDER ====================
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: colors.espresso, fontWeight: '600', margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '28px' }}>
          Producción
        </h2>
      </div>

      {/* Mensaje */}
      {mensaje.texto && (
        <div style={{ padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', background: mensaje.tipo === 'ok' ? '#e8f5e9' : '#fce4ec', color: mensaje.tipo === 'ok' ? '#2e7d32' : '#c62828', fontSize: '14px' }}>
          {mensaje.texto}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: colors.sand, borderRadius: '10px', padding: '4px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTabActivo(t.id)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
            background: tabActivo === t.id ? colors.sidebarBg : 'transparent',
            color: tabActivo === t.id ? '#fff' : colors.espresso,
            fontWeight: tabActivo === t.id ? '700' : '400', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.2s'
          }}>
            {t.icon} {t.nombre}
          </button>
        ))}
      </div>

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '50px', color: colors.camel }}>Cargando...</div>
      ) : (
        <>
          {/* ========== TAB MATERIALES ========== */}
          {tabActivo === 'materiales' && (
            <div>
              {/* Resumen cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: colors.cotton, borderRadius: '10px', padding: '16px', textAlign: 'center', border: `1px solid ${colors.sand}` }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Total materiales</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.sidebarBg }}>{materiales.length}</div>
                </div>
                <div style={{ background: colors.cotton, borderRadius: '10px', padding: '16px', textAlign: 'center', border: `1px solid ${colors.sand}` }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Valor total</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.sidebarBg }}>{formatearMoneda(valorTotalMat)}</div>
                </div>
                <div style={{ background: alertasBajas > 0 ? '#fce4ec' : colors.cotton, borderRadius: '10px', padding: '16px', textAlign: 'center', border: `1px solid ${alertasBajas > 0 ? '#ef9a9a' : colors.sand}` }}>
                  <div style={{ fontSize: '11px', color: alertasBajas > 0 ? '#c62828' : colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Stock bajo</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: alertasBajas > 0 ? '#c62828' : colors.olive }}>{alertasBajas}</div>
                </div>
              </div>

              {/* Filtro + botón */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categoriasM.map(c => (
                    <button key={c} onClick={() => setFiltroCategoria(c)} style={{
                      padding: '6px 14px', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px',
                      background: filtroCategoria === c ? colors.sidebarBg : colors.sand,
                      color: filtroCategoria === c ? '#fff' : colors.espresso, fontFamily: 'inherit'
                    }}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
                <button onClick={() => { resetFormMaterial(); setMostrarFormMaterial(true); }} style={{
                  padding: '8px 20px', background: colors.sidebarBg, color: '#fff', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: 'inherit'
                }}>
                  + Nuevo Material
                </button>
              </div>

              {/* Tabla materiales */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: colors.sand }}>
                      {['Nombre', 'Categoría', 'Unidad', 'Stock', 'Mínimo', 'Costo/u', 'Valor', 'Proveedor', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '10px 8px', textAlign: 'left', color: colors.espresso, fontWeight: '600', borderBottom: `2px solid ${colors.camel}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materiales.map(m => {
                      const alerta = m.stock_minimo > 0 && m.stock <= m.stock_minimo;
                      return (
                        <tr key={m.id} style={{ borderBottom: `1px solid ${colors.sand}`, background: alerta ? '#fff3e0' : 'transparent' }}>
                          <td style={{ padding: '10px 8px', fontWeight: '600' }}>{m.nombre}</td>
                          <td style={{ padding: '10px 8px' }}><span style={{ background: colors.sand, padding: '2px 8px', borderRadius: '10px', fontSize: '11px' }}>{m.categoria}</span></td>
                          <td style={{ padding: '10px 8px' }}>{m.unidad}</td>
                          <td style={{ padding: '10px 8px', fontWeight: '600', color: alerta ? '#c62828' : colors.espresso }}>
                            {parseFloat(m.stock).toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                            {alerta && <span style={{ marginLeft: '6px', fontSize: '14px' }} title="Stock bajo">⚠️</span>}
                          </td>
                          <td style={{ padding: '10px 8px', color: colors.camel }}>{m.stock_minimo}</td>
                          <td style={{ padding: '10px 8px' }}>{formatearMoneda(m.costo_unitario)}</td>
                          <td style={{ padding: '10px 8px', fontWeight: '600' }}>{formatearMoneda((parseFloat(m.stock) || 0) * (parseFloat(m.costo_unitario) || 0))}</td>
                          <td style={{ padding: '10px 8px', color: colors.camel, fontSize: '12px' }}>{m.proveedor || '-'}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => { setMostrarCompra(m); setFormCompra({ cantidad: '', costoTotal: '', metodoPago: 'efectivo' }); }} style={{
                                padding: '4px 10px', background: colors.olive, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit'
                              }}>Comprar</button>
                              <button onClick={() => handleEditarMaterial(m)} style={{
                                padding: '4px 10px', background: colors.camel, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit'
                              }}>Editar</button>
                              {isAdmin && (
                                <button onClick={() => handleEliminarMaterial(m.id)} style={{
                                  padding: '4px 10px', background: colors.terracotta, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit'
                                }}>X</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {materiales.length === 0 && (
                      <tr><td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: colors.camel }}>No hay materiales registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Formulario Material */}
              {mostrarFormMaterial && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 20px', color: colors.espresso }}>{editandoMaterial ? 'Editar Material' : 'Nuevo Material'}</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Nombre *</label>
                        <input value={formMaterial.nombre} onChange={e => setFormMaterial(p => ({ ...p, nombre: e.target.value }))} style={inputBase} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Categoría</label>
                          <select value={formMaterial.categoria} onChange={e => setFormMaterial(p => ({ ...p, categoria: e.target.value }))} style={selectBase}>
                            {['tela', 'cierre', 'hilo', 'etiqueta', 'empaque', 'otro'].map(c => <option key={c} value={c} style={optStyle}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Unidad</label>
                          <select value={formMaterial.unidad} onChange={e => setFormMaterial(p => ({ ...p, unidad: e.target.value }))} style={selectBase}>
                            {unidades.map(u => <option key={u} value={u} style={optStyle}>{u}</option>)}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Stock inicial</label>
                          <input type="number" value={formMaterial.stock} onChange={e => setFormMaterial(p => ({ ...p, stock: e.target.value }))} style={inputBase} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Stock mínimo</label>
                          <input type="number" value={formMaterial.stock_minimo} onChange={e => setFormMaterial(p => ({ ...p, stock_minimo: e.target.value }))} style={inputBase} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Costo/unidad</label>
                          <input type="number" step="0.01" value={formMaterial.costo_unitario} onChange={e => setFormMaterial(p => ({ ...p, costo_unitario: e.target.value }))} style={inputBase} />
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Proveedor</label>
                        <input value={formMaterial.proveedor} onChange={e => setFormMaterial(p => ({ ...p, proveedor: e.target.value }))} style={inputBase} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Notas</label>
                        <textarea value={formMaterial.notas} onChange={e => setFormMaterial(p => ({ ...p, notas: e.target.value }))} rows={2} style={{ ...inputBase, resize: 'vertical' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setMostrarFormMaterial(false); resetFormMaterial(); }} style={{ padding: '8px 20px', background: colors.sand, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                      <button onClick={handleGuardarMaterial} disabled={guardando} style={{ padding: '8px 20px', background: colors.sidebarBg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', opacity: guardando ? 0.6 : 1 }}>
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Compra */}
              {mostrarCompra && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}>
                    <h3 style={{ margin: '0 0 16px', color: colors.espresso }}>Comprar: {mostrarCompra.nombre}</h3>
                    <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '16px' }}>Stock actual: {mostrarCompra.stock} {mostrarCompra.unidad} | Costo actual: {formatearMoneda(mostrarCompra.costo_unitario)}/{mostrarCompra.unidad}</div>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Cantidad ({mostrarCompra.unidad})</label>
                        <input type="number" step="0.01" value={formCompra.cantidad} onChange={e => setFormCompra(p => ({ ...p, cantidad: e.target.value }))} style={inputBase} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Costo total $</label>
                        <input type="number" step="0.01" value={formCompra.costoTotal} onChange={e => setFormCompra(p => ({ ...p, costoTotal: e.target.value }))} style={inputBase} />
                      </div>
                      {formCompra.cantidad && formCompra.costoTotal && (
                        <div style={{ fontSize: '13px', color: colors.sidebarBg, fontWeight: '600' }}>
                          Costo unitario: {formatearMoneda(parseFloat(formCompra.costoTotal) / parseFloat(formCompra.cantidad))}/{mostrarCompra.unidad}
                        </div>
                      )}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Método de pago</label>
                        <select value={formCompra.metodoPago} onChange={e => setFormCompra(p => ({ ...p, metodoPago: e.target.value }))} style={selectBase}>
                          <option value="efectivo" style={optStyle}>Efectivo</option>
                          <option value="transferencia" style={optStyle}>Transferencia</option>
                          <option value="tarjeta" style={optStyle}>Tarjeta</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setMostrarCompra(null)} style={{ padding: '8px 20px', background: colors.sand, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                      <button onClick={handleComprar} disabled={guardando} style={{ padding: '8px 20px', background: colors.olive, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', opacity: guardando ? 0.6 : 1 }}>
                        {guardando ? 'Registrando...' : 'Registrar compra'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== TAB RECETAS ========== */}
          {tabActivo === 'recetas' && (
            <div>
              {/* Selector de producto */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Selecciona un producto</label>
                <select value={productoReceta} onChange={e => cargarReceta(e.target.value)} style={{ ...selectBase, maxWidth: '400px', padding: '10px 14px' }}>
                  <option value="" style={optStyle}>-- Seleccionar producto --</option>
                  {productos.map(p => <option key={p.id} value={p.id} style={optStyle}>{p.nombre}</option>)}
                </select>
              </div>

              {productoReceta && (
                <>
                  {/* Botón agregar línea */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: colors.espresso, fontSize: '18px' }}>Receta (BOM)</h3>
                    <button onClick={() => { setFormReceta({ material_id: '', cantidad: '', notas: '' }); setMostrarFormReceta(true); }} style={{
                      padding: '8px 20px', background: colors.sidebarBg, color: '#fff', border: 'none',
                      borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', fontFamily: 'inherit'
                    }}>
                      + Agregar material
                    </button>
                  </div>

                  {/* Tabla receta */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: colors.sand }}>
                        {['Material', 'Cantidad/pieza', 'Unidad', 'Costo contribución', 'Notas', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '10px 8px', textAlign: 'left', color: colors.espresso, fontWeight: '600', borderBottom: `2px solid ${colors.camel}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recetaLineas.map(r => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${colors.sand}` }}>
                          <td style={{ padding: '10px 8px', fontWeight: '600' }}>{r.material?.nombre || '-'}</td>
                          <td style={{ padding: '10px 8px' }}>{parseFloat(r.cantidad).toLocaleString('es-MX', { maximumFractionDigits: 4 })}</td>
                          <td style={{ padding: '10px 8px' }}>{r.material?.unidad || '-'}</td>
                          <td style={{ padding: '10px 8px', fontWeight: '600' }}>{formatearMoneda((parseFloat(r.cantidad) || 0) * (parseFloat(r.material?.costo_unitario) || 0))}</td>
                          <td style={{ padding: '10px 8px', color: colors.camel, fontSize: '12px' }}>{r.notas || '-'}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <button onClick={() => handleEliminarRecetaLinea(r.id)} style={{
                              padding: '4px 10px', background: colors.terracotta, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit'
                            }}>X</button>
                          </td>
                        </tr>
                      ))}
                      {recetaLineas.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: colors.camel }}>No hay materiales en la receta</td></tr>
                      )}
                    </tbody>
                  </table>

                  {/* Resumen receta */}
                  {recetaLineas.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '16px', background: colors.cotton, borderRadius: '10px', border: `1px solid ${colors.sand}` }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: colors.espresso }}>
                        Costo total receta: {formatearMoneda(recetaLineas.reduce((acc, r) => acc + (parseFloat(r.cantidad) || 0) * (parseFloat(r.material?.costo_unitario) || 0), 0))} / pieza
                      </div>
                      <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px' }}>
                        {recetaLineas.length} material{recetaLineas.length !== 1 ? 'es' : ''}
                      </div>
                    </div>
                  )}

                  {/* Modal agregar línea receta */}
                  {mostrarFormReceta && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ margin: '0 0 16px', color: colors.espresso }}>Agregar material a receta</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Material *</label>
                            <select value={formReceta.material_id} onChange={e => setFormReceta(p => ({ ...p, material_id: e.target.value }))} style={selectBase}>
                              <option value="" style={optStyle}>-- Seleccionar --</option>
                              {materiales.map(m => <option key={m.id} value={m.id} style={optStyle}>{m.nombre} ({m.unidad})</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Cantidad por pieza *</label>
                            <input type="number" step="0.001" value={formReceta.cantidad} onChange={e => setFormReceta(p => ({ ...p, cantidad: e.target.value }))} style={inputBase} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Notas</label>
                            <input value={formReceta.notas} onChange={e => setFormReceta(p => ({ ...p, notas: e.target.value }))} style={inputBase} />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setMostrarFormReceta(false)} style={{ padding: '8px 20px', background: colors.sand, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                          <button onClick={handleGuardarRecetaLinea} disabled={guardando} style={{ padding: '8px 20px', background: colors.sidebarBg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', opacity: guardando ? 0.6 : 1 }}>
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========== TAB PRODUCIR ========== */}
          {tabActivo === 'producir' && (
            <div>
              {/* Botón nueva orden */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button onClick={iniciarWizard} style={{
                  padding: '10px 24px', background: colors.sidebarBg, color: '#fff', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit'
                }}>
                  + Nueva Orden
                </button>
              </div>

              {/* Lista órdenes */}
              <div style={{ display: 'grid', gap: '12px' }}>
                {ordenes.map(o => (
                  <div key={o.id} style={{ background: colors.cotton, borderRadius: '12px', padding: '16px', border: `1px solid ${colors.sand}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: colors.espresso, fontSize: '16px' }}>
                          {o.producto?.nombre || 'Producto'}
                          {o.variante && <span style={{ fontWeight: '400', color: colors.camel, fontSize: '14px' }}> / {[o.variante.material, o.variante.color, o.variante.talla].filter(Boolean).join(' - ') || o.variante.sku}</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: colors.camel, marginTop: '4px' }}>
                          {o.cantidad} piezas | {badgeEstado(o.estado)}
                          {o.estado === 'completada' && <span style={{ marginLeft: '10px', fontWeight: '600', color: colors.sidebarBg }}>Costo: {formatearMoneda(o.costo_unitario_calculado)}/pza</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.camel, marginTop: '4px' }}>
                          Creada: {new Date(o.created_at).toLocaleDateString('es-MX')}
                          {o.fecha_completada && ` | Completada: ${new Date(o.fecha_completada).toLocaleDateString('es-MX')}`}
                        </div>
                        {o.notas && <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px', fontStyle: 'italic' }}>{o.notas}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {(o.estado === 'borrador' || o.estado === 'en_proceso') && (
                          <>
                            <button onClick={() => handleCompletarOrden(o.id)} disabled={guardando} style={{
                              padding: '6px 16px', background: colors.olive, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit'
                            }}>Completar</button>
                            <button onClick={() => handleCancelarOrden(o.id)} style={{
                              padding: '6px 16px', background: colors.terracotta, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit'
                            }}>Cancelar</button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Materiales usados */}
                    {o.materiales_usados && o.materiales_usados.length > 0 && (
                      <div style={{ marginTop: '12px', background: colors.cream, borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Materiales</div>
                        {o.materiales_usados.map(mu => (
                          <div key={mu.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0', borderBottom: `1px solid ${colors.sand}` }}>
                            <span>{mu.material?.nombre || '-'}</span>
                            <span style={{ color: colors.camel }}>
                              {mu.cantidad_real != null ? parseFloat(mu.cantidad_real).toLocaleString('es-MX', { maximumFractionDigits: 2 }) : parseFloat(mu.cantidad_planeada).toLocaleString('es-MX', { maximumFractionDigits: 2 })} {mu.material?.unidad || ''}
                              {o.estado === 'completada' && <span style={{ marginLeft: '8px', fontWeight: '600' }}>{formatearMoneda(mu.costo_total)}</span>}
                            </span>
                          </div>
                        ))}
                        {o.estado === 'completada' && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginTop: '6px', color: colors.sidebarBg }}>
                            <span>Total</span>
                            <span>{formatearMoneda(o.costo_total)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {ordenes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px' }}>
                    No hay órdenes de producción
                  </div>
                )}
              </div>

              {/* Wizard Modal */}
              {mostrarWizard && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 8px', color: colors.espresso }}>Nueva Orden de Producción</h3>
                    <div style={{ fontSize: '12px', color: colors.camel, marginBottom: '20px' }}>Paso {pasoWizard} de 3</div>

                    {/* Paso 1: Producto y cantidad */}
                    {pasoWizard === 1 && (
                      <div style={{ display: 'grid', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Producto *</label>
                          <select value={formOrden.producto_id} onChange={e => handleSeleccionarProductoOrden(e.target.value)} style={{ ...selectBase, padding: '10px 14px' }}>
                            <option value="">-- Seleccionar producto --</option>
                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                        </div>
                        {variantesProducto.length > 0 && (
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Variante</label>
                            <select value={formOrden.variante_id} onChange={e => setFormOrden(p => ({ ...p, variante_id: e.target.value }))} style={{ ...selectBase, padding: '10px 14px' }}>
                              <option value="" style={optStyle}>-- Sin variante --</option>
                              {variantesProducto.map(v => <option key={v.id} value={v.id} style={optStyle}>{[v.material, v.color, v.talla].filter(Boolean).join(' - ')} ({v.sku || ''})</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Cantidad a producir *</label>
                          <input type="number" value={formOrden.cantidad} onChange={e => setFormOrden(p => ({ ...p, cantidad: e.target.value }))} style={{ ...inputBase, padding: '10px 14px' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setMostrarWizard(false)} style={{ padding: '8px 20px', background: colors.sand, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                          <button onClick={cargarRecetaParaOrden} disabled={!formOrden.producto_id || !formOrden.cantidad} style={{
                            padding: '8px 20px', background: colors.sidebarBg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit',
                            opacity: (!formOrden.producto_id || !formOrden.cantidad) ? 0.5 : 1
                          }}>Siguiente</button>
                        </div>
                      </div>
                    )}

                    {/* Paso 2: Revisar/editar materiales */}
                    {pasoWizard === 2 && (
                      <div>
                        <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '12px' }}>
                          Revisa y ajusta las cantidades de material necesarias para {formOrden.cantidad} piezas:
                        </div>
                        {materialesOrden.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: colors.camel, background: colors.cream, borderRadius: '8px', marginBottom: '16px' }}>
                            No hay receta definida para este producto. Puedes continuar sin materiales o definir una receta primero.
                          </div>
                        ) : (
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
                            <thead>
                              <tr style={{ background: colors.sand }}>
                                {['Material', 'Unidad', 'Cant. total', 'Stock disp.', 'Costo est.'].map(h => (
                                  <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: colors.espresso, fontSize: '12px' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {materialesOrden.map((m, idx) => {
                                const insuficiente = m.cantidad_total > m.stock_disponible;
                                return (
                                  <tr key={idx} style={{ borderBottom: `1px solid ${colors.sand}`, background: insuficiente ? '#fff3e0' : 'transparent' }}>
                                    <td style={{ padding: '8px 6px', fontWeight: '600' }}>{m.nombre}</td>
                                    <td style={{ padding: '8px 6px' }}>{m.unidad}</td>
                                    <td style={{ padding: '8px 6px' }}>
                                      <input type="number" step="0.01" value={m.cantidad_total}
                                        onChange={e => {
                                          const nuevo = [...materialesOrden];
                                          nuevo[idx] = { ...nuevo[idx], cantidad_total: parseFloat(e.target.value) || 0 };
                                          setMaterialesOrden(nuevo);
                                        }}
                                        style={{ width: '80px', padding: '4px 6px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }}
                                      />
                                    </td>
                                    <td style={{ padding: '8px 6px', color: insuficiente ? '#c62828' : colors.camel }}>
                                      {m.stock_disponible.toLocaleString('es-MX', { maximumFractionDigits: 2 })}
                                      {insuficiente && <span title="Stock insuficiente"> ⚠️</span>}
                                    </td>
                                    <td style={{ padding: '8px 6px' }}>{formatearMoneda(m.cantidad_total * m.costo_unitario)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                          <button onClick={() => setPasoWizard(1)} style={{ padding: '8px 20px', background: colors.sand, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Atrás</button>
                          <button onClick={() => setPasoWizard(3)} style={{ padding: '8px 20px', background: colors.sidebarBg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit' }}>Siguiente</button>
                        </div>
                      </div>
                    )}

                    {/* Paso 3: Confirmar */}
                    {pasoWizard === 3 && (
                      <div>
                        <div style={{ background: colors.cream, borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
                          <div style={{ fontWeight: '700', fontSize: '16px', color: colors.espresso, marginBottom: '8px' }}>Resumen de la orden</div>
                          <div style={{ fontSize: '14px', color: colors.espresso }}>
                            <strong>Producto:</strong> {productos.find(p => p.id === formOrden.producto_id)?.nombre || '-'}
                            {formOrden.variante_id && (() => { const vr = variantesProducto.find(v => v.id === parseInt(formOrden.variante_id)); return <span> / {vr ? [vr.material, vr.color, vr.talla].filter(Boolean).join(' - ') : '-'}</span>; })()}
                          </div>
                          <div style={{ fontSize: '14px', color: colors.espresso, marginTop: '4px' }}>
                            <strong>Cantidad:</strong> {formOrden.cantidad} piezas
                          </div>
                          {materialesOrden.length > 0 && (
                            <>
                              <div style={{ fontSize: '14px', color: colors.espresso, marginTop: '4px' }}>
                                <strong>Costo estimado total:</strong> {formatearMoneda(materialesOrden.reduce((acc, m) => acc + m.cantidad_total * m.costo_unitario, 0))}
                              </div>
                              <div style={{ fontSize: '14px', color: colors.espresso, marginTop: '4px' }}>
                                <strong>Costo estimado/pieza:</strong> {formatearMoneda(materialesOrden.reduce((acc, m) => acc + m.cantidad_total * m.costo_unitario, 0) / (parseInt(formOrden.cantidad) || 1))}
                              </div>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                          <button onClick={() => setPasoWizard(2)} style={{ padding: '8px 20px', background: colors.sand, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Atrás</button>
                          <button onClick={handleCrearOrden} disabled={guardando} style={{
                            padding: '10px 24px', background: colors.olive, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit',
                            opacity: guardando ? 0.6 : 1
                          }}>
                            {guardando ? 'Creando...' : 'Crear Orden'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProduccionView;

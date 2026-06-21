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
  const [formReceta, setFormReceta] = useState({ material_id: '', cantidad: '', notas: '', opcional: false });

  // --- Producción state ---
  const [mostrarWizard, setMostrarWizard] = useState(false);
  const [pasoWizard, setPasoWizard] = useState(1);
  const [formOrden, setFormOrden] = useState({ producto_id: '', variante_id: '', cantidad: '' });
  const [materialesOrden, setMaterialesOrden] = useState([]);
  const [configOrden, setConfigOrden] = useState(null);
  const [variantesProducto, setVariantesProducto] = useState([]);
  const [mostrarCompletar, setMostrarCompletar] = useState(null);
  const [filtroEstadoOrden, setFiltroEstadoOrden] = useState('pendientes');

  // --- Ritmo state ---
  const [ritmoProductoId, setRitmoProductoId] = useState('');
  const [ritmoReceta, setRitmoReceta] = useState([]);
  const [ritmoForm, setRitmoForm] = useState({ cantidad: '', plazoDias: '6', anaquelDias: '6', cobroDias: '8', horasDia: '8', costo: '', precio: '' });

  const categoriasM = ['todas', 'tela', 'cierre', 'hilo', 'etiqueta', 'empaque', 'otro'];
  const unidades = ['metros', 'piezas', 'kilos', 'rollos', 'litros', 'conos'];
  const inputBase = { width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', color: colors.espresso, background: '#fff' };
  const selectBase = { width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', color: colors.espresso, background: '#fff' };
  const optStyle = { color: '#333', background: '#fff' };
  const tabs = [
    { id: 'materiales', nombre: 'Materiales', icon: '🧶' },
    { id: 'recetas', nombre: 'Recetas', icon: '📋' },
    { id: 'producir', nombre: 'Producir', icon: '⚙️' },
    { id: 'ritmo', nombre: 'Ritmo', icon: '⏱️' }
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

  // ---- FILTRADO ORDENES ----
  const ordenesFiltradas = ordenes.filter(o => {
    if (filtroEstadoOrden === 'todas') return true;
    if (filtroEstadoOrden === 'pendientes') return o.estado === 'borrador' || o.estado === 'en_proceso';
    if (filtroEstadoOrden === 'terminadas') return o.estado === 'completada' || o.estado === 'cancelada';
    return true;
  });

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
        notas: formReceta.notas || null,
        opcional: formReceta.opcional
      });
      if (res.error) mostrarMsg('error', res.error.message || 'Error');
      else { mostrarMsg('ok', 'Línea guardada'); setFormReceta({ material_id: '', cantidad: '', notas: '', opcional: false }); setMostrarFormReceta(false); cargarReceta(productoReceta); }
    } catch (e) { mostrarMsg('error', e.message); }
    setGuardando(false);
  };

  const handleEliminarRecetaLinea = async (id) => {
    if (!window.confirm('¿Eliminar esta línea de receta?')) return;
    const res = await deleteRecetaLinea(id);
    if (res.error) mostrarMsg('error', res.error.message || 'Error');
    else { mostrarMsg('ok', 'Línea eliminada'); cargarReceta(productoReceta); }
  };

  // ---- RITMO handlers ----
  const cargarRitmoProducto = async (id) => {
    setRitmoProductoId(id);
    if (!id) { setRitmoReceta([]); setRitmoForm(f => ({ ...f, costo: '', precio: '' })); return; }
    const prod = productos.find(p => String(p.id) === String(id));
    const res = await getRecetasProducto(id);
    const lineas = res.data || [];
    setRitmoReceta(lineas);
    const cfg = (prod?.configuraciones_corte || []).find(c => c.es_configuracion_actual);
    const costoMatReceta = lineas
      .filter(r => !r.opcional)
      .reduce((a, r) => a + (parseFloat(r.cantidad) || 0) * (parseFloat(r.material?.costo_unitario) || 0), 0);
    const prefillCosto = (cfg && parseFloat(cfg.costo_total) > 0) ? parseFloat(cfg.costo_total)
      : (parseFloat(prod?.costo_unitario) > 0 ? parseFloat(prod.costo_unitario) : costoMatReceta);
    setRitmoForm(f => ({
      ...f,
      costo: prefillCosto ? String(Math.round(prefillCosto * 100) / 100) : '',
      precio: (parseFloat(prod?.precio_venta) > 0) ? String(prod.precio_venta) : ''
    }));
  };

  // ---- PRODUCCIÓN handlers ----
  const iniciarWizard = () => {
    setFormOrden({ producto_id: '', variante_id: '', cantidad: '' });
    setMaterialesOrden([]);
    setConfigOrden(null);
    setVariantesProducto([]);
    setPasoWizard(1);
    setMostrarWizard(true);
  };

  const handleSeleccionarProductoOrden = async (prodId) => {
    setFormOrden(prev => ({ ...prev, producto_id: prodId, variante_id: '' }));
    if (!prodId) { setVariantesProducto([]); return; }
    // Consultar variantes siempre: el flag productos.tiene_variantes puede estar
    // desincronizado con la realidad de la tabla variantes_producto.
    const varRes = await getVariantes(prodId);
    setVariantesProducto(varRes.data || []);
  };

  const cargarRecetaParaOrden = async () => {
    if (!formOrden.producto_id) return;
    
    const pId = parseInt(formOrden.producto_id);
    const vId = parseInt(formOrden.variante_id);
    const producto = productos.find(p => p.id === pId);
    
    // 1. Obtener receta base
    const res = await getRecetasProducto(pId);
    
    // 2. Buscar configuración de corte (tela principal)
    const config = (producto?.configuraciones_corte || []).find(c => 
      c.es_configuracion_actual && (c.variante_id === vId || c.variante_id === null)
    );
    setConfigOrden(config || null);

    let lineas = (res.data || [])
      .filter(r => r.variante_id === null || r.variante_id === vId)
      .map(r => {
        const opcional = r.opcional === true;
        return {
          material_id: r.material_id,
          nombre: r.material?.nombre || '',
          unidad: r.material?.unidad || '',
          categoria: r.material?.categoria || 'otro',
          cantidad_por_pieza: parseFloat(r.cantidad) || 0,
          cantidad_total: opcional ? 0 : (parseFloat(r.cantidad) || 0) * (parseInt(formOrden.cantidad) || 0),
          costo_unitario: parseFloat(r.material?.costo_unitario) || 0,
          stock_disponible: parseFloat(r.material?.stock) || 0,
          es_opcional: opcional
        };
      });

    // 3. Integrar tela de la configuración si existe
    if (config && config.material_id) {
      const materialPrincipalId = config.material_id;
      const existeEnReceta = lineas.some(l => l.material_id === materialPrincipalId);
      
      const materialData = materiales.find(m => m.id === materialPrincipalId);
      const metrosTotales = parseFloat(config.total_metros_lineales) || 0;

      if (!existeEnReceta) {
        lineas.unshift({
          material_id: materialPrincipalId,
          nombre: materialData?.nombre || 'Tela principal',
          unidad: materialData?.unidad || 'metros',
          categoria: materialData?.categoria || 'tela',
          cantidad_por_pieza: metrosTotales,
          cantidad_total: metrosTotales * (parseInt(formOrden.cantidad) || 0),
          costo_unitario: parseFloat(materialData?.costo_unitario) || 0,
          stock_disponible: parseFloat(materialData?.stock) || 0,
          es_opcional: false,
          es_principal: true
        });
      } else {
        // Si ya existe, actualizamos la cantidad con la del patrón de corte (más precisa)
        lineas = lineas.map(l => {
          if (l.material_id === materialPrincipalId) {
            return {
              ...l,
              cantidad_por_pieza: metrosTotales,
              cantidad_total: metrosTotales * (parseInt(formOrden.cantidad) || 0),
              es_principal: true
            };
          }
          return l;
        });
      }
    }

    setMaterialesOrden(lineas);
    setPasoWizard(2);
  };

  const handleCrearOrden = async () => {
    if (!formOrden.producto_id || !formOrden.cantidad || parseInt(formOrden.cantidad) <= 0) {
      mostrarMsg('error', 'Selecciona producto y cantidad'); return;
    }
    if (variantesProducto.length === 0) {
      mostrarMsg('error', 'Este producto no tiene variantes activas — crea una variante antes de producir'); return;
    }
    if (!formOrden.variante_id) {
      mostrarMsg('error', 'Selecciona una variante para esta orden'); return;
    }
    setGuardando(true);
    try {
      const ordenData = {
        producto_id: formOrden.producto_id,
        variante_id: parseInt(formOrden.variante_id),
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
                  {productos.map(p => <option key={p.id} value={p.id} style={optStyle}>{p.linea_nombre || p.nombre}</option>)}
                </select>
              </div>

              {productoReceta && (
                <>
                  {/* Botón agregar línea */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: colors.espresso, fontSize: '18px' }}>Receta (BOM)</h3>
                    <button onClick={() => { setFormReceta({ material_id: '', cantidad: '', notas: '', opcional: false }); setMostrarFormReceta(true); }} style={{
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
                        <tr key={r.id} style={{ borderBottom: `1px solid ${colors.sand}`, background: r.opcional ? 'rgba(218,159,23,0.03)' : 'transparent' }}>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ fontWeight: '600' }}>{r.material?.nombre || '-'}</div>
                            {r.opcional && <div style={{ fontSize: '10px', color: colors.camel, fontStyle: 'italic' }}>Opcional / Alternativo</div>}
                          </td>
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
                        Costo base receta: {formatearMoneda(recetaLineas.reduce((acc, r) => {
                          if (r.opcional) return acc;
                          return acc + (parseFloat(r.cantidad) || 0) * (parseFloat(r.material?.costo_unitario) || 0);
                        }, 0))} / pieza
                      </div>
                      <div style={{ fontSize: '12px', color: colors.camel, marginTop: '4px' }}>
                        {recetaLineas.filter(r => !r.opcional).length} fijos + {recetaLineas.filter(r => r.opcional).length} opcionales/alternativas
                      </div>
                      {recetaLineas.some(r => r.opcional) && (
                        <div style={{ fontSize: '11px', color: colors.camel, marginTop: '8px', fontStyle: 'italic' }}>
                          * El costo final varía según la tela opcional que se seleccione al producir.
                        </div>
                      )}
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input 
                              type="checkbox" 
                              id="receta-opcional"
                              checked={formReceta.opcional} 
                              onChange={e => setFormReceta(p => ({ ...p, opcional: e.target.checked }))} 
                            />
                            <label htmlFor="receta-opcional" style={{ fontSize: '13px', color: colors.espresso, cursor: 'pointer' }}>
                              Este material es opcional / alternativo
                            </label>
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
              {/* Controles: Filtros y Botón Nueva Orden */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', background: colors.cream, borderRadius: '8px', padding: '4px', border: `1px solid ${colors.sand}` }}>
                  {[
                    { id: 'todas', label: 'Todas' },
                    { id: 'pendientes', label: 'Pendientes' },
                    { id: 'terminadas', label: 'Terminadas' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFiltroEstadoOrden(f.id)}
                      style={{
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        background: filtroEstadoOrden === f.id ? colors.sidebarBg : 'transparent',
                        color: filtroEstadoOrden === f.id ? '#fff' : colors.espresso,
                        transition: 'all 0.2s'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <button onClick={iniciarWizard} style={{
                  padding: '10px 24px', background: colors.sidebarBg, color: '#fff', border: 'none',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', fontFamily: 'inherit'
                }}>
                  + Nueva Orden
                </button>
              </div>

              {/* Lista órdenes */}
              <div style={{ display: 'grid', gap: '12px' }}>
                {ordenesFiltradas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px', border: `1px dashed ${colors.sand}` }}>
                    No hay órdenes en este estado
                  </div>
                ) : (
                  ordenesFiltradas.map(o => (
                    <div key={o.id} style={{ background: colors.cotton, borderRadius: '12px', padding: '16px', border: `1px solid ${colors.sand}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: colors.espresso, fontSize: '16px' }}>
                            {o.producto?.linea_nombre || 'Producto'}
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
                          {o.materiales_usados.filter(mu => (mu.cantidad_real || mu.cantidad_planeada) > 0).map(mu => (
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
                  ))
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
                            {productos.filter(p => p.es_manufacturado).map(p => <option key={p.id} value={p.id}>{p.linea_nombre || p.nombre}</option>)}
                          </select>
                          {productos.length > 0 && productos.filter(p => p.es_manufacturado).length === 0 && (
                            <div style={{ marginTop: '8px', padding: '10px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '6px', fontSize: '12px', color: '#856404' }}>
                              ⚠ No hay productos marcados como manufactura. Activa el toggle "MANUFACTURA" en la pantalla de productos para los que vas a producir.
                            </div>
                          )}
                        </div>
                        {formOrden.producto_id && variantesProducto.length === 0 && (
                          <div style={{ padding: '12px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', fontSize: '13px', color: '#856404' }}>
                            ⚠ Este producto no tiene variantes activas. Crea al menos una variante en la pantalla de productos antes de poder producir.
                          </div>
                        )}
                        {variantesProducto.length > 0 && (
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Variante *</label>
                            <select value={formOrden.variante_id} onChange={e => setFormOrden(p => ({ ...p, variante_id: e.target.value }))} style={{ ...selectBase, padding: '10px 14px' }}>
                              <option value="" style={optStyle}>-- Seleccionar variante --</option>
                              {variantesProducto.map(v => <option key={v.id} value={v.id} style={optStyle}>{[v.material, v.color, v.talla].filter(Boolean).join(' - ')} ({v.sku || ''})</option>)}
                            </select>
                          </div>
                        )}
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Cantidad a producir *</label>
                          <input type="number" value={formOrden.cantidad} onChange={e => setFormOrden(p => ({ ...p, cantidad: e.target.value }))} style={{ ...inputBase, padding: '10px 14px' }} />
                        </div>
                        {(() => {
                          const sinVariantes = formOrden.producto_id && variantesProducto.length === 0;
                          const variantesPendientes = variantesProducto.length > 0 && !formOrden.variante_id;
                          const desactivado = !formOrden.producto_id || !formOrden.cantidad || sinVariantes || variantesPendientes;
                          return (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                              <button onClick={() => setMostrarWizard(false)} style={{ padding: '8px 20px', background: colors.sand, border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
                              <button onClick={cargarRecetaParaOrden} disabled={desactivado} style={{
                                padding: '8px 20px', background: colors.sidebarBg, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit',
                                opacity: desactivado ? 0.5 : 1
                              }}>Siguiente</button>
                            </div>
                          );
                        })()}
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
                                const esOpcionalDormido = m.es_opcional && m.cantidad_total === 0;
                                return (
                                  <tr key={idx} style={{ 
                                    borderBottom: `1px solid ${colors.sand}`, 
                                    background: insuficiente ? '#fff3e0' : 'transparent',
                                    opacity: esOpcionalDormido ? 0.5 : 1,
                                    transition: 'opacity 0.3s'
                                  }}>
                                    <td style={{ padding: '8px 6px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontWeight: '600', color: esOpcionalDormido ? colors.camel : colors.espresso }}>
                                          {m.nombre}
                                        </span>
                                        {m.es_opcional && (
                                          <span style={{ fontSize: '9px', background: colors.sand, padding: '2px 4px', borderRadius: '4px', textTransform: 'uppercase' }}>Opcional</span>
                                        )}
                                      </div>
                                      {esOpcionalDormido && (
                                        <button 
                                          onClick={() => {
                                            const nuevo = materialesOrden.map((item, i) => {
                                              if (i === idx) {
                                                return { ...item, cantidad_total: m.cantidad_por_pieza * (parseInt(formOrden.cantidad) || 0) };
                                              }
                                              // Si es de la misma categoría (ej. tela) y es opcional, lo desactivamos para que sea alternativa
                                              if (item.es_opcional && item.categoria === m.categoria && m.categoria === 'tela') {
                                                return { ...item, cantidad_total: 0 };
                                              }
                                              return item;
                                            });
                                            setMaterialesOrden(nuevo);
                                          }}
                                          style={{ fontSize: '11px', background: 'none', border: 'none', color: colors.olive, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                                        >
                                          + Seleccionar esta {m.categoria === 'tela' ? 'tela' : 'opción'}
                                        </button>
                                      )}
                                    </td>
                                    <td style={{ padding: '8px 6px', color: esOpcionalDormido ? colors.camel : colors.espresso }}>{m.unidad}</td>
                                    <td style={{ padding: '8px 6px' }}>
                                      <input type="number" step="0.01" value={m.cantidad_total}
                                        onChange={e => {
                                          const nuevo = [...materialesOrden];
                                          nuevo[idx] = { ...nuevo[idx], cantidad_total: parseFloat(e.target.value) || 0 };
                                          setMaterialesOrden(nuevo);
                                        }}
                                        style={{ 
                                          width: '80px', 
                                          padding: '4px 6px', 
                                          border: `1px solid ${colors.sand}`, 
                                          borderRadius: '6px', 
                                          fontSize: '13px', 
                                          fontFamily: 'inherit',
                                          background: esOpcionalDormido ? colors.cream : 'white'
                                        }}
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
                        
                        {(materialesOrden.length > 0 || configOrden) && (
                          <div style={{ 
                            background: colors.linen, 
                            padding: '12px', 
                            borderRadius: '8px', 
                            marginBottom: '16px',
                            border: `1px solid ${colors.sand}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.espresso }}>
                              <span>Subtotal Materiales:</span>
                              <span style={{ fontWeight: '600' }}>{formatearMoneda(materialesOrden.reduce((acc, m) => acc + m.cantidad_total * m.costo_unitario, 0))}</span>
                            </div>
                            {configOrden && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: colors.espresso, marginTop: '4px' }}>
                                <span>Mano de obra + Empaque:</span>
                                <span style={{ fontWeight: '600' }}>{formatearMoneda(((parseFloat(configOrden.costo_confeccion) || 0) + (parseFloat(configOrden.costo_empaque) || 0)) * (parseInt(formOrden.cantidad) || 0))}</span>
                              </div>
                            )}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              fontSize: '15px', 
                              color: colors.olive, 
                              marginTop: '8px',
                              paddingTop: '8px',
                              borderTop: `1px solid ${colors.sand}`,
                              fontWeight: '700'
                            }}>
                              <span>TOTAL ESTIMADO:</span>
                              <span>{(() => {
                                const costMat = materialesOrden.reduce((acc, m) => acc + m.cantidad_total * m.costo_unitario, 0);
                                const costExtra = ((parseFloat(configOrden?.costo_confeccion) || 0) + (parseFloat(configOrden?.costo_empaque) || 0)) * (parseInt(formOrden.cantidad) || 0);
                                return formatearMoneda(costMat + costExtra);
                              })()}</span>
                            </div>
                          </div>
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
                            <strong>Producto:</strong> {(() => { const pr = productos.find(p => p.id === parseInt(formOrden.producto_id)); return pr?.linea_nombre || pr?.nombre || '-'; })()}
                            {formOrden.variante_id && (() => { const vr = variantesProducto.find(v => v.id === parseInt(formOrden.variante_id)); return <span> / {vr ? [vr.material, vr.color, vr.talla].filter(Boolean).join(' - ') : '-'}</span>; })()}
                          </div>
                          <div style={{ fontSize: '14px', color: colors.espresso, marginTop: '4px' }}>
                            <strong>Cantidad:</strong> {formOrden.cantidad} piezas
                          </div>
                          <div style={{ borderTop: `1px solid ${colors.sand}`, marginTop: '8px', paddingTop: '8px' }}>
                            {materialesOrden.filter(m => m.cantidad_total > 0).length > 0 && (
                              <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '4px' }}>
                                Materiales: {formatearMoneda(materialesOrden.reduce((acc, m) => acc + m.cantidad_total * m.costo_unitario, 0))}
                              </div>
                            )}
                            {configOrden && (
                              <>
                                {(parseFloat(configOrden.costo_confeccion) > 0) && (
                                  <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '4px' }}>
                                    Mano de obra (confección): {formatearMoneda(parseFloat(configOrden.costo_confeccion) * (parseInt(formOrden.cantidad) || 0))}
                                  </div>
                                )}
                                {(parseFloat(configOrden.costo_empaque) > 0) && (
                                  <div style={{ fontSize: '13px', color: colors.camel, marginBottom: '4px' }}>
                                    Empaque: {formatearMoneda(parseFloat(configOrden.costo_empaque) * (parseInt(formOrden.cantidad) || 0))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                          {materialesOrden.length > 0 && (
                            <>
                              <div style={{ fontSize: '16px', color: colors.espresso, marginTop: '8px', fontWeight: '700' }}>
                                <strong>Total estimado:</strong> {(() => {
                                  const costMat = materialesOrden.reduce((acc, m) => acc + m.cantidad_total * m.costo_unitario, 0);
                                  const costConf = (parseFloat(configOrden?.costo_confeccion) || 0) * (parseInt(formOrden.cantidad) || 0);
                                  const costEmp = (parseFloat(configOrden?.costo_empaque) || 0) * (parseInt(formOrden.cantidad) || 0);
                                  return formatearMoneda(costMat + costConf + costEmp);
                                })()}
                              </div>
                              <div style={{ fontSize: '13px', color: colors.olive, marginTop: '2px' }}>
                                <strong>Costo unitario:</strong> {(() => {
                                  const qty = parseInt(formOrden.cantidad) || 1;
                                  const costMat = materialesOrden.reduce((acc, m) => acc + m.cantidad_total * m.costo_unitario, 0);
                                  const costConf = (parseFloat(configOrden?.costo_confeccion) || 0) * (parseInt(formOrden.cantidad) || 0);
                                  const costEmp = (parseFloat(configOrden?.costo_empaque) || 0) * (parseInt(formOrden.cantidad) || 0);
                                  return formatearMoneda((costMat + costConf + costEmp) / qty);
                                })()}
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

          {/* ========== TAB RITMO ========== */}
          {tabActivo === 'ritmo' && (() => {
            const C = { verde: '#2e7d32', amber: '#e08e0b', rojo: '#c62828', neutro: colors.camel };
            const cantidad = parseInt(ritmoForm.cantidad) || 0;
            const plazo = parseFloat(ritmoForm.plazoDias) || 0;
            const horasDia = parseFloat(ritmoForm.horasDia) || 0;
            const costo = parseFloat(ritmoForm.costo) || 0;
            const precio = parseFloat(ritmoForm.precio) || 0;
            const anaquel = parseFloat(ritmoForm.anaquelDias) || 0;
            const cobro = parseFloat(ritmoForm.cobroDias) || 0;

            const costoMatReceta = ritmoReceta
              .filter(r => !r.opcional)
              .reduce((a, r) => a + (parseFloat(r.cantidad) || 0) * (parseFloat(r.material?.costo_unitario) || 0), 0);

            const ritmoDia = plazo > 0 ? cantidad / plazo : 0;
            const ritmoHora = horasDia > 0 ? ritmoDia / horasDia : 0;
            const costoLote = cantidad * costo;
            const ingresoLote = cantidad * precio;
            const utilidadLote = ingresoLote - costoLote;
            const margen = ingresoLote > 0 ? (utilidadLote / ingresoLote) * 100 : 0;
            const mult = costo > 0 ? precio / costo : 0;
            const cicloCaja = plazo + anaquel + cobro;
            const precioConsig = costo * 1.5;
            const precioDetalle = costo * 2.0;

            const plazoColor = plazo <= 0 ? C.neutro : plazo <= 6 ? C.verde : plazo === 7 ? C.amber : C.rojo;
            const plazoMsg = plazo <= 0 ? 'Define un plazo' : plazo <= 6 ? 'Controlado: cabe dentro del anaquel' : plazo === 7 ? 'Al límite' : 'Rompe el ciclo: parte el lote o suma maquila';
            const precioColor = mult <= 0 ? C.neutro : mult >= 1.5 ? C.verde : mult >= 1.3 ? C.amber : C.rojo;
            const precioMsg = mult <= 0 ? '—' : mult >= 1.5 ? 'Precio sano (≥ tier consignación)' : mult >= 1.3 ? 'Apenas mayoreo — subir' : 'Subpreciado: nivel mayoreo o menos';

            const lineasMat = ritmoReceta.filter(r => !r.opcional).map(r => {
              const porPieza = parseFloat(r.cantidad) || 0;
              const total = porPieza * cantidad;
              const stock = parseFloat(r.material?.stock) || 0;
              return { nombre: r.material?.nombre || '-', unidad: r.material?.unidad || '', total, stock, suficiente: stock >= total };
            });
            const faltaMaterial = lineasMat.some(l => !l.suficiente);

            const kpiCard = (label, valor, sub, color) => (
              <div style={{ background: colors.cotton, borderRadius: '10px', padding: '16px', textAlign: 'center', border: `1px solid ${colors.sand}` }}>
                <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: color || colors.sidebarBg }}>{valor}</div>
                {sub && <div style={{ fontSize: '11px', color: colors.camel, marginTop: '2px' }}>{sub}</div>}
              </div>
            );

            return (
              <div>
                {/* Explicación de la regla */}
                <div style={{ background: colors.linen, borderRadius: '10px', padding: '14px 16px', marginBottom: '20px', border: `1px solid ${colors.sand}`, fontSize: '13px', color: colors.espresso }}>
                  <strong>Ciclo de caja = Producción + Anaquel (~6 d) + Cobro (~8 d).</strong> Como anaquel + cobro ya suman ~14 días, la producción de cada lote debe quedar lista en <strong>≤ 6 días</strong> (ideal 4-5), entregando en gotas. Define el plazo y la app te dice el ritmo diario que necesitas.
                </div>

                {/* Selector producto */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Producto a producir</label>
                  <select value={ritmoProductoId} onChange={e => cargarRitmoProducto(e.target.value)} style={{ ...selectBase, maxWidth: '420px', padding: '10px 14px' }}>
                    <option value="" style={optStyle}>-- Seleccionar producto --</option>
                    {productos.filter(p => p.es_manufacturado).map(p => <option key={p.id} value={p.id} style={optStyle}>{p.linea_nombre || p.nombre}</option>)}
                  </select>
                </div>

                {/* Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Tamaño del lote (pz)</label>
                    <input type="number" value={ritmoForm.cantidad} onChange={e => setRitmoForm(f => ({ ...f, cantidad: e.target.value }))} style={inputBase} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Plazo objetivo (días)</label>
                    <input type="number" value={ritmoForm.plazoDias} onChange={e => setRitmoForm(f => ({ ...f, plazoDias: e.target.value }))} style={inputBase} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Horas/día</label>
                    <input type="number" value={ritmoForm.horasDia} onChange={e => setRitmoForm(f => ({ ...f, horasDia: e.target.value }))} style={inputBase} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Costo/pieza $</label>
                    <input type="number" step="0.01" value={ritmoForm.costo} onChange={e => setRitmoForm(f => ({ ...f, costo: e.target.value }))} style={inputBase} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>Precio/pieza $</label>
                    <input type="number" step="0.01" value={ritmoForm.precio} onChange={e => setRitmoForm(f => ({ ...f, precio: e.target.value }))} style={inputBase} />
                  </div>
                </div>
                {ritmoProductoId && costoMatReceta > 0 && (
                  <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '20px', fontStyle: 'italic' }}>
                    Costo de materia según receta: {formatearMoneda(costoMatReceta)}/pza (sin confección). Ajusta el costo/pieza si incluyes mano de obra.
                  </div>
                )}

                {ritmoProductoId ? (
                  <>
                    {/* KPIs de ritmo */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      {kpiCard('Ritmo requerido', ritmoDia ? `${ritmoDia.toLocaleString('es-MX', { maximumFractionDigits: 1 })} pz/día` : '—', ritmoHora ? `${ritmoHora.toLocaleString('es-MX', { maximumFractionDigits: 1 })} pz/hora` : null)}
                      {kpiCard('Costo del lote', formatearMoneda(costoLote), `${cantidad} pz × ${formatearMoneda(costo)}`)}
                      {kpiCard('Retorno esperado', formatearMoneda(ingresoLote), `× ${formatearMoneda(precio)}`)}
                      {kpiCard('Utilidad del lote', formatearMoneda(utilidadLote), `margen ${margen.toLocaleString('es-MX', { maximumFractionDigits: 0 })}%`, utilidadLote >= 0 ? C.verde : C.rojo)}
                    </div>

                    {/* Semáforos */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#fff', border: `2px solid ${plazoColor}`, borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Ciclo de caja proyectado</div>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: plazoColor }}>{cicloCaja || '—'} días</div>
                        <div style={{ fontSize: '12px', color: colors.camel }}>{plazo || 0} producción + {anaquel} anaquel + {cobro} cobro</div>
                        <div style={{ fontSize: '12px', color: plazoColor, fontWeight: '600', marginTop: '4px' }}>● {plazoMsg}</div>
                      </div>
                      <div style={{ background: '#fff', border: `2px solid ${precioColor}`, borderRadius: '10px', padding: '14px' }}>
                        <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px' }}>Multiplicador de precio</div>
                        <div style={{ fontSize: '22px', fontWeight: '700', color: precioColor }}>{mult ? `${mult.toLocaleString('es-MX', { maximumFractionDigits: 2 })}x` : '—'}</div>
                        <div style={{ fontSize: '12px', color: precioColor, fontWeight: '600' }}>● {precioMsg}</div>
                        {costo > 0 && (
                          <div style={{ fontSize: '11px', color: colors.camel, marginTop: '4px' }}>
                            Tier: consignación {formatearMoneda(precioConsig)} (1.5x) · detalle {formatearMoneda(precioDetalle)} (2.0x)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Material requerido vs stock */}
                    {lineasMat.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '15px', color: colors.espresso, margin: '0 0 8px' }}>Material para el lote {faltaMaterial && <span style={{ color: C.rojo, fontSize: '13px' }}>⚠️ falta stock</span>}</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                          <thead>
                            <tr style={{ background: colors.sand }}>
                              {['Material', 'Requerido', 'En stock', ''].map(h => (
                                <th key={h} style={{ padding: '8px', textAlign: 'left', color: colors.espresso, fontWeight: '600' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {lineasMat.map((l, i) => (
                              <tr key={i} style={{ borderBottom: `1px solid ${colors.sand}`, background: l.suficiente ? 'transparent' : '#fff3e0' }}>
                                <td style={{ padding: '8px', fontWeight: '600' }}>{l.nombre}</td>
                                <td style={{ padding: '8px' }}>{l.total.toLocaleString('es-MX', { maximumFractionDigits: 2 })} {l.unidad}</td>
                                <td style={{ padding: '8px', color: l.suficiente ? colors.camel : C.rojo }}>{l.stock.toLocaleString('es-MX', { maximumFractionDigits: 2 })} {l.unidad}</td>
                                <td style={{ padding: '8px', color: l.suficiente ? C.verde : C.rojo, fontWeight: '600' }}>{l.suficiente ? '✓ alcanza' : '✗ falta'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cotton, borderRadius: '12px', border: `1px dashed ${colors.sand}` }}>
                    Selecciona un producto para calcular su ritmo de producción
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
};

export default ProduccionView;

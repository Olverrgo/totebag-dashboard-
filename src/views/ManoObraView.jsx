import React, { useState, useEffect } from 'react';
import { 
  getColaboradores, 
  createColaborador, 
  updateColaborador, 
  getTareasTrabajo, 
  registrarTrabajo, 
  getRegistrosTrabajo, 
  eliminarRegistroTrabajo, 
  getResumenManoObra, 
  getCostoManoObraPeriodo,
  getOrdenesProduccion,
  getProductos,
  getVariantes,
  iniciarJornada,
  pausarJornada,
  reanudarJornada,
  cerrarJornada,
  getJornadaActiva,
  getJornadas,
  getCostoPorProceso,
  getMaquilaPorProducto
} from '../supabaseClient';
import { colors } from '../utils/colors';
import { formatearFechaCorta } from '../utils/formatearFecha';
import { formatearMoneda } from '../utils/formatearMoneda';

// eslint-disable-next-line no-unused-vars
const ManoObraView = ({ isAdmin }) => {
  const [activeSubTab, setActiveSubTab] = useState('resumen');
  const [loading, setLoading] = useState(true);

  // Datos
  const [colaboradores, setColaboradores] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [resumenDiario, setResumenDiario] = useState([]);
  const [resumenPeriodo, setResumenPeriodo] = useState({ costo: 0, horas: 0, piezas: 0 });
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [variantes, setVariantes] = useState([]);

  // Datos Reloj Checador
  const [colaboradorChecadorId, setColaboradorChecadorId] = useState('');
  const [jornadaActiva, setJornadaActiva] = useState(null);
  const [jornadasColaborador, setJornadasColaborador] = useState([]);
  const [tiempoNeto, setTiempoNeto] = useState(0);
  
  // Modal Pausa
  const [showModalPausa, setShowModalPausa] = useState(false);
  const [formPausa, setFormPausa] = useState({
    tipo: 'comida',
    justificacion: ''
  });

  // Datos Costeo por Proceso
  const [costoProceso, setCostoProceso] = useState([]);
  const [maquilaProducto, setMaquilaProducto] = useState([]);

  // Rango de fechas
  const getFechaHoyStr = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const getPrimerDiaMesStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const [fechaDesde, setFechaDesde] = useState(getPrimerDiaMesStr());
  const [fechaHasta, setFechaHasta] = useState(getFechaHoyStr());

  // Modales y formularios
  const [showModalColab, setShowModalColab] = useState(false);
  const [colabEditando, setColabEditando] = useState(null);
  const [formColab, setFormColab] = useState({
    nombre: '',
    rol: 'empaque',
    tarifa_hora: 0,
    tarifa_pieza: 0,
    activo: true,
    notas: ''
  });

  const [showModalRegistro, setShowModalRegistro] = useState(false);
  const [formRegistro, setFormRegistro] = useState({
    colaborador_id: '',
    tarea_id: '',
    orden_produccion_id: '',
    producto_id: '',
    variante_id: '',
    fecha: getFechaHoyStr(),
    modalidad: 'pieza',
    horas: 0,
    cantidad: 0,
    notas: '',
    vincularOrden: false
  });

  // Mensaje flotante de retroalimentación
  const [alerta, setAlerta] = useState({ show: false, tipo: 'success', texto: '' });

  const mostrarAlerta = (tipo, texto) => {
    setAlerta({ show: true, tipo, texto });
    setTimeout(() => {
      setAlerta({ show: false, tipo: 'success', texto: '' });
    }, 4000);
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'resumen') {
      fetchResumen();
    } else if (activeSubTab === 'registros') {
      fetchRegistros();
    } else if (activeSubTab === 'costos_proceso') {
      fetchCostosProceso();
    }
  }, [activeSubTab, fechaDesde, fechaHasta]);

  useEffect(() => {
    if (colaboradorChecadorId) {
      fetchJornadaColaborador(colaboradorChecadorId);
    } else {
      setJornadaActiva(null);
      setJornadasColaborador([]);
    }
  }, [colaboradorChecadorId]);

  // Cronómetro live para el Reloj Checador
  useEffect(() => {
    let timer;
    if (jornadaActiva) {
      setTiempoNeto(calcularTiempoNetoMs(jornadaActiva));
      
      if (jornadaActiva.estado === 'activa') {
        timer = setInterval(() => {
          setTiempoNeto(calcularTiempoNetoMs(jornadaActiva));
        }, 1000);
      }
    } else {
      setTiempoNeto(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [jornadaActiva]);

  // Helpers para calcular el cronómetro en milisegundos netos
  const calcularTiempoNetoMs = (jornada) => {
    if (!jornada) return 0;
    const start = new Date(jornada.inicio).getTime();
    const end = jornada.fin ? new Date(jornada.fin).getTime() : Date.now();
    let totalPausaMs = 0;
    if (jornada.jornada_pausas) {
      jornada.jornada_pausas.forEach(p => {
        const pStart = new Date(p.inicio).getTime();
        const pEnd = p.fin ? new Date(p.fin).getTime() : Date.now();
        totalPausaMs += (pEnd - pStart);
      });
    }
    return Math.max(0, (end - start) - totalPausaMs);
  };

  const formatearMs = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const initData = async () => {
    setLoading(true);
    try {
      const [colabsRes, tareasRes, ordenesRes, prodsRes] = await Promise.all([
        getColaboradores(false), // todos, incluyendo inactivos
        getTareasTrabajo(),
        getOrdenesProduccion(),
        getProductos()
      ]);

      if (colabsRes.data) setColaboradores(colabsRes.data);
      if (tareasRes.data) setTareas(tareasRes.data);
      if (ordenesRes.data) setOrdenes(ordenesRes.data);
      if (prodsRes.data) setProductos(prodsRes.data);

      await Promise.all([
        fetchResumen(),
        fetchRegistros()
      ]);
    } catch (err) {
      console.error('Error al inicializar datos:', err);
      mostrarAlerta('error', 'Error al cargar la información inicial.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumen = async () => {
    const [resumenRes, totalRes] = await Promise.all([
      getResumenManoObra({ desde: fechaDesde, hasta: fechaHasta }),
      getCostoManoObraPeriodo(fechaDesde, fechaHasta)
    ]);
    if (resumenRes.data) setResumenDiario(resumenRes.data);
    if (totalRes.data) setResumenPeriodo(totalRes.data);
  };

  const fetchRegistros = async () => {
    const res = await getRegistrosTrabajo({ desde: fechaDesde, hasta: fechaHasta });
    if (res.data) setRegistros(res.data);
  };

  const fetchCostosProceso = async () => {
    const [costoRes, maqRes] = await Promise.all([
      getCostoPorProceso(),
      getMaquilaPorProducto()
    ]);
    if (costoRes.data) setCostoProceso(costoRes.data);
    if (maqRes.data) setMaquilaProducto(maqRes.data);
  };

  const fetchJornadaColaborador = async (colabId) => {
    if (!colabId) return;
    const activeRes = await getJornadaActiva(colabId);
    setJornadaActiva(activeRes.data);

    const listRes = await getJornadas({ colaboradorId: colabId });
    if (listRes.data) setJornadasColaborador(listRes.data);
  };

  // Acciones Reloj Checador (RPC)
  const handleIniciarJornada = async () => {
    if (!colaboradorChecadorId) return;
    const res = await iniciarJornada(colaboradorChecadorId);
    if (!res.error) {
      mostrarAlerta('success', 'Jornada iniciada correctamente.');
      fetchJornadaColaborador(colaboradorChecadorId);
    } else {
      mostrarAlerta('error', 'Error al iniciar jornada: ' + res.error);
    }
  };

  const handlePausarJornada = async (e) => {
    e.preventDefault();
    if (!jornadaActiva) return;
    const res = await pausarJornada(jornadaActiva.id, formPausa.tipo, formPausa.justificacion);
    if (!res.error) {
      mostrarAlerta('success', 'Jornada pausada correctamente.');
      setShowModalPausa(false);
      setFormPausa({ tipo: 'comida', justificacion: '' });
      fetchJornadaColaborador(colaboradorChecadorId);
    } else {
      mostrarAlerta('error', 'Error al pausar jornada: ' + res.error);
    }
  };

  const handleReanudarJornada = async () => {
    if (!jornadaActiva) return;
    const res = await reanudarJornada(jornadaActiva.id);
    if (!res.error) {
      mostrarAlerta('success', 'Jornada reanudada correctamente.');
      fetchJornadaColaborador(colaboradorChecadorId);
    } else {
      mostrarAlerta('error', 'Error al reanudar jornada: ' + res.error);
    }
  };

  const handleCerrarJornada = async () => {
    if (!jornadaActiva) return;
    if (!window.confirm('¿Deseas finalizar la jornada de trabajo actual?')) return;
    const res = await cerrarJornada(jornadaActiva.id);
    if (!res.error) {
      mostrarAlerta('success', 'Jornada finalizada y registrada correctamente.');
      fetchJornadaColaborador(colaboradorChecadorId);
      fetchResumen();
    } else {
      mostrarAlerta('error', 'Error al finalizar jornada: ' + res.error);
    }
  };

  // Cargar variantes cuando se selecciona un producto en el registro manual
  const handleProductoChange = async (productoId) => {
    setFormRegistro(prev => ({ ...prev, producto_id: productoId, variante_id: '' }));
    if (!productoId) {
      setVariantes([]);
      return;
    }
    const res = await getVariantes(productoId);
    if (res.data) setVariantes(res.data);
  };

  // Cuando cambia la orden seleccionada, se auto-rellenan datos del producto/variante vinculada
  const handleOrdenChange = (ordenId) => {
    if (!ordenId) {
      setFormRegistro(prev => ({
        ...prev,
        orden_produccion_id: '',
        producto_id: '',
        variante_id: ''
      }));
      return;
    }
    const orden = ordenes.find(o => o.id === ordenId);
    if (orden) {
      setFormRegistro(prev => ({
        ...prev,
        orden_produccion_id: ordenId,
        producto_id: orden.producto_id || '',
        variante_id: orden.variante_id || ''
      }));
    }
  };

  // Cuando cambia la tarea, sugerimos la modalidad registrada en BD
  const handleTareaChange = (tareaId) => {
    const tarea = tareas.find(t => t.id === tareaId);
    setFormRegistro(prev => ({
      ...prev,
      tarea_id: tareaId,
      modalidad: tarea ? (tarea.modalidad_sugerida || 'pieza') : 'pieza'
    }));
  };

  // Guardar Colaborador (Nuevo / Editar)
  const handleGuardarColaborador = async (e) => {
    e.preventDefault();
    if (!formColab.nombre.trim()) {
      mostrarAlerta('error', 'El nombre es obligatorio.');
      return;
    }

    const payload = {
      nombre: formColab.nombre,
      rol: formColab.rol,
      tarifa_hora: parseFloat(formColab.tarifa_hora) || 0,
      tarifa_pieza: parseFloat(formColab.tarifa_pieza) || 0,
      activo: formColab.activo,
      notas: formColab.notas
    };

    let res;
    if (colabEditando) {
      res = await updateColaborador(colabEditando.id, payload);
    } else {
      res = await createColaborador(payload);
    }

    if (!res.error) {
      mostrarAlerta('success', colabEditando ? 'Colaborador actualizado.' : 'Colaborador creado.');
      setShowModalColab(false);
      setColabEditando(null);
      // Recargar colaboradores
      const colabsRes = await getColaboradores(false);
      if (colabsRes.data) setColaboradores(colabsRes.data);
    } else {
      mostrarAlerta('error', 'Error al guardar colaborador: ' + res.error);
    }
  };

  // Registrar sesión de trabajo
  const handleRegistrarTrabajo = async (e) => {
    e.preventDefault();
    if (!formRegistro.colaborador_id) {
      mostrarAlerta('error', 'Selecciona un colaborador.');
      return;
    }
    if (!formRegistro.tarea_id) {
      mostrarAlerta('error', 'Selecciona una tarea.');
      return;
    }
    if ((parseFloat(formRegistro.horas) || 0) <= 0) {
      mostrarAlerta('error', 'Ingresa una cantidad válida de horas.');
      return;
    }
    if ((parseInt(formRegistro.cantidad) || 0) <= 0) {
      mostrarAlerta('error', 'Ingresa una cantidad válida de piezas.');
      return;
    }

    const payload = {
      colaborador_id: formRegistro.colaborador_id,
      tarea_id: formRegistro.tarea_id,
      fecha: formRegistro.fecha,
      modalidad: formRegistro.modalidad,
      horas: parseFloat(formRegistro.horas) || 0,
      cantidad: parseInt(formRegistro.cantidad) || 0,
      notas: formRegistro.notas,
      orden_produccion_id: formRegistro.vincularOrden && formRegistro.orden_produccion_id ? formRegistro.orden_produccion_id : null,
      producto_id: formRegistro.producto_id ? parseInt(formRegistro.producto_id) : null,
      variante_id: formRegistro.variante_id ? parseInt(formRegistro.variante_id) : null
    };

    const res = await registrarTrabajo(payload);
    if (!res.error) {
      mostrarAlerta('success', 'Sesión de trabajo registrada con éxito.');
      setShowModalRegistro(false);
      // Limpiar form
      setFormRegistro({
        colaborador_id: '',
        tarea_id: '',
        orden_produccion_id: '',
        producto_id: '',
        variante_id: '',
        fecha: getFechaHoyStr(),
        modalidad: 'pieza',
        horas: 0,
        cantidad: 0,
        notas: '',
        vincularOrden: false
      });
      setVariantes([]);
      // Recargar datos
      if (activeSubTab === 'resumen') fetchResumen();
      if (activeSubTab === 'registros') fetchRegistros();
    } else {
      mostrarAlerta('error', 'Error al registrar sesión: ' + res.error);
    }
  };

  const handleEliminarRegistro = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro de trabajo? El costo acumulado se descontará del reporte.')) return;
    const res = await eliminarRegistroTrabajo(id);
    if (!res.error) {
      mostrarAlerta('success', 'Registro eliminado correctamente.');
      fetchRegistros();
      fetchResumen();
    } else {
      mostrarAlerta('error', 'Error al eliminar registro: ' + res.error);
    }
  };

  const abrirModalEditarColab = (colab) => {
    setColabEditando(colab);
    setFormColab({
      nombre: colab.nombre,
      rol: colab.rol || 'empaque',
      tarifa_hora: colab.tarifa_hora || 0,
      tarifa_pieza: colab.tarifa_pieza || 0,
      activo: colab.activo,
      notas: colab.notes || colab.notas || ''
    });
    setShowModalColab(true);
  };

  const abrirModalCrearColab = () => {
    setColabEditando(null);
    setFormColab({
      nombre: '',
      rol: 'empaque',
      tarifa_hora: 0,
      tarifa_pieza: 0,
      activo: true,
      notas: ''
    });
    setShowModalColab(true);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* Alerta flotante */}
      {alerta.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 24px',
          borderRadius: '8px',
          color: '#fff',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          background: alerta.tipo === 'success' ? colors.olive : colors.terracotta,
          transition: 'all 0.3s ease'
        }}>
          {alerta.tipo === 'success' ? '✓ ' : '⚠ '} {alerta.texto}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', color: colors.espresso, margin: '0 0 5px 0', fontWeight: '300' }}>
            👷 Mano de Obra y Rendimiento
          </h2>
          <p style={{ color: colors.camel, margin: 0, fontSize: '14px' }}>
            Registro de actividades, checador de asistencia y análisis de costo por proceso
          </p>
        </div>
        
        {/* Rango de Fechas (Global para consultas) */}
        {activeSubTab !== 'costos_proceso' && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: colors.camel, textTransform: 'uppercase', fontWeight: 'bold' }}>Desde</label>
              <input 
                type="date" 
                value={fechaDesde} 
                onChange={e => setFechaDesde(e.target.value)} 
                style={{ border: 'none', color: colors.espresso, fontWeight: '600', outline: 'none', background: 'none' }}
              />
            </div>
            <div style={{ color: colors.sand, fontWeight: 'bold' }}>|</div>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: colors.camel, textTransform: 'uppercase', fontWeight: 'bold' }}>Hasta</label>
              <input 
                type="date" 
                value={fechaHasta} 
                onChange={e => setFechaHasta(e.target.value)} 
                style={{ border: 'none', color: colors.espresso, fontWeight: '600', outline: 'none', background: 'none' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navegación de Sub-tabs */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '25px', borderBottom: `1px solid ${colors.sand}`, overflowX: 'auto', paddingBottom: '5px' }}>
        {[
          { id: 'resumen', label: '📊 Resumen y Eficiencia' },
          { id: 'checador', label: '🕐 Reloj Checador' },
          { id: 'registros', label: '⏱️ Historial de Actividades' },
          { id: 'costos_proceso', label: '💰 Costeo por Proceso' },
          { id: 'colaboradores', label: '👥 Colaboradores y Tarifas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === tab.id ? `3px solid ${colors.sidebarBg}` : '3px solid transparent',
              color: activeSubTab === tab.id ? colors.sidebarBg : colors.espresso,
              fontWeight: activeSubTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vista de Carga */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: colors.camel }}>Cargando datos de mano de obra...</div>
      ) : (
        <>
          {/* TAB 1: RESUMEN Y EFICIENCIA */}
          {activeSubTab === 'resumen' && (
            <div>
              {/* KPIs de Periodo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', borderLeft: `5px solid ${colors.sidebarBg}` }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Costo Mano de Obra</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: colors.espresso, marginTop: '5px' }}>
                    {formatearMoneda(resumenPeriodo.costo)}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.olive, marginTop: '5px' }}>Inversión en el periodo</div>
                </div>

                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', borderLeft: `5px solid ${colors.camel}` }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Tiempo Registrado</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: colors.espresso, marginTop: '5px' }}>
                    {(resumenPeriodo.horas || 0).toLocaleString('es-MX', { maximumFractionDigits: 1 })} hrs
                  </div>
                  <div style={{ fontSize: '12px', color: colors.camel, marginTop: '5px' }}>Horas efectivas pagadas</div>
                </div>

                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', borderLeft: `5px solid ${colors.olive}` }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Piezas Procesadas</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: colors.espresso, marginTop: '5px' }}>
                    {(resumenPeriodo.piezas || 0).toLocaleString('es-MX')} pzs
                  </div>
                  <div style={{ fontSize: '12px', color: colors.olive, marginTop: '5px' }}>Volumen total procesado</div>
                </div>

                <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', borderLeft: `5px solid ${colors.gold}` }}>
                  <div style={{ fontSize: '11px', color: colors.camel, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Rendimiento Promedio</div>
                  <div style={{ fontSize: '26px', fontWeight: '700', color: colors.espresso, marginTop: '5px' }}>
                    {resumenPeriodo.horas > 0 ? ((resumenPeriodo.piezas || 0) / resumenPeriodo.horas).toFixed(1) : '0.0'} pz/hr
                  </div>
                  <div style={{ fontSize: '12px', color: colors.gold, marginTop: '5px' }}>Velocidad general por hora</div>
                </div>
              </div>

              {/* Tabla de Resumen Diario y Tarea (v_mano_obra) */}
              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.cream}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: colors.espresso, fontSize: '16px', fontWeight: '600' }}>
                    📈 Desglose Diario de Productividad
                  </h4>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: colors.cream, borderBottom: `1px solid ${colors.sand}` }}>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Fecha</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Colaborador</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Tarea</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Horas</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Piezas</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Costo</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Productividad</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Costo Prom/Pza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumenDiario.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: colors.camel }}>
                          No hay resumen disponible en este rango de fechas. Registra trabajo o usa el checador.
                        </td>
                      </tr>
                    ) : (
                      resumenDiario.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: `1px solid ${colors.cream}`, fontSize: '13px' }}>
                          <td style={{ padding: '15px' }}>{formatearFechaCorta(row.fecha)}</td>
                          <td style={{ padding: '15px', fontWeight: '600', color: colors.espresso }}>{row.colaborador}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ background: colors.cream, padding: '3px 8px', borderRadius: '4px', fontSize: '11px', color: colors.espresso }}>
                              {row.tarea}
                            </span>
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right' }}>{row.horas ? Number(row.horas).toFixed(1) : '-'}</td>
                          <td style={{ padding: '15px', textAlign: 'right' }}>{row.piezas ? Number(row.piezas).toLocaleString() : '-'}</td>
                          <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: colors.sidebarBg }}>
                            {formatearMoneda(row.costo)}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: colors.olive }}>
                            {row.piezas_por_hora ? `${row.piezas_por_hora} pz/hr` : '-'}
                          </td>
                          <td style={{ padding: '15px', textAlign: 'right', color: colors.terracotta }}>
                            {row.costo_por_pieza ? formatearMoneda(row.costo_por_pieza) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: RELOJ CHECADOR */}
          {activeSubTab === 'checador' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Columna Izquierda: Panel de Checado */}
              <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: colors.espresso, fontWeight: '600', borderBottom: `1px solid ${colors.cream}`, paddingBottom: '10px' }}>
                  🕐 Reloj Checador Digital
                </h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.camel, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Selecciona Colaborador</label>
                  <select
                    value={colaboradorChecadorId}
                    onChange={e => setColaboradorChecadorId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.sand}`, borderRadius: '8px', fontSize: '15px', outline: 'none', background: '#fff' }}
                  >
                    <option value="">-- Elige un colaborador --</option>
                    {colaboradores.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.rol || 'Empaque'})</option>
                    ))}
                  </select>
                </div>

                {colaboradorChecadorId ? (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    {jornadaActiva ? (
                      <div>
                        {/* Estado Badge */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px',
                          background: jornadaActiva.estado === 'activa' ? '#D5F5E3' : '#FCF3CF',
                          color: jornadaActiva.estado === 'activa' ? '#27AE60' : '#B7950B',
                          marginBottom: '20px'
                        }}>
                          <span style={{ fontSize: '10px' }}>●</span>
                          {jornadaActiva.estado === 'activa' ? 'TRABAJANDO (JORNADA ACTIVA)' : 'PAUSADO (EN DESCANSO)'}
                        </div>

                        {/* Cronómetro Digital */}
                        <div style={{ fontSize: '48px', fontWeight: '800', fontFamily: 'monospace', color: colors.espresso, letterSpacing: '2px', marginBottom: '25px' }}>
                          {formatearMs(tiempoNeto)}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', background: colors.cotton, padding: '15px', borderRadius: '8px' }}>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '10px', color: colors.camel, textTransform: 'uppercase' }}>Hora de Inicio</div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: colors.espresso }}>
                              {new Date(jornadaActiva.inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: colors.camel, textTransform: 'uppercase' }}>Pausas Totales</div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: colors.espresso }}>
                              {jornadaActiva.jornada_pausas ? `${jornadaActiva.jornada_pausas.length} pausas` : 'Ninguna'}
                            </div>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                          {jornadaActiva.estado === 'activa' ? (
                            <button
                              onClick={() => setShowModalPausa(true)}
                              style={{ flex: 1, padding: '12px', background: colors.gold, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                            >
                              ⏸️ Pausar Jornada
                            </button>
                          ) : (
                            <button
                              onClick={handleReanudarJornada}
                              style={{ flex: 1, padding: '12px', background: colors.olive, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                            >
                              ▶️ Reanudar Trabajo
                            </button>
                          )}
                          <button
                            onClick={handleCerrarJornada}
                            style={{ flex: 1, padding: '12px', background: colors.terracotta, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            ⏹️ Cerrar Jornada
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '30px 10px' }}>
                        <div style={{ fontSize: '15px', color: colors.camel, marginBottom: '20px' }}>
                          No hay ninguna jornada de trabajo abierta para este colaborador el día de hoy.
                        </div>
                        <button
                          onClick={handleIniciarJornada}
                          style={{ width: '100%', padding: '15px', background: colors.olive, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                        >
                          ▶️ Iniciar Jornada de Trabajo
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '40px 10px', textAlign: 'center', color: colors.camel }}>
                    Selecciona un colaborador para interactuar con el Reloj Checador
                  </div>
                )}
              </div>

              {/* Columna Derecha: Historial de jornadas del colaborador o de todos */}
              <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: colors.espresso, fontWeight: '600', borderBottom: `1px solid ${colors.cream}`, paddingBottom: '10px' }}>
                  📅 Historial de Jornadas Registradas
                </h3>
                
                <div style={{ overflowX: 'auto', maxHeight: '380px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: colors.cream, borderBottom: `1px solid ${colors.sand}` }}>
                        <th style={{ padding: '10px', color: colors.espresso, fontWeight: '600' }}>Fecha</th>
                        <th style={{ padding: '10px', color: colors.espresso, fontWeight: '600' }}>Entrada</th>
                        <th style={{ padding: '10px', color: colors.espresso, fontWeight: '600' }}>Salida</th>
                        <th style={{ padding: '10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Pausas</th>
                        <th style={{ padding: '10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Hrs Netas</th>
                        <th style={{ padding: '10px', color: colors.espresso, fontWeight: '600' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jornadasColaborador.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: colors.camel }}>
                            {colaboradorChecadorId ? 'Sin jornadas registradas aún.' : 'Elige un colaborador a la izquierda.'}
                          </td>
                        </tr>
                      ) : (
                        jornadasColaborador.map(j => (
                          <tr key={j.id} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                            <td style={{ padding: '10px' }}>{formatearFechaCorta(j.fecha)}</td>
                            <td style={{ padding: '10px' }}>{new Date(j.inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                            <td style={{ padding: '10px' }}>
                              {j.fin ? new Date(j.fin).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', color: colors.gold }}>
                              {j.horas_pausa > 0 ? `${j.horas_pausa.toFixed(1)} hrs` : '-'}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: colors.espresso }}>
                              {j.horas_netas ? `${j.horas_netas.toFixed(2)} hrs` : '-'}
                            </td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ 
                                padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold',
                                background: j.estado === 'cerrada' ? '#EAECEE' : j.estado === 'activa' ? '#D5F5E3' : '#FCF3CF',
                                color: j.estado === 'cerrada' ? '#5D6D7E' : j.estado === 'activa' ? '#27AE60' : '#B7950B',
                              }}>
                                {j.estado.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTROS DE TRABAJO */}
          {activeSubTab === 'registros' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', color: colors.camel }}>
                  Mostrando sesiones del periodo seleccionado arriba
                </div>
                <button
                  onClick={() => setShowModalRegistro(true)}
                  style={{
                    background: colors.sidebarBg,
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  ➕ Registrar Trabajo
                </button>
              </div>

              {/* Listado de Registros */}
              <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: colors.cream, borderBottom: `1px solid ${colors.sand}` }}>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Fecha</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Colaborador</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Tarea</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Orden / Producto</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Horas Dedicadas</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Piezas Producidas</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Tarifa Usada</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Costo Total</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px' }}>Notas</th>
                      <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.length === 0 ? (
                      <tr>
                        <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: colors.camel }}>
                          No hay registros de trabajo guardados en este periodo.
                        </td>
                      </tr>
                    ) : (
                      registros.map(reg => {
                        const colabNombre = reg.colaboradores?.nombre || 'Desconocido';
                        const tareaNombre = reg.tareas_trabajo?.nombre || 'N/A';
                        const ordenFolio = reg.orden_produccion_id ? `Orden #${reg.orden_produccion_id.substring(0, 8)}` : null;
                        
                        return (
                          <tr key={reg.id} style={{ borderBottom: `1px solid ${colors.cream}`, fontSize: '13px' }}>
                            <td style={{ padding: '15px' }}>{formatearFechaCorta(reg.fecha)}</td>
                            <td style={{ padding: '15px', fontWeight: '600', color: colors.espresso }}>
                              {colabNombre}
                              <div style={{ fontSize: '10px', color: colors.camel, fontWeight: 'normal' }}>
                                {reg.colaboradores?.rol}
                              </div>
                            </td>
                            <td style={{ padding: '15px' }}>{tareaNombre}</td>
                            <td style={{ padding: '15px' }}>
                              {ordenFolio && (
                                <div style={{ fontWeight: '600', color: colors.olive, fontSize: '12px', marginBottom: '2px' }}>
                                  🏭 {ordenFolio}
                                </div>
                              )}
                              {reg.producto_id ? (
                                <div style={{ fontSize: '11px', color: colors.camel }}>
                                  ID Prod: {reg.producto_id} {reg.variante_id ? `/ Var: ${reg.variante_id}` : ''}
                                </div>
                              ) : (
                                <span style={{ color: '#aaa', fontSize: '11px' }}>No vinculado</span>
                              )}
                            </td>
                            <td style={{ padding: '15px', textAlign: 'right' }}>
                              {reg.horas ? `⏱️ ${Number(reg.horas).toFixed(1)} hrs` : '0.0 hrs'}
                            </td>
                            <td style={{ padding: '15px', textAlign: 'right' }}>
                              {reg.cantidad ? `📦 ${Number(reg.cantidad).toLocaleString()} pzs` : '0 pzs'}
                            </td>
                            <td style={{ padding: '15px', textAlign: 'right', color: colors.camel }}>
                              {formatearMoneda(reg.tarifa_aplicada)}
                              <span style={{ fontSize: '10px' }}>/{reg.modalidad === 'hora' ? 'hr' : 'pz'}</span>
                            </td>
                            <td style={{ padding: '15px', textAlign: 'right', fontWeight: '700', color: colors.sidebarBg }}>
                              {formatearMoneda(reg.costo)}
                            </td>
                            <td style={{ padding: '15px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={reg.notes || reg.notas}>
                              {reg.notes || reg.notas || '-'}
                            </td>
                            <td style={{ padding: '15px', textAlign: 'center' }}>
                              <button
                                onClick={() => handleEliminarRegistro(reg.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: colors.terracotta,
                                  fontSize: '14px',
                                  padding: '4px'
                                }}
                                title="Eliminar sesión de trabajo"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: COSTEO POR PROCESO */}
          {activeSubTab === 'costos_proceso' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }}>
              
              {/* Costeo por Proceso Table */}
              <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: colors.espresso, fontWeight: '600', borderBottom: `1px solid ${colors.cream}`, paddingBottom: '10px' }}>
                  💸 Costo Real de Operación por Proceso
                </h3>
                <p style={{ fontSize: '13px', color: colors.camel, margin: '0 0 20px 0' }}>
                  El costo unitario por pieza se calcula dividiendo la nómina total pagada (horas × tarifa o piezas × tarifa) entre el número de piezas producidas en cada tarea.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: colors.cream, borderBottom: `1px solid ${colors.sand}` }}>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600' }}>Producto</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600' }}>Proceso / Tarea</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Horas Totales</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Piezas Listas</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Costo Acum.</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Costo Real / Pza</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costoProceso.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: colors.camel }}>
                            Sin datos de costeo de procesos aún. Registra actividades con piezas y horas para calcular.
                          </td>
                        </tr>
                      ) : (
                        costoProceso.map((row, idx) => (
                          <tr key={idx} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                            <td style={{ padding: '12px 10px', fontWeight: '600', color: colors.espresso }}>{row.producto || 'Sin Vincular'}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{ background: colors.cream, padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: colors.espresso }}>
                                {row.proceso}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>{row.horas ? `${row.horas.toFixed(1)} hrs` : '-'}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right' }}>{row.piezas ? Number(row.piezas).toLocaleString() : '-'}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '500', color: colors.sidebarBg }}>
                              {formatearMoneda(row.costo_total)}
                            </td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: colors.terracotta }}>
                              {row.costo_por_pieza ? formatearMoneda(row.costo_por_pieza) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Maquila Real vs Estándar Table */}
              <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: colors.espresso, fontWeight: '600', borderBottom: `1px solid ${colors.cream}`, paddingBottom: '10px' }}>
                  🧵 Costo de Maquila vs Estándar ($20)
                </h3>
                <p style={{ fontSize: '13px', color: colors.camel, margin: '0 0 20px 0' }}>
                  Compara la suma de la maquila real de todos los procesos contra el costo estándar de maquila de referencia del producto.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: colors.cream, borderBottom: `1px solid ${colors.sand}` }}>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600' }}>Producto</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Maquila Real</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Estándar</th>
                        <th style={{ padding: '12px 10px', color: colors.espresso, fontWeight: '600', textAlign: 'right' }}>Desviación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maquilaProducto.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: colors.camel }}>
                            Sin datos de maquila real aún.
                          </td>
                        </tr>
                      ) : (
                        maquilaProducto.map((row, idx) => {
                          const esMayor = row.diferencia_vs_estandar > 0;
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                              <td style={{ padding: '12px 10px', fontWeight: '600', color: colors.espresso }}>{row.producto}</td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: '700', color: colors.sidebarBg }}>
                                {formatearMoneda(row.maquila_real_por_pieza)}
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', color: colors.camel }}>
                                {formatearMoneda(row.maquila_estandar || 20)}
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', 
                                color: esMayor ? colors.terracotta : colors.olive 
                              }}>
                                {row.diferencia_vs_estandar > 0 ? '+' : ''}{formatearMoneda(row.diferencia_vs_estandar)}
                                <span style={{ fontSize: '10px', display: 'block', fontWeight: 'normal' }}>
                                  {esMayor ? '🔴 Sobrecosto' : '🟢 Eficiencia'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: COLABORADORES Y TARIFAS */}
          {activeSubTab === 'colaboradores' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', color: colors.camel }}>
                  Configuración de tarifas base para nómina y destajo
                </div>
                <button
                  onClick={abrirModalCrearColab}
                  style={{
                    background: colors.sidebarBg,
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                  }}
                >
                  ➕ Nuevo Colaborador
                </button>
              </div>

              {/* Grid de colaboradores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {colaboradores.map(colab => (
                  <div 
                    key={colab.id} 
                    style={{ 
                      background: '#fff', 
                      borderRadius: '12px', 
                      padding: '20px', 
                      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                      borderTop: `4px solid ${colab.activo ? colors.olive : colors.sand}`,
                      opacity: colab.activo ? 1 : 0.6
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: colors.espresso, fontSize: '16px', fontWeight: '600' }}>
                          {colab.nombre}
                        </h4>
                        <span style={{ 
                          fontSize: '11px', 
                          background: colors.cream, 
                          color: colors.espresso, 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          textTransform: 'uppercase',
                          fontWeight: 'bold' 
                        }}>
                          {colab.rol || 'Empaque'}
                        </span>
                      </div>
                      
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '20px',
                        background: colab.activo ? '#D5F5E3' : '#FADBD8',
                        color: colab.activo ? '#27AE60' : '#C0392B',
                        fontWeight: 'bold'
                      }}>
                        {colab.activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${colors.cream}`, paddingTop: '12px', marginBottom: '15px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: colors.camel, textTransform: 'uppercase' }}>Tarifa por Hora</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: colors.espresso }}>
                          {formatearMoneda(colab.tarifa_hora)}<span style={{ fontSize: '11px', fontWeight: 'normal' }}>/hr</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: colors.camel, textTransform: 'uppercase' }}>Tarifa por Pieza</div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: colors.espresso }}>
                          {formatearMoneda(colab.tarifa_pieza)}<span style={{ fontSize: '11px', fontWeight: 'normal' }}>/pz</span>
                        </div>
                      </div>
                    </div>

                    {colab.notas && (
                      <p style={{ fontSize: '12px', color: colors.camel, fontStyle: 'italic', margin: '0 0 15px 0', background: colors.cotton, padding: '8px', borderRadius: '4px' }}>
                        "{colab.notes || colab.notas}"
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button
                        onClick={() => abrirModalEditarColab(colab)}
                        style={{
                          background: 'none',
                          border: `1px solid ${colors.camel}`,
                          color: colors.camel,
                          padding: '6px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                      >
                        ⚙️ Editar Tarifas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: REGISTRAR TRABAJO */}
      {showModalRegistro && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
          padding: '15px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '550px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <div style={{ background: colors.sidebarBg, color: colors.sidebarText, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>👷 Registrar Sesión de Trabajo</h3>
              <button onClick={() => setShowModalRegistro(false)} style={{ background: 'none', border: 'none', color: colors.sidebarText, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handleRegistrarTrabajo} style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Colaborador *</label>
                  <select
                    value={formRegistro.colaborador_id}
                    onChange={e => setFormRegistro(prev => ({ ...prev, colaborador_id: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {colaboradores.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.rol || 'Empaque'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Fecha *</label>
                  <input
                    type="date"
                    value={formRegistro.fecha}
                    onChange={e => setFormRegistro(prev => ({ ...prev, fecha: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Tarea *</label>
                  <select
                    value={formRegistro.tarea_id}
                    onChange={e => handleTareaChange(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    required
                  >
                    <option value="">-- Seleccionar --</option>
                    {tareas.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Modalidad de Pago *</label>
                  <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formRegistro.modalidad === 'pieza'}
                        onChange={() => setFormRegistro(prev => ({ ...prev, modalidad: 'pieza' }))}
                      />
                      Por pieza (Destajo)
                    </label>
                    <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={formRegistro.modalidad === 'hora'}
                        onChange={() => setFormRegistro(prev => ({ ...prev, modalidad: 'hora' }))}
                      />
                      Por hora
                    </label>
                  </div>
                </div>
              </div>

              {/* Inputs obligatorios para horas y piezas en ambas modalidades */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', background: '#fcfcfc', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.cream}` }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>
                    Horas Trabajadas *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formRegistro.horas}
                    onChange={e => setFormRegistro(prev => ({ ...prev, horas: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    min="0.1"
                    required
                  />
                  <span style={{ fontSize: '10px', color: colors.camel }}>
                    {formRegistro.modalidad === 'hora' ? 'Determina el pago de la sesión.' : 'Ayuda a calcular productividad.'}
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>
                    Cantidad Producida (piezas) *
                  </label>
                  <input
                    type="number"
                    value={formRegistro.cantidad}
                    onChange={e => setFormRegistro(prev => ({ ...prev, cantidad: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    min="1"
                    required
                  />
                  <span style={{ fontSize: '10px', color: colors.camel }}>
                    {formRegistro.modalidad === 'pieza' ? 'Determina el pago de la sesión.' : 'Requerido para costear el proceso real.'}
                  </span>
                </div>
              </div>

              {/* Vinculación con Orden de Producción */}
              <div style={{ background: colors.cream, padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: colors.espresso, cursor: 'pointer', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    checked={formRegistro.vincularOrden}
                    onChange={e => setFormRegistro(prev => ({ ...prev, vincularOrden: e.target.checked, orden_produccion_id: '', producto_id: '', variante_id: '' }))}
                  />
                  🔗 Vincular con Orden de Producción
                </label>

                {formRegistro.vincularOrden ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: colors.espresso, marginBottom: '4px' }}>Seleccionar Orden</label>
                    <select
                      value={formRegistro.orden_produccion_id}
                      onChange={e => handleOrdenChange(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '13px', background: '#fff' }}
                      required
                    >
                      <option value="">-- Seleccionar Orden Activa --</option>
                      {ordenes.filter(o => o.estado === 'en_proceso' || o.estado === 'completada').slice(0, 15).map(o => (
                        <option key={o.id} value={o.id}>
                          Ord #{o.id.substring(0, 6).toUpperCase()} - {o.producto_nombre || 'S/N'} ({o.cantidad} pzs) - {o.estado.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: colors.espresso, marginBottom: '4px' }}>Producto (Opcional)</label>
                      <select
                        value={formRegistro.producto_id}
                        onChange={e => handleProductoChange(e.target.value)}
                        style={{ width: '100%', padding: '8px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '13px', background: '#fff' }}
                      >
                        <option value="">-- Ninguno --</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.linea_nombre || p.descripcion}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', color: colors.espresso, marginBottom: '4px' }}>Variante (Opcional)</label>
                      <select
                        value={formRegistro.variante_id}
                        onChange={e => setFormRegistro(prev => ({ ...prev, variante_id: e.target.value }))}
                        style={{ width: '100%', padding: '8px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '13px', background: '#fff' }}
                        disabled={!formRegistro.producto_id}
                      >
                        <option value="">-- Ninguna --</option>
                        {variantes.map(v => (
                          <option key={v.id} value={v.id}>{v.variante_label || [v.material, v.color, v.talla].filter(Boolean).join(' - ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Notas</label>
                <textarea
                  value={formRegistro.notas}
                  onChange={e => setFormRegistro(prev => ({ ...prev, notas: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none', height: '60px', resize: 'none' }}
                  placeholder="Detalles sobre el lote, incidentes, etc."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalRegistro(false)}
                  style={{ padding: '10px 20px', background: colors.sand, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: colors.sidebarBg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Registrar Trabajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR/EDITAR COLABORADOR */}
      {showModalColab && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
          padding: '15px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <div style={{ background: colors.sidebarBg, color: colors.sidebarText, padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                {colabEditando ? '⚙️ Configurar Tarifas' : '👥 Nuevo Colaborador'}
              </h3>
              <button onClick={() => setShowModalColab(false)} style={{ background: 'none', border: 'none', color: colors.sidebarText, fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handleGuardarColaborador} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Nombre Completo *</label>
                <input
                  type="text"
                  value={formColab.nombre}
                  onChange={e => setFormColab(prev => ({ ...prev, nombre: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                  placeholder="Ej: Alejandra Gómez"
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Rol Principal</label>
                <select
                  value={formColab.rol}
                  onChange={e => setFormColab(prev => ({ ...prev, rol: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                >
                  <option value="empaque">Empaque / Doblado</option>
                  <option value="corte">Corte</option>
                  <option value="costura">Costura / Confección</option>
                  <option value="acabado">Planchado / Acabados</option>
                  <option value="multi">Multiusos</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Tarifa por Hora ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formColab.tarifa_hora}
                    onChange={e => setFormColab(prev => ({ ...prev, tarifa_hora: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Tarifa por Pieza ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formColab.tarifa_pieza}
                    onChange={e => setFormColab(prev => ({ ...prev, tarifa_pieza: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none' }}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formColab.activo}
                    onChange={e => setFormColab(prev => ({ ...prev, activo: e.target.checked }))}
                  />
                  Colaborador Activo (Disponible para asignación de tareas)
                </label>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Notas</label>
                <textarea
                  value={formColab.notas}
                  onChange={e => setFormColab(prev => ({ ...prev, notas: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none', height: '60px', resize: 'none' }}
                  placeholder="Detalles adicionales sobre experiencia, horarios, etc."
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalColab(false)}
                  style={{ padding: '10px 20px', background: colors.sand, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: colors.sidebarBg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {colabEditando ? 'Guardar Cambios' : 'Crear Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOMAR PAUSA */}
      {showModalPausa && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000,
          padding: '15px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}>
            <div style={{ background: colors.gold, color: '#fff', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>⏸️ Registrar Descanso / Pausa</h3>
              <button onClick={() => setShowModalPausa(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <form onSubmit={handlePausarJornada} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px', fontWeight: '600' }}>Tipo de Pausa *</label>
                <select
                  value={formPausa.tipo}
                  onChange={e => setFormPausa(prev => ({ ...prev, tipo: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: `1px solid ${colors.sand}`, borderRadius: '8px', fontSize: '14px', outline: 'none', background: '#fff' }}
                  required
                >
                  <option value="comida">Comida / Almuerzo</option>
                  <option value="permiso">Permiso Temporal</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: colors.espresso, marginBottom: '5px' }}>Justificación / Nota</label>
                <textarea
                  value={formPausa.justificacion}
                  onChange={e => setFormPausa(prev => ({ ...prev, justificacion: e.target.value }))}
                  style={{ width: '100%', padding: '8px 12px', border: `1px solid ${colors.sand}`, borderRadius: '6px', fontSize: '14px', outline: 'none', height: '60px', resize: 'none' }}
                  placeholder="Ej: Salida a banco o almuerzo reglamentario"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalPausa(false)}
                  style={{ padding: '10px 20px', background: colors.sand, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: colors.gold, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Pausar Jornada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManoObraView;

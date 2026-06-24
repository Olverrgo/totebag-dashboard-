import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';
import { 
  isSupabaseConfigured, 
  getProductos, 
  getCategorias,
  getMercanciaEnCalle,
  updateStockVarianteLote
} from '../supabaseClient';

const StocksView = ({ isAdmin }) => {
  const [productosGuardados, setProductosGuardados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null); // null = todas
  const [busqueda, setBusqueda] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos'); // 'todos' | 'suficiente' | 'bajo' | 'agotado'
  const [vistaActiva, setVistaActiva] = useState('gestion'); // 'resumen' | 'gestion'
  
  // Estado para edición por tarjeta
  const [valoresEditables, setValoresEditables] = useState({}); // { [id]: { stock: string, stock_consignacion: string } }
  const [modoEdicion, setModoEdicion] = useState({}); // { [productoId]: 'ajuste' | 'absoluto' }
  const [consignacionDesbloqueada, setConsignacionDesbloqueada] = useState({}); // { [productoId]: boolean }
  
  const [mercanciaEnCalle, setMercanciaEnCalle] = useState({ piezas: 0, costoTotal: 0, valorVenta: 0 });
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [imagenPopup, setImagenPopup] = useState(null); // { url, nombre }

  // Cargar datos
  const cargarDatos = async () => {
    if (!isSupabaseConfigured) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const [prodRes, catRes, mercRes] = await Promise.all([
        getProductos(),
        getCategorias(),
        getMercanciaEnCalle()
      ]);

      if (prodRes.data) {
        setProductosGuardados(prodRes.data);
      }
      if (catRes.data) {
        setCategorias(catRes.data);
      }
      if (mercRes.data) {
        setMercanciaEnCalle(mercRes.data);
      }
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los datos de stock.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Calcular métricas de Taller basadas en costo real
  let totalTaller = 0;
  let valorTaller = 0;
  productosGuardados.forEach(prod => {
    const tieneVariantes = prod.tiene_variantes;
    if (tieneVariantes) {
      const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
      variantesActivas.forEach(v => {
        const stock = v.stock || 0;
        const costo = parseFloat(v.costo_unitario) || 0;
        totalTaller += stock;
        valorTaller += stock * costo;
      });
    } else {
      const stock = prod.stock || 0;
      const costo = parseFloat(prod.costo_total_1_tinta) || 0;
      totalTaller += stock;
      valorTaller += stock * costo;
    }
  });

  // Helper para cálculo en vivo del stock resultante
  const calcularStockDestino = (currentVal, inputVal, mode) => {
    if (inputVal === undefined || inputVal.trim() === '') {
      return currentVal;
    }
    const val = parseInt(inputVal);
    if (isNaN(val)) return currentVal;

    if (mode === 'absoluto') {
      return val;
    } else {
      // mode: ajuste
      return currentVal + val;
    }
  };

  // Validaciones preventivas a nivel de interfaz de tarjeta
  const esCambioInvalido = (prod) => {
    const mode = modoEdicion[prod.id] || 'ajuste';
    const items = prod.tiene_variantes ? (prod.variantes || []).filter(v => v.activo !== false) : [prod];

    let hayCambios = false;
    for (const item of items) {
      const edit = valoresEditables[item.id];
      if (edit) {
        if (edit.stock !== undefined && edit.stock.trim() !== '') {
          hayCambios = true;
          const finalStock = calcularStockDestino(item.stock || 0, edit.stock, mode);
          if (finalStock < 0) return 'taller_negativo';
        }
        if (edit.stock_consignacion !== undefined && edit.stock_consignacion.trim() !== '') {
          hayCambios = true;
          const finalConsig = calcularStockDestino(item.stock_consignacion || 0, edit.stock_consignacion, mode);
          if (finalConsig < 0) return 'consig_negativa';
        }
      }
    }
    return hayCambios ? null : 'sin_cambios';
  };

  // Guardado agrupado por lote (Batch Save) a nivel de tarjeta de producto
  const guardarCambiosProducto = async (prod) => {
    const validation = esCambioInvalido(prod);
    if (validation === 'taller_negativo') {
      setMensaje({ tipo: 'error', texto: 'El stock resultante en taller no puede ser negativo.' });
      return;
    }
    if (validation === 'consig_negativa') {
      setMensaje({ tipo: 'error', texto: 'El stock resultante en consignación no puede ser negativo.' });
      return;
    }
    if (validation === 'sin_cambios') {
      return;
    }

    const mode = modoEdicion[prod.id] || 'ajuste';
    const items = prod.tiene_variantes ? (prod.variantes || []).filter(v => v.activo !== false) : [prod];
    const cambios = [];
    let modificoConsignacion = false;

    for (const item of items) {
      const edit = valoresEditables[item.id];
      if (edit) {
        const cambio = {
          tipo: prod.tiene_variantes ? 'variante' : 'producto',
          id: item.id
        };

        let tieneUpdates = false;

        if (edit.stock !== undefined && edit.stock.trim() !== '') {
          const finalStock = calcularStockDestino(item.stock || 0, edit.stock, mode);
          cambio.stock = finalStock;
          tieneUpdates = true;
        }

        if (edit.stock_consignacion !== undefined && edit.stock_consignacion.trim() !== '') {
          const finalConsig = calcularStockDestino(item.stock_consignacion || 0, edit.stock_consignacion, mode);
          cambio.stock_consignacion = finalConsig;
          tieneUpdates = true;
          modificoConsignacion = true;
        }

        if (tieneUpdates) {
          cambios.push(cambio);
        }
      }
    }

    if (cambios.length === 0) return;

    // Doble confirmación visual si modificó stock de consignación
    if (modificoConsignacion) {
      const confirmar = window.confirm(
        "⚠️ ATENCIÓN:\nModificar el stock de consignación manualmente no ajusta el saldo deudor ni las cuentas de los clientes en las ventas.\n\n¿Estás seguro de que deseas continuar con esta actualización?"
      );
      if (!confirmar) return;
    }

    setGuardando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const res = await updateStockVarianteLote(cambios);
      
      if (!res.ok) {
        const errores = res.resultados.filter(r => !r.ok).map(r => `${r.tipo} (${r.id}): ${r.error}`).join('\n');
        setMensaje({ 
          tipo: 'error', 
          texto: `Error al actualizar algunas filas:\n${errores}` 
        });
      } else {
        setMensaje({ 
          tipo: 'exito', 
          texto: `¡Stock actualizado correctamente! (${res.totalOk} cambios guardados)` 
        });

        // Limpiar inputs locales del producto
        const nuevosValores = { ...valoresEditables };
        items.forEach(item => {
          delete nuevosValores[item.id];
        });
        setValoresEditables(nuevosValores);

        // Recargar datos y recalcular
        await cargarDatos();
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error inesperado: ${err.message}` });
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado de productos basado en filtros avanzados
  const productosFiltrados = productosGuardados.filter(prod => {
    // 1. Filtro de Categoría
    if (categoriaActiva && prod.categoria_id !== categoriaActiva.id) {
      return false;
    }

    // 2. Filtro de Búsqueda (Texto, SKU, Características)
    if (busqueda.trim() !== '') {
      const query = busqueda.toLowerCase();
      const matchNombre = prod.linea_nombre?.toLowerCase().includes(query);
      const matchSKU = prod.variantes?.some(v => v.sku?.toLowerCase().includes(query));
      const matchVarNombre = prod.variantes?.some(v => 
        [v.material, v.color, v.talla].filter(Boolean).join(' ').toLowerCase().includes(query)
      );
      if (!matchNombre && !matchSKU && !matchVarNombre) {
        return false;
      }
    }

    // 3. Filtro de Alerta de Stock
    if (filtroStock !== 'todos') {
      const tieneVariantes = prod.tiene_variantes;
      if (tieneVariantes) {
        const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
        
        if (filtroStock === 'agotado') {
          return variantesActivas.every(v => (v.stock || 0) + (v.stock_consignacion || 0) === 0);
        } else if (filtroStock === 'bajo') {
          return variantesActivas.some(v => {
            const sum = (v.stock || 0) + (v.stock_consignacion || 0);
            return sum > 0 && sum <= 10;
          });
        } else if (filtroStock === 'suficiente') {
          return variantesActivas.every(v => (v.stock || 0) + (v.stock_consignacion || 0) > 10);
        }
      } else {
        const stockTotal = (prod.stock || 0) + (prod.stock_consignacion || 0);
        if (filtroStock === 'agotado') {
          return stockTotal === 0;
        } else if (filtroStock === 'bajo') {
          return stockTotal > 0 && stockTotal <= 10;
        } else if (filtroStock === 'suficiente') {
          return stockTotal > 10;
        }
      }
    }

    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
          Stocks
        </h2>
        {!isAdmin && (
          <span style={{ fontSize: '12px', color: colors.terracotta, background: 'rgba(196,120,74,0.1)', padding: '6px 12px', borderRadius: '4px' }}>
            Solo lectura (Admin requerido)
          </span>
        )}
      </div>

      {/* Grid de KPIs con diseño elegante y premium */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        {/* KPI 1 - Stock Taller */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF, #F3F9F6)',
          border: `2px solid ${colors.olive}`,
          borderRadius: '12px',
          padding: '18px',
          boxShadow: '0 4px 15px rgba(107,126,82,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: colors.olive, letterSpacing: '1px', textTransform: 'uppercase' }}>
            📦 Stock en Taller
          </span>
          <div style={{ margin: '12px 0 4px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: colors.espresso }}>
              {totalTaller.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: colors.camel, marginLeft: '6px' }}>pzas</span>
          </div>
          <span style={{ fontSize: '11px', color: colors.camel }}>Disponible en almacén principal</span>
        </div>

        {/* KPI 2 - Valor Taller */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF, #F3F9F6)',
          border: `2px solid ${colors.olive}`,
          borderRadius: '12px',
          padding: '18px',
          boxShadow: '0 4px 15px rgba(107,126,82,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: colors.olive, letterSpacing: '1px', textTransform: 'uppercase' }}>
            💰 Valor en Taller
          </span>
          <div style={{ margin: '12px 0 4px' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: colors.espresso }}>
              ${valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: colors.camel }}>Valuado a costo de manufactura/compra</span>
        </div>

        {/* KPI 3 - Stock Consignación */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF, #FCF5F3)',
          border: `2px solid ${colors.terracotta}`,
          borderRadius: '12px',
          padding: '18px',
          boxShadow: '0 4px 15px rgba(196,120,74,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: colors.terracotta, letterSpacing: '1px', textTransform: 'uppercase' }}>
            🤝 Stock en Consignación
          </span>
          <div style={{ margin: '12px 0 4px' }}>
            <span style={{ fontSize: '28px', fontWeight: '800', color: colors.espresso }}>
              {mercanciaEnCalle.piezas.toLocaleString()}
            </span>
            <span style={{ fontSize: '12px', color: colors.camel, marginLeft: '6px' }}>pzas</span>
          </div>
          <span style={{ fontSize: '11px', color: colors.camel }}>En posesión de vendedores</span>
        </div>

        {/* KPI 4 - Valor Consignación */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF, #FCF5F3)',
          border: `2px solid ${colors.terracotta}`,
          borderRadius: '12px',
          padding: '18px',
          boxShadow: '0 4px 15px rgba(196,120,74,0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: colors.terracotta, letterSpacing: '1px', textTransform: 'uppercase' }}>
            💸 Valor en Consignación
          </span>
          <div style={{ margin: '12px 0 4px' }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: colors.espresso }}>
              ${mercanciaEnCalle.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: colors.camel }}>Capital invertido en calle</span>
        </div>
      </div>

      {/* Control Panel: Buscador, Categorías, Alertas y Selector de Vista */}
      <div style={{
        background: 'white',
        border: `2px solid ${colors.sand}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '25px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          {/* Buscador de Texto */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre de producto, variante o SKU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 15px 10px 38px',
                border: `2px solid ${colors.sand}`,
                borderRadius: '8px',
                fontSize: '14px',
                background: colors.cream,
                color: colors.espresso,
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
            />
          </div>

          {/* Toggle de Modo de Vista */}
          <div style={{
            display: 'flex',
            background: colors.cream,
            border: `2px solid ${colors.sand}`,
            borderRadius: '8px',
            padding: '2px'
          }}>
            <button
              onClick={() => setVistaActiva('gestion')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: vistaActiva === 'gestion' ? colors.sidebarBg : 'transparent',
                color: vistaActiva === 'gestion' ? 'white' : colors.espresso,
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📦 Gestión Operativa
            </button>
            <button
              onClick={() => setVistaActiva('resumen')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                background: vistaActiva === 'resumen' ? colors.sidebarBg : 'transparent',
                color: vistaActiva === 'resumen' ? 'white' : colors.espresso,
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📋 Resumen Financiero
            </button>
          </div>
        </div>

        {/* Categorías */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: colors.camel, marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            📁 Filtrar por Categoría
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategoriaActiva(null)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '20px',
                border: `2px solid ${categoriaActiva === null ? colors.sidebarBg : colors.sand}`,
                background: categoriaActiva === null ? colors.sidebarBg : colors.cream,
                color: categoriaActiva === null ? 'white' : colors.espresso,
                cursor: 'pointer',
                fontWeight: categoriaActiva === null ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              Ver todas
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '20px',
                  border: `2px solid ${categoriaActiva?.id === cat.id ? colors.sidebarBg : colors.sand}`,
                  background: categoriaActiva?.id === cat.id ? colors.sidebarBg : colors.cream,
                  color: categoriaActiva?.id === cat.id ? 'white' : colors.espresso,
                  cursor: 'pointer',
                  fontWeight: categoriaActiva?.id === cat.id ? '600' : '400',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{cat.icono}</span>
                <span>{cat.nombre}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alertas de Stock */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: colors.camel, marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            🚨 Alerta de Inventario
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'todos', label: 'Todos los productos', color: colors.espresso, icon: '⚪' },
              { id: 'suficiente', label: 'Suficiente (> 10 pzas)', color: colors.olive, icon: '🟢' },
              { id: 'bajo', label: 'Stock Bajo (1 a 10 pzas)', color: '#B78A00', icon: '🟡' },
              { id: 'agotado', label: 'Agotado (0 pzas)', color: colors.terracotta, icon: '🔴' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setFiltroStock(status.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '20px',
                  border: `2px solid ${filtroStock === status.id ? status.color : colors.sand}`,
                  background: filtroStock === status.id ? status.color : colors.cream,
                  color: filtroStock === status.id ? 'white' : colors.espresso,
                  cursor: 'pointer',
                  fontWeight: filtroStock === status.id ? '600' : '400',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{status.icon}</span>
                <span>{status.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estado del Mensaje */}
      {mensaje.texto && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          borderRadius: '8px',
          background: mensaje.tipo === 'exito' ? 'rgba(107,126,82,0.12)' :
                      mensaje.tipo === 'info' ? 'rgba(218,159,23,0.1)' : 'rgba(196,120,74,0.12)',
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive :
                              mensaje.tipo === 'info' ? '#DA9F17' : colors.terracotta}`,
          color: mensaje.tipo === 'exito' ? colors.olive :
                 mensaje.tipo === 'info' ? '#DA9F17' : colors.terracotta,
          textAlign: 'center',
          fontWeight: '600',
          fontSize: '14px',
          whiteSpace: 'pre-line'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Cargando State */}
      {cargando ? (
        <div style={{ padding: '50px', textAlign: 'center', color: colors.camel }}>
          <span>🔄 Cargando inventario...</span>
        </div>
      ) : productosGuardados.length === 0 ? (
        <div style={{ background: colors.cotton, border: `2px solid ${colors.sand}`, padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px' }}>📋</span>
          <h3 style={{ margin: '20px 0 10px', color: colors.espresso }}>Sin productos definidos</h3>
          <p style={{ color: colors.camel, fontSize: '14px' }}>Primero define productos en la sección de Productos</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div style={{ background: colors.cotton, border: `2px solid ${colors.sand}`, padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
          <span style={{ fontSize: '32px' }}>🔍</span>
          <h3 style={{ margin: '20px 0 10px', color: colors.espresso }}>Sin resultados</h3>
          <p style={{ color: colors.camel, fontSize: '14px' }}>Ningún producto coincide con los filtros aplicados.</p>
        </div>
      ) : vistaActiva === 'resumen' ? (
        /* VISTA 1: RESUMEN FINANCIERO (TABLA AGRUPADA) */
        <div style={{
          background: 'white',
          borderRadius: '12px',
          overflow: 'hidden',
          border: `2px solid ${colors.sand}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: colors.sidebarBg, color: 'white' }}>
                  <th style={{ padding: '12px 15px', textAlign: 'left', fontWeight: '700' }}>CATEGORÍA / PRODUCTO / VARIANTE</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '700', width: '80px' }}>TALLER</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '700', width: '110px' }}>VALOR TALLER</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '700', width: '80px' }}>CONSIG.</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '700', width: '110px' }}>VALOR CONSIG.</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', fontWeight: '700', width: '120px', background: '#16a085' }}>TOTAL VALOR</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Agrupar productos filtrados por categoría
                  const estructura = {};
                  productosFiltrados.forEach(prod => {
                    const catNombre = prod.categoria?.nombre || 'Sin Categoría';
                    const catIcono = prod.categoria?.icono || '📦';
                    const key = `${catIcono} ${catNombre}`;

                    if (!estructura[key]) {
                      estructura[key] = { productos: [], totales: { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 } };
                    }

                    const prodData = {
                      linea_nombre: prod.linea_nombre,
                      es_manufacturado: prod.es_manufacturado,
                      linea_medidas: prod.linea_medidas,
                      tiene_variantes: prod.tiene_variantes,
                      variantes: [],
                      totales: { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 }
                    };

                    if (prod.tiene_variantes) {
                      const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
                      variantesActivas.forEach(v => {
                        const stock = v.stock || 0;
                        const consig = v.stock_consignacion || 0;
                        const costo = parseFloat(v.costo_unitario) || 0;
                        const nombreVar = [v.material, v.color, v.talla].filter(Boolean).join(' / ') || 'Sin especificar';

                        prodData.variantes.push({
                          nombre: nombreVar,
                          imagen_url: v.imagen_url,
                          sku: v.sku,
                          taller: stock,
                          consignacion: consig,
                          valorTaller: stock * costo,
                          valorConsig: consig * costo
                        });

                        prodData.totales.taller += stock;
                        prodData.totales.consignacion += consig;
                        prodData.totales.valorTaller += stock * costo;
                        prodData.totales.valorConsig += consig * costo;
                      });
                    } else {
                      const stock = prod.stock || 0;
                      const consig = prod.stock_consignacion || 0;
                      const costo = parseFloat(prod.costo_total_1_tinta) || 0;

                      prodData.totales.taller = stock;
                      prodData.totales.consignacion = consig;
                      prodData.totales.valorTaller = stock * costo;
                      prodData.totales.valorConsig = consig * costo;
                    }

                    estructura[key].productos.push(prodData);
                    estructura[key].totales.taller += prodData.totales.taller;
                    estructura[key].totales.consignacion += prodData.totales.consignacion;
                    estructura[key].totales.valorTaller += prodData.totales.valorTaller;
                    estructura[key].totales.valorConsig += prodData.totales.valorConsig;
                  });

                  const keysCategorias = Object.keys(estructura);

                  return (
                    <>
                      {keysCategorias.map((catKey) => {
                        const catData = estructura[catKey];
                        return (
                          <React.Fragment key={catKey}>
                            {/* Fila de Categoría */}
                            <tr style={{ background: colors.sand }}>
                              <td colSpan={6} style={{ padding: '12px 15px', fontWeight: '700', color: colors.sidebarBg, fontSize: '14px' }}>
                                {catKey}
                              </td>
                            </tr>

                            {/* Productos */}
                            {catData.productos.map((prod, pIdx) => (
                              <React.Fragment key={pIdx}>
                                <tr style={{ background: colors.cotton, borderBottom: `1px solid ${colors.sand}` }}>
                                  <td style={{ padding: '10px 15px', paddingLeft: '25px', fontWeight: '600', color: colors.espresso }}>
                                    <span>{prod.linea_nombre}</span>
                                    <span style={{ marginLeft: '8px', fontSize: '9px', padding: '1px 4px', background: 'white', borderRadius: '4px', border: `1px solid ${colors.sand}` }}>
                                      {prod.es_manufacturado ? 'MFG' : 'REV'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '10px 15px', textAlign: 'center', fontWeight: '600', color: colors.olive }}>{prod.totales.taller}</td>
                                  <td style={{ padding: '10px 15px', textAlign: 'center', color: colors.olive }}>${prod.totales.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td style={{ padding: '10px 15px', textAlign: 'center', fontWeight: '600', color: colors.terracotta }}>{prod.totales.consignacion}</td>
                                  <td style={{ padding: '10px 15px', textAlign: 'center', color: colors.terracotta }}>${prod.totales.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                  <td style={{ padding: '10px 15px', textAlign: 'center', fontWeight: '700', color: '#16a085' }}>
                                    ${(prod.totales.valorTaller + prod.totales.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>

                                {/* Variantes */}
                                {prod.variantes.map((v, vIdx) => (
                                  <tr key={vIdx} style={{ background: 'white', borderBottom: '1px solid #f1f1f1' }}>
                                    <td style={{ padding: '8px 15px', paddingLeft: '45px', color: colors.camel, fontSize: '12px' }}>
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        {v.imagen_url && (
                                          <img 
                                            src={v.imagen_url} 
                                            alt="" 
                                            onClick={() => setImagenPopup({ url: v.imagen_url, nombre: v.nombre })} 
                                            style={{ width: '22px', height: '22px', borderRadius: '3px', objectFit: 'cover', cursor: 'pointer' }} 
                                          />
                                        )}
                                        <span>↳ {v.nombre}</span>
                                        {v.sku && <span style={{ fontSize: '9px', color: '#bbb' }}>({v.sku})</span>}
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px 15px', textAlign: 'center', color: colors.olive, fontSize: '12px' }}>{v.taller}</td>
                                    <td style={{ padding: '8px 15px', textAlign: 'center', color: colors.olive, fontSize: '12px' }}>${v.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '8px 15px', textAlign: 'center', color: colors.terracotta, fontSize: '12px' }}>{v.consignacion}</td>
                                    <td style={{ padding: '8px 15px', textAlign: 'center', color: colors.terracotta, fontSize: '12px' }}>${v.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '8px 15px', textAlign: 'center', fontSize: '12px', color: '#16a085' }}>
                                      ${(v.valorTaller + v.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ))}

                            {/* Subtotal de Categoría */}
                            <tr style={{ background: 'rgba(22,160,133,0.08)', fontWeight: '700', borderBottom: `2px solid ${colors.sand}` }}>
                              <td style={{ padding: '12px 15px', color: '#16a085' }}>
                                Subtotal {catKey.replace(/^[^\s]+\s/, '')}
                              </td>
                              <td style={{ padding: '12px 15px', textAlign: 'center', color: colors.olive }}>{catData.totales.taller}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'center', color: colors.olive }}>${catData.totales.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'center', color: colors.terracotta }}>{catData.totales.consignacion}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'center', color: colors.terracotta }}>${catData.totales.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '12px 15px', textAlign: 'center', color: '#16a085', fontSize: '14px' }}>
                                ${(catData.totales.valorTaller + catData.totales.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}

                      {/* TOTAL GENERAL */}
                      <tr style={{ background: colors.sidebarBg, color: 'white', fontWeight: '800', fontSize: '14px' }}>
                        <td style={{ padding: '15px' }}>TOTAL INVENTARIO GENERAL</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>{totalTaller}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>${valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>{mercanciaEnCalle.piezas}</td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>${mercanciaEnCalle.costoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '15px', textAlign: 'center', background: '#16a085', fontSize: '15px' }}>
                          ${(valorTaller + mercanciaEnCalle.costoTotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA 2: GESTIÓN OPERATIVA (TARJETAS DE PRODUCTO) */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {productosFiltrados.map((prod) => {
            const tieneVariantes = prod.tiene_variantes;
            const stockTaller = tieneVariantes ? (prod.stock_variantes || 0) : (prod.stock || 0);
            const stockConsig = tieneVariantes ? (prod.stock_consignacion_variantes || 0) : (prod.stock_consignacion || 0);
            const stockTotal = stockTaller + stockConsig;
            const numVariantes = prod.variantes?.filter(v => v.activo !== false)?.length || 0;

            // Determinar estado de stock del producto
            let statusPill = { label: 'Suficiente', color: colors.olive, bg: 'rgba(107,126,82,0.1)' };
            if (tieneVariantes) {
              const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
              if (variantesActivas.every(v => (v.stock || 0) + (v.stock_consignacion || 0) === 0)) {
                statusPill = { label: 'Agotado', color: colors.terracotta, bg: 'rgba(196,120,74,0.1)' };
              } else if (variantesActivas.some(v => {
                const s = (v.stock || 0) + (v.stock_consignacion || 0);
                return s > 0 && s <= 10;
              })) {
                statusPill = { label: 'Stock Bajo', color: '#B78A00', bg: '#FFF9E6' };
              }
            } else {
              if (stockTotal === 0) {
                statusPill = { label: 'Agotado', color: colors.terracotta, bg: 'rgba(196,120,74,0.1)' };
              } else if (stockTotal > 0 && stockTotal <= 10) {
                statusPill = { label: 'Stock Bajo', color: '#B78A00', bg: '#FFF9E6' };
              }
            }

            // Calcular valor total del producto
            let valorInventario = 0;
            if (tieneVariantes) {
              const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
              variantesActivas.forEach(v => {
                valorInventario += ((v.stock || 0) + (v.stock_consignacion || 0)) * (parseFloat(v.costo_unitario) || 0);
              });
            } else {
              valorInventario = stockTotal * (parseFloat(prod.costo_total_1_tinta) || 0);
            }

            const mode = modoEdicion[prod.id] || 'ajuste';
            const isUnlocked = !!consignacionDesbloqueada[prod.id];
            const validationError = esCambioInvalido(prod);

            // Verificar si hay algún input en este producto
            const items = tieneVariantes ? (prod.variantes || []).filter(v => v.activo !== false) : [prod];
            const tieneCambiosLocales = items.some(item => {
              const edit = valoresEditables[item.id];
              return edit && (
                (edit.stock !== undefined && edit.stock.trim() !== '') || 
                (edit.stock_consignacion !== undefined && edit.stock_consignacion.trim() !== '')
              );
            });

            return (
              <div
                key={prod.id}
                style={{
                  background: 'white',
                  border: `2px solid ${colors.sand}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                  transition: 'transform 0.3s, box-shadow 0.3s'
                }}
              >
                {/* Header Tarjeta */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: `1px solid ${colors.sand}`,
                  paddingBottom: '15px',
                  marginBottom: '15px',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: colors.espresso, fontWeight: '700' }}>
                        {prod.linea_nombre}
                      </h3>
                      <span style={{
                        background: prod.es_manufacturado ? 'rgba(107,126,82,0.1)' : 'rgba(196,120,74,0.1)',
                        color: prod.es_manufacturado ? colors.olive : colors.terracotta,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: `1px solid ${prod.es_manufacturado ? colors.olive : colors.terracotta}`
                      }}>
                        {prod.es_manufacturado ? '🧵 MFG' : '🏷️ REV'}
                      </span>
                      {prod.categoria && (
                        <span style={{
                          background: colors.cream,
                          color: colors.camel,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          border: `1px solid ${colors.sand}`
                        }}>
                          {prod.categoria.icono} {prod.categoria.nombre}
                        </span>
                      )}
                      <span style={{
                        background: statusPill.bg,
                        color: statusPill.color,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {statusPill.label}
                      </span>
                    </div>
                    {prod.linea_medidas && (
                      <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: colors.camel }}>
                        Medidas: {prod.linea_medidas} {tieneVariantes && `• ${numVariantes} variantes`}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: colors.camel }}>VALOR INVENTARIO</span>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: colors.espresso }}>
                        ${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumen de Stock Horizontal */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '15px',
                  background: colors.cream,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: colors.camel, fontWeight: '500' }}>🏢 TALLER</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: colors.olive }}>{stockTaller}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: colors.camel, fontWeight: '500' }}>🤝 CONSIG.</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: colors.terracotta }}>{stockConsig}</span>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', color: colors.camel, fontWeight: '500' }}>📊 TOTAL</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: colors.espresso }}>{stockTotal}</span>
                  </div>
                </div>

                {/* Formulario de Edición (solo para Admin) */}
                {isAdmin && (
                  <div style={{
                    borderTop: `1px solid ${colors.sand}`,
                    paddingTop: '15px'
                  }}>
                    {/* Controles de Configuración de Edición */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: '15px'
                    }}>
                      {/* Modo de Entrada */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso }}>Modo de entrada:</span>
                        <div style={{
                          display: 'flex',
                          background: colors.cream,
                          border: `1px solid ${colors.sand}`,
                          borderRadius: '6px',
                          padding: '2px'
                        }}>
                          <button
                            onClick={() => setModoEdicion({ ...modoEdicion, [prod.id]: 'ajuste' })}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              border: 'none',
                              borderRadius: '4px',
                              background: mode === 'ajuste' ? colors.sidebarBg : 'transparent',
                              color: mode === 'ajuste' ? 'white' : colors.espresso,
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Ajuste +/-
                          </button>
                          <button
                            onClick={() => setModoEdicion({ ...modoEdicion, [prod.id]: 'absoluto' })}
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              border: 'none',
                              borderRadius: '4px',
                              background: mode === 'absoluto' ? colors.sidebarBg : 'transparent',
                              color: mode === 'absoluto' ? 'white' : colors.espresso,
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Fijar Absoluto
                          </button>
                        </div>
                      </div>

                      {/* Candado de Consignación */}
                      <button
                        onClick={() => {
                          if (isUnlocked) {
                            setConsignacionDesbloqueada({ ...consignacionDesbloqueada, [prod.id]: false });
                          } else {
                            const conf = window.confirm(
                              "⚠️ CUIDADO: Modificar stock de consignación directamente desincroniza las deudas de los vendedores y cuentas por cobrar en el historial de ventas. Utilízalo únicamente para correcciones de auditoría.\n\n¿Deseas desbloquear la edición de consignación?"
                            );
                            if (conf) {
                              setConsignacionDesbloqueada({ ...consignacionDesbloqueada, [prod.id]: true });
                            }
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          border: `1px solid ${isUnlocked ? colors.terracotta : colors.sand}`,
                          background: isUnlocked ? 'rgba(196,120,74,0.05)' : colors.cream,
                          color: isUnlocked ? colors.terracotta : colors.camel,
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span>{isUnlocked ? '🔓 Consignación Desbloqueada' : '🔒 Consignación Protegida'}</span>
                      </button>
                    </div>

                    {/* Banner de Advertencia si está desbloqueada */}
                    {isUnlocked && (
                      <div style={{
                        background: '#FFF3CD',
                        border: '1px solid #FFEBA8',
                        color: '#856404',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>⚠️</span>
                        <span>
                          <strong>Advertencia de Consignación:</strong> Estás editando el inventario en calle sin afectar la deuda del vendedor. Utiliza con precaución.
                        </span>
                      </div>
                    )}

                    {/* Lista de Variantes o Producto Único */}
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {items.map((item) => {
                        const nombreVar = tieneVariantes 
                          ? ([item.material, item.color, item.talla].filter(Boolean).join(' / ') || 'Sin especificar')
                          : 'Línea de stock';
                        const skuVar = item.sku;
                        
                        const inputTallerVal = valoresEditables[item.id]?.stock ?? '';
                        const inputConsigVal = valoresEditables[item.id]?.stock_consignacion ?? '';

                        // Previsualización de stock resultante
                        const finalTaller = calcularStockDestino(item.stock || 0, inputTallerVal, mode);
                        const finalConsig = calcularStockDestino(item.stock_consignacion || 0, inputConsigVal, mode);

                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              padding: '10px 15px',
                              background: colors.cream,
                              borderRadius: '8px',
                              border: `1px solid ${colors.sand}`,
                              flexWrap: 'wrap'
                            }}
                          >
                            {/* Variante Info */}
                            <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {tieneVariantes && item.imagen_url ? (
                                <img
                                  src={item.imagen_url}
                                  alt=""
                                  onClick={() => setImagenPopup({ url: item.imagen_url, nombre: nombreVar })}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '4px',
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    border: `1px solid ${colors.sand}`
                                  }}
                                />
                              ) : (
                                <div style={{ fontSize: '20px' }}>📦</div>
                              )}
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: colors.espresso }}>
                                  {nombreVar}
                                </div>
                                {skuVar && (
                                  <div style={{ fontSize: '10px', color: colors.camel }}>
                                    SKU: {skuVar}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Inputs de Edición */}
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* Taller Input */}
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '9px', color: colors.camel, fontWeight: '700', textTransform: 'uppercase' }}>Taller ({item.stock || 0})</span>
                                <input
                                  type="number"
                                  placeholder={mode === 'ajuste' ? '+/-' : 'Fijar'}
                                  value={inputTallerVal}
                                  onChange={(e) => setValoresEditables({
                                    ...valoresEditables,
                                    [item.id]: {
                                      ...valoresEditables[item.id],
                                      stock: e.target.value
                                    }
                                  })}
                                  style={{
                                    width: '75px',
                                    padding: '6px',
                                    border: `2px solid ${colors.olive}`,
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    background: 'white',
                                    color: colors.espresso
                                  }}
                                />
                              </div>

                              {/* Consig Input */}
                              <div style={{ textAlign: 'center' }}>
                                <span style={{ display: 'block', fontSize: '9px', color: colors.camel, fontWeight: '700', textTransform: 'uppercase' }}>Consig ({item.stock_consignacion || 0})</span>
                                <input
                                  type="number"
                                  placeholder={mode === 'ajuste' ? '+/-' : 'Fijar'}
                                  value={inputConsigVal}
                                  disabled={!isUnlocked}
                                  onChange={(e) => setValoresEditables({
                                    ...valoresEditables,
                                    [item.id]: {
                                      ...valoresEditables[item.id],
                                      stock_consignacion: e.target.value
                                    }
                                  })}
                                  style={{
                                    width: '75px',
                                    padding: '6px',
                                    border: `2px solid ${isUnlocked ? colors.terracotta : '#ccc'}`,
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    textAlign: 'center',
                                    background: isUnlocked ? 'white' : '#e9ecef',
                                    color: isUnlocked ? colors.espresso : '#6c757d',
                                    cursor: isUnlocked ? 'text' : 'not-allowed'
                                  }}
                                />
                              </div>

                              {/* Previsualización final */}
                              <div style={{
                                padding: '6px 12px',
                                background: 'white',
                                border: `1px solid ${colors.sand}`,
                                borderRadius: '6px',
                                fontSize: '11px',
                                color: colors.espresso,
                                minWidth: '100px',
                                textAlign: 'center'
                              }}>
                                <span style={{ display: 'block', fontSize: '9px', color: colors.camel, fontWeight: '700' }}>RESULTADO</span>
                                <span style={{ fontWeight: '700', color: finalTaller < 0 ? colors.terracotta : colors.olive }}>
                                  🏢 {finalTaller}
                                </span>
                                <span style={{ margin: '0 4px', color: '#ccc' }}>|</span>
                                <span style={{ fontWeight: '700', color: finalConsig < 0 ? colors.terracotta : colors.terracotta }}>
                                  🤝 {finalConsig}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botones de Acción de Tarjeta */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      marginTop: '15px',
                      gap: '15px'
                    }}>
                      {/* Errores Inline */}
                      {validationError && validationError !== 'sin_cambios' && (
                        <span style={{ fontSize: '12px', color: colors.terracotta, fontWeight: '600' }}>
                          {validationError === 'taller_negativo' 
                            ? '❌ El stock de taller resultante no puede ser negativo.'
                            : '❌ El stock de consignación resultante no puede ser negativo.'}
                        </span>
                      )}

                      {tieneCambiosLocales && (
                        <button
                          onClick={() => {
                            // Limpiar los valores de este producto
                            const nuevosValores = { ...valoresEditables };
                            items.forEach(item => {
                              delete nuevosValores[item.id];
                            });
                            setValoresEditables(nuevosValores);
                          }}
                          style={{
                            padding: '8px 15px',
                            background: 'transparent',
                            color: colors.camel,
                            border: `1px solid ${colors.sand}`,
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Cancelar
                        </button>
                      )}

                      <button
                        onClick={() => guardarCambiosProducto(prod)}
                        disabled={guardando || !tieneCambiosLocales || !!validationError}
                        style={{
                          padding: '10px 20px',
                          background: (tieneCambiosLocales && !validationError) ? colors.sidebarBg : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: (tieneCambiosLocales && !validationError && !guardando) ? 'pointer' : 'not-allowed',
                          boxShadow: (tieneCambiosLocales && !validationError) ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
                          transition: 'all 0.2s',
                          opacity: guardando ? 0.7 : 1
                        }}
                      >
                        {guardando ? 'Guardando...' : '💾 Guardar Todo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Popup de Imagen de Variante en Pantalla Completa */}
      {imagenPopup && (
        <div 
          onClick={() => setImagenPopup(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '80%' }} onClick={(e) => e.stopPropagation()}>
            <img 
              src={imagenPopup.url} 
              alt={imagenPopup.nombre} 
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', boxShadow: '0 5px 25px rgba(0,0,0,0.5)' }} 
            />
            <button 
              onClick={() => setImagenPopup(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'white',
                border: 'none',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
          <span style={{ color: 'white', marginTop: '15px', fontSize: '16px', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {imagenPopup.nombre}
          </span>
        </div>
      )}
    </div>
  );
};

export default StocksView;

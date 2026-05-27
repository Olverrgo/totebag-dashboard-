import React, { useState, useEffect } from 'react';
import { colors } from '../utils/colors';
import { 
  isSupabaseConfigured, 
  getProductos, 
  updateProducto, 
  updateStockVariante 
} from '../supabaseClient';

const StocksView = ({ isAdmin }) => {
  const [productosGuardados, setProductosGuardados] = useState([]);
  const [cantidadAgregar, setCantidadAgregar] = useState({});
  const [cantidadVariante, setCantidadVariante] = useState({}); // Para variantes: { varianteId: cantidad }
  const [cantidadConsigVariante, setCantidadConsigVariante] = useState({}); // Para consignación: { varianteId: cantidad }
  const [expandido, setExpandido] = useState({}); // Productos expandidos para ver variantes
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [hoverGuardar, setHoverGuardar] = useState({});
  const [imagenPopup, setImagenPopup] = useState(null);

  // Cargar productos al montar
  useEffect(() => {
    const cargarProductos = async () => {
      if (isSupabaseConfigured) {
        const { data } = await getProductos();
        if (data) {
          setProductosGuardados(data);
          // Inicializar cantidad a agregar en 0 para todos
          const cantidadInicial = {};
          const cantidadVarianteInicial = {};
          data.forEach(prod => {
            cantidadInicial[prod.id] = 0;
            // Inicializar cantidades de variantes
            if (prod.variantes) {
              prod.variantes.forEach(v => {
                cantidadVarianteInicial[v.id] = 0;
              });
            }
          });
          setCantidadAgregar(cantidadInicial);
          setCantidadVariante(cantidadVarianteInicial);
        }
      }
    };
    cargarProductos();
  }, []);

  // Guardar stock de una variante (taller y/o consignación)
  const guardarStockVariante = async (variante, productoId) => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo administradores pueden modificar el stock' });
      return;
    }

    const cantTaller = parseInt(cantidadVariante[variante.id]) || 0;
    const cantConsig = parseInt(cantidadConsigVariante[variante.id]) || 0;

    if (cantTaller === 0 && cantConsig === 0) {
      setMensaje({ tipo: 'info', texto: 'No hay cambios' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      return;
    }

    // Consignación automática: sumar a consig resta del taller y viceversa
    // cantTaller: ajuste directo al taller (ej: entrada de producción)
    // cantConsig: mueve entre taller y consignación (+consig = -taller, -consig = +taller)
    const nuevoStock = (variante.stock || 0) + cantTaller - cantConsig;
    const nuevaConsig = (variante.stock_consignacion || 0) + cantConsig;

    if (nuevoStock < 0) {
      setMensaje({ tipo: 'error', texto: `Stock insuficiente en taller. Disponible: ${variante.stock || 0}` });
      return;
    }
    if (nuevaConsig < 0) {
      setMensaje({ tipo: 'error', texto: 'El stock en consignación no puede ser negativo' });
      return;
    }

    setGuardando(true);
    try {
      const { error } = await updateStockVariante(variante.id, nuevoStock, nuevaConsig);
      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error: ' + error.message });
      } else {
        const cambios = [];
        cambios.push(`Taller: ${variante.stock || 0} → ${nuevoStock}`);
        cambios.push(`Consig: ${variante.stock_consignacion || 0} → ${nuevaConsig}`);
        setMensaje({ tipo: 'exito', texto: `Stock actualizado. ${cambios.join(' | ')}` });
        // Actualizar lista local
        setProductosGuardados(productosGuardados.map(p => {
          if (Number(p.id) === Number(productoId) && p.variantes) {
            const nuevasVariantes = p.variantes.map(v =>
              Number(v.id) === Number(variante.id) ? { ...v, stock: nuevoStock, stock_consignacion: nuevaConsig } : v
            );
            const variantesActivas = nuevasVariantes.filter(v => v.activo !== false);
            return {
              ...p,
              variantes: nuevasVariantes,
              stock_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0),
              stock_consignacion_variantes: variantesActivas.reduce((sum, v) => sum + (v.stock_consignacion || 0), 0)
            };
          }
          return p;
        }));
        setCantidadVariante({ ...cantidadVariante, [variante.id]: 0 });
        setCantidadConsigVariante({ ...cantidadConsigVariante, [variante.id]: 0 });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  // Guardar stock de un producto (suma al stock actual)
  const guardarStock = async (productoId) => {
    if (!isAdmin) {
      setMensaje({ tipo: 'error', texto: 'Solo administradores pueden modificar el stock' });
      return;
    }

    const cantidad = parseInt(cantidadAgregar[productoId]) || 0;

    // Validar si hay cambios
    if (cantidad === 0) {
      setMensaje({ tipo: 'info', texto: 'No hay cambios' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 2000);
      return;
    }

    setGuardando(true);
    try {
      const producto = productosGuardados.find(p => Number(p.id) === Number(productoId));
      const stockActual = producto?.stock || 0;
      const nuevoStock = stockActual + cantidad;

      // No permitir stock negativo
      if (nuevoStock < 0) {
        setMensaje({ tipo: 'error', texto: 'El stock no puede ser negativo' });
        setGuardando(false);
        return;
      }

      const { error } = await updateProducto(productoId, {
        stock: nuevoStock
      });

      if (error) {
        setMensaje({ tipo: 'error', texto: 'Error al guardar: ' + error.message });
      } else {
        setMensaje({ tipo: 'exito', texto: `Stock actualizado: ${stockActual} + ${cantidad} = ${nuevoStock}` });
        // Actualizar lista local
        setProductosGuardados(productosGuardados.map(p =>
          Number(p.id) === Number(productoId) ? { ...p, stock: nuevoStock } : p
        ));
        // Resetear campo de cantidad a 0
        setCantidadAgregar({ ...cantidadAgregar, [productoId]: 0 });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + err.message });
    } finally {
      setGuardando(false);
    }
  };

  const inputStyle = {
    width: '80px',
    padding: '8px 12px',
    border: '2px solid #DA9F17',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center',
    background: colors.cream
  };

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

      {/* Resumen de inventario detallado por categoría > producto > variante */}
      {productosGuardados.length > 0 && (() => {
        // Agrupar por categoría y producto
        const estructura = {};
        let totalGeneral = { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 };

        productosGuardados.forEach(prod => {
          const catNombre = prod.categoria?.nombre || 'Sin Categoría';
          if (!estructura[catNombre]) {
            estructura[catNombre] = { productos: [], totales: { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 } };
          }

          const productoData = {
            nombre: prod.linea_nombre,
            variantes: [],
            totales: { taller: 0, consignacion: 0, valorTaller: 0, valorConsig: 0 }
          };

          if (prod.tiene_variantes) {
            const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
            variantesActivas.forEach(v => {
              const stock = v.stock || 0;
              const consig = v.stock_consignacion || 0;
              const costo = parseFloat(v.costo_unitario) || 0;
              const nombreVariante = [v.material, v.color, v.talla].filter(Boolean).join(' / ') || 'Sin especificar';

              productoData.variantes.push({
                nombre: nombreVariante,
                imagen: v.imagen_url,
                taller: stock,
                consignacion: consig,
                valorTaller: stock * costo,
                valorConsig: consig * costo
              });

              productoData.totales.taller += stock;
              productoData.totales.consignacion += consig;
              productoData.totales.valorTaller += stock * costo;
              productoData.totales.valorConsig += consig * costo;
            });
          } else {
            const stock = prod.stock || 0;
            const consig = prod.stock_consignacion || 0;
            const costo = parseFloat(prod.costo_total_1_tinta) || 0;

            productoData.totales.taller = stock;
            productoData.totales.consignacion = consig;
            productoData.totales.valorTaller = stock * costo;
            productoData.totales.valorConsig = consig * costo;
          }

          estructura[catNombre].productos.push(productoData);
          estructura[catNombre].totales.taller += productoData.totales.taller;
          estructura[catNombre].totales.consignacion += productoData.totales.consignacion;
          estructura[catNombre].totales.valorTaller += productoData.totales.valorTaller;
          estructura[catNombre].totales.valorConsig += productoData.totales.valorConsig;

          totalGeneral.taller += productoData.totales.taller;
          totalGeneral.consignacion += productoData.totales.consignacion;
          totalGeneral.valorTaller += productoData.totales.valorTaller;
          totalGeneral.valorConsig += productoData.totales.valorConsig;
        });

        const categorias = Object.keys(estructura);

        return (
          <div style={{ marginBottom: '25px' }}>
            <div style={{
              background: 'white',
              borderRadius: '10px',
              overflow: 'hidden',
              border: `2px solid ${colors.sand}`
            }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: colors.sidebarBg, color: 'white' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '600' }}>CATEGORÍA / PRODUCTO / VARIANTE</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '70px' }}>TALLER</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '100px' }}>VALOR</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '70px' }}>CONSIG.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '100px' }}>VALOR</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', width: '110px', background: '#16a085' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((cat) => {
                    const catData = estructura[cat];
                    return (
                      <React.Fragment key={cat}>
                        {/* Fila de categoría */}
                        <tr style={{ background: colors.sand }}>
                          <td colSpan={6} style={{ padding: '10px 12px', fontWeight: '700', color: colors.sidebarBg, fontSize: '14px' }}>
                            📁 {cat}
                          </td>
                        </tr>
                        {/* Productos de esta categoría */}
                        {catData.productos.map((prod, pIdx) => (
                          <React.Fragment key={pIdx}>
                            {/* Fila de producto */}
                            <tr style={{ background: colors.cotton }}>
                              <td style={{ padding: '8px 12px', paddingLeft: '25px', fontWeight: '600', color: colors.espresso }}>
                                {prod.nombre}
                              </td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.olive, fontWeight: '600' }}>{prod.totales.taller}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.olive }}>${prod.totales.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.terracotta, fontWeight: '600' }}>{prod.totales.consignacion}</td>
                              <td style={{ padding: '8px', textAlign: 'center', color: colors.terracotta }}>${prod.totales.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#16a085' }}>
                                ${(prod.totales.valorTaller + prod.totales.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                            {/* Variantes del producto */}
                            {prod.variantes.map((v, vIdx) => (
                              <tr key={vIdx} style={{ background: 'white' }}>
                                <td style={{ padding: '6px 12px', paddingLeft: '45px', color: colors.camel, fontSize: '12px' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    {v.imagen && <img src={v.imagen} alt="" onClick={() => setImagenPopup({ url: v.imagen, nombre: v.nombre })} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }} />}
                                    ↳ {v.nombre}
                                  </span>
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.olive, fontSize: '12px' }}>{v.taller}</td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.olive, fontSize: '12px' }}>${v.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.terracotta, fontSize: '12px' }}>{v.consignacion}</td>
                                <td style={{ padding: '6px', textAlign: 'center', color: colors.terracotta, fontSize: '12px' }}>${v.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td style={{ padding: '6px', textAlign: 'center', fontSize: '12px', color: '#16a085' }}>
                                  ${(v.valorTaller + v.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                        {/* Subtotal de categoría */}
                        <tr style={{ background: 'rgba(22,160,133,0.15)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '700', color: '#16a085' }}>
                            Subtotal {cat}
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: colors.olive }}>{catData.totales.taller}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: colors.olive }}>${catData.totales.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: colors.terracotta }}>{catData.totales.consignacion}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: colors.terracotta }}>${catData.totales.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#16a085', fontSize: '14px' }}>
                            ${(catData.totales.valorTaller + catData.totales.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {/* TOTAL GENERAL */}
                  <tr style={{ background: colors.sidebarBg, color: 'white', fontWeight: '700' }}>
                    <td style={{ padding: '12px' }}>TOTAL GENERAL</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{totalGeneral.taller}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>${totalGeneral.valorTaller.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{totalGeneral.consignacion}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>${totalGeneral.valorConsig.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '12px', textAlign: 'center', background: '#16a085', fontSize: '15px' }}>
                      ${(totalGeneral.valorTaller + totalGeneral.valorConsig).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          </div>
        );
      })()}

      {/* Mensaje de estado */}
      {mensaje.texto && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          borderRadius: '6px',
          background: mensaje.tipo === 'exito' ? 'rgba(171,213,94,0.2)' :
                      mensaje.tipo === 'info' ? 'rgba(50,205,50,0.15)' : 'rgba(196,120,74,0.2)',
          border: `1px solid ${mensaje.tipo === 'exito' ? colors.olive :
                              mensaje.tipo === 'info' ? '#32CD32' : colors.terracotta}`,
          color: mensaje.tipo === 'exito' ? colors.olive :
                 mensaje.tipo === 'info' ? '#32CD32' : colors.terracotta,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {mensaje.texto}
        </div>
      )}

      {/* Lista de productos con stock */}
      {productosGuardados.length > 0 ? (
        <div style={{ display: 'grid', gap: '15px' }}>
          {productosGuardados.map((prod) => {
            // Determinar stock según si tiene variantes o no
            const tieneVariantes = prod.tiene_variantes;
            const stockTaller = tieneVariantes ? (prod.stock_variantes || 0) : (prod.stock || 0);
            const stockConsig = tieneVariantes ? (prod.stock_consignacion_variantes || 0) : (prod.stock_consignacion || 0);
            const stockTotal = stockTaller + stockConsig;
            const numVariantes = prod.variantes?.filter(v => v.activo !== false)?.length || 0;

            // Calcular valor del inventario
            let valorInventario = 0;
            if (tieneVariantes) {
              const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
              variantesActivas.forEach(v => {
                valorInventario += ((v.stock || 0) + (v.stock_consignacion || 0)) * (parseFloat(v.costo_unitario) || 0);
              });
            } else {
              valorInventario = stockTotal * (parseFloat(prod.costo_total_1_tinta) || 0);
            }

            return (
            <React.Fragment key={prod.id}>
            <div style={{
              background: colors.cotton,
              border: `2px solid ${tieneVariantes ? '#16a085' : '#DA9F17'}`,
              padding: '20px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              {/* Info del producto */}
              <div style={{ flex: '1', minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h4 style={{ margin: 0, color: colors.sidebarBg, fontSize: '16px', fontWeight: '600' }}>
                    {prod.linea_nombre}
                  </h4>
                  {tieneVariantes && (
                    <span style={{
                      background: '#16a085', color: 'white', padding: '2px 8px',
                      borderRadius: '10px', fontSize: '10px', fontWeight: '600'
                    }}>
                      {numVariantes} variantes
                    </span>
                  )}
                </div>
                <p style={{ margin: '5px 0 0', color: colors.camel, fontSize: '13px' }}>
                  {prod.categoria?.nombre && <span style={{ fontWeight: '500' }}>{prod.categoria.nombre}</span>}
                  {prod.linea_medidas && ` • ${prod.linea_medidas}`}
                </p>
              </div>

              {/* Stock para productos CON variantes */}
              {tieneVariantes ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TALLER</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.olive }}>
                      {stockTaller}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>CONSIG.</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.terracotta }}>
                      {stockConsig}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TOTAL</label>
                    <div style={{ padding: '6px 12px', background: colors.sidebarBg, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: 'white' }}>
                      {stockTotal}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>VALOR</label>
                    <div style={{ padding: '6px 12px', background: '#1abc9c', borderRadius: '4px', fontSize: '14px', fontWeight: '600', color: 'white' }}>
                      ${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  {/* Botón expandir variantes */}
                  {isAdmin && (
                    <button
                      onClick={() => setExpandido({ ...expandido, [prod.id]: !expandido[prod.id] })}
                      style={{
                        padding: '8px 15px', background: expandido[prod.id] ? colors.terracotta : '#16a085',
                        color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
                        fontSize: '12px', fontWeight: '500'
                      }}
                    >
                      {expandido[prod.id] ? '▲ Cerrar' : '▼ Editar Stock'}
                    </button>
                  )}
                  {/* Indicador visual */}
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: stockTotal > 10 ? colors.olive : stockTotal > 0 ? '#F7B731' : colors.terracotta
                  }} title={stockTotal > 10 ? 'Stock OK' : stockTotal > 0 ? 'Stock bajo' : 'Sin stock'} />
                </div>
              ) : (
                /* Stock para productos SIN variantes */
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TALLER</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.olive }}>
                      {stockTaller}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>CONSIG.</label>
                    <div style={{ padding: '6px 12px', background: colors.sand, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: colors.terracotta }}>
                      {stockConsig}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>TOTAL</label>
                    <div style={{ padding: '6px 12px', background: colors.sidebarBg, borderRadius: '4px', fontSize: '16px', fontWeight: '600', color: 'white' }}>
                      {stockTotal}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <label style={{ display: 'block', fontSize: '10px', color: colors.camel, marginBottom: '3px' }}>VALOR</label>
                    <div style={{ padding: '6px 12px', background: '#1abc9c', borderRadius: '4px', fontSize: '14px', fontWeight: '600', color: 'white' }}>
                      ${valorInventario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {isAdmin && (
                    <div style={{ textAlign: 'center' }}>
                      <label style={{ display: 'block', fontSize: '11px', color: colors.sidebarBg, marginBottom: '5px' }}>
                        AGREGAR (+/-)
                      </label>
                      <input
                        type="number"
                        value={cantidadAgregar[prod.id] || 0}
                        onChange={(e) => setCantidadAgregar({ ...cantidadAgregar, [prod.id]: e.target.value })}
                        style={inputStyle}
                        placeholder="0"
                      />
                    </div>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => guardarStock(prod.id)}
                      onMouseEnter={() => setHoverGuardar({ ...hoverGuardar, [prod.id]: true })}
                      onMouseLeave={() => setHoverGuardar({ ...hoverGuardar, [prod.id]: false })}
                      disabled={guardando}
                      style={{
                        padding: '10px 20px',
                        background: hoverGuardar[prod.id] ? colors.sidebarText : colors.sidebarBg,
                        color: hoverGuardar[prod.id] ? colors.sidebarBg : colors.sidebarText,
                        border: 'none',
                        borderRadius: '4px',
                        cursor: guardando ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        opacity: guardando ? 0.7 : 1
                      }}
                    >
                      Guardar
                    </button>
                  )}

                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: stockTotal > 10 ? colors.olive : stockTotal > 0 ? '#F7B731' : colors.terracotta
                  }} title={stockTotal > 10 ? 'Stock OK' : stockTotal > 0 ? 'Stock bajo' : 'Sin stock'} />
                </div>
              )}
            </div>

            {/* Panel expandible de variantes */}
            {tieneVariantes && expandido[prod.id] && (
              <div style={{
                background: '#f0faf8',
                border: '2px solid #16a085',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                padding: '15px',
                marginTop: '-8px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#16a085', marginBottom: '10px' }}>
                  Editar stock por variante:
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {(prod.variantes || []).filter(v => v.activo !== false).map(v => {
                    const nombreVar = [v.material, v.color, v.talla].filter(Boolean).join(' / ') || 'Sin especificar';
                    return (
                      <div key={v.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        background: 'white', padding: '10px 12px', borderRadius: '6px',
                        border: '1px solid #ddd'
                      }}>
                        {/* Imagen miniatura */}
                        {v.imagen_url ? (
                          <img src={v.imagen_url} alt="" onClick={() => setImagenPopup({ url: v.imagen_url, nombre: nombreVar })} style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }} />
                        ) : (
                          <div style={{ width: '36px', height: '36px', background: '#eee', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>📦</div>
                        )}
                        {/* Nombre variante */}
                        <div style={{ flex: 1, minWidth: '120px' }}>
                          <div style={{ fontWeight: '600', fontSize: '13px', color: colors.espresso }}>{nombreVar}</div>
                          <div style={{ fontSize: '10px', color: colors.camel }}>SKU: {v.sku || '-'}</div>
                        </div>
                        {/* Stock taller */}
                        <div style={{ textAlign: 'center', minWidth: '50px' }}>
                          <div style={{ fontSize: '10px', color: colors.camel }}>TALLER</div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.olive }}>{v.stock || 0}</div>
                        </div>
                        {/* Input agregar taller */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: colors.sidebarBg }}>+/- TALLER</div>
                          <input
                            type="number"
                            value={cantidadVariante[v.id] || 0}
                            onChange={(e) => setCantidadVariante({ ...cantidadVariante, [v.id]: e.target.value })}
                            style={{
                              width: '65px', padding: '6px', border: '2px solid #16a085',
                              borderRadius: '4px', fontSize: '14px', textAlign: 'center'
                            }}
                          />
                        </div>
                        {/* Stock consignación */}
                        <div style={{ textAlign: 'center', minWidth: '50px' }}>
                          <div style={{ fontSize: '10px', color: colors.camel }}>CONSIG.</div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: colors.terracotta }}>{v.stock_consignacion || 0}</div>
                        </div>
                        {/* Input agregar consignación */}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: '#e67e22' }}>+/- CONSIG.</div>
                          <input
                            type="number"
                            value={cantidadConsigVariante[v.id] || 0}
                            onChange={(e) => setCantidadConsigVariante({ ...cantidadConsigVariante, [v.id]: e.target.value })}
                            style={{
                              width: '65px', padding: '6px', border: '2px solid #e67e22',
                              borderRadius: '4px', fontSize: '14px', textAlign: 'center'
                            }}
                          />
                        </div>
                        {/* Botón guardar */}
                        <button
                          onClick={() => guardarStockVariante(v, prod.id)}
                          disabled={guardando}
                          style={{
                            padding: '8px 12px', background: '#16a085', color: 'white',
                            border: 'none', borderRadius: '4px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '500'
                          }}
                        >
                          Guardar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </React.Fragment>
          );
          })}
        </div>
      ) : (
        <div style={{ background: colors.cotton, border: '2px solid #DA9F17', padding: '40px', textAlign: 'center', borderRadius: '8px' }}>
          <span style={{ fontSize: '48px' }}>📋</span>
          <h3 style={{ margin: '20px 0 10px', color: colors.espresso }}>Sin productos definidos</h3>
          <p style={{ color: colors.camel, fontSize: '14px' }}>Primero define productos en la sección "Productos"</p>
        </div>
      )}
    </div>
  );
};


export default StocksView;

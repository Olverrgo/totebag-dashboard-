import React, { useState, useEffect } from 'react';
import { 
  getClientes, 
  getProductos, 
  registrarVentaMultiple 
} from '../supabaseClient';
import { colors } from '../utils/colors';
import { generarReciboPDF } from '../utils/receiptGenerator';

const VentaCarritoModal = ({ onClose, onSuccess, initialType = 'directa' }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [officialFolio, setOfficialFolio] = useState('');
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  
  // Header State
  const [clienteId, setClienteId] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [tipoOperacion, setTipoOperacion] = useState(initialType); // 'directa' | 'consignacion'
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [estadoPago, setEstadoPago] = useState('pagado');
  const [notas, setNotas] = useState('');

  // Cart State
  const [items, setItems] = useState([]); // { producto_id, variante_id, cantidad, precio_unitario, costo_unitario, nombre, variante_info }

  useEffect(() => {
    const loadData = async () => {
      const [cliRes, prodRes] = await Promise.all([
        getClientes(),
        getProductos()
      ]);
      if (cliRes.data) setClientes(cliRes.data);
      if (prodRes.data) setProductos(prodRes.data);
    };
    loadData();
  }, []);

  const addItem = () => {
    setItems([...items, { 
      producto_id: '', 
      variante_id: '', 
      cantidad: 1, 
      precio_unitario: 0, 
      costo_unitario: 0, 
      nombre: '', 
      variante_info: '',
      stock_disponible: 0
    }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    const item = newItems[index];
    item[field] = value;

    if (field === 'producto_id') {
      const prod = productos.find(p => p.id === parseInt(value));
      item.nombre = prod?.linea_nombre || '';
      item.variante_id = '';
      item.variante_info = '';
      item.precio_unitario = prod?.precio_venta || 0;
      item.costo_unitario = prod?.costo_total_1_tinta || 0;
      item.stock_disponible = prod?.stock || 0;
    }

    if (field === 'variante_id') {
      const prod = productos.find(p => p.id === parseInt(item.producto_id));
      const v = prod?.variantes?.find(v => v.id === parseInt(value));
      if (v) {
        item.variante_info = [v.material, v.color, v.talla].filter(Boolean).join(' - ') || v.sku;
        item.precio_unitario = prod.precio_venta || 0;
        item.costo_unitario = prod.costo_calculado_por_variante?.[v.id]?.costo_total || v.costo_unitario || 0;
        item.stock_disponible = v.stock || 0;
      }
    }

    setItems(newItems);
  };

  const total = items.reduce((acc, curr) => acc + (curr.cantidad * curr.precio_unitario), 0);

  const handleImprimirRecibo = () => {
    generarReciboPDF({
      folio: officialFolio,
      clienteNombre: clienteId ? clientes.find(c => c.id === parseInt(clienteId))?.nombre : clienteNombre,
      tipoOperacion,
      metodoPago,
      estadoPago: tipoOperacion === 'consignacion' ? 'pendiente' : estadoPago,
      items,
      total,
      notas
    });
  };

  const handleGuardar = async () => {
    if (!clienteId && !clienteNombre) return alert('Selecciona o escribe un cliente');
    if (items.length === 0) return alert('El carrito está vacío');
    
    // Validar líneas incompletas, sin variante o stock insuficiente
    for (const it of items) {
      if (!it.producto_id || it.cantidad <= 0) {
        return alert('Hay productos sin seleccionar o con cantidad cero');
      }
      const prod = productos.find(p => p.id === parseInt(it.producto_id));
      if (prod?.tiene_variantes && !it.variante_id) {
        return alert(`El producto "${prod.linea_nombre}" requiere seleccionar una variante.`);
      }
      // Validación preventiva de stock
      if (it.cantidad > it.stock_disponible) {
        return alert(`Stock insuficiente para "${it.nombre}${it.variante_info ? ' ('+it.variante_info+')' : ''}". Disponible: ${it.stock_disponible}, Solicitado: ${it.cantidad}`);
      }
    }

    setLoading(true);
    const header = {
      cliente_id: clienteId || null,
      cliente_nombre: clienteId ? clientes.find(c => c.id === parseInt(clienteId))?.nombre : clienteNombre,
      tipo_operacion: tipoOperacion,
      metodo_pago: metodoPago,
      estado_pago: tipoOperacion === 'consignacion' ? 'pendiente' : estadoPago,
      notas
    };

    const lineas = items.map(it => ({
      producto_id: parseInt(it.producto_id),
      variante_id: it.variante_id ? parseInt(it.variante_id) : null,
      producto_nombre: `${it.nombre}${it.variante_info ? ' (' + it.variante_info + ')' : ''}`,
      producto_medidas: productos.find(p => p.id === parseInt(it.producto_id))?.linea_medidas || '',
      cantidad: it.cantidad,
      precio_unitario: it.precio_unitario,
      costo_unitario: it.costo_unitario
    }));

    const res = await registrarVentaMultiple(header, lineas);
    setLoading(false);

    if (res.error) {
      if (res.error.detalles) {
        const erroresLineas = res.error.detalles
          .filter(d => !d.ok)
          .map(d => {
            const errorMsg = typeof d.error === 'object' ? (d.error.message || JSON.stringify(d.error)) : d.error;
            return `- ${d.linea.producto_nombre}: ${errorMsg}`;
          })
          .join('\n');
        alert('Error en algunas líneas:\n' + erroresLineas);
      } else {
        alert('Error: ' + (res.error.message || res.error));
      }
      console.error(res.error);
    } else {
      setOfficialFolio(res.folio || '');
      setSuccess(true);
      onSuccess();
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  if (success) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: '15px', width: '500px', padding: '40px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: colors.espresso, margin: '0 0 10px 0' }}>¡Registro Exitoso!</h2>
          <p style={{ color: colors.camel, marginBottom: '5px' }}>La operación se ha guardado correctamente.</p>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.sidebarBg, marginBottom: '25px' }}>Folio: {officialFolio}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handleImprimirRecibo} style={{ padding: '15px', borderRadius: '8px', background: colors.sidebarBg, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              📄 Descargar Recibo PDF
            </button>
            <button onClick={onClose} style={{ padding: '12px', borderRadius: '8px', background: 'white', border: `1px solid ${colors.sand}`, cursor: 'pointer', color: colors.camel }}>
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '900px', maxHeight: '95vh', overflowY: 'auto', padding: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${colors.sand}`, paddingBottom: '15px' }}>
          <h3 style={{ margin: 0, color: colors.espresso }}>Registrar Salida / Venta (Carrito)</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: colors.camel }}>✕</button>
        </div>

        {/* Header: Cliente y Tipo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '15px', marginBottom: '20px', background: colors.cream, padding: '15px', borderRadius: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', color: colors.camel, display: 'block', marginBottom: '5px' }}>Cliente</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <select value={clienteId} onChange={e => { setClienteId(e.target.value); setClienteNombre(''); }} style={{ flex: 1, padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }}>
                <option value="">Seleccionar registrado...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input value={clienteNombre} onChange={e => { setClienteNombre(e.target.value); setClienteId(''); }} placeholder="O nombre nuevo..." style={{ flex: 1, padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: colors.camel, display: 'block', marginBottom: '5px' }}>Tipo Operación</label>
            <select value={tipoOperacion} onChange={e => setTipoOperacion(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}`, fontWeight: 'bold' }}>
              <option value="directa">Venta Directa</option>
              <option value="consignacion">Entrega a Consignación</option>
            </select>
          </div>
          {tipoOperacion === 'directa' && (
            <div>
              <label style={{ fontSize: '12px', color: colors.camel, display: 'block', marginBottom: '5px' }}>Estado Pago</label>
              <select value={estadoPago} onChange={e => setEstadoPago(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }}>
                <option value="pagado">Pagado (Caja)</option>
                <option value="pendiente">Pendiente (CxC)</option>
              </select>
            </div>
          )}
        </div>

        {/* Body: Lista de Productos */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0 }}>Productos en el Carrito</h4>
            <button onClick={addItem} style={{ padding: '6px 15px', borderRadius: '6px', background: colors.sage, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+ Agregar Producto</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', background: colors.cotton, borderRadius: '10px', border: `1px dashed ${colors.sand}`, color: colors.camel }}>
                Tu carrito está vacío. Agrega productos para comenzar.
              </div>
            ) : (
              items.map((item, idx) => {
                const prod = productos.find(p => p.id === parseInt(item.producto_id));
                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr 1fr 0.2fr', gap: '10px', alignItems: 'center', background: '#fff', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}` }}>
                    <select value={item.producto_id} onChange={e => updateItem(idx, 'producto_id', e.target.value)} style={{ padding: '8px' }}>
                      <option value="">Producto...</option>
                      {productos.map(p => <option key={p.id} value={p.id}>{p.linea_nombre}</option>)}
                    </select>
                    <select value={item.variante_id} onChange={e => updateItem(idx, 'variante_id', e.target.value)} disabled={!item.producto_id} style={{ padding: '8px' }}>
                      <option value="">Variante...</option>
                      {prod?.variantes?.map(v => <option key={v.id} value={v.id}>{[v.material, v.color, v.talla].filter(Boolean).join(' - ') || v.sku}</option>)}
                    </select>
                    <div style={{ textAlign: 'center' }}>
                       <input type="number" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', parseFloat(e.target.value))} style={{ width: '60px', padding: '8px', textAlign: 'center' }} min="1" />
                       <div style={{ fontSize: '10px', color: colors.camel }}>Stock: {item.stock_disponible}</div>
                    </div>
                    <div>
                      <input type="number" value={item.precio_unitario} onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value))} style={{ width: '100%', padding: '8px' }} />
                      <div style={{ fontSize: '10px', color: colors.camel }}>Sugerido: {formatCurrency(prod?.precio_venta)}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      {formatCurrency(item.cantidad * item.precio_unitario)}
                    </div>
                    <button onClick={() => removeItem(idx)} style={{ border: 'none', background: 'none', color: '#E74C3C', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer: Notas y Total */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', borderTop: `1px solid ${colors.sand}`, paddingTop: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', color: colors.camel, display: 'block', marginBottom: '5px' }}>Notas de la Operación</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Ej. Entrega parcial, pedido especial..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}`, minHeight: '80px' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: colors.camel }}>Total a Registrar</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: colors.espresso, marginBottom: '20px' }}>{formatCurrency(total)}</div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '12px 25px', borderRadius: '8px', border: `1px solid ${colors.sand}`, background: 'white', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleGuardar} disabled={loading || items.length === 0} style={{ padding: '12px 40px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: (loading || items.length === 0) ? 0.6 : 1 }}>
                {loading ? 'Procesando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaCarritoModal;

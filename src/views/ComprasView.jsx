import React, { useState, useEffect } from 'react';
import { 
  getProveedores, 
  createProveedor, 
  getComprasMaterial, 
  getCompraDetalles, 
  crearCompraCompleta, 
  getPagosProveedor, 
  registrarPagoProveedor,
  getMateriales,
  eliminarPagoProveedor,
  createMaterial,
  updateCompraVencimiento
} from '../supabaseClient';
import { colors } from '../utils/colors';

const ComprasView = ({ isAdmin }) => {
  const [activeSubTab, setActiveSubTab] = useState('compras');
  const [loading, setLoading] = useState(true);
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [materiales, setMateriales] = useState([]);
  
  // Modales
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalCompra, setShowModalCompra] = useState(false);
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [showModalPago, setShowModalPago] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [provRes, compRes, matRes] = await Promise.all([
      getProveedores(),
      getComprasMaterial(),
      getMateriales()
    ]);
    
    if (provRes.data) setProveedores(provRes.data);
    if (compRes.data) setCompras(compRes.data);
    if (matRes.data) setMateriales(matRes.data);
    setLoading(false);
  };

  const handleCreateProveedor = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nuevo = {
      nombre: formData.get('nombre'),
      contacto: formData.get('contacto'),
      telefono: formData.get('telefono'),
      notas: formData.get('notas')
    };

    const { error } = await createProveedor(nuevo);
    if (!error) {
      setShowModalProveedor(false);
      fetchData();
    } else {
      alert('Error al crear proveedor: ' + error.message);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  const totalDeuda = compras.reduce((acc, curr) => acc + (parseFloat(curr.saldo_pendiente) || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '28px', color: colors.espresso, margin: '0 0 5px 0', fontWeight: '300' }}>
            Compras y Cuentas por Pagar
          </h2>
          <p style={{ color: colors.camel, margin: 0, fontSize: '14px' }}>Gestión de proveedores y abastecimiento</p>
        </div>
        
        <div style={{ 
          background: colors.espresso, 
          padding: '15px 25px', 
          borderRadius: '12px', 
          color: 'white',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>Deuda Total</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>{formatCurrency(totalDeuda)}</div>
        </div>
      </div>

      {/* Tabs Nav */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: `1px solid ${colors.sand}` }}>
        {['compras', 'proveedores'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === tab ? `3px solid ${colors.sidebarBg}` : '3px solid transparent',
              color: activeSubTab === tab ? colors.sidebarBg : colors.espresso,
              fontWeight: activeSubTab === tab ? '600' : '400',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSubTab === 'compras' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button 
              onClick={() => setShowModalCompra(true)}
              style={{
                background: colors.sidebarBg,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>➕</span> Nueva Compra
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: colors.cream, borderBottom: `1px solid ${colors.sand}` }}>
                  <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600' }}>Fecha</th>
                  <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600' }}>Proveedor</th>
                  <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600' }}>Total</th>
                  <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600' }}>Saldo</th>
                  <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600' }}>Vencimiento</th>
                  <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '15px', color: colors.espresso, fontWeight: '600' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {compras.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: colors.camel }}>
                      No hay compras registradas
                    </td>
                  </tr>
                ) : (
                  compras.map(compra => {
                    const isExpired = compra.saldo_pendiente > 0 && compra.fecha_vencimiento && new Date(compra.fecha_vencimiento) < new Date().setHours(0,0,0,0);
                    return (
                      <tr key={compra.id} style={{ borderBottom: `1px solid ${colors.cream}`, transition: 'background 0.2s' }}>
                        <td style={{ padding: '15px' }}>{new Date(compra.fecha_compra).toLocaleDateString()}</td>
                        <td style={{ padding: '15px', fontWeight: '500' }}>{compra.proveedores?.nombre || 'N/A'}</td>
                        <td style={{ padding: '15px' }}>{formatCurrency(compra.monto_total)}</td>
                        <td style={{ padding: '15px', color: compra.saldo_pendiente > 0 ? '#E74C3C' : '#27AE60' }}>
                          {formatCurrency(compra.saldo_pendiente)}
                        </td>
                        <td style={{ padding: '15px', color: isExpired ? '#E74C3C' : 'inherit', fontWeight: isExpired ? '600' : 'normal' }}>
                          {compra.fecha_vencimiento ? new Date(compra.fecha_vencimiento).toLocaleDateString() : '-'}
                          {isExpired && <div style={{ fontSize: '10px', color: '#E74C3C' }}>VENCIDA</div>}
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '12px',
                            background: compra.estado_pago === 'pagado' ? '#D5F5E3' : compra.estado_pago === 'parcial' ? '#FCF3CF' : '#FADBD8',
                            color: compra.estado_pago === 'pagado' ? '#27AE60' : compra.estado_pago === 'parcial' ? '#B7950B' : '#C0392B'
                          }}>
                            {compra.estado_pago.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <button 
                            onClick={() => setSelectedCompra(compra)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.sidebarBg }}
                          >
                            👁️ Ver detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeSubTab === 'proveedores' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button 
              onClick={() => setShowModalProveedor(true)}
              style={{
                background: colors.sidebarBg,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <span>➕</span> Nuevo Proveedor
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {proveedores.map(prov => (
              <div key={prov.id} style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '15px', 
                boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                border: `1px solid ${colors.sand}`
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: colors.espresso, marginBottom: '10px' }}>{prov.nombre}</div>
                <div style={{ fontSize: '14px', color: colors.camel, marginBottom: '5px' }}>👤 {prov.contacto || 'Sin contacto'}</div>
                <div style={{ fontSize: '14px', color: colors.camel, marginBottom: '15px' }}>📞 {prov.telefono || 'Sin teléfono'}</div>
                {prov.notas && (
                  <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#888', background: colors.cream, padding: '8px', borderRadius: '5px' }}>
                    {prov.notas}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal Nuevo Proveedor */}
      {showModalProveedor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: colors.espresso }}>Registrar Nuevo Proveedor</h3>
            <form onSubmit={handleCreateProveedor} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input name="nombre" placeholder="Nombre de la empresa" required style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}` }} />
              <input name="contacto" placeholder="Nombre de contacto" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}` }} />
              <input name="telefono" placeholder="Teléfono" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}` }} />
              <textarea name="notas" placeholder="Notas" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}`, minHeight: '80px' }} />
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModalProveedor(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: `1px solid ${colors.sand}`, background: 'white', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: colors.sidebarBg, color: 'white', cursor: 'pointer', fontWeight: '600' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nueva Compra */}
      {showModalCompra && (
        <NewCompraModal 
          onClose={() => setShowModalCompra(false)} 
          proveedores={proveedores} 
          materiales={materiales}
          onSuccess={fetchData}
        />
      )}

      {/* Modal Detalle Compra */}
      {selectedCompra && (
        <CompraDetailModal 
          compra={selectedCompra} 
          onClose={() => setSelectedCompra(null)}
          onUpdate={fetchData}
        />
      )}
    </div>
  );
};

// --- Componentes Auxiliares ---

const QuickMaterialForm = ({ onCancel, onCreated }) => {
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const nombre = formData.get('nombre');
    
    if (!nombre) return alert('El nombre es obligatorio');
    
    setLoading(true);
    const nuevo = {
      nombre,
      unidad: formData.get('unidad'),
      categoria: formData.get('categoria')
    };
    
    const { data, error } = await createMaterial(nuevo);
    setLoading(false);
    
    if (!error && data) {
      onCreated(data);
    } else {
      alert('Error: ' + (error?.message || 'No se pudo crear el material'));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ 
      background: colors.cotton, padding: '10px', borderRadius: '8px', 
      border: `1px solid ${colors.sand}`, display: 'flex', flexDirection: 'column', gap: '8px',
      marginTop: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
    }}>
      <div style={{ fontSize: '11px', fontWeight: '600', color: colors.camel, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nuevo Material</div>
      <input name="nombre" placeholder="Nombre (ej. Tela Bramante)" required style={{ padding: '6px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${colors.sand}` }} autoFocus />
      <div style={{ display: 'flex', gap: '5px' }}>
        <select name="unidad" required style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${colors.sand}` }}>
          <option value="metros">Metros</option>
          <option value="piezas">Piezas</option>
          <option value="kilos">Kilos</option>
          <option value="rollos">Rollos</option>
          <option value="litros">Litros</option>
          <option value="conos">Conos</option>
        </select>
        <select name="categoria" required style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '4px', border: `1px solid ${colors.sand}` }}>
          <option value="tela">Tela</option>
          <option value="cierre">Cierre</option>
          <option value="hilo">Hilo</option>
          <option value="etiqueta">Etiqueta</option>
          <option value="empaque">Empaque</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: '5px', fontSize: '11px', borderRadius: '4px', border: `1px solid ${colors.sand}`, background: 'white', cursor: 'pointer' }}>Cancelar</button>
        <button type="submit" disabled={loading} style={{ 
          flex: 1, padding: '5px', fontSize: '11px', borderRadius: '4px', border: 'none', 
          background: colors.sage, color: 'white', cursor: 'pointer', opacity: loading ? 0.7 : 1 
        }}>
          {loading ? 'Guardando...' : 'Crear Material'}
        </button>
      </div>
    </form>
  );
};

const NewCompraModal = ({ onClose, proveedores, materiales, onSuccess }) => {
  const [paso, setPaso] = useState(1);
  const [proveedorId, setProveedorId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQuickMaterial, setShowQuickMaterial] = useState(null);

  const addItem = () => {
    setItems([...items, { material_id: '', cantidad: 0, costo_unitario: 0 }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalCompra = items.reduce((acc, curr) => acc + (curr.cantidad * curr.costo_unitario), 0);

  const handleSubmit = async () => {
    if (!proveedorId || items.length === 0) {
      alert('Completa los datos mínimos');
      return;
    }
    
    setLoading(true);
    const compra = {
      proveedor_id: proveedorId,
      fecha_compra: fecha,
      fecha_vencimiento: fechaVencimiento || null,
      monto_total: totalCompra
    };
    
    const { error } = await crearCompraCompleta(compra, items);
    setLoading(false);
    
    if (!error) {
      onSuccess();
      onClose();
    } else {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 20px 0', color: colors.espresso }}>Registrar Compra de Material</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: colors.camel, marginBottom: '5px' }}>Proveedor</label>
            <select 
              value={proveedorId} 
              onChange={(e) => setProveedorId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}` }}
            >
              <option value="">Seleccionar...</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: colors.camel, marginBottom: '5px' }}>Fecha Compra</label>
            <input 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}` }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: colors.camel, marginBottom: '5px' }}>Vencimiento (Crédito)</label>
            <input 
              type="date" 
              value={fechaVencimiento} 
              onChange={(e) => setFechaVencimiento(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.sand}` }} 
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '16px' }}>Detalle de Materiales</h4>
            <button onClick={addItem} style={{ padding: '5px 12px', borderRadius: '5px', background: colors.sage, color: 'white', border: 'none', cursor: 'pointer' }}>
              + Agregar Línea
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {items.map((item, index) => (
              <div key={index} style={{ borderBottom: index < items.length - 1 ? `1px solid ${colors.cream}` : 'none', paddingBottom: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.2fr', gap: '10px', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <select 
                        value={item.material_id} 
                        onChange={(e) => updateItem(index, 'material_id', e.target.value)}
                        style={{ flex: 1, padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }}
                      >
                        <option value="">Material...</option>
                        {materiales.map(m => <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>)}
                      </select>
                      <button 
                        type="button"
                        onClick={() => setShowQuickMaterial(index === showQuickMaterial ? null : index)}
                        style={{ 
                          padding: '0 10px', borderRadius: '5px', background: colors.cream, 
                          border: `1px solid ${colors.sand}`, cursor: 'pointer', fontSize: '14px',
                          color: colors.espresso
                        }}
                        title="Nuevo material al vuelo"
                      >
                        +
                      </button>
                    </div>
                    {showQuickMaterial === index && (
                      <QuickMaterialForm 
                        onCancel={() => setShowQuickMaterial(null)}
                        onCreated={async (nuevoMat) => {
                          await onSuccess(); // Recargar lista de materiales en el padre
                          updateItem(index, 'material_id', nuevoMat.id);
                          setShowQuickMaterial(null);
                        }}
                      />
                    )}
                  </div>
                  <input 
                    type="number" 
                    placeholder="Cant" 
                    value={item.cantidad} 
                    onChange={(e) => updateItem(index, 'cantidad', parseFloat(e.target.value))}
                    style={{ padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }}
                  />
                  <input 
                    type="number" 
                    placeholder="Costo U." 
                    value={item.costo_unitario} 
                    onChange={(e) => updateItem(index, 'costo_unitario', parseFloat(e.target.value))}
                    style={{ padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }}
                  />
                  <button onClick={() => removeItem(index)} style={{ border: 'none', background: 'none', color: '#E74C3C', cursor: 'pointer', marginTop: '8px' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${colors.sand}`, paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: colors.camel }}>Total Compra</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: colors.espresso }}>
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalCompra)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ padding: '12px 25px', borderRadius: '8px', border: `1px solid ${colors.sand}`, background: 'white', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading || items.length === 0}
              style={{ 
                padding: '12px 25px', borderRadius: '8px', border: 'none', 
                background: colors.sidebarBg, color: 'white', cursor: 'pointer', fontWeight: '600',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Procesando...' : 'Guardar Compra'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompraDetailModal = ({ compra, onClose, onUpdate }) => {
  const [detalles, setDetalles] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tempVencimiento, setTempVencimiento] = useState(compra.fecha_vencimiento || '');

  useEffect(() => {
    loadData();
    setTempVencimiento(compra.fecha_vencimiento || '');
  }, [compra]);

  const loadData = async () => {
    setLoading(true);
    const [detRes, pagRes] = await Promise.all([
      getCompraDetalles(compra.id),
      getPagosProveedor(compra.id)
    ]);
    if (detRes.data) setDetalles(detRes.data);
    if (pagRes.data) setPagos(pagRes.data);
    setLoading(false);
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const monto = parseFloat(formData.get('monto'));
    
    if (monto > compra.saldo_pendiente) {
      alert('El pago no puede ser mayor al saldo pendiente');
      return;
    }

    const pago = {
      compra_id: compra.id,
      monto,
      metodo_pago: formData.get('metodo_pago'),
      fecha_pago: formData.get('fecha_pago') || new Date().toISOString(),
      notas: formData.get('notas')
    };

    const { error } = await registrarPagoProveedor(pago);
    if (!error) {
      setShowPagoForm(false);
      loadData();
      onUpdate();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const handleEliminarPago = async (pagoId) => {
    if (!window.confirm('¿Estás seguro de eliminar este abono? La deuda volverá a subir y se cancelará el egreso de caja.')) return;
    
    const { error } = await eliminarPagoProveedor(pagoId);
    if (!error) {
      loadData();
      onUpdate();
    } else {
      alert('Error al eliminar: ' + error.message);
    }
  };

  const handleUpdateVencimiento = async () => {
    const { error } = await updateCompraVencimiento(compra.id, tempVencimiento);
    if (!error) {
      alert('Fecha de vencimiento actualizada');
      onUpdate();
    } else {
      alert('Error al actualizar: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: colors.espresso }}>Detalle de Compra</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px', background: colors.cream, padding: '15px', borderRadius: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: colors.camel }}>Proveedor</div>
            <div style={{ fontWeight: '600' }}>{compra.proveedores?.nombre}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: colors.camel }}>Total Factura</div>
            <div style={{ fontWeight: '600' }}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(compra.monto_total)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: colors.camel }}>Saldo Pendiente</div>
            <div style={{ fontWeight: '600', color: compra.saldo_pendiente > 0 ? '#E74C3C' : '#27AE60' }}>
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(compra.saldo_pendiente)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: colors.camel }}>Vencimiento</div>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
              <input 
                type="date" 
                value={tempVencimiento} 
                onChange={(e) => setTempVencimiento(e.target.value)}
                style={{ fontSize: '11px', padding: '2px', width: '95px' }}
              />
              <button 
                onClick={handleUpdateVencimiento}
                style={{ padding: '2px 5px', fontSize: '10px', background: colors.sage, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                title="Guardar fecha"
              >
                💾
              </button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: colors.camel }}>Estado</div>
            <div style={{ fontWeight: '600', textTransform: 'capitalize' }}>{compra.estado_pago}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', borderBottom: `1px solid ${colors.sand}` }}>Artículos</h4>
            {loading ? <p>Cargando...</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: colors.camel }}>
                    <th style={{ padding: '8px 0' }}>Material</th>
                    <th style={{ padding: '8px 0' }}>Cant.</th>
                    <th style={{ padding: '8px 0' }}>Costo U.</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map(det => (
                    <tr key={det.id} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                      <td style={{ padding: '8px 0' }}>{det.materiales?.nombre}</td>
                      <td style={{ padding: '8px 0' }}>{det.cantidad} {det.materiales?.unidad}</td>
                      <td style={{ padding: '8px 0' }}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(det.costo_unitario)}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(det.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', borderBottom: `1px solid ${colors.sand}` }}>
              <h4 style={{ margin: 0, fontSize: '15px' }}>Historial de Pagos</h4>
              {compra.saldo_pendiente > 0 && (
                <button 
                  onClick={() => setShowPagoForm(true)}
                  style={{ background: colors.sage, color: 'white', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                >
                  + Abonar
                </button>
              )}
            </div>

            {showPagoForm && (
              <form onSubmit={handleRegistrarPago} style={{ background: colors.cotton, padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input name="monto" type="number" step="0.01" max={compra.saldo_pendiente} required placeholder="Monto a pagar" style={{ padding: '6px', fontSize: '13px' }} />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <select name="metodo_pago" required style={{ flex: 1, padding: '6px', fontSize: '13px' }}>
                      <option value="transferencia">Transferencia</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                    <input name="fecha_pago" type="date" defaultValue={new Date().toISOString().split('T')[0]} style={{ flex: 1, padding: '6px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button type="button" onClick={() => setShowPagoForm(false)} style={{ flex: 1, padding: '5px', fontSize: '12px' }}>Cancelar</button>
                    <button type="submit" style={{ flex: 1, padding: '5px', fontSize: '12px', background: colors.sidebarBg, color: 'white', border: 'none' }}>Registrar</button>
                  </div>
                </div>
              </form>
            )}

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {pagos.length === 0 ? <p style={{ fontSize: '12px', color: colors.camel }}>Sin pagos registrados</p> : (
                pagos.map(pago => (
                  <div key={pago.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px dotted ${colors.sand}`, fontSize: '13px' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(pago.monto)}</div>
                      <div style={{ fontSize: '11px', color: colors.camel }}>{new Date(pago.fecha_pago).toLocaleDateString()} - {pago.metodo_pago}</div>
                    </div>
                    <button 
                      onClick={() => handleEliminarPago(pago.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '14px' }}
                      title="Eliminar abono"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprasView;

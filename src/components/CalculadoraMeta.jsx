import React, { useState, useEffect, useMemo } from 'react';
import { getProductos } from '../supabaseClient';
import { colors } from '../utils/colors';

// Calculadora de Producción / Meta
// Metes cantidades por producto y te dice ingreso, costo, utilidad y mano de obra.
// El costo y la mano de obra salen del patrón de corte (fuente de verdad);
// la tela ya NO se suma desde la receta (ver fix en supabaseClient calcularVariante).

const money = (n) =>
  '$' + (Number(n) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = (n) =>
  '$' + Math.round(Number(n) || 0).toLocaleString('es-MX');

// Saca variante representativa + precio/costo/mano de obra de un producto.
function infoProducto(prod, varianteId) {
  const variantesActivas = (prod.variantes || []).filter((v) => v.activo);
  const variante = varianteId
    ? variantesActivas.find((v) => v.id === varianteId)
    : variantesActivas[0];

  const configs = (prod.configuraciones_corte || []).filter(
    (c) => c.es_configuracion_actual && c.activo
  );
  const config = variante
    ? configs.find((c) => c.variante_id === variante.id) ||
      configs.find((c) => c.variante_id === null) ||
      configs[0]
    : configs.find((c) => c.variante_id === null) || configs[0];

  const manoObra = config
    ? (parseFloat(config.costo_confeccion) || 0) + (parseFloat(config.costo_empaque) || 0)
    : 0;

  // Costo: el guardado en la variante (lo escribe el patrón de corte) o el legacy del producto.
  const costo = variante
    ? parseFloat(variante.costo_unitario) || 0
    : parseFloat(prod.costo_total_1_tinta) || 0;

  const precio = variante
    ? parseFloat(variante.precio_venta) || 0
    : parseFloat(prod.precio_venta) || 0;

  return { variante, variantesActivas, precio, costo, manoObra };
}

const CalculadoraMeta = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [meta, setMeta] = useState(4000);
  // filas[prodId] = { cantidad, varianteId, precio (override) }
  const [filas, setFilas] = useState({});

  useEffect(() => {
    (async () => {
      setCargando(true);
      const { data } = await getProductos();
      setProductos((data || []).filter((p) => p.activo !== false));
      setCargando(false);
    })();
  }, []);

  const setFila = (id, patch) =>
    setFilas((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const limpiar = () => setFilas({});

  // Cálculo en vivo
  const { lineas, totales, porCategoria } = useMemo(() => {
    const lineas = [];
    const totales = { cantidad: 0, ingreso: 0, costo: 0, utilidad: 0, manoObra: 0 };
    const porCategoria = {};

    for (const prod of productos) {
      const fila = filas[prod.id];
      const cantidad = parseInt(fila?.cantidad) || 0;
      if (cantidad <= 0) continue;

      const info = infoProducto(prod, fila?.varianteId);
      const precio = fila?.precio != null && fila.precio !== '' ? parseFloat(fila.precio) : info.precio;
      const costo = info.costo;
      const manoObra = info.manoObra;

      const ingreso = precio * cantidad;
      const utilidad = (precio - costo) * cantidad;
      const manoObraTotal = manoObra * cantidad;

      const cat = prod.categoria?.nombre || 'Sin categoría';
      lineas.push({
        id: prod.id,
        nombre: prod.linea_nombre,
        categoria: cat,
        variante: info.variante,
        cantidad,
        precio,
        costo,
        manoObra,
        ingreso,
        utilidad,
        manoObraTotal,
      });

      totales.cantidad += cantidad;
      totales.ingreso += ingreso;
      totales.costo += costo * cantidad;
      totales.utilidad += utilidad;
      totales.manoObra += manoObraTotal;

      porCategoria[cat] = porCategoria[cat] || { cantidad: 0, utilidad: 0 };
      porCategoria[cat].cantidad += cantidad;
      porCategoria[cat].utilidad += utilidad;
    }
    return { lineas, totales, porCategoria };
  }, [productos, filas]);

  // Productos agrupados por categoría para el listado
  const grupos = useMemo(() => {
    const g = {};
    for (const p of productos) {
      const cat = p.categoria?.nombre || 'Sin categoría';
      (g[cat] = g[cat] || []).push(p);
    }
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [productos]);

  const pctMeta = meta > 0 ? (totales.utilidad / meta) * 100 : 0;
  const flujoNeto = totales.ingreso - totales.costo; // = utilidad (mano de obra ya está en el costo)

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: colors.camel }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🧮</div>
        Cargando productos...
      </div>
    );
  }

  const card = (titulo, valor, sub, color) => (
    <div
      style={{
        flex: '1 1 180px',
        background: colors.cotton,
        border: `1px solid ${colors.camel}40`,
        borderRadius: '12px',
        padding: '16px 18px',
      }}
    >
      <div style={{ fontSize: '12px', color: colors.camel, marginBottom: '4px' }}>{titulo}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: color || colors.espresso }}>{valor}</div>
      {sub && <div style={{ fontSize: '11px', color: colors.camel, marginTop: '2px' }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: colors.espresso, fontSize: '28px' }}>🧮 Calculadora de Producción</h2>
          <div style={{ fontSize: '13px', color: colors.camel }}>
            Mete cantidades por producto y calcula ingreso, utilidad y mano de obra (desde el patrón de corte).
          </div>
        </div>
        <button
          onClick={limpiar}
          style={{
            background: 'transparent', border: `1px solid ${colors.terracotta}`, color: colors.terracotta,
            borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '14px',
          }}
        >
          Limpiar
        </button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
        {card('Ingreso (cobras)', money0(totales.ingreso), `${totales.cantidad} piezas`, colors.sidebarBg)}
        {card('Utilidad bruta (ganas)', money0(totales.utilidad), 'precio − costo', colors.olive)}
        {card('Mano de obra al taller', money0(totales.manoObra), 'ya incluida en el costo', colors.terracotta)}
        {card('Costo total mercancía', money0(totales.costo), 'material + maquila + reventa', colors.camel)}
      </div>

      {/* Meta */}
      <div
        style={{
          background: colors.cotton, border: `1px solid ${colors.camel}40`, borderRadius: '12px',
          padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        }}
      >
        <label style={{ color: colors.espresso, fontWeight: 600 }}>Meta de utilidad:</label>
        <span style={{ color: colors.camel }}>$</span>
        <input
          type="number"
          value={meta}
          onChange={(e) => setMeta(parseFloat(e.target.value) || 0)}
          style={{ width: '110px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${colors.camel}`, fontSize: '15px' }}
        />
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ height: '14px', background: `${colors.camel}30`, borderRadius: '7px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', width: `${Math.min(pctMeta, 100)}%`,
                background: pctMeta >= 100 ? colors.olive : colors.gold, transition: 'width .2s',
              }}
            />
          </div>
        </div>
        <div style={{ fontWeight: 700, color: pctMeta >= 100 ? colors.olive : colors.espresso }}>
          {pctMeta.toFixed(0)}% {pctMeta >= 100 ? '✅' : ''}
        </div>
        <div style={{ fontSize: '13px', color: colors.camel }}>
          {pctMeta >= 100
            ? `Superas la meta por ${money0(totales.utilidad - meta)}`
            : `Faltan ${money0(meta - totales.utilidad)}`}
        </div>
      </div>

      {/* Listado por categoría */}
      {grupos.map(([cat, prods]) => (
        <div key={cat} style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: colors.sidebarBg, marginBottom: '6px' }}>
            {cat}
            {porCategoria[cat] && (
              <span style={{ fontSize: '12px', fontWeight: 400, color: colors.camel, marginLeft: '8px' }}>
                · {porCategoria[cat].cantidad} pz → {money0(porCategoria[cat].utilidad)} utilidad
              </span>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ color: colors.camel, textAlign: 'right', fontSize: '11px' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Producto</th>
                  <th style={{ textAlign: 'left', padding: '4px 8px' }}>Variante</th>
                  <th style={{ padding: '4px 8px' }}>Precio</th>
                  <th style={{ padding: '4px 8px' }}>Costo</th>
                  <th style={{ padding: '4px 8px' }}>M. obra</th>
                  <th style={{ padding: '4px 8px' }}>Cantidad</th>
                  <th style={{ padding: '4px 8px' }}>Utilidad</th>
                </tr>
              </thead>
              <tbody>
                {prods.map((prod) => {
                  const fila = filas[prod.id] || {};
                  const info = infoProducto(prod, fila.varianteId);
                  const precioVal = fila.precio != null && fila.precio !== '' ? fila.precio : info.precio;
                  const cantidad = parseInt(fila.cantidad) || 0;
                  const utilidadFila = ((parseFloat(precioVal) || 0) - info.costo) * cantidad;
                  const activa = cantidad > 0;
                  return (
                    <tr
                      key={prod.id}
                      style={{
                        borderTop: `1px solid ${colors.camel}25`,
                        background: activa ? `${colors.sidebarText}22` : 'transparent',
                      }}
                    >
                      <td style={{ padding: '6px 8px', color: colors.espresso }}>{prod.linea_nombre}</td>
                      <td style={{ padding: '6px 8px' }}>
                        {info.variantesActivas.length > 1 ? (
                          <select
                            value={fila.varianteId || info.variante?.id || ''}
                            onChange={(e) => setFila(prod.id, { varianteId: Number(e.target.value), precio: '' })}
                            style={{ padding: '4px', borderRadius: '6px', border: `1px solid ${colors.camel}`, maxWidth: '160px' }}
                          >
                            {info.variantesActivas.map((v) => (
                              <option key={v.id} value={v.id}>
                                {[v.material, v.talla].filter(Boolean).join(' ') || v.sku || `Var ${v.id}`}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: colors.camel, fontSize: '12px' }}>
                            {info.variante
                              ? [info.variante.material, info.variante.talla].filter(Boolean).join(' ')
                              : '—'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={precioVal}
                          onChange={(e) => setFila(prod.id, { precio: e.target.value })}
                          style={{ width: '70px', padding: '4px 6px', borderRadius: '6px', border: `1px solid ${colors.camel}`, textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: colors.camel }}>{money(info.costo)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: colors.camel }}>{money(info.manoObra)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          min="0"
                          value={fila.cantidad || ''}
                          placeholder="0"
                          onChange={(e) => setFila(prod.id, { cantidad: e.target.value })}
                          style={{ width: '70px', padding: '4px 6px', borderRadius: '6px', border: `1px solid ${colors.camel}`, textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600, color: utilidadFila < 0 ? colors.terracotta : colors.olive }}>
                        {activa ? money0(utilidadFila) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {lineas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: colors.camel }}>
          Mete cantidades en los productos para ver el cálculo. La utilidad es bruta (no descuenta renta/sueldo).
        </div>
      )}
    </div>
  );
};

export default CalculadoraMeta;

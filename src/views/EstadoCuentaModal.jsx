import React, { useState, useEffect } from 'react';
import { getEstadoCuentaVendedor } from '../supabaseClient';
import { colors } from '../utils/colors';
import { formatearMoneda } from '../utils/formatearMoneda';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseLocalDate } from '../utils/formatearFecha';

// Helpers locales para evitar desajuste de zona horaria al inicializar el input date
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalFirstDayOfMonthString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

const EstadoCuentaModal = ({ cliente, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const hoy = new Date();
  const [periodo, setPeriodo] = useState({
    desde: getLocalFirstDayOfMonthString(hoy),
    hasta: getLocalDateString(hoy)
  });

  const loadData = async () => {
    setLoading(true);
    const res = await getEstadoCuentaVendedor(cliente.id, periodo);
    if (res.data) setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [periodo]);

  const generarPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    const fechaGen = new Date().toLocaleDateString('es-MX');

    // Header
    doc.setFillColor(colors.sidebarBg);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('ESTADO DE CUENTA MENSUAL', 15, 20);
    doc.setFontSize(10);
    doc.text('BLANCOS SINAÍ - Yolotl Gestora', 15, 30);
    doc.text(`Generado: ${fechaGen}`, 195, 25, { align: 'right' });

    // Info Cliente
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('VENDEDOR / CLIENTE:', 15, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(cliente?.nombre || 'N/A', 15, 62);
    doc.text(`Periodo: ${parseLocalDate(periodo.desde).toLocaleDateString()} al ${parseLocalDate(periodo.hasta).toLocaleDateString()}`, 15, 69);

    // Tabla Entregas
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREGAS (Mercancía enviada)', 15, 80);
    const entregasRows = data.ventas.map(v => [
      parseLocalDate(v.fecha).toLocaleDateString(),
      v.folio || '-',
      v.producto,
      v.cantidad,
      formatearMoneda(v.total)
    ]);
    autoTable(doc, {
      startY: 85,
      head: [['Fecha', 'Folio', 'Producto', 'Cant.', 'Total']],
      body: entregasRows,
      headStyles: { fillColor: colors.sidebarBg },
      theme: 'grid'
    });

    // Tabla Abonos
    const nextY = doc.lastAutoTable.finalY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('PAGOS Y ABONOS RECIBIDOS', 15, nextY);
    const abonosRows = data.abonos.map(a => [
      parseLocalDate(a.fecha).toLocaleDateString(),
      a.folio || 'Abono Libre',
      a.metodo.toUpperCase(),
      '-' + formatearMoneda(a.monto),
      a.saldo_despues != null ? formatearMoneda(a.saldo_despues) : '-'
    ]);
    autoTable(doc, {
      startY: nextY + 5,
      head: [['Fecha', 'Folio Abono', 'Método', 'Monto', 'Saldo después']],
      body: abonosRows,
      headStyles: { fillColor: colors.olive },
      theme: 'grid'
    });

    // Tabla Devoluciones (si hay)
    if (data.devoluciones && data.devoluciones.length > 0) {
      const devY = doc.lastAutoTable.finalY + 15;
      doc.setFont('helvetica', 'bold');
      doc.text('DEVOLUCIONES', 15, devY);
      autoTable(doc, {
        startY: devY + 5,
        head: [['Fecha', 'Producto', 'Piezas', 'Se resta a deuda']],
        body: data.devoluciones.map(d => [
          parseLocalDate(d.fecha).toLocaleDateString(),
          d.producto,
          `${d.cantidad} pz`,
          '-' + formatearMoneda(d.valor)
        ]),
        headStyles: { fillColor: colors.terracotta },
        theme: 'grid'
      });
    }

    // Totales — flujo de la deuda (con salto de página si no cabe)
    const tieneDev = data.totales.devuelto > 0;
    const boxH = tieneDev ? 54 : 46;
    const pageH = doc.internal.pageSize.height;
    let finalY = doc.lastAutoTable.finalY + 15;
    if (finalY + boxH + 12 > pageH) { doc.addPage(); finalY = 20; }
    doc.setFillColor(colors.cream);
    doc.rect(125, finalY, 70, boxH, 'F');
    doc.setTextColor(0);
    doc.setFontSize(10);
    let yy = finalY + 9;
    doc.text(`Saldo Anterior: ${formatearMoneda(data.totales.saldo_inicial || 0)}`, 130, yy); yy += 8;
    doc.text(`(+) Entregado: ${formatearMoneda(data.totales.entregado_bruto ?? data.totales.entregado)}`, 130, yy); yy += 8;
    if (tieneDev) { doc.text(`(-) Devuelto: ${formatearMoneda(data.totales.devuelto)}`, 130, yy); yy += 8; }
    doc.text(`(-) Cobrado: ${formatearMoneda(data.totales.cobrado)}`, 130, yy); yy += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`SALDO VIVO: ${formatearMoneda(data.totales.pendiente)}`, 130, yy);

    doc.save(`estado-cuenta-${cliente?.nombre || 'vendedor'}-${periodo.desde}.pdf`);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '15px', width: '900px', maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: `1px solid ${colors.sand}`, paddingBottom: '15px' }}>
          <div>
            <h3 style={{ margin: 0, color: colors.espresso }}>Estado de Cuenta: {cliente.nombre}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: colors.camel }}>Resumen mensual de entregas y cobranza</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Filtros de periodo */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'flex-end', background: colors.cream, padding: '15px', borderRadius: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Desde</label>
            <input type="date" value={periodo.desde} onChange={e => setPeriodo({ ...periodo, desde: e.target.value })} style={{ padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Hasta</label>
            <input type="date" value={periodo.hasta} onChange={e => setPeriodo({ ...periodo, hasta: e.target.value })} style={{ padding: '8px', borderRadius: '5px', border: `1px solid ${colors.sand}` }} />
          </div>
          <button onClick={generarPDF} style={{ marginLeft: 'auto', padding: '10px 20px', background: colors.sidebarBg, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            📄 Descargar PDF
          </button>
        </div>

        {loading ? <p>Cargando datos...</p> : data && (
          <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
            {/* Columna Entregas */}
            <div>
              <h4 style={{ borderBottom: `2px solid ${colors.sidebarBg}`, paddingBottom: '5px' }}>📦 Entregas en el periodo</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: colors.camel }}>
                    <th style={{ padding: '8px 0' }}>Fecha/Folio</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ventas.map((v, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                      <td style={{ padding: '10px 0' }}>
                        <div>{parseLocalDate(v.fecha).toLocaleDateString()}</div>
                        <div style={{ fontSize: '10px', color: colors.sidebarBg, fontWeight: 'bold' }}>{v.folio}</div>
                      </td>
                      <td>{v.producto} ({v.cantidad} pza)</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatearMoneda(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Columna Abonos */}
            <div>
              <h4 style={{ borderBottom: `2px solid ${colors.olive}`, paddingBottom: '5px' }}>💰 Pagos recibidos</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: colors.camel }}>
                    <th style={{ padding: '8px 0' }}>Fecha/Folio</th>
                    <th style={{ textAlign: 'right' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {data.abonos.map((a, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                      <td style={{ padding: '10px 0' }}>
                        <div>{parseLocalDate(a.fecha).toLocaleDateString()}</div>
                        <div style={{ fontSize: '10px', color: colors.olive, fontWeight: 'bold' }}>{a.folio || 'S/F'}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', color: colors.olive }}>−{formatearMoneda(a.monto)}</div>
                        {a.saldo_despues != null && (
                          <div style={{ fontSize: '10px', color: colors.camel }}>saldo: {formatearMoneda(a.saldo_despues)}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Resumen Final — flujo de la deuda */}
              <div style={{ marginTop: '30px', background: colors.cotton, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.sand}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', paddingBottom: '10px', borderBottom: `1px solid ${colors.sand}`, alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: colors.camel, textTransform: 'uppercase' }}>Flujo de Cuenta:</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: colors.espresso }}>
                      {formatearMoneda(data.totales.saldo_inicial)} → {formatearMoneda(data.totales.pendiente)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: colors.camel }}>
                  <span>Saldo anterior:</span>
                  <strong>{formatearMoneda(data.totales.saldo_inicial)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>(+) Entregado:</span>
                  <strong>{formatearMoneda(data.totales.entregado_bruto ?? data.totales.entregado)}</strong>
                </div>
                {data.totales.devuelto > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: colors.terracotta }}>
                    <span>(−) Devuelto:</span>
                    <strong>−{formatearMoneda(data.totales.devuelto)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: colors.olive }}>
                  <span>(−) Cobrado:</span>
                  <strong>−{formatearMoneda(data.totales.cobrado)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: `2px solid ${colors.sand}`, paddingTop: '15px', fontSize: '18px' }}>
                  <span style={{ fontWeight: 'bold' }}>SALDO VIVO:</span>
                  <strong style={{ color: colors.terracotta }}>{formatearMoneda(data.totales.pendiente)}</strong>
                </div>
                <p style={{ fontSize: '10px', color: colors.camel, textAlign: 'center', marginTop: '15px' }}>
                  * El saldo vivo es la deuda total actual del cliente (incluye periodos anteriores).
                </p>
              </div>
            </div>
          </div>

          {/* Devoluciones */}
          {data.devoluciones && data.devoluciones.length > 0 && (
            <div style={{ marginTop: '30px' }}>
              <h4 style={{ borderBottom: `2px solid ${colors.terracotta}`, paddingBottom: '5px' }}>↩️ Devoluciones en el periodo</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: colors.camel }}>
                    <th style={{ padding: '8px 0' }}>Fecha</th>
                    <th>Producto</th>
                    <th style={{ textAlign: 'center' }}>Piezas</th>
                    <th style={{ textAlign: 'right' }}>Se resta a la deuda</th>
                  </tr>
                </thead>
                <tbody>
                  {data.devoluciones.map((d, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${colors.cream}` }}>
                      <td style={{ padding: '10px 0' }}>{parseLocalDate(d.fecha).toLocaleDateString()}</td>
                      <td>{d.producto}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: colors.terracotta }}>{d.cantidad} pz</td>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: colors.terracotta }}>−{formatearMoneda(d.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: '10px', color: colors.camel, marginTop: '8px' }}>
                * Cada devolución regresa piezas al taller y resta su valor a la cuenta por cobrar del cliente.
              </p>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default EstadoCuentaModal;

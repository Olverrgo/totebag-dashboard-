import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { colors } from './colors';

/**
 * Genera un Recibo PDF profesional para una operación de venta o consignación.
 * @param {Object} data - Datos de la operación
 * @param {string} data.folio - Folio oficial (ej: BSIN-2026-05-001)
 * @param {string} data.clienteNombre - Nombre del cliente
 * @param {string} data.tipoOperacion - 'directa' | 'consignacion'
 * @param {string} data.metodoPago - 'efectivo', 'transferencia', etc.
 * @param {string} data.estadoPago - 'pagado' | 'pendiente'
 * @param {Array} data.items - Lista de productos { nombre, variante_info, cantidad, precio_unitario }
 * @param {number} data.total - Monto total de la operación
 * @param {string} data.notas - Notas comerciales
 * @param {string} data.fecha - Fecha de la operación (opcional, default hoy)
 */
export const generarReciboPDF = (data) => {
  const { 
    folio, 
    clienteNombre, 
    tipoOperacion, 
    metodoPago, 
    estadoPago, 
    items, 
    total, 
    notas, 
    fecha 
  } = data;

  const doc = new jsPDF();
  const fechaStr = fecha 
    ? new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  // Membrete / Header
  doc.setFillColor(colors.sidebarBg);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('BLANCOS SINAÍ', 15, 18);
  
  doc.setFontSize(10);
  doc.text('RECIBO DE OPERACIÓN - Yolotl Gestora', 15, 26);
  
  doc.setFontSize(11);
  doc.text(`FOLIO: ${folio || 'S/F'}`, 195, 18, { align: 'right' });
  doc.text(`FECHA: ${fechaStr}`, 195, 26, { align: 'right' });

  // Datos del Cliente
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE:', 15, 48);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${clienteNombre || 'Público General'}`, 15, 55);
  doc.text(`Tipo de Operación: ${tipoOperacion === 'directa' ? 'VENTA DIRECTA' : 'ENTREGA EN CONSIGNACIÓN'}`, 15, 62);
  
  if (tipoOperacion === 'directa') {
    doc.text(`Método de Pago: ${(metodoPago || '').toUpperCase()} (${(estadoPago || '').toUpperCase()})`, 15, 69);
  }

  // Tabla de Productos
  const tableData = items.map(it => [
    `${it.nombre || it.producto_nombre || 'Producto'}${it.variante_info ? ' (' + it.variante_info + ')' : ''}`,
    it.cantidad,
    formatCurrency(it.precio_unitario),
    formatCurrency(it.cantidad * it.precio_unitario)
  ]);

  autoTable(doc, {
    startY: 75,
    head: [['Producto / Descripción', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    headStyles: { fillColor: colors.sidebarBg },
    foot: [[
      { content: 'TOTAL:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatCurrency(total), styles: { fontStyle: 'bold' } }
    ]],
    theme: 'grid',
    styles: { fontSize: 10 },
    margin: { left: 15, right: 15 }
  });

  // Leyendas de Estado
  const finalY = doc.lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  
  if (tipoOperacion === 'directa' && estadoPago === 'pagado') {
    doc.setTextColor(39, 174, 96); // Verde
    doc.text('ESTADO: PAGADO - ¡GRACIAS POR SU COMPRA!', 105, finalY, { align: 'center' });
  } else if (tipoOperacion === 'consignacion') {
    doc.setTextColor(211, 84, 0); // Naranja
    doc.text('ESTADO: ENTREGA EN CONSIGNACIÓN (PENDIENTE DE LIQUIDAR)', 105, finalY, { align: 'center' });
  } else if (estadoPago === 'pendiente') {
    doc.setTextColor(192, 57, 43); // Rojo
    doc.text(`ESTADO: PENDIENTE DE PAGO - SALDO: ${formatCurrency(total)}`, 105, finalY, { align: 'center' });
  }

  // Notas
  if (notas) {
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text('Notas / Observaciones:', 15, finalY + 15);
    doc.setFont('helvetica', 'normal');
    const splitNotas = doc.splitTextToSize(notas, 180);
    doc.text(splitNotas, 15, finalY + 20);
  }

  // Pie de página institucional
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Este documento es un comprobante de operación interna de Yolotl Gestora.', 105, 285, { align: 'center' });

  doc.save(`recibo-${folio || 'sin-folio'}.pdf`);
};

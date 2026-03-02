export const formatearMoneda = (monto) =>
  '$' + (parseFloat(monto) || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

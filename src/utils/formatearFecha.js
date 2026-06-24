/**
 * Utilidades para manejo de fechas sin desajuste por zona horaria (timezone shift).
 * JavaScript por defecto parsea cadenas tipo 'YYYY-MM-DD' como UTC medianoche,
 * lo que en zonas horarias de América (como UTC-6) resta horas y mueve la fecha al día anterior.
 */

/**
 * Parsea una fecha de manera segura. Si es una cadena de solo fecha (YYYY-MM-DD),
 * la interpreta en la zona horaria local a medianoche en lugar de UTC.
 * Si es un timestamp completo ISO, lo parsea normalmente respetando la zona horaria.
 * 
 * @param {string|Date} dateInput - Fecha a parsear
 * @returns {Date} Objeto Date correspondiente
 */
export const parseLocalDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput === 'string') {
    // Expresión regular para capturar el prefijo YYYY-MM-DD
    const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      // Si es exactamente YYYY-MM-DD (10 caracteres)
      // o es un formato de fecha con hora en cero sin zona horaria explicada (ej: 2026-06-23T00:00:00)
      // o no contiene indicaciones de zona horaria (Z, +XX, -XX) ni caracteres de hora (:):
      const esFechaSolo = dateInput.length === 10 || 
                          dateInput.includes('T00:00:00') || 
                          (!dateInput.includes('T') && !dateInput.includes(':'));
                          
      if (esFechaSolo) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // Mes es 0-indexed
        const day = parseInt(match[3], 10);
        return new Date(year, month, day);
      }
    }
  }

  // Para cualquier otro formato o timestamp completo
  const d = new Date(dateInput);
  // Si no es una fecha válida, regresamos la fecha de hoy como fallback seguro
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Formatea una fecha a una cadena legible local en español de México.
 * 
 * @param {string|Date} dateInput - Fecha a formatear
 * @param {Object} options - Opciones de formato de toLocaleDateString
 * @returns {string} Fecha formateada
 */
export const formatearFechaLocal = (dateInput, options = { day: '2-digit', month: 'long', year: 'numeric' }) => {
  const dateObj = parseLocalDate(dateInput);
  return dateObj.toLocaleDateString('es-MX', options);
};

/**
 * Formatea una fecha en formato corto (ej: 23/06/2026 o 23 de jun)
 * 
 * @param {string|Date} dateInput 
 * @param {boolean} incluirAnio 
 * @returns {string}
 */
export const formatearFechaCorta = (dateInput, incluirAnio = true) => {
  const options = incluirAnio
    ? { day: '2-digit', month: 'short', year: 'numeric' }
    : { day: '2-digit', month: 'short' };
  return formatearFechaLocal(dateInput, options);
};

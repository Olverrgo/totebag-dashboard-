import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURACIÓN DE SUPABASE - BLANCOS SINAI TOTEBAG
// =====================================================
// Las credenciales se cargan desde variables de entorno (.env.local)
// Nunca hardcodear claves en el código fuente

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verificar si las credenciales están configuradas
const isConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

// Crear cliente de Supabase (solo si está configurado)
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'totebag-auth-token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const isSupabaseConfigured = isConfigured;

// Helper: detectar errores de permisos RLS y dar mensaje claro
const handleRLSError = (error) => {
  if (!error) return null;
  const msg = error.message || '';
  if (msg.includes('row-level security') || msg.includes('policy') ||
      error.code === '42501' || msg.includes('permission denied') ||
      msg.includes('new row violates')) {
    return { ...error, message: 'Permiso denegado: solo administradores pueden realizar esta acción' };
  }
  return error;
};

// =====================================================
// FUNCIONES PARA LÍNEAS DE PRODUCTO
// =====================================================

// Obtener todas las líneas de producto
export const getLineasProducto = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('lineas_producto')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar una línea de producto
export const updateLineaProducto = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('lineas_producto')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA PROYECCIONES
// =====================================================

// Obtener todas las proyecciones
export const getProyecciones = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('proyecciones')
    .select('*')
    .order('mes_numero', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar una proyección
export const updateProyeccion = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('proyecciones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA CANALES E-COMMERCE
// =====================================================

// Obtener todos los canales e-commerce
export const getCanalesEcommerce = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('canales_ecommerce')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar un canal e-commerce
export const updateCanalEcommerce = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('canales_ecommerce')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Crear un nuevo canal e-commerce
export const createCanalEcommerce = async (canal) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('canales_ecommerce')
    .insert([canal])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar un canal e-commerce
export const deleteCanalEcommerce = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('canales_ecommerce')
    .delete()
    .eq('id', id);

  return { error };
};

// =====================================================
// FUNCIONES PARA COSTOS DE ENVÍO
// =====================================================

// Obtener todos los costos de envío
export const getCostosEnvio = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('costos_envio')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar un costo de envío
export const updateCostoEnvio = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('costos_envio')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Crear un nuevo costo de envío
export const createCostoEnvio = async (costo) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('costos_envio')
    .insert([costo])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar un costo de envío
export const deleteCostoEnvio = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('costos_envio')
    .delete()
    .eq('id', id);

  return { error };
};

// =====================================================
// FUNCIONES PARA PERSONALIZACIÓN
// =====================================================

// Obtener todas las opciones de personalización
export const getPersonalizacion = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('personalizacion')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar una opción de personalización
export const updatePersonalizacion = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('personalizacion')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA TIPOS DE DISEÑO
// =====================================================

// Obtener todos los tipos de diseño
export const getTiposDiseno = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('tipos_diseno')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar un tipo de diseño
export const updateTipoDiseno = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('tipos_diseno')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA COLECCIONES
// =====================================================

// Obtener todas las colecciones
export const getColecciones = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('colecciones')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar una colección
export const updateColeccion = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('colecciones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA CONFIGURACIÓN
// =====================================================

// Obtener toda la configuración
export const getConfiguracion = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('configuracion')
    .select('*');

  // Convertir array a objeto con claves
  if (data) {
    const config = {};
    data.forEach(item => {
      config[item.clave] = item.valor;
    });
    return { data: config, error: null };
  }

  return { data: null, error };
};

// Actualizar una configuración
export const updateConfiguracion = async (clave, valor) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('configuracion')
    .upsert({ clave, valor, updated_at: new Date().toISOString() })
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES DE CARGA MASIVA (para Dashboard)
// =====================================================

// Cargar todos los datos necesarios para el Dashboard
export const cargarDatosDashboard = async () => {
  if (!supabase) {
    return {
      data: null,
      error: 'Supabase no configurado',
      usarDatosLocales: true
    };
  }

  try {
    const [
      lineasRes,
      proyeccionesRes,
      canalesRes,
      costosRes,
      personalizacionRes,
      tiposRes,
      coleccionesRes,
      configRes
    ] = await Promise.all([
      getLineasProducto(),
      getProyecciones(),
      getCanalesEcommerce(),
      getCostosEnvio(),
      getPersonalizacion(),
      getTiposDiseno(),
      getColecciones(),
      getConfiguracion()
    ]);

    // Verificar si hay errores
    const errores = [
      lineasRes.error,
      proyeccionesRes.error,
      canalesRes.error,
      costosRes.error,
      personalizacionRes.error,
      tiposRes.error,
      coleccionesRes.error,
      configRes.error
    ].filter(Boolean);

    if (errores.length > 0) {
      console.warn('Algunos datos no pudieron cargarse. Total errores:', errores.length);
    }

    // Transformar líneas de producto a formato esperado por Dashboard
    const productosFormateados = {};
    if (lineasRes.data) {
      lineasRes.data.forEach(linea => {
        productosFormateados[linea.id] = {
          nombre: linea.nombre,
          icon: linea.icon,
          descripcion: linea.descripcion,
          material: linea.material,
          especificaciones: linea.especificaciones,
          costos: linea.costos,
          costoTotal: parseFloat(linea.costo_total),
          precioPublico: parseFloat(linea.precio_publico),
          precioMayoreo: parseFloat(linea.precio_mayoreo),
          utilidadPublica: parseFloat(linea.utilidad_publica || 0),
          utilidadMayoreo: parseFloat(linea.utilidad_mayoreo || 0),
          margenPublico: parseFloat(linea.margen_publico || 0),
          margenMayoreo: parseFloat(linea.margen_mayoreo || 0),
          color: linea.color,
          colorLight: linea.color_light,
          target: linea.target,
          ventajaEspecial: linea.ventaja_especial,
          escenarios: linea.escenarios,
          volumenes: linea.volumenes,
          casos: linea.casos,
          promociones: linea.promociones,
          personalizacion: linea.personalizacion
        };
      });
    }

    // Transformar proyecciones al formato esperado
    const proyeccionesFormateadas = proyeccionesRes.data?.map(p => ({
      mes: p.mes,
      ventas: p.ventas,
      publicitaria: p.publicitaria,
      eco: p.eco,
      ecoForro: p.eco_forro,
      basica: p.basica,
      estandar: p.estandar,
      premium: p.premium,
      ecomm: p.ecomm,
      directa: p.directa,
      mayoreo: p.mayoreo,
      modelos: p.modelos,
      utilidad: parseFloat(p.utilidad),
      acumulado: parseFloat(p.acumulado)
    })) || [];

    // Transformar costos de envío al formato esperado
    const costosEnvioFormateados = {
      local: [],
      nacional: []
    };
    if (costosRes.data) {
      costosRes.data.forEach(costo => {
        const item = {
          servicio: costo.servicio,
          tarifa: parseFloat(costo.tarifa),
          tiempo: costo.tiempo,
          nota: costo.nota
        };
        if (costo.tipo === 'local') {
          costosEnvioFormateados.local.push(item);
        } else {
          costosEnvioFormateados.nacional.push(item);
        }
      });
    }

    return {
      data: {
        productos: productosFormateados,
        proyecciones: proyeccionesFormateadas,
        canalesEcommerce: canalesRes.data || [],
        costosEnvio: costosEnvioFormateados,
        personalizacion: personalizacionRes.data || [],
        tiposDiseno: tiposRes.data || [],
        colecciones: coleccionesRes.data || [],
        configuracion: configRes.data || {}
      },
      error: null,
      usarDatosLocales: !lineasRes.data || lineasRes.data.length === 0
    };
  } catch (error) {
    console.error('Error cargando datos del dashboard');
    return {
      data: null,
      error: error.message,
      usarDatosLocales: true
    };
  }
};

// =====================================================
// FUNCIONES PARA TIPOS DE TELA (ADMIN)
// =====================================================

// Obtener todos los tipos de tela
export const getTiposTela = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('tipos_tela')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar tipo de tela (solo admin)
export const updateTipoTela = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('tipos_tela')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Crear tipo de tela (solo admin)
export const createTipoTela = async (tela) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('tipos_tela')
    .insert([tela])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA CONFIGURACIÓN DE ENVÍO (ADMIN)
// =====================================================

// Obtener configuración de envío
export const getConfigEnvio = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('config_envio')
    .select('*')
    .eq('activo', true)
    .order('id', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Actualizar configuración de envío (solo admin)
export const updateConfigEnvio = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('config_envio')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA CATEGORÍAS
// =====================================================

// Obtener todas las categorías
export const getCategorias = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Crear categoría
export const createCategoria = async (categoria) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('categorias')
    .insert([categoria])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar categoría
export const updateCategoria = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar categoría (soft delete)
export const deleteCategoria = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('categorias')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA SUBCATEGORÍAS
// =====================================================

// Obtener subcategorías por categoría
export const getSubcategorias = async (categoriaId = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('subcategorias')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// Crear subcategoría
export const createSubcategoria = async (subcategoria) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('subcategorias')
    .insert([subcategoria])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar subcategoría
export const updateSubcategoria = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('subcategorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar subcategoría (soft delete)
export const deleteSubcategoria = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('subcategorias')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA CAMPOS DE CATEGORÍA
// =====================================================

// Obtener campos dinámicos por categoría
export const getCamposCategoria = async (categoriaId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('campos_categoria')
    .select('*')
    .eq('categoria_id', categoriaId)
    .eq('activo', true)
    .order('seccion', { ascending: true })
    .order('orden', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Crear campo de categoría
export const createCampoCategoria = async (campo) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('campos_categoria')
    .insert([campo])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar campo de categoría
export const updateCampoCategoria = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('campos_categoria')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA PRODUCTOS
// =====================================================

// Obtener todos los productos (con filtro opcional por categoría)
export const getProductos = async (categoriaId = null, subcategoriaId = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('productos')
    .select(`
      *,
      tipo_tela:tipos_tela(*),
      config_envio:config_envio(*),
      categoria:categorias(*),
      subcategoria:subcategorias(*),
      variantes:variantes_producto(id, sku, material, color, talla, stock, stock_consignacion, costo_unitario, precio_venta, imagen_url, activo)
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId);
  }

  if (subcategoriaId) {
    query = query.eq('subcategoria_id', subcategoriaId);
  }

  const { data, error } = await query;

  // Calcular stock total de variantes para cada producto
  if (data) {
    data.forEach(prod => {
      const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
      if (variantesActivas.length > 0) {
        // Usar stock de variantes
        prod.stock_variantes = variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0);
        prod.stock_consignacion_variantes = variantesActivas.reduce((sum, v) => sum + (v.stock_consignacion || 0), 0);
        prod.tiene_variantes = true;
      } else {
        prod.stock_variantes = 0;
        prod.stock_consignacion_variantes = 0;
        prod.tiene_variantes = false;
      }
    });
  }

  return { data, error: handleRLSError(error) };
};

// Crear producto
export const createProducto = async (producto) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('productos')
    .insert([producto])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar producto
export const updateProducto = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('productos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar producto (soft delete)
export const deleteProducto = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id);

  return { error };
};

// =====================================================
// FUNCIONES PARA VARIANTES DE PRODUCTO
// =====================================================

// Obtener variantes de un producto
export const getVariantes = async (productoId = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('variantes_producto')
    .select(`
      *,
      producto:productos(id, linea_nombre, linea_medidas, categoria_id)
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (productoId) {
    query = query.eq('producto_id', productoId);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// Crear variante
export const createVariante = async (variante) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('variantes_producto')
    .insert([variante])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar variante
export const updateVariante = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('variantes_producto')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar variante (soft delete)
export const deleteVariante = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('variantes_producto')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// Actualizar stock de variante
export const updateStockVariante = async (id, stockTaller, stockConsignacion = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const updates = { stock: stockTaller };
  if (stockConsignacion !== null) {
    updates.stock_consignacion = stockConsignacion;
  }

  const { data, error } = await supabase
    .from('variantes_producto')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Subir imagen de variante a Supabase Storage
export const uploadImagenVariante = async (file, varianteId) => {
  if (!supabase) return { url: null, error: 'Supabase no configurado' };

  try {
    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `variante-${varianteId}-${Date.now()}.${fileExt}`;
    const filePath = `variantes/${fileName}`;

    // Subir archivo al bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('variantes-imagenes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('variantes-imagenes')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;

    // Actualizar la variante con la URL de la imagen
    if (publicUrl) {
      await supabase
        .from('variantes_producto')
        .update({ imagen_url: publicUrl })
        .eq('id', varianteId);
    }

    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: null, error: err.message };
  }
};

// Eliminar imagen de variante
export const deleteImagenVariante = async (varianteId, imagenUrl) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  try {
    // Extraer el path del archivo de la URL
    const urlParts = imagenUrl.split('/variantes-imagenes/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];

      // Eliminar del storage
      await supabase.storage
        .from('variantes-imagenes')
        .remove([filePath]);
    }

    // Limpiar la URL en la variante
    await supabase
      .from('variantes_producto')
      .update({ imagen_url: null })
      .eq('id', varianteId);

    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
};

// Obtener resumen de variantes por producto
export const getResumenVariantes = async (productoId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('variantes_producto')
    .select('stock, stock_consignacion, material, color, talla')
    .eq('producto_id', productoId)
    .eq('activo', true);

  if (error) return { data: null, error: handleRLSError(error) };

  // Calcular resumen
  const resumen = {
    stockTotal: 0,
    consignacionTotal: 0,
    numVariantes: data?.length || 0,
    materiales: [...new Set(data?.map(v => v.material).filter(Boolean))],
    colores: [...new Set(data?.map(v => v.color).filter(Boolean))],
    tallas: [...new Set(data?.map(v => v.talla).filter(Boolean))]
  };

  data?.forEach(v => {
    resumen.stockTotal += v.stock || 0;
    resumen.consignacionTotal += v.stock_consignacion || 0;
  });

  return { data: resumen, error: null };
};

// =====================================================
// FUNCIONES PARA CONFIGURACIONES DE CORTE
// =====================================================

// Obtener configuraciones de corte de un producto
export const getConfiguracionesCorte = async (productoId = null, varianteId = null, soloActual = false) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('configuraciones_corte')
    .select(`
      *,
      producto:productos(id, linea_nombre, linea_medidas),
      variante:variantes_producto(id, material, color, talla, sku)
    `)
    .eq('activo', true)
    .order('fecha_vigencia', { ascending: false });

  if (productoId) {
    query = query.eq('producto_id', productoId);
  }

  if (varianteId) {
    query = query.eq('variante_id', varianteId);
  }

  if (soloActual) {
    query = query.eq('es_configuracion_actual', true);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// Obtener configuración actual de un producto/variante
export const getConfiguracionActual = async (productoId, varianteId = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('configuraciones_corte')
    .select('*')
    .eq('producto_id', productoId)
    .eq('es_configuracion_actual', true)
    .eq('activo', true);

  if (varianteId) {
    query = query.eq('variante_id', varianteId);
  } else {
    query = query.is('variante_id', null);
  }

  const { data, error } = await query.single();
  return { data, error: handleRLSError(error) };
};

// Crear configuración de corte
export const createConfiguracionCorte = async (config) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('configuraciones_corte')
    .insert([config])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar configuración de corte
export const updateConfiguracionCorte = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('configuraciones_corte')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar configuración de corte (soft delete)
export const deleteConfiguracionCorte = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('configuraciones_corte')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// Duplicar configuración con nuevo precio (para historial)
export const duplicarConfiguracionConNuevoPrecio = async (configId, nuevoPrecioTela, nuevaFecha = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // Obtener configuración original
  const { data: configOriginal, error: errorGet } = await supabase
    .from('configuraciones_corte')
    .select('*')
    .eq('id', configId)
    .single();

  if (errorGet) return { data: null, error: handleRLSError(errorGet) };

  // Crear nueva configuración con el nuevo precio
  const nuevaConfig = {
    producto_id: configOriginal.producto_id,
    variante_id: configOriginal.variante_id,
    nombre: configOriginal.nombre,
    descripcion: configOriginal.descripcion,
    sabana_plana_largo: configOriginal.sabana_plana_largo,
    sabana_plana_ancho: configOriginal.sabana_plana_ancho,
    incluye_sabana_plana: configOriginal.incluye_sabana_plana,
    sabana_cajon_largo: configOriginal.sabana_cajon_largo,
    sabana_cajon_ancho: configOriginal.sabana_cajon_ancho,
    sabana_cajon_alto: configOriginal.sabana_cajon_alto,
    incluye_sabana_cajon: configOriginal.incluye_sabana_cajon,
    funda_largo: configOriginal.funda_largo,
    funda_ancho: configOriginal.funda_ancho,
    cantidad_fundas: configOriginal.cantidad_fundas,
    incluye_fundas: configOriginal.incluye_fundas,
    piezas_adicionales: configOriginal.piezas_adicionales,
    ancho_tela: configOriginal.ancho_tela,
    porcentaje_desperdicio: configOriginal.porcentaje_desperdicio,
    precio_tela_metro: nuevoPrecioTela,
    costo_confeccion: configOriginal.costo_confeccion,
    costo_empaque: configOriginal.costo_empaque,
    fecha_vigencia: nuevaFecha || new Date().toISOString().split('T')[0],
    es_configuracion_actual: true,
    notas: `Actualización de precio desde $${configOriginal.precio_tela_metro} a $${nuevoPrecioTela}`
  };

  const { data, error } = await supabase
    .from('configuraciones_corte')
    .insert([nuevaConfig])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Obtener historial de precios de un producto
export const getHistorialPrecios = async (productoId, varianteId = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('configuraciones_corte')
    .select('id, fecha_vigencia, precio_tela_metro, costo_material, costo_total, es_configuracion_actual, created_at')
    .eq('producto_id', productoId)
    .eq('activo', true)
    .order('fecha_vigencia', { ascending: false });

  if (varianteId) {
    query = query.eq('variante_id', varianteId);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA CLIENTES
// =====================================================

// Obtener todos los clientes
export const getClientes = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('activo', true)
    .order('nombre', { ascending: true });

  return { data, error: handleRLSError(error) };
};

// Crear cliente
export const createCliente = async (cliente) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar cliente
export const updateCliente = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('clientes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA VENTAS
// =====================================================

// Obtener ventas con filtros opcionales
export const getVentas = async (filtros = {}) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('ventas')
    .select(`
      *,
      producto:productos(id, linea_nombre, linea_medidas, costo_total_1_tinta),
      cliente:clientes(id, nombre, tipo)
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false });

  // Filtro por fecha inicio
  if (filtros.fechaInicio) {
    query = query.gte('created_at', filtros.fechaInicio);
  }

  // Filtro por fecha fin
  if (filtros.fechaFin) {
    query = query.lte('created_at', filtros.fechaFin + 'T23:59:59');
  }

  // Filtro por estado de pago
  if (filtros.estadoPago) {
    query = query.eq('estado_pago', filtros.estadoPago);
  }

  // Filtro por tipo de venta
  if (filtros.tipoVenta) {
    query = query.eq('tipo_venta', filtros.tipoVenta);
  }

  // Filtro por cliente
  if (filtros.clienteId) {
    query = query.eq('cliente_id', filtros.clienteId);
  }

  // Filtro por producto
  if (filtros.productoId) {
    query = query.eq('producto_id', filtros.productoId);
  }

  // Límite
  if (filtros.limite) {
    query = query.limit(filtros.limite);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// Crear venta
export const createVenta = async (venta) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('ventas')
    .insert([venta])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar venta
export const updateVenta = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('ventas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar venta (soft delete)
export const deleteVenta = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('ventas')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// Obtener resumen de ventas por período
export const getResumenVentas = async (fechaInicio = null, fechaFin = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // Si no hay fechas, usar últimos 30 días
  const hoy = new Date();
  const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const inicio = fechaInicio || hace30Dias.toISOString().split('T')[0];
  const fin = fechaFin || hoy.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ventas')
    .select('total, cantidad, utilidad, estado_pago, monto_pagado, created_at')
    .eq('activo', true)
    .gte('created_at', inicio)
    .lte('created_at', fin + 'T23:59:59');

  if (error) return { data: null, error: handleRLSError(error) };

  // Calcular resumen
  const resumen = {
    totalVentas: 0,
    totalPiezas: 0,
    totalUtilidad: 0,
    totalCobrado: 0,
    totalPorCobrar: 0,
    numVentas: data?.length || 0,
    ticketPromedio: 0,
    ventasHoy: 0,
    piezasHoy: 0
  };

  const hoyStr = hoy.toISOString().split('T')[0];

  data?.forEach(v => {
    resumen.totalVentas += parseFloat(v.total) || 0;
    resumen.totalPiezas += v.cantidad || 0;
    resumen.totalUtilidad += parseFloat(v.utilidad) || 0;

    if (v.estado_pago === 'pagado') {
      resumen.totalCobrado += parseFloat(v.total) || 0;
    } else {
      resumen.totalCobrado += parseFloat(v.monto_pagado) || 0;
      resumen.totalPorCobrar += (parseFloat(v.total) || 0) - (parseFloat(v.monto_pagado) || 0);
    }

    // Ventas de hoy
    if (v.created_at?.startsWith(hoyStr)) {
      resumen.ventasHoy += parseFloat(v.total) || 0;
      resumen.piezasHoy += v.cantidad || 0;
    }
  });

  resumen.ticketPromedio = resumen.numVentas > 0 ? resumen.totalVentas / resumen.numVentas : 0;

  return { data: resumen, error: null };
};

// Registrar pago de venta
export const registrarPagoVenta = async (ventaId, montoPago) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // Obtener venta actual
  const { data: venta, error: errorGet } = await supabase
    .from('ventas')
    .select('total, monto_pagado')
    .eq('id', ventaId)
    .single();

  if (errorGet) return { data: null, error: handleRLSError(errorGet) };

  const nuevoMontoPagado = (parseFloat(venta.monto_pagado) || 0) + montoPago;
  const total = parseFloat(venta.total) || 0;

  let nuevoEstado = 'parcial';
  if (nuevoMontoPagado >= total) {
    nuevoEstado = 'pagado';
  } else if (nuevoMontoPagado <= 0) {
    nuevoEstado = 'pendiente';
  }

  const { data, error } = await supabase
    .from('ventas')
    .update({
      monto_pagado: nuevoMontoPagado,
      estado_pago: nuevoEstado,
      fecha_pago: nuevoEstado === 'pagado' ? new Date().toISOString() : null
    })
    .eq('id', ventaId)
    .select()
    .single();

  // Registrar ingreso automático en caja
  if (!error && montoPago > 0) {
    await supabase
      .from('movimientos_caja')
      .insert([{
        tipo: 'ingreso',
        monto: montoPago,
        venta_id: ventaId,
        categoria: 'pago_consignacion',
        metodo_pago: 'efectivo',
        descripcion: `Pago de consignación - Venta #${ventaId}`
      }]);
  }

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA MOVIMIENTOS DE STOCK
// =====================================================

// Obtener movimientos de stock
export const getMovimientosStock = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('movimientos_stock')
    .select(`
      *,
      producto:productos(id, linea_nombre, linea_medidas),
      cliente:clientes(id, nombre, tipo),
      variante:variantes_producto(id, material, color, talla, sku)
    `)
    .order('fecha', { ascending: false });

  return { data, error: handleRLSError(error) };
};

// Crear movimiento de stock
export const createMovimientoStock = async (movimiento) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('movimientos_stock')
    .insert([movimiento])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar movimiento de stock (hard delete)
export const deleteMovimientoStock = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('movimientos_stock')
    .delete()
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// Eliminar venta asociada a un movimiento (hard delete)
export const deleteVentaPorMovimiento = async (movimientoId) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('ventas')
    .delete()
    .eq('movimiento_id', movimientoId);

  return { error: handleRLSError(error) };
};

// Crear consignación con venta automática (para tracking de cuentas por cobrar)
export const createConsignacionConVenta = async (movimiento, datosVenta) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // 1. Crear el movimiento de stock
  const { data: movData, error: movError } = await supabase
    .from('movimientos_stock')
    .insert([movimiento])
    .select()
    .single();

  if (movError) return { data: null, error: handleRLSError(movError) };

  // 2. Crear la venta asociada con estado pendiente
  const venta = {
    producto_id: datosVenta.producto_id,
    cliente_id: datosVenta.cliente_id,
    movimiento_id: movData.id, // Enlace al movimiento de stock
    producto_nombre: datosVenta.producto_nombre,
    producto_medidas: datosVenta.producto_medidas,
    cliente_nombre: datosVenta.cliente_nombre,
    cantidad: datosVenta.cantidad,
    precio_unitario: datosVenta.precio_unitario,
    total: datosVenta.cantidad * datosVenta.precio_unitario,
    costo_unitario: datosVenta.costo_unitario || 0,
    tipo_venta: 'consignacion',
    estado_pago: 'pendiente',
    monto_pagado: 0,
    notas: datosVenta.notas || `Consignación automática - ${new Date().toLocaleDateString('es-MX')}`
  };

  const { data: ventaData, error: ventaError } = await supabase
    .from('ventas')
    .insert([venta])
    .select()
    .single();

  if (ventaError) {
    // Si falla la venta, el movimiento ya se creó pero logueamos el error
    console.error('Error creando venta para consignación:', ventaError);
    return {
      data: { movimiento: movData, venta: null },
      error: handleRLSError(ventaError),
      warning: 'Movimiento creado pero venta no registrada'
    };
  }

  return {
    data: { movimiento: movData, venta: ventaData },
    error: null
  };
};

// Registrar venta de consignación (cliente vendió piezas - actualiza cuenta por cobrar)
export const registrarVentaConsignacion = async (movimiento, datosVenta) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // 1. Crear el movimiento de stock
  const { data: movData, error: movError } = await supabase
    .from('movimientos_stock')
    .insert([movimiento])
    .select()
    .single();

  if (movError) return { data: null, error: handleRLSError(movError) };

  // 2. Buscar ventas pendientes de consignación para este producto/cliente
  const { data: ventasPendientes, error: searchError } = await supabase
    .from('ventas')
    .select('*')
    .eq('producto_id', datosVenta.producto_id)
    .eq('cliente_id', datosVenta.cliente_id)
    .eq('tipo_venta', 'consignacion')
    .in('estado_pago', ['pendiente', 'parcial'])
    .eq('activo', true)
    .order('created_at', { ascending: true });

  if (searchError) {
    console.error('Error buscando ventas pendientes:', searchError);
    return { data: { movimiento: movData }, error: null, warning: 'Movimiento creado pero no se encontraron ventas pendientes' };
  }

  // 3. Registrar pago en las ventas pendientes (FIFO - primero las más antiguas)
  let cantidadPorPagar = datosVenta.cantidad;
  const ventasActualizadas = [];

  for (const venta of (ventasPendientes || [])) {
    if (cantidadPorPagar <= 0) break;

    const cantidadPendienteVenta = venta.cantidad - (venta.monto_pagado / venta.precio_unitario);
    const cantidadAPagar = Math.min(cantidadPorPagar, cantidadPendienteVenta);
    const montoAPagar = cantidadAPagar * venta.precio_unitario;

    const nuevoMontoPagado = (parseFloat(venta.monto_pagado) || 0) + montoAPagar;
    const nuevoEstado = nuevoMontoPagado >= parseFloat(venta.total) ? 'pagado' : 'parcial';

    const { data: ventaActualizada, error: updateError } = await supabase
      .from('ventas')
      .update({
        monto_pagado: nuevoMontoPagado,
        estado_pago: nuevoEstado,
        fecha_pago: nuevoEstado === 'pagado' ? new Date().toISOString() : null
      })
      .eq('id', venta.id)
      .select()
      .single();

    if (!updateError) {
      ventasActualizadas.push(ventaActualizada);

      // Registrar ingreso automático en caja
      if (montoAPagar > 0) {
        await supabase
          .from('movimientos_caja')
          .insert([{
            tipo: 'ingreso',
            monto: montoAPagar,
            venta_id: venta.id,
            categoria: 'venta',
            metodo_pago: 'efectivo',
            descripcion: `Venta consignación - ${cantidadAPagar} pzas - Venta #${venta.id}`
          }]);
      }
    }

    cantidadPorPagar -= cantidadAPagar;
  }

  return {
    data: { movimiento: movData, ventasActualizadas },
    error: null
  };
};

// Registrar devolución de consignación (reduce cuenta por cobrar)
export const registrarDevolucionConsignacion = async (movimiento, datosDevolucion) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // 1. Crear el movimiento de stock
  const { data: movData, error: movError } = await supabase
    .from('movimientos_stock')
    .insert([movimiento])
    .select()
    .single();

  if (movError) return { data: null, error: handleRLSError(movError) };

  // 2. Buscar ventas pendientes de consignación para este producto/cliente
  const { data: ventasPendientes, error: searchError } = await supabase
    .from('ventas')
    .select('*')
    .eq('producto_id', datosDevolucion.producto_id)
    .eq('cliente_id', datosDevolucion.cliente_id)
    .eq('tipo_venta', 'consignacion')
    .in('estado_pago', ['pendiente', 'parcial'])
    .eq('activo', true)
    .order('created_at', { ascending: false }); // LIFO para devoluciones - las más recientes primero

  if (searchError) {
    console.error('Error buscando ventas para devolución:', searchError);
    return { data: { movimiento: movData }, error: null, warning: 'Movimiento creado pero no se actualizaron ventas' };
  }

  // 3. Reducir cantidad en ventas pendientes o cancelarlas
  let cantidadPorDevolver = datosDevolucion.cantidad;
  const ventasActualizadas = [];

  for (const venta of (ventasPendientes || [])) {
    if (cantidadPorDevolver <= 0) break;

    const cantidadPendienteVenta = venta.cantidad - (parseFloat(venta.monto_pagado) / parseFloat(venta.precio_unitario));
    const cantidadAReducir = Math.min(cantidadPorDevolver, cantidadPendienteVenta);

    if (cantidadAReducir >= cantidadPendienteVenta) {
      // Cancelar la venta completa si se devuelve todo lo pendiente
      const { data: ventaCancelada, error: cancelError } = await supabase
        .from('ventas')
        .update({
          estado_pago: 'cancelado',
          notas: `${venta.notas || ''} | Cancelado por devolución ${new Date().toLocaleDateString('es-MX')}`
        })
        .eq('id', venta.id)
        .select()
        .single();

      if (!cancelError) {
        ventasActualizadas.push(ventaCancelada);
      }
    } else {
      // Reducir cantidad de la venta
      const nuevaCantidad = venta.cantidad - cantidadAReducir;
      const nuevoTotal = nuevaCantidad * parseFloat(venta.precio_unitario);

      const { data: ventaReducida, error: reduceError } = await supabase
        .from('ventas')
        .update({
          cantidad: nuevaCantidad,
          total: nuevoTotal,
          notas: `${venta.notas || ''} | Reducido por devolución de ${cantidadAReducir} pzas`
        })
        .eq('id', venta.id)
        .select()
        .single();

      if (!reduceError) {
        ventasActualizadas.push(ventaReducida);
      }
    }

    cantidadPorDevolver -= cantidadAReducir;
  }

  return {
    data: { movimiento: movData, ventasActualizadas },
    error: null
  };
};

// Obtener resumen de stock por producto
export const getResumenStock = async (productoId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('movimientos_stock')
    .select('tipo_movimiento, cantidad')
    .eq('producto_id', productoId);

  if (data) {
    const resumen = {
      enConsignacion: 0,
      vendidoDirecto: 0,
      vendidoConsignacion: 0,
      devuelto: 0
    };

    data.forEach(mov => {
      switch (mov.tipo_movimiento) {
        case 'consignacion':
          resumen.enConsignacion += mov.cantidad;
          break;
        case 'venta_directa':
          resumen.vendidoDirecto += mov.cantidad;
          break;
        case 'venta_consignacion':
          resumen.vendidoConsignacion += mov.cantidad;
          resumen.enConsignacion -= mov.cantidad;
          break;
        case 'devolucion':
          resumen.devuelto += mov.cantidad;
          resumen.enConsignacion -= mov.cantidad;
          break;
      }
    });

    return { data: resumen, error: null };
  }

  return { data: null, error };
};

// =====================================================
// FUNCIONES DE AUTENTICACIÓN
// =====================================================

// Iniciar sesión
export const signIn = async (email, password) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  return { data, error: handleRLSError(error) };
};

// Cerrar sesión
export const signOut = async () => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase.auth.signOut();
  return { error };
};

// Obtener sesión actual
export const getSession = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase.auth.getSession();
  return { data: data?.session, error };
};

// Obtener usuario actual
export const getCurrentUser = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data: { user }, error } = await supabase.auth.getUser();
  return { data: user, error };
};

// Obtener perfil del usuario (con rol)
export const getUserProfile = async (userId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error: handleRLSError(error) };
};

// Escuchar cambios de autenticación
export const onAuthStateChange = (callback) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  return supabase.auth.onAuthStateChange(callback);
};

// =====================================================
// FUNCIONES PARA COSTOS AMAZON
// =====================================================

// Obtener costos Amazon
export const getCostosAmazon = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('costos_amazon')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data) {
    // Transformar nombres de columnas de snake_case a camelCase
    return {
      data: {
        material: parseFloat(data.material),
        maquila: parseFloat(data.maquila),
        insumos: parseFloat(data.insumos),
        merma: parseFloat(data.merma),
        amazonComision: parseFloat(data.amazon_comision),
        amazonFbaFee: parseFloat(data.amazon_fba_fee),
        amazonEnvioBodega: parseFloat(data.amazon_envio_bodega),
        precioBaseMayoreo: parseFloat(data.precio_base_mayoreo),
        piezasPorEnvioFBA: parseInt(data.piezas_por_envio_fba),
        volumenesMayoreo: data.volumenes_mayoreo || null
      },
      error: null
    };
  }

  return { data: null, error };
};

// Guardar costos Amazon (upsert)
export const saveCostosAmazon = async (costos) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // Primero obtener el ID del registro existente
  const { data: existingData } = await supabase
    .from('costos_amazon')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const costosDB = {
    material: costos.material,
    maquila: costos.maquila,
    insumos: costos.insumos,
    merma: costos.merma,
    amazon_comision: costos.amazonComision,
    amazon_fba_fee: costos.amazonFbaFee,
    amazon_envio_bodega: costos.amazonEnvioBodega,
    precio_base_mayoreo: costos.precioBaseMayoreo,
    piezas_por_envio_fba: costos.piezasPorEnvioFBA,
    volumenes_mayoreo: costos.volumenesMayoreo || null
  };

  let result;
  if (existingData?.id) {
    // Actualizar registro existente
    result = await supabase
      .from('costos_amazon')
      .update(costosDB)
      .eq('id', existingData.id)
      .select()
      .single();
  } else {
    // Insertar nuevo registro
    result = await supabase
      .from('costos_amazon')
      .insert([costosDB])
      .select()
      .single();
  }

  return result;
};

// =====================================================
// FUNCIONES PARA STORAGE (Imagenes y PDFs)
// =====================================================

// Subir imagen de producto
export const uploadImagenProducto = async (productoId, file) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${productoId}-${Date.now()}.${fileExt}`;
  const filePath = `productos/${fileName}`;

  const { data, error } = await supabase.storage
    .from('producto-imagenes')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) return { data: null, error };

  // Obtener URL publica
  const { data: { publicUrl } } = supabase.storage
    .from('producto-imagenes')
    .getPublicUrl(filePath);

  return {
    data: {
      url: publicUrl,
      nombre: file.name,
      path: filePath
    },
    error: null
  };
};

// Subir PDF (patron o instrucciones)
export const uploadPdfProducto = async (productoId, file, tipo) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const fileName = `${productoId}-${tipo}-${Date.now()}.pdf`;
  const filePath = `productos/${fileName}`;

  const { data, error } = await supabase.storage
    .from('producto-documentos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) return { data: null, error };

  // Obtener URL firmada (documentos privados)
  const { data: signedData, error: signError } = await supabase.storage
    .from('producto-documentos')
    .createSignedUrl(filePath, 3600); // 1 hora de validez

  return {
    data: {
      url: signedData?.signedUrl || filePath,
      nombre: file.name,
      path: filePath
    },
    error: signError
  };
};

// Obtener URL firmada para PDF (renovar acceso)
export const getSignedPdfUrl = async (filePath) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase.storage
    .from('producto-documentos')
    .createSignedUrl(filePath, 3600);

  return { data: data?.signedUrl, error };
};

// Eliminar archivo de storage
export const deleteStorageFile = async (bucket, filePath) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  return { error };
};

// =====================================================
// FUNCIONES PARA SERVICIOS DE MAQUILA
// =====================================================

// Obtener servicios de maquila con filtros
export const getServiciosMaquila = async (filtros = {}) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('servicios_maquila')
    .select(`
      *,
      cliente:clientes(id, nombre)
    `)
    .eq('activo', true)
    .order('fecha', { ascending: false });

  if (filtros.estadoPago) {
    query = query.eq('estado_pago', filtros.estadoPago);
  }

  if (filtros.clienteId) {
    query = query.eq('cliente_id', filtros.clienteId);
  }

  if (filtros.maquila) {
    query = query.ilike('maquila', `%${filtros.maquila}%`);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// Crear servicio de maquila
export const createServicioMaquila = async (servicio) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('servicios_maquila')
    .insert([servicio])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Actualizar servicio de maquila
export const updateServicioMaquila = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('servicios_maquila')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar servicio de maquila (soft delete)
export const deleteServicioMaquila = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('servicios_maquila')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// Registrar pago de servicio de maquila
export const registrarPagoServicio = async (servicioId, montoPago) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data: servicio, error: errorGet } = await supabase
    .from('servicios_maquila')
    .select('total, monto_pagado')
    .eq('id', servicioId)
    .single();

  if (errorGet) return { data: null, error: handleRLSError(errorGet) };

  const nuevoMontoPagado = (parseFloat(servicio.monto_pagado) || 0) + montoPago;
  const total = parseFloat(servicio.total) || 0;

  let nuevoEstado = 'parcial';
  if (nuevoMontoPagado >= total) {
    nuevoEstado = 'pagado';
  } else if (nuevoMontoPagado <= 0) {
    nuevoEstado = 'pendiente';
  }

  const { data, error } = await supabase
    .from('servicios_maquila')
    .update({
      monto_pagado: nuevoMontoPagado,
      estado_pago: nuevoEstado
    })
    .eq('id', servicioId)
    .select()
    .single();

  // Registrar ingreso en caja (el cliente nos paga por el servicio)
  if (!error && montoPago > 0) {
    await supabase
      .from('movimientos_caja')
      .insert([{
        tipo: 'ingreso',
        monto: montoPago,
        categoria: 'venta',
        metodo_pago: 'efectivo',
        descripcion: `Cobro servicio maquila - Servicio #${servicioId}`
      }]);
  }

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA MOVIMIENTOS DE CAJA
// =====================================================

// Obtener movimientos de caja con filtros
export const getMovimientosCaja = async (filtros = {}) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('movimientos_caja')
    .select('*')
    .eq('activo', true)
    .order('fecha', { ascending: false });

  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo);
  }

  if (filtros.categoria) {
    query = query.eq('categoria', filtros.categoria);
  }

  if (filtros.fechaInicio) {
    query = query.gte('fecha', filtros.fechaInicio);
  }

  if (filtros.fechaFin) {
    query = query.lte('fecha', filtros.fechaFin + 'T23:59:59');
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// Crear movimiento de caja
export const createMovimientoCaja = async (movimiento) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert([movimiento])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar movimiento de caja (soft delete)
export const deleteMovimientoCaja = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('movimientos_caja')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// Obtener balance de caja (ingresos - egresos)
export const getBalanceCaja = async (fechaInicio = null, fechaFin = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('movimientos_caja')
    .select('tipo, monto')
    .eq('activo', true);

  if (fechaInicio) {
    query = query.gte('fecha', fechaInicio);
  }

  if (fechaFin) {
    query = query.lte('fecha', fechaFin + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error) return { data: null, error: handleRLSError(error) };

  const resumen = { totalIngresos: 0, totalEgresos: 0, balance: 0 };

  (data || []).forEach(mov => {
    const monto = parseFloat(mov.monto) || 0;
    if (mov.tipo === 'ingreso') {
      resumen.totalIngresos += monto;
    } else {
      resumen.totalEgresos += monto;
    }
  });

  resumen.balance = resumen.totalIngresos - resumen.totalEgresos;

  return { data: resumen, error: null };
};

// =====================================================
// FUNCIONES PARA RESURTIDOS (Historial de compras)
// =====================================================

// Obtener resurtidos de un producto
export const getResurtidos = async (productoId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('resurtidos')
    .select(`
      *,
      cliente:clientes(id, nombre)
    `)
    .eq('activo', true)
    .order('fecha', { ascending: false });

  if (productoId) {
    query = query.eq('producto_id', productoId);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

// Crear resurtido
export const createResurtido = async (resurtido) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('resurtidos')
    .insert([resurtido])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Eliminar resurtido (hard delete)
export const deleteResurtido = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('resurtidos')
    .delete()
    .eq('id', id);

  return { error: handleRLSError(error) };
};

export default supabase;

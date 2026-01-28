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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
};

// Crear un nuevo canal e-commerce
export const createCanalEcommerce = async (canal) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('canales_ecommerce')
    .insert([canal])
    .select()
    .single();

  return { data, error };
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

  return { data, error };
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

  return { data, error };
};

// Crear un nuevo costo de envío
export const createCostoEnvio = async (costo) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('costos_envio')
    .insert([costo])
    .select()
    .single();

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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
      console.warn('Algunos datos no pudieron cargarse:', errores);
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
    console.error('Error cargando datos del dashboard:', error);
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

  return { data, error };
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

  return { data, error };
};

// Crear tipo de tela (solo admin)
export const createTipoTela = async (tela) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('tipos_tela')
    .insert([tela])
    .select()
    .single();

  return { data, error };
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

  return { data, error };
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

  return { data, error };
};

// =====================================================
// FUNCIONES PARA PRODUCTOS
// =====================================================

// Obtener todos los productos
export const getProductos = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      tipo_tela:tipos_tela(*),
      config_envio:config_envio(*)
    `)
    .eq('activo', true)
    .order('created_at', { ascending: false });

  return { data, error };
};

// Crear producto
export const createProducto = async (producto) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('productos')
    .insert([producto])
    .select()
    .single();

  return { data, error };
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

  return { data, error };
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

  return { data, error };
};

// Crear cliente
export const createCliente = async (cliente) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('clientes')
    .insert([cliente])
    .select()
    .single();

  return { data, error };
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

  return { data, error };
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
      cliente:clientes(id, nombre, tipo)
    `)
    .order('fecha', { ascending: false });

  return { data, error };
};

// Crear movimiento de stock
export const createMovimientoStock = async (movimiento) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('movimientos_stock')
    .insert([movimiento])
    .select()
    .single();

  return { data, error };
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

  return { data, error };
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

  return { data, error };
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

export default supabase;

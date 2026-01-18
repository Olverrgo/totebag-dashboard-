import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURACIÓN DE SUPABASE - BLANCOS SINAI TOTEBAG
// =====================================================

const supabaseUrl = 'https://xaacdoacjzjjvldgovxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhYWNkb2FjanpqanZsZGdvdnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDcxNjQsImV4cCI6MjA4MzkyMzE2NH0.BoLWKoMk3cLjttEJAGwSQNxlyDgUs6xZya1SDIOgLvc';

// Verificar si las credenciales están configuradas
const isConfigured = !supabaseUrl.includes('TU_SUPABASE') && !supabaseAnonKey.includes('TU_SUPABASE');

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

export default supabase;

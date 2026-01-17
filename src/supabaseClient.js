import { createClient } from '@supabase/supabase-js';

// =====================================================
// CONFIGURACIÓN DE SUPABASE - BLANCOS SINAI TOTEBAG
// =====================================================
//
// INSTRUCCIONES:
// 1. Ve a https://supabase.com y crea una cuenta
// 2. Crea un nuevo proyecto llamado "blancos-sinai-totebag"
// 3. Ve a Settings > API
// 4. Copia la "Project URL" y "anon public key"
// 5. Pégalas abajo:

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
// FUNCIONES DE AYUDA PARA LA BASE DE DATOS
// =====================================================

// Obtener todos los modelos
export const getModelos = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('modelos')
    .select(`
      *,
      modelo_imagenes (*),
      modelo_pdfs (*),
      modelo_comentarios (*),
      modelo_stock (*)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
};

// Crear modelo
export const createModelo = async (modelo) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('modelos')
    .insert([modelo])
    .select()
    .single();

  return { data, error };
};

// Actualizar modelo
export const updateModelo = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('modelos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

// Eliminar modelo
export const deleteModelo = async (id) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('modelos')
    .delete()
    .eq('id', id);

  return { error };
};

// Subir imagen
export const uploadImagen = async (modeloId, file) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${modeloId}/${Date.now()}.${fileExt}`;

  // Subir archivo al storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('modelo-imagenes')
    .upload(fileName, file);

  if (uploadError) return { data: null, error: uploadError };

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('modelo-imagenes')
    .getPublicUrl(fileName);

  // Guardar referencia en la tabla
  const { data, error } = await supabase
    .from('modelo_imagenes')
    .insert([{
      modelo_id: modeloId,
      url: publicUrl,
      nombre: file.name
    }])
    .select()
    .single();

  return { data, error };
};

// Subir PDF
export const uploadPDF = async (modeloId, file) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const fileName = `${modeloId}/${Date.now()}_${file.name}`;

  // Subir archivo al storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('modelo-pdfs')
    .upload(fileName, file);

  if (uploadError) return { data: null, error: uploadError };

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('modelo-pdfs')
    .getPublicUrl(fileName);

  // Guardar referencia en la tabla
  const { data, error } = await supabase
    .from('modelo_pdfs')
    .insert([{
      modelo_id: modeloId,
      url: publicUrl,
      nombre: file.name
    }])
    .select()
    .single();

  return { data, error };
};

// Agregar comentario
export const addComentario = async (modeloId, texto) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('modelo_comentarios')
    .insert([{
      modelo_id: modeloId,
      texto,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  return { data, error };
};

// Actualizar stock
export const updateStock = async (modeloId, cantidad, tipo, nota) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // Registrar movimiento de stock
  const { data, error } = await supabase
    .from('modelo_stock')
    .insert([{
      modelo_id: modeloId,
      cantidad,
      tipo, // 'entrada' o 'salida'
      nota,
      fecha: new Date().toISOString()
    }])
    .select()
    .single();

  return { data, error };
};

// Obtener stock actual de un modelo
export const getStockActual = async (modeloId) => {
  if (!supabase) return { data: 0, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('modelo_stock')
    .select('cantidad, tipo')
    .eq('modelo_id', modeloId);

  if (error) return { data: 0, error };

  const total = data.reduce((acc, mov) => {
    return mov.tipo === 'entrada' ? acc + mov.cantidad : acc - mov.cantidad;
  }, 0);

  return { data: total, error: null };
};

// Eliminar imagen
export const deleteImagen = async (imagenId, url) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  // Extraer path del storage
  const path = url.split('/modelo-imagenes/')[1];

  // Eliminar del storage
  if (path) {
    await supabase.storage.from('modelo-imagenes').remove([path]);
  }

  // Eliminar de la tabla
  const { error } = await supabase
    .from('modelo_imagenes')
    .delete()
    .eq('id', imagenId);

  return { error };
};

// Eliminar PDF
export const deletePDF = async (pdfId, url) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  // Extraer path del storage
  const path = url.split('/modelo-pdfs/')[1];

  // Eliminar del storage
  if (path) {
    await supabase.storage.from('modelo-pdfs').remove([path]);
  }

  // Eliminar de la tabla
  const { error } = await supabase
    .from('modelo_pdfs')
    .delete()
    .eq('id', pdfId);

  return { error };
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

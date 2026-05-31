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

// Eliminar tipo de tela (soft delete, solo admin)
export const deleteTipoTela = async (id) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('tipos_tela')
    .update({ activo: false })
    .eq('id', id)
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
//
// Sub-Fase 5.C: agrega cálculo de costo on-the-fly para productos manufactura
// desde la "Receta Viva" (recetas + materiales + configuraciones_corte).
// Resultado en `prod.costo_calculado_por_variante` (objeto por variante.id) +
// `prod.costo_desde` / `prod.costo_hasta` (rango para mostrar en card).
//
// Estos campos son ADITIVOS: no reemplazan `costo_total_1_tinta` ni
// `variantes.costo_unitario` por ahora. Sub-Fase 5.D (UI) los usará.
//
// Fallback dual: si configuracion_corte tiene `material_id` set, el costo
// de tela viene de la receta (que incluye ese material). Si NO tiene
// material_id, se usa el legacy `precio_tela_metro × total_metros_lineales`
// como fallback temporal hasta que Rigo migre cada config (Sub-Fase 5.B).
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
      variantes:variantes_producto(id, sku, material, color, talla, stock, stock_consignacion, costo_unitario, precio_venta, imagen_url, activo),
      recetas:recetas(id, variante_id, material_id, cantidad, opcional, activo,
        material:materiales(id, nombre, unidad, costo_unitario)),
      configuraciones_corte:configuraciones_corte(id, variante_id, costo_confeccion, costo_empaque,
        precio_tela_metro, total_metros_lineales, material_id, es_configuracion_actual, activo,
        material:materiales(id, costo_unitario))
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

  if (data) {
    data.forEach(prod => {
      // Stock de variantes (lógica existente)
      const variantesActivas = (prod.variantes || []).filter(v => v.activo !== false);
      if (variantesActivas.length > 0) {
        prod.stock_variantes = variantesActivas.reduce((sum, v) => sum + (v.stock || 0), 0);
        prod.stock_consignacion_variantes = variantesActivas.reduce((sum, v) => sum + (v.stock_consignacion || 0), 0);
        prod.tiene_variantes = true;
      } else {
        prod.stock_variantes = 0;
        prod.stock_consignacion_variantes = 0;
        prod.tiene_variantes = false;
      }

      // Costo calculado on-the-fly (solo manufactura)
      prod.costo_calculado_por_variante = {};
      prod.costo_desde = null;
      prod.costo_hasta = null;

      if (prod.es_manufacturado) {
        const recetasActivas = (prod.recetas || []).filter(r => r.activo);
        const configsVigentes = (prod.configuraciones_corte || [])
          .filter(c => c.es_configuracion_actual && c.activo);

        const calcularVariante = (varianteId) => {
          // Recetas: específicas de la variante O las del producto (variante_id=null)
          const recetasAplicables = recetasActivas.filter(r =>
            (r.variante_id === varianteId || r.variante_id === null) && !r.opcional
          );

          // Config: específica de la variante O del producto (variante_id=null)
          const config = configsVigentes.find(c => c.variante_id === varianteId)
            || configsVigentes.find(c => c.variante_id === null);

          // Merma del patrón de corte aplica a TODOS los materiales de la receta
          // (decisión Rigo + Gemini en Fase 6). Si en el futuro se necesita
          // excluir algún material de la merma, agregar flag `aplica_merma` en
          // `recetas` o en `materiales`.
          const merma = parseFloat(config?.porcentaje_desperdicio) || 0;
          const factorMerma = 1 + (merma / 100);

          // 1. Costo de materiales de la receta (insumos extra)
          // Excluimos el material que ya está en la configuración de corte para no duplicar
          const costoMaterialesReceta = recetasAplicables
            .filter(r => r.material_id !== config?.material_id)
            .reduce((sum, r) => {
              const cantidadBase = parseFloat(r.cantidad) || 0;
              const precio = parseFloat(r.material?.costo_unitario) || 0;
              return sum + cantidadBase * factorMerma * precio;
            }, 0);

          // 2. Costo de la tela principal (desde configuración de corte)
          // Nota: total_metros_lineales ya incluye la merma (calculado por trigger SQL)
          let costoTelaConfig = 0;
          if (config) {
            const metros = parseFloat(config.total_metros_lineales) || 0;
            const precio = config.material?.costo_unitario 
              ? parseFloat(config.material.costo_unitario) 
              : (parseFloat(config.precio_tela_metro) || 0);
            costoTelaConfig = metros * precio;
          }

          const costoServicios = config
            ? (parseFloat(config.costo_confeccion) || 0) + (parseFloat(config.costo_empaque) || 0)
            : 0;

          return {
            costo_materiales: costoMaterialesReceta,
            costo_servicios: costoServicios,
            costo_tela_principal: costoTelaConfig,
            costo_total: costoMaterialesReceta + costoServicios + costoTelaConfig,
            usa_fallback_legacy: config && !config.material_id,
          };
        };

        // Por cada variante activa, calcular
        variantesActivas.forEach(v => {
          prod.costo_calculado_por_variante[v.id] = calcularVariante(v.id);
        });

        // Rango para card del producto
        const totales = Object.values(prod.costo_calculado_por_variante)
          .map(c => c.costo_total)
          .filter(t => t > 0);
        if (totales.length > 0) {
          prod.costo_desde = Math.min(...totales);
          prod.costo_hasta = Math.max(...totales);
        }
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

  // Crear nueva configuración con el nuevo precio.
  // Copiamos TODO el original (spread) en vez de listar columnas a mano:
  // así sobreviven medidas_json (Fase 7) y los campos v2 (metros_sabana_*)
  // sin riesgo de desincronizar con el schema en el futuro.
  // Quitamos id/timestamps; el trigger recalcula total_metros_lineales,
  // costo_material y costo_total al insertar.
  const {
    id: _id,
    created_at: _createdAt,
    updated_at: _updatedAt,
    ...camposOriginal
  } = configOriginal;

  const nuevaConfig = {
    ...camposOriginal,
    precio_tela_metro: nuevoPrecioTela,
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

// Eliminar venta (soft delete) — LEGACY: usar eliminarVentaCompleta para cascada
export const deleteVenta = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('ventas')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// Obtener resumen de impacto antes de eliminar una venta
export const obtenerImpactoEliminacion = async (ventaId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // 1. Obtener la venta con producto y cliente
  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .select(`
      *,
      producto:productos(id, linea_nombre, linea_medidas),
      variante:variantes_producto(id, material, color, talla, sku),
      cliente:clientes(id, nombre)
    `)
    .eq('id', ventaId)
    .single();

  if (errorVenta) return { data: null, error: handleRLSError(errorVenta) };
  if (!venta) return { data: null, error: 'Venta no encontrada' };

  // 2. Obtener movimientos de caja vinculados (activos)
  const { data: movsCaja } = await supabase
    .from('movimientos_caja')
    .select('id, tipo, monto, categoria, metodo_pago, fecha')
    .eq('venta_id', ventaId)
    .eq('activo', true);

  // 3. Obtener movimientos de stock vinculados
  const { data: movsStock } = await supabase
    .from('movimientos_stock')
    .select('id, tipo_movimiento, cantidad, notas')
    .or(`movimiento_id.eq.${ventaId},notas.ilike.%Venta #${ventaId}%`);

  const totalCobrado = (movsCaja || []).reduce((sum, m) => sum + (parseFloat(m.monto) || 0), 0);
  const esConsignacion = venta.tipo_venta === 'consignacion';
  const cantidad = parseInt(venta.cantidad) || 0;
  const total = parseFloat(venta.total) || 0;
  const montoPagado = parseFloat(venta.monto_pagado) || 0;
  const pendiente = Math.max(0, total - montoPagado);

  const impacto = {
    venta,
    resumen: {
      producto: venta.producto?.linea_nombre || 'Producto desconocido',
      variante: venta.variante ? `${venta.variante.material || ''} ${venta.variante.color || ''} ${venta.variante.talla || ''}`.trim() : null,
      cliente: venta.cliente?.nombre || 'Sin cliente',
      tipoVenta: venta.tipo_venta,
      cantidad,
      total,
      montoPagado,
      pendiente,
      estadoPago: venta.estado_pago,
    },
    impactoCaja: {
      movimientos: movsCaja || [],
      totalCobrado,
      descripcion: totalCobrado > 0
        ? `Se desactivarán ${(movsCaja || []).length} movimiento(s) de caja por $${totalCobrado.toFixed(2)}`
        : 'Sin movimientos de caja vinculados',
    },
    impactoStock: {
      descripcion: esConsignacion
        ? `Se restaurarán ${cantidad} pza(s) al stock de taller (desde consignación)`
        : `Se restaurarán ${cantidad} pza(s) al stock de taller`,
      cantidad,
      esConsignacion,
    },
    impactoDashboard: {
      areas: [],
    },
    movsStock: movsStock || [],
  };

  // Construir lista de áreas afectadas
  const areas = impacto.impactoDashboard.areas;
  areas.push(`Balance de Caja: ${totalCobrado > 0 ? `-$${totalCobrado.toFixed(2)} en ingresos` : 'sin cambio'}`);
  if (pendiente > 0) areas.push(`Por Cobrar: -$${pendiente.toFixed(2)} (se elimina deuda pendiente)`);
  if (esConsignacion) areas.push(`Inventario Consignación: -${cantidad} pza(s) (regresan a taller)`);
  areas.push(`Stock Taller: +${cantidad} pza(s) (se devuelven al inventario)`);
  areas.push(`Ventas Totales: -$${total.toFixed(2)} del período`);
  areas.push(`Utilidad: se ajustará al eliminar la ganancia/pérdida de esta venta`);

  return { data: impacto, error: null };
};

// Eliminar venta con cascada completa (auditoría + reversión de stock + caja)
export const eliminarVentaCompleta = async (ventaId, motivoEliminacion = '') => {
  if (!supabase) return { error: 'Supabase no configurado' };

  // 1. Obtener la venta
  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .select('*')
    .eq('id', ventaId)
    .single();

  if (errorVenta) return { error: handleRLSError(errorVenta) };
  if (!venta) return { error: 'Venta no encontrada' };

  const cantidad = parseInt(venta.cantidad) || 0;
  const esConsignacion = venta.tipo_venta === 'consignacion';

  // 2. Desactivar movimientos de caja vinculados
  const { data: movsCaja } = await supabase
    .from('movimientos_caja')
    .select('id, monto')
    .eq('venta_id', ventaId)
    .eq('activo', true);

  if (movsCaja && movsCaja.length > 0) {
    const ids = movsCaja.map(m => m.id);
    await supabase
      .from('movimientos_caja')
      .update({ activo: false })
      .in('id', ids);
  }

  // 3. Restaurar stock según tipo de venta
  if (esConsignacion && cantidad > 0) {
    // Consignación: restaurar stock_consignacion → stock (las piezas estaban en consignación)
    // Primero ver cuántas piezas ya se pagaron (ya salieron de consignación)
    const montoPagado = parseFloat(venta.monto_pagado) || 0;
    const precioUnitario = parseFloat(venta.precio_unitario) || 0;
    const piezasPagadas = precioUnitario > 0 ? Math.floor(montoPagado / precioUnitario) : 0;
    const piezasEnConsignacion = Math.max(0, cantidad - piezasPagadas);

    if (venta.variante_id) {
      const { data: varData } = await supabase
        .from('variantes_producto')
        .select('stock, stock_consignacion')
        .eq('id', venta.variante_id)
        .single();
      if (varData) {
        await supabase
          .from('variantes_producto')
          .update({
            stock: (varData.stock || 0) + piezasEnConsignacion,
            stock_consignacion: Math.max(0, (varData.stock_consignacion || 0) - piezasEnConsignacion)
          })
          .eq('id', venta.variante_id);
      }
    } else if (venta.producto_id) {
      const { data: prodData } = await supabase
        .from('productos')
        .select('stock, stock_consignacion')
        .eq('id', venta.producto_id)
        .single();
      if (prodData) {
        await supabase
          .from('productos')
          .update({
            stock: (prodData.stock || 0) + piezasEnConsignacion,
            stock_consignacion: Math.max(0, (prodData.stock_consignacion || 0) - piezasEnConsignacion)
          })
          .eq('id', venta.producto_id);
      }
    }
  } else if (!esConsignacion && cantidad > 0) {
    // Venta directa: restaurar stock al taller
    if (venta.variante_id) {
      const { data: varData } = await supabase
        .from('variantes_producto')
        .select('stock')
        .eq('id', venta.variante_id)
        .single();
      if (varData) {
        await supabase
          .from('variantes_producto')
          .update({ stock: (varData.stock || 0) + cantidad })
          .eq('id', venta.variante_id);
      }
    } else if (venta.producto_id) {
      const { data: prodData } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', venta.producto_id)
        .single();
      if (prodData) {
        await supabase
          .from('productos')
          .update({ stock: (prodData.stock || 0) + cantidad })
          .eq('id', venta.producto_id);
      }
    }
  }

  // 4. Crear movimiento_stock de auditoría
  await supabase
    .from('movimientos_stock')
    .insert([{
      producto_id: venta.producto_id,
      tipo_movimiento: 'eliminacion_venta',
      cantidad: cantidad,
      notas: `Eliminación de venta #${ventaId}${esConsignacion ? ' (consignación)' : ' (directa)'} - ${motivoEliminacion || 'Sin motivo especificado'}`,
      ...(venta.variante_id ? { variante_id: venta.variante_id } : {}),
      ...(venta.cliente_id ? { cliente_id: venta.cliente_id } : {})
    }]);

  // 5. Soft-delete de la venta con motivo
  const { error: errorDelete } = await supabase
    .from('ventas')
    .update({
      activo: false,
      notas: `[ELIMINADA ${new Date().toLocaleDateString('es-MX')}] ${motivoEliminacion || ''} | Datos: $${venta.total} total, $${venta.monto_pagado || 0} pagado, ${cantidad} pzas | ${venta.notas || ''}`
    })
    .eq('id', ventaId);

  if (errorDelete) return { error: handleRLSError(errorDelete) };

  const totalRevertidoCaja = (movsCaja || []).reduce((s, m) => s + (parseFloat(m.monto) || 0), 0);

  return {
    error: null,
    resumen: {
      ventaId,
      cajaMomentosDesactivados: (movsCaja || []).length,
      totalRevertidoCaja,
      stockRestaurado: cantidad,
      tipo: esConsignacion ? 'consignacion' : 'directa',
    }
  };
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

// Registrar pago de venta (centralizado: maneja stock_consignacion y movimientos para consignaciones)
// options.skipMovimientoStock: true para evitar duplicar movimiento cuando ya fue creado externamente
export const registrarPagoVenta = async (ventaId, montoPago, options = {}, metodoPago = 'efectivo') => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // Obtener venta actual con campos necesarios para consignaciones
  const { data: venta, error: errorGet } = await supabase
    .from('ventas')
    .select('total, monto_pagado, tipo_venta, precio_unitario, producto_id, cliente_id, variante_id')
    .eq('id', ventaId)
    .single();

  if (errorGet) return { data: null, error: handleRLSError(errorGet) };

  const total = parseFloat(venta.total) || 0;
  const pagadoActual = parseFloat(venta.monto_pagado) || 0;
  const pendiente = total - pagadoActual;

  // Si ya está completamente pagada, no permitir más pagos
  if (pendiente <= 0) {
    return { data: null, error: { message: 'Esta venta ya está completamente pagada' } };
  }

  // Limitar el pago al monto pendiente
  const montoReal = Math.min(montoPago, pendiente);
  const nuevoMontoPagado = pagadoActual + montoReal;

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

  if (error) return { data: null, error: handleRLSError(error) };

  // Para consignaciones: reducir stock_consignacion y crear movimiento_stock
  const esConsignacion = venta.tipo_venta === 'consignacion';
  const precioUnitario = parseFloat(venta.precio_unitario) || 0;

  if (esConsignacion && precioUnitario > 0 && montoReal > 0) {
    const piezasPagadas = Math.floor(montoReal / precioUnitario);

    if (piezasPagadas > 0) {
      // Crear movimiento de stock tipo venta_consignacion (skip si ya fue creado externamente)
      if (!options.skipMovimientoStock) {
        await supabase
          .from('movimientos_stock')
          .insert([{
            producto_id: venta.producto_id,
            cliente_id: venta.cliente_id,
            tipo_movimiento: 'venta_consignacion',
            cantidad: piezasPagadas,
            notas: `Cobro consignación - ${piezasPagadas} pzas pagadas`,
            ...(venta.variante_id ? { variante_id: venta.variante_id } : {})
          }]);
      }

      // Reducir stock_consignacion
      if (venta.variante_id) {
        const { data: varData } = await supabase
          .from('variantes_producto')
          .select('stock, stock_consignacion')
          .eq('id', venta.variante_id)
          .single();
        if (varData) {
          const nuevaConsig = Math.max(0, (varData.stock_consignacion || 0) - piezasPagadas);
          await supabase
            .from('variantes_producto')
            .update({ stock_consignacion: nuevaConsig })
            .eq('id', venta.variante_id);
        }
      } else if (venta.producto_id) {
        const { data: prodData } = await supabase
          .from('productos')
          .select('stock_consignacion')
          .eq('id', venta.producto_id)
          .single();
        if (prodData) {
          const nuevaConsig = Math.max(0, (prodData.stock_consignacion || 0) - piezasPagadas);
          await supabase
            .from('productos')
            .update({ stock_consignacion: nuevaConsig })
            .eq('id', venta.producto_id);
        }
      }
    }
  }

  // Registrar ingreso automático en caja
  if (montoReal > 0) {
    const categoriaCaja = esConsignacion ? 'cobro_consignacion' : 'cobro_venta';
    const descripcionCaja = esConsignacion
      ? `Cobro consignación - Venta #${ventaId}`
      : `Cobro venta - Venta #${ventaId}`;
    const { error: cajaError } = await supabase
      .from('movimientos_caja')
      .insert([{
        tipo: 'ingreso',
        monto: montoReal,
        venta_id: ventaId,
        categoria: categoriaCaja,
        metodo_pago: metodoPago,
        descripcion: descripcionCaja,
        // Agrupa los N fragmentos de un mismo abono como UN evento (estado de cuenta)
        abono_grupo: options.abonoGrupo || null
      }])
      .select()
      .single();
    if (cajaError) {
      console.error('Error creando movimiento de caja en registrarPagoVenta:', cajaError);
    }
  }

  return { data, error: null };
};

// =====================================================
// ABONO DE CLIENTE COMO EVENTO ÚNICO + ESTADO DE CUENTA (Fase 12)
// =====================================================

// Registra UN abono del cliente distribuyéndolo FIFO entre sus ventas
// pendientes, pero estampando un MISMO folio de abono (AB-AAAA-MM-NNN) en
// todos los ingresos de caja que genera → el estado de cuenta lo ve como UN
// evento, aunque internamente cubra varios productos.
// `ventas` = lista de ventas pendientes del cliente (las que hoy arma la UI),
// cada una con { id, total, monto_pagado, created_at, _es_servicio? }.
export const registrarAbonoCliente = async (clienteId, monto, ventas, metodoPago = 'efectivo') => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const montoNum = parseFloat(monto);
  if (!montoNum || montoNum <= 0) return { data: null, error: { message: 'Monto inválido' } };
  if (!ventas || ventas.length === 0) return { data: null, error: { message: 'Sin ventas pendientes' } };

  // UN folio de abono para todo el pago (resiliente: si falla, el abono igual procede sin agrupar)
  let abonoGrupo = null;
  try {
    const { data: f, error: fErr } = await supabase.rpc('siguiente_folio_abono');
    if (fErr) console.error('No se pudo generar folio de abono:', fErr);
    else abonoGrupo = f;
  } catch (e) {
    console.error('Error llamando siguiente_folio_abono:', e);
  }

  let montoRestante = montoNum;
  const ventasOrdenadas = [...ventas].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const aplicados = [];

  for (const venta of ventasOrdenadas) {
    if (montoRestante <= 0) break;
    const pendiente = (parseFloat(venta.total) || 0) - (parseFloat(venta.monto_pagado) || 0);
    if (pendiente <= 0) continue;
    const montoAplicar = Math.min(montoRestante, pendiente);

    let res;
    if (venta._es_servicio) {
      // servicios de maquila: tabla aparte, no llevan abono_grupo (flujo distinto)
      res = await registrarPagoServicio(venta.id, montoAplicar, metodoPago);
    } else {
      res = await registrarPagoVenta(venta.id, montoAplicar, { abonoGrupo }, metodoPago);
    }
    if (res.error) {
      return { data: { folio: abonoGrupo, aplicados }, error: res.error };
    }
    aplicados.push({ venta_id: venta.id, monto: montoAplicar });
    montoRestante -= montoAplicar;
  }

  return {
    data: { folio: abonoGrupo, aplicados, sobrante: montoRestante },
    folio: abonoGrupo,
    error: null
  };
};

// Estado de cuenta de un vendedor (cliente de consignación), mensual o por rango.
// Devuelve sus entregas (ventas) y sus abonos como EVENTOS (agrupados por
// abono_grupo), más totales. El saldo pendiente es el saldo VIVO total del
// cliente (no acotado al periodo): la deuda es la deuda.
export const getEstadoCuentaVendedor = async (clienteId, { desde, hasta } = {}) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  if (!clienteId) return { data: null, error: { message: 'Falta el cliente' } };

  // 1. Todas las ventas del cliente (para ligar abonos y calcular saldo vivo)
  const { data: ventasAll, error: errV } = await supabase
    .from('ventas')
    .select('id, folio_operacion, producto_nombre, cantidad, total, monto_pagado, monto_pendiente, tipo_venta, estado_pago, created_at')
    .eq('cliente_id', clienteId)
    .eq('activo', true)
    .order('created_at', { ascending: true });
  if (errV) return { data: null, error: handleRLSError(errV) };

  const dentroRango = (fecha) => {
    if (!fecha) return false;
    const t = new Date(fecha).getTime();
    if (desde && t < new Date(desde).getTime()) return false;
    if (hasta && t > new Date(hasta).getTime()) return false;
    return true;
  };

  // Entregas del periodo (por fecha de la venta)
  const ventas = (ventasAll || []).filter(v => (!desde && !hasta) || dentroRango(v.created_at));

  // 2. Abonos: ingresos de caja ligados a CUALQUIER venta del cliente, agrupados
  //    por abono_grupo. Se filtran por la fecha DEL ABONO (no de la venta), para
  //    que un pago de este mes sobre una venta vieja sí aparezca en el mes.
  const ventaIds = (ventasAll || []).map(v => v.id);
  let abonos = [];
  if (ventaIds.length > 0) {
    const { data: ingresos, error: errC } = await supabase
      .from('movimientos_caja')
      .select('id, monto, fecha, metodo_pago, abono_grupo, venta_id, activo')
      .eq('tipo', 'ingreso')
      .in('venta_id', ventaIds);
    if (errC) return { data: null, error: handleRLSError(errC) };

    const mapa = new Map();
    for (const ing of (ingresos || [])) {
      if (ing.activo === false) continue;
      if ((desde || hasta) && !dentroRango(ing.fecha)) continue;
      const key = ing.abono_grupo || `solo-${ing.id}`; // abonos viejos sin grupo: cada uno su evento
      if (!mapa.has(key)) {
        mapa.set(key, { folio: ing.abono_grupo || null, fecha: ing.fecha, metodo: ing.metodo_pago, monto: 0 });
      }
      const ev = mapa.get(key);
      ev.monto += parseFloat(ing.monto) || 0;
      if (new Date(ing.fecha) < new Date(ev.fecha)) ev.fecha = ing.fecha; // fecha más temprana del grupo
    }
    abonos = Array.from(mapa.values()).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  // 3. Totales
  const entregado = ventas.reduce((s, v) => s + (parseFloat(v.total) || 0), 0);
  const cobrado = abonos.reduce((s, a) => s + a.monto, 0);
  const pendiente = (ventasAll || [])
    .filter(v => v.tipo_venta === 'consignacion')
    .reduce((s, v) => s + (parseFloat(v.monto_pendiente) || 0), 0); // saldo VIVO total

  return {
    data: {
      cliente_id: clienteId,
      periodo: { desde: desde || null, hasta: hasta || null },
      ventas,
      abonos,
      totales: { entregado, cobrado, pendiente }
    },
    error: null
  };
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
    notas: datosVenta.notas || `Consignación automática - ${new Date().toLocaleDateString('es-MX')}`,
    folio_operacion: datosVenta.folio_operacion || null,
    ...(datosVenta.variante_id ? { variante_id: datosVenta.variante_id } : {})
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

  // 1. Crear el movimiento de stock (registro en SalidasView)
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

  // 3. Registrar pago en las ventas pendientes (FIFO) usando registrarPagoVenta centralizado
  let cantidadPorPagar = datosVenta.cantidad;
  const ventasActualizadas = [];

  for (const venta of (ventasPendientes || [])) {
    if (cantidadPorPagar <= 0) break;

    const cantidadPendienteVenta = venta.cantidad - ((parseFloat(venta.monto_pagado) || 0) / (parseFloat(venta.precio_unitario) || 1));
    const cantidadAPagar = Math.min(cantidadPorPagar, cantidadPendienteVenta);
    const montoAPagar = cantidadAPagar * (parseFloat(venta.precio_unitario) || 0);

    if (montoAPagar > 0) {
      // registrarPagoVenta maneja: monto_pagado, estado_pago, stock_consignacion y movimiento_caja
      // skipMovimientoStock porque ya creamos el movimiento arriba
      const { data: ventaActualizada, error: pagoError } = await registrarPagoVenta(venta.id, montoAPagar, { skipMovimientoStock: true });
      if (!pagoError && ventaActualizada) {
        ventasActualizadas.push(ventaActualizada);
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

// =====================================================
// FASE 11: VENTA MULTI-PRODUCTO (CARRITO)
// =====================================================

// Ajusta el stock de UNA línea leyendo el valor FRESCO de la BD (evita
// descuadres si el mismo producto/variante aparece más de una vez en el carrito).
// directa  → resta del stock de taller (consignación sin cambio).
// consignación → resta de taller y suma a stock_consignacion.
// Lee el stock de taller disponible (FRESCO) de una línea, para validar
// que no se venda/consigne más de lo que hay antes de crear la venta.
const getStockTallerLinea = async (productoId, varianteId) => {
  if (varianteId) {
    const { data } = await supabase
      .from('variantes_producto')
      .select('stock')
      .eq('id', varianteId)
      .single();
    return data?.stock || 0;
  }
  const { data } = await supabase
    .from('productos')
    .select('stock')
    .eq('id', productoId)
    .single();
  return data?.stock || 0;
};

const ajustarStockLinea = async (productoId, varianteId, cantidad, esConsignacion) => {
  if (varianteId) {
    const { data: v } = await supabase
      .from('variantes_producto')
      .select('stock, stock_consignacion')
      .eq('id', varianteId)
      .single();
    const nuevoStock = (v?.stock || 0) - cantidad;
    const nuevaConsig = esConsignacion ? (v?.stock_consignacion || 0) + cantidad : null; // null = no tocar consig
    return updateStockVariante(varianteId, nuevoStock, nuevaConsig);
  }
  const { data: p } = await supabase
    .from('productos')
    .select('stock, stock_consignacion')
    .eq('id', productoId)
    .single();
  const updates = { stock: (p?.stock || 0) - cantidad };
  if (esConsignacion) updates.stock_consignacion = (p?.stock_consignacion || 0) + cantidad;
  return updateProducto(productoId, updates);
};

// Registra una venta de VARIOS productos para UN cliente en UNA sola operación
// (el "carrito"). Un solo tipo por carrito: 'directa' o 'consignacion'.
// Reusa los conectores existentes por línea: movimiento_stock (log) + venta
// (deuda/pago) + caja (ingreso si directa pagada) + ajuste de stock manual.
//
// header = { cliente_id, cliente_nombre, tipo_operacion: 'directa'|'consignacion',
//            metodo_pago, estado_pago ('pagado'|'pendiente'|'parcial' — solo directa), notas }
// lineas = [{ producto_id, variante_id?, producto_nombre, producto_medidas,
//             cantidad, precio_unitario, costo_unitario }]
//
// NO es atómico (loop en JS, decisión Rigo opción A): si una línea falla, las
// anteriores ya quedaron. Devuelve resultado por línea para que la UI reporte
// exactamente cuáles fallaron.
export const registrarVentaMultiple = async (header, lineas) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  if (!lineas || lineas.length === 0) return { data: null, error: { message: 'El carrito está vacío' } };
  if (!header.cliente_id) return { data: null, error: { message: 'Falta el cliente' } };

  const esConsignacion = header.tipo_operacion === 'consignacion';

  // UN folio para toda la operación (lo comparten las N líneas). Lo genera la
  // BD de forma atómica (BSIN-AAAA-MM-NNN). Si fallara, NO bloqueamos la venta:
  // queda sin folio (degradación segura), pero registramos el aviso.
  let folioOperacion = null;
  try {
    const { data: f, error: fErr } = await supabase.rpc('siguiente_folio_venta');
    if (fErr) console.error('No se pudo generar folio de venta:', fErr);
    else folioOperacion = f;
  } catch (e) {
    console.error('Error llamando siguiente_folio_venta:', e);
  }

  const resultados = [];

  for (const l of lineas) {
    const cantidad = parseInt(l.cantidad) || 0;
    const precio = parseFloat(l.precio_unitario) || 0;
    const total = cantidad * precio;
    const productoId = (l.producto_id === '' || l.producto_id == null) ? null : parseInt(l.producto_id);
    const varianteId = (l.variante_id === '' || l.variante_id == null) ? null : parseInt(l.variante_id);

    if (!productoId || cantidad <= 0) {
      resultados.push({ linea: l, ok: false, error: { message: 'Línea inválida (producto o cantidad)' } });
      continue;
    }

    // Guard: si el producto tiene variantes activas pero no se eligió una,
    // NO se puede ajustar stock (viviría en la variante, no en productos.stock).
    // Rechazar la línea ANTES de crear venta/movimiento para no dejar una venta
    // sin su descuento de stock. (El fix de fondo es que la UI exija variante.)
    if (!varianteId) {
      const { data: vars } = await supabase
        .from('variantes_producto')
        .select('id')
        .eq('producto_id', productoId)
        .eq('activo', true)
        .limit(1);
      if (vars && vars.length > 0) {
        resultados.push({ linea: l, ok: false, error: { message: `"${l.producto_nombre || 'Producto'}" tiene variantes: debes elegir una variante` } });
        continue;
      }
    }

    // Guard: no vender más que el stock disponible (taller). Tanto venta directa
    // como consignación salen del stock de taller. Se lee FRESCO: si el mismo
    // producto/variante va en 2 líneas, la 2ª ya ve el descuento de la 1ª.
    const stockDisp = await getStockTallerLinea(productoId, varianteId);
    if (cantidad > stockDisp) {
      resultados.push({ linea: l, ok: false, error: { message: `"${l.producto_nombre || 'Producto'}": stock insuficiente (disponible ${stockDisp}, solicitado ${cantidad})` } });
      continue;
    }

    const movimiento = {
      producto_id: productoId,
      cliente_id: header.cliente_id,
      tipo_movimiento: esConsignacion ? 'consignacion' : 'venta_directa',
      cantidad,
      notas: header.notas || (esConsignacion ? 'Consignación (carrito)' : 'Venta directa (carrito)'),
      ...(varianteId ? { variante_id: varianteId } : {})
    };

    let lineaError = null;

    if (esConsignacion) {
      // movimiento + venta pendiente (reusa la función probada)
      const datosVenta = {
        producto_id: productoId,
        cliente_id: header.cliente_id,
        producto_nombre: l.producto_nombre,
        producto_medidas: l.producto_medidas,
        cliente_nombre: header.cliente_nombre,
        cantidad,
        precio_unitario: precio,
        costo_unitario: parseFloat(l.costo_unitario) || 0,
        notas: header.notas,
        folio_operacion: folioOperacion,
        ...(varianteId ? { variante_id: varianteId } : {})
      };
      const res = await createConsignacionConVenta(movimiento, datosVenta);
      lineaError = res.error;
    } else {
      // Venta directa: movimiento + venta + (caja si pagada)
      const { data: movData, error: movErr } = await createMovimientoStock(movimiento);
      if (movErr) { resultados.push({ linea: l, ok: false, error: movErr }); continue; }

      const estado = header.estado_pago || 'pagado';
      const venta = {
        producto_id: productoId,
        cliente_id: header.cliente_id,
        movimiento_id: movData?.id || null,
        producto_nombre: l.producto_nombre,
        producto_medidas: l.producto_medidas,
        cliente_nombre: header.cliente_nombre,
        cantidad,
        precio_unitario: precio,
        total,
        costo_unitario: parseFloat(l.costo_unitario) || 0,
        metodo_pago: header.metodo_pago || 'efectivo',
        estado_pago: estado,
        monto_pagado: estado === 'pagado' ? total : 0,
        tipo_venta: 'directa',
        notas: header.notas,
        folio_operacion: folioOperacion,
        ...(varianteId ? { variante_id: varianteId } : {})
      };
      const { data: ventaData, error: ventaErr } = await createVenta(venta);
      if (ventaErr) { resultados.push({ linea: l, ok: false, error: ventaErr }); continue; }

      if (estado === 'pagado' && total > 0) {
        await createMovimientoCaja({
          tipo: 'ingreso',
          monto: total,
          venta_id: ventaData?.id || null,
          categoria: 'venta',
          metodo_pago: header.metodo_pago || 'efectivo',
          descripcion: `Venta - ${l.producto_nombre || 'Producto'} - ${cantidad} pzas`
        });
      }
    }

    if (lineaError) { resultados.push({ linea: l, ok: false, error: lineaError }); continue; }

    // Ajuste de stock manual (no hay trigger) con valor fresco
    await ajustarStockLinea(productoId, varianteId, cantidad, esConsignacion);
    resultados.push({ linea: l, ok: true });
  }

  const errores = resultados.filter(r => !r.ok);
  return {
    data: resultados,
    folio: folioOperacion, // la UI imprime ESTE folio en el recibo (no uno propio)
    error: errores.length
      ? { message: `${errores.length} de ${lineas.length} línea(s) no se registraron`, detalles: errores }
      : null
  };
};

// Trae todas las líneas (ventas) de una operación por su folio. Sirve para
// el buscador de recibos y para regenerar el PDF histórico. Ordena por id
// para conservar el orden de captura del carrito.
export const getVentasPorFolio = async (folio) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  if (!folio) return { data: null, error: { message: 'Folio vacío' } };
  const { data, error } = await supabase
    .from('ventas')
    .select('*')
    .eq('folio_operacion', folio)
    .order('id', { ascending: true });
  return { data, error: handleRLSError(error) };
};

// Obtener resumen de stock por producto
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
export const registrarPagoServicio = async (servicioId, montoPago, metodoPago = 'efectivo') => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data: servicio, error: errorGet } = await supabase
    .from('servicios_maquila')
    .select('total, monto_pagado')
    .eq('id', servicioId)
    .single();

  if (errorGet) return { data: null, error: handleRLSError(errorGet) };

  const total = parseFloat(servicio.total) || 0;
  const pagadoActual = parseFloat(servicio.monto_pagado) || 0;
  const pendiente = total - pagadoActual;

  // Si ya está completamente pagado, no permitir más pagos
  if (pendiente <= 0) {
    return { data: null, error: { message: 'Este servicio ya está completamente pagado' } };
  }

  // Limitar el pago al monto pendiente
  const montoReal = Math.min(montoPago, pendiente);
  const nuevoMontoPagado = pagadoActual + montoReal;

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
  if (!error && montoReal > 0) {
    await supabase
      .from('movimientos_caja')
      .insert([{
        tipo: 'ingreso',
        monto: montoReal,
        categoria: 'venta',
        metodo_pago: metodoPago,
        descripcion: `Cobro servicio maquila - Servicio #${servicioId}`,
        servicio_id: servicioId
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
    .select(`
      *,
      venta:ventas(cliente:clientes(nombre)),
      servicio:servicios_maquila(cliente_nombre)
    `)
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

// Actualizar movimiento de caja (solo movimientos manuales)
export const updateMovimientoCaja = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('movimientos_caja')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Revertir un pago vinculado a venta o servicio
export const revertirPago = async (movimientoId) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  // 1. Obtener el movimiento
  const { data: mov, error: errorGet } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('id', movimientoId)
    .single();

  if (errorGet) return { error: handleRLSError(errorGet) };
  if (!mov) return { error: 'Movimiento no encontrado' };

  const monto = parseFloat(mov.monto) || 0;

  // 2. Si tiene venta_id, restar monto de ventas.monto_pagado y restaurar stock_consignacion
  if (mov.venta_id) {
    const { data: venta, error: errorVenta } = await supabase
      .from('ventas')
      .select('total, monto_pagado, tipo_venta, precio_unitario, producto_id, variante_id')
      .eq('id', mov.venta_id)
      .single();

    if (errorVenta) return { error: handleRLSError(errorVenta) };

    const nuevoMontoPagado = Math.max(0, (parseFloat(venta.monto_pagado) || 0) - monto);
    const total = parseFloat(venta.total) || 0;
    let nuevoEstado = 'parcial';
    if (nuevoMontoPagado >= total) nuevoEstado = 'pagado';
    else if (nuevoMontoPagado <= 0) nuevoEstado = 'pendiente';

    const { error: errorUpdate } = await supabase
      .from('ventas')
      .update({ monto_pagado: nuevoMontoPagado, estado_pago: nuevoEstado })
      .eq('id', mov.venta_id);

    if (errorUpdate) return { error: handleRLSError(errorUpdate) };

    // Restaurar stock_consignacion si era pago de consignación
    const esConsignacion = venta.tipo_venta === 'consignacion';
    const precioUnitario = parseFloat(venta.precio_unitario) || 0;

    if (esConsignacion && precioUnitario > 0 && monto > 0) {
      const piezasARestaurar = Math.floor(monto / precioUnitario);

      if (piezasARestaurar > 0) {
        // Restaurar stock_consignacion en variante o producto
        if (venta.variante_id) {
          const { data: varData } = await supabase
            .from('variantes_producto')
            .select('stock_consignacion')
            .eq('id', venta.variante_id)
            .single();
          if (varData) {
            await supabase
              .from('variantes_producto')
              .update({ stock_consignacion: (varData.stock_consignacion || 0) + piezasARestaurar })
              .eq('id', venta.variante_id);
          }
        } else if (venta.producto_id) {
          const { data: prodData } = await supabase
            .from('productos')
            .select('stock_consignacion')
            .eq('id', venta.producto_id)
            .single();
          if (prodData) {
            await supabase
              .from('productos')
              .update({ stock_consignacion: (prodData.stock_consignacion || 0) + piezasARestaurar })
              .eq('id', venta.producto_id);
          }
        }

        // Crear movimiento_stock de reversión
        await supabase
          .from('movimientos_stock')
          .insert([{
            producto_id: venta.producto_id,
            tipo_movimiento: 'reversion_pago',
            cantidad: piezasARestaurar,
            notas: `Reversión de pago - ${piezasARestaurar} pzas devueltas a consignación`,
            ...(venta.variante_id ? { variante_id: venta.variante_id } : {})
          }]);
      }
    }
  }

  // 3. Si tiene servicio_id, restar monto de servicios_maquila.monto_pagado
  if (mov.servicio_id) {
    const { data: servicio, error: errorServicio } = await supabase
      .from('servicios_maquila')
      .select('total, monto_pagado')
      .eq('id', mov.servicio_id)
      .single();

    if (errorServicio) return { error: handleRLSError(errorServicio) };

    const nuevoMontoPagado = Math.max(0, (parseFloat(servicio.monto_pagado) || 0) - monto);
    const total = parseFloat(servicio.total) || 0;
    let nuevoEstado = 'parcial';
    if (nuevoMontoPagado >= total) nuevoEstado = 'pagado';
    else if (nuevoMontoPagado <= 0) nuevoEstado = 'pendiente';

    const { error: errorUpdate } = await supabase
      .from('servicios_maquila')
      .update({ monto_pagado: nuevoMontoPagado, estado_pago: nuevoEstado })
      .eq('id', mov.servicio_id);

    if (errorUpdate) return { error: handleRLSError(errorUpdate) };
  }

  // 4. Soft-delete del movimiento
  const { error: errorDelete } = await supabase
    .from('movimientos_caja')
    .update({ activo: false })
    .eq('id', movimientoId);

  return { error: handleRLSError(errorDelete) };
};

// Ajustar monto_pagado de una venta manualmente (admin)
export const ajustarPagoVenta = async (ventaId, nuevoMontoPagado) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data: venta, error: errorGet } = await supabase
    .from('ventas')
    .select('total')
    .eq('id', ventaId)
    .single();

  if (errorGet) return { data: null, error: handleRLSError(errorGet) };

  const total = parseFloat(venta.total) || 0;
  const montoPagado = Math.max(0, parseFloat(nuevoMontoPagado) || 0);

  let nuevoEstado = 'parcial';
  if (montoPagado >= total) nuevoEstado = 'pagado';
  else if (montoPagado <= 0) nuevoEstado = 'pendiente';

  const { data, error } = await supabase
    .from('ventas')
    .update({ monto_pagado: montoPagado, estado_pago: nuevoEstado })
    .eq('id', ventaId)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Ajustar monto_pagado de un servicio maquila manualmente (admin)
export const ajustarPagoServicio = async (servicioId, nuevoMontoPagado) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data: servicio, error: errorGet } = await supabase
    .from('servicios_maquila')
    .select('total')
    .eq('id', servicioId)
    .single();

  if (errorGet) return { data: null, error: handleRLSError(errorGet) };

  const total = parseFloat(servicio.total) || 0;
  const montoPagado = Math.max(0, parseFloat(nuevoMontoPagado) || 0);

  let nuevoEstado = 'parcial';
  if (montoPagado >= total) nuevoEstado = 'pagado';
  else if (montoPagado <= 0) nuevoEstado = 'pendiente';

  const { data, error } = await supabase
    .from('servicios_maquila')
    .update({ monto_pagado: montoPagado, estado_pago: nuevoEstado })
    .eq('id', servicioId)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Editar monto de un pago vinculado a venta/servicio (ajusta por diferencia)
export const editarPagoCaja = async (movimientoId, nuevoMonto) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  // 1. Obtener el movimiento original
  const { data: mov, error: errorGet } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('id', movimientoId)
    .single();

  if (errorGet) return { error: handleRLSError(errorGet) };
  if (!mov) return { error: 'Movimiento no encontrado' };

  const montoAnterior = parseFloat(mov.monto) || 0;
  const diferencia = nuevoMonto - montoAnterior;

  // 2. Si tiene venta_id, ajustar monto_pagado por diferencia
  if (mov.venta_id) {
    const { data: venta, error: errorVenta } = await supabase
      .from('ventas')
      .select('total, monto_pagado')
      .eq('id', mov.venta_id)
      .single();

    if (errorVenta) return { error: handleRLSError(errorVenta) };

    const pagadoActual = parseFloat(venta.monto_pagado) || 0;
    const total = parseFloat(venta.total) || 0;
    const nuevoPagado = Math.max(0, Math.min(total, pagadoActual + diferencia));

    let nuevoEstado = 'parcial';
    if (nuevoPagado >= total) nuevoEstado = 'pagado';
    else if (nuevoPagado <= 0) nuevoEstado = 'pendiente';

    const { error: errorUpdate } = await supabase
      .from('ventas')
      .update({ monto_pagado: nuevoPagado, estado_pago: nuevoEstado })
      .eq('id', mov.venta_id);

    if (errorUpdate) return { error: handleRLSError(errorUpdate) };
  }

  // 3. Si tiene servicio_id, ajustar monto_pagado por diferencia
  if (mov.servicio_id) {
    const { data: servicio, error: errorServicio } = await supabase
      .from('servicios_maquila')
      .select('total, monto_pagado')
      .eq('id', mov.servicio_id)
      .single();

    if (errorServicio) return { error: handleRLSError(errorServicio) };

    const pagadoActual = parseFloat(servicio.monto_pagado) || 0;
    const total = parseFloat(servicio.total) || 0;
    const nuevoPagado = Math.max(0, Math.min(total, pagadoActual + diferencia));

    let nuevoEstado = 'parcial';
    if (nuevoPagado >= total) nuevoEstado = 'pagado';
    else if (nuevoPagado <= 0) nuevoEstado = 'pendiente';

    const { error: errorUpdate } = await supabase
      .from('servicios_maquila')
      .update({ monto_pagado: nuevoPagado, estado_pago: nuevoEstado })
      .eq('id', mov.servicio_id);

    if (errorUpdate) return { error: handleRLSError(errorUpdate) };
  }

  // 4. Actualizar el monto en movimientos_caja
  const { error: errorCaja } = await supabase
    .from('movimientos_caja')
    .update({ monto: nuevoMonto })
    .eq('id', movimientoId);

  return { error: handleRLSError(errorCaja) };
};

// Obtener balance de caja (ingresos - egresos)
export const getBalanceCaja = async (fechaInicio = null, fechaFin = null) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('movimientos_caja')
    .select('tipo, monto, categoria')
    .eq('activo', true);

  if (fechaInicio) {
    query = query.gte('fecha', fechaInicio);
  }

  if (fechaFin) {
    query = query.lte('fecha', fechaFin + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error) return { data: null, error: handleRLSError(error) };

  const resumen = { totalIngresos: 0, totalEgresos: 0, balance: 0, compraMaterial: 0, inversionCapital: 0, reinversion: 0 };

  (data || []).forEach(mov => {
    const monto = parseFloat(mov.monto) || 0;
    if (mov.tipo === 'ingreso') {
      // Inversiones de capital se trackean aparte (no son ingreso por ventas)
      if (mov.categoria === 'inversion_capital') {
        resumen.inversionCapital += monto;
      }
      resumen.totalIngresos += monto;
    } else {
      resumen.totalEgresos += monto;
      if (mov.categoria === 'compra_material') {
        resumen.compraMaterial += monto;
      }
      if (mov.categoria === 'reinversion') {
        resumen.reinversion += monto;
      }
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

// =====================================================
// FUNCIONES PARA MATERIALES (Inventario de materia prima)
// =====================================================

export const getMateriales = async (categoriaFiltro) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('materiales')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  if (categoriaFiltro && categoriaFiltro !== 'todas') {
    query = query.eq('categoria', categoriaFiltro);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

export const createMaterial = async (material) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('materiales')
    .insert([material])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

export const updateMaterial = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('materiales')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

export const deleteMaterial = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('materiales')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA RECETAS (BOM por producto)
// =====================================================

export const getRecetasProducto = async (productoId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('recetas')
    .select(`
      *,
      material:materiales(id, nombre, unidad, costo_unitario, stock, categoria)
    `)
    .eq('producto_id', productoId)
    .eq('activo', true)
    .order('created_at', { ascending: true });

  return { data, error: handleRLSError(error) };
};

export const upsertRecetaLinea = async (linea) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // Upsert manual: el UNIQUE de recetas ahora es (producto_id, variante_id, material_id)
  // y PostgreSQL trata múltiples NULL como distintos en UNIQUE por default, así que
  // un upsert con onConflict no matchearía filas con variante_id=NULL. Lo hacemos
  // manualmente para que funcione tanto con variante específica como con NULL.
  const variante_id = linea.variante_id ?? null;
  let query = supabase
    .from('recetas')
    .select('id')
    .eq('producto_id', linea.producto_id)
    .eq('material_id', linea.material_id);
  query = variante_id === null
    ? query.is('variante_id', null)
    : query.eq('variante_id', variante_id);

  const { data: existing } = await query.maybeSingle();

  const selectStr = `
    *,
    material:materiales(id, nombre, unidad, costo_unitario, stock, categoria)
  `;

  const payload = { ...linea, variante_id, activo: true };
  const result = existing
    ? await supabase.from('recetas').update(payload).eq('id', existing.id).select(selectStr).single()
    : await supabase.from('recetas').insert([payload]).select(selectStr).single();

  return { data: result.data, error: handleRLSError(result.error) };
};

export const deleteRecetaLinea = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  const { error } = await supabase
    .from('recetas')
    .update({ activo: false })
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA ÓRDENES DE PRODUCCIÓN
// =====================================================

export const getOrdenesProduccion = async (filtros = {}) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  let query = supabase
    .from('ordenes_produccion')
    .select(`
      *,
      producto:productos(id, linea_nombre, categoria_id),
      variante:variantes_producto(id, material, color, talla, sku, stock),
      materiales_usados(
        id, material_id, cantidad_planeada, cantidad_real, costo_unitario, costo_total,
        material:materiales(id, nombre, unidad)
      )
    `)
    .order('created_at', { ascending: false });

  if (filtros.estado) {
    query = query.eq('estado', filtros.estado);
  }

  const { data, error } = await query;
  return { data, error: handleRLSError(error) };
};

export const createOrdenProduccion = async (orden) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('ordenes_produccion')
    .insert([orden])
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

export const updateOrdenProduccion = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('ordenes_produccion')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES PARA MATERIALES USADOS
// =====================================================

export const createMaterialesUsados = async (lineas) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('materiales_usados')
    .insert(lineas)
    .select(`
      *,
      material:materiales(id, nombre, unidad)
    `);

  return { data, error: handleRLSError(error) };
};

export const updateMaterialUsado = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('materiales_usados')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// =====================================================
// FUNCIONES COMPUESTAS DE PRODUCCIÓN
// =====================================================

// Completar orden de producción:
// 1. Descontar stock de materiales
// 2. Crear movimientos_material tipo 'produccion'
// 3. Sumar stock al producto/variante
// 4. Crear movimiento_stock tipo 'produccion'
// 5. Calcular costo unitario real
export const completarOrdenProduccion = async (ordenId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // 1. Obtener orden con materiales usados
  const { data: orden, error: errorOrden } = await supabase
    .from('ordenes_produccion')
    .select(`
      *,
      producto:productos(id, linea_nombre, stock, costo_unitario),
      variante:variantes_producto(id, material, color, talla, sku, stock, stock_consignacion, costo_unitario),
      materiales_usados(
        id, material_id, cantidad_planeada, cantidad_real, costo_unitario,
        material:materiales(id, nombre, stock, costo_unitario)
      )
    `)
    .eq('id', ordenId)
    .single();

  if (errorOrden) return { data: null, error: handleRLSError(errorOrden) };
  if (!orden) return { data: null, error: 'Orden no encontrada' };
  if (orden.estado === 'completada') return { data: null, error: 'La orden ya está completada' };
  if (orden.estado === 'cancelada') return { data: null, error: 'La orden está cancelada' };

  let costoTotal = 0;

  // 2. Descontar stock de cada material y crear movimientos
  for (const mu of orden.materiales_usados) {
    const cantidadFinal = mu.cantidad_real != null ? mu.cantidad_real : mu.cantidad_planeada;
    const costoUnit = parseFloat(mu.material.costo_unitario) || 0;
    const costoLinea = cantidadFinal * costoUnit;
    costoTotal += costoLinea;

    // Descontar stock del material
    const nuevoStock = Math.max(0, (parseFloat(mu.material.stock) || 0) - cantidadFinal);
    const { error: errMat } = await supabase
      .from('materiales')
      .update({ stock: nuevoStock })
      .eq('id', mu.material_id);
    if (errMat) return { data: null, error: handleRLSError(errMat) };

    // Actualizar costo en materiales_usados
    await supabase
      .from('materiales_usados')
      .update({
        cantidad_real: cantidadFinal,
        costo_unitario: costoUnit,
        costo_total: costoLinea
      })
      .eq('id', mu.id);

    // Crear movimiento_material
    await supabase
      .from('movimientos_material')
      .insert([{
        material_id: mu.material_id,
        tipo: 'produccion',
        cantidad: -cantidadFinal,
        referencia_id: ordenId,
        referencia_tipo: 'orden_produccion',
        notas: `Orden de producción: ${orden.cantidad} pzas de ${orden.producto?.linea_nombre || ''}`
      }]);
  }

  // 3. Calcular costo unitario de producción (desde materiales de la receta)
  const costoUnitarioCalc = orden.cantidad > 0 ? costoTotal / orden.cantidad : 0;
  const costoUnitarioRedondeado = Math.round(costoUnitarioCalc * 100) / 100;

  // 4. Sumar stock al producto o variante
  // Si la variante/producto ya tiene costo_unitario definido (ej: desde configuración de corte
  // que incluye tela + mano de obra + empaque), se respeta ese costo y no se sobreescribe.
  // Solo se propaga el costo de materiales si no hay costo previo definido.
  if (orden.variante_id && orden.variante) {
    const stockAnterior = parseInt(orden.variante.stock) || 0;
    const costoAnterior = parseFloat(orden.variante.costo_unitario) || 0;
    const nuevoStock = stockAnterior + orden.cantidad;

    let nuevoCosto;
    if (costoAnterior > 0) {
      // Ya tiene costo definido (ej: configuración de corte con tela+confección+empaque)
      // Respetar el costo existente, no sobreescribir con solo materiales
      nuevoCosto = costoAnterior;
    } else {
      // Sin costo previo: usar cálculo de materiales (promedio ponderado)
      nuevoCosto = nuevoStock > 0
        ? Math.round(((stockAnterior * costoAnterior + orden.cantidad * costoUnitarioCalc) / nuevoStock) * 100) / 100
        : costoUnitarioRedondeado;
    }
    const { error: errVar } = await supabase
      .from('variantes_producto')
      .update({ stock: nuevoStock, costo_unitario: nuevoCosto })
      .eq('id', orden.variante_id);
    if (errVar) return { data: null, error: handleRLSError(errVar) };
  } else if (orden.producto) {
    const stockAnterior = parseInt(orden.producto.stock) || 0;
    const costoAnterior = parseFloat(orden.producto.costo_unitario) || 0;
    const nuevoStock = stockAnterior + orden.cantidad;

    let nuevoCosto;
    if (costoAnterior > 0) {
      // Ya tiene costo definido, respetar
      nuevoCosto = costoAnterior;
    } else {
      nuevoCosto = nuevoStock > 0
        ? Math.round(((stockAnterior * costoAnterior + orden.cantidad * costoUnitarioCalc) / nuevoStock) * 100) / 100
        : costoUnitarioRedondeado;
    }
    const { error: errProd } = await supabase
      .from('productos')
      .update({ stock: nuevoStock, costo_unitario: nuevoCosto })
      .eq('id', orden.producto_id);
    if (errProd) return { data: null, error: handleRLSError(errProd) };
  }

  // 5. Crear movimiento_stock tipo 'produccion'
  await supabase
    .from('movimientos_stock')
    .insert([{
      producto_id: orden.producto_id,
      variante_id: orden.variante_id || null,
      tipo: 'produccion',
      cantidad: orden.cantidad,
      notas: `Producción completada - Orden ${orden.id.slice(0, 8)}`
    }]);

  // 6. Actualizar orden con costo calculado
  const { data: ordenActualizada, error: errFinal } = await supabase
    .from('ordenes_produccion')
    .update({
      estado: 'completada',
      costo_total: costoTotal,
      costo_unitario_calculado: costoUnitarioCalc,
      fecha_completada: new Date().toISOString()
    })
    .eq('id', ordenId)
    .select()
    .single();

  return { data: ordenActualizada, error: handleRLSError(errFinal) };
};

// Registrar compra de material:
// 1. Actualizar stock y costo promedio ponderado
// 2. Crear movimiento_material tipo 'compra'
// 3. Crear movimiento_caja egreso
export const registrarCompraMaterial = async ({ materialId, cantidad, costoTotal, metodoPago, notas, categoriaCaja }) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // 1. Obtener material actual
  const { data: material, error: errGet } = await supabase
    .from('materiales')
    .select('*')
    .eq('id', materialId)
    .single();

  if (errGet) return { data: null, error: handleRLSError(errGet) };

  const stockActual = parseFloat(material.stock) || 0;
  const costoActual = parseFloat(material.costo_unitario) || 0;
  const cantidadCompra = parseFloat(cantidad);
  const costoCompra = parseFloat(costoTotal);
  const costoUnitarioCompra = cantidadCompra > 0 ? costoCompra / cantidadCompra : 0;

  // Costo promedio ponderado
  const nuevoStock = stockActual + cantidadCompra;
  const nuevoCosto = nuevoStock > 0
    ? ((stockActual * costoActual) + costoCompra) / nuevoStock
    : costoUnitarioCompra;

  // 2. Actualizar material
  const { error: errUpdate } = await supabase
    .from('materiales')
    .update({
      stock: nuevoStock,
      costo_unitario: Math.round(nuevoCosto * 100) / 100
    })
    .eq('id', materialId);

  if (errUpdate) return { data: null, error: handleRLSError(errUpdate) };

  // 3. Crear movimiento_material
  await supabase
    .from('movimientos_material')
    .insert([{
      material_id: materialId,
      tipo: 'compra',
      cantidad: cantidadCompra,
      notas: notas || `Compra: ${cantidadCompra} ${material.unidad} por $${costoCompra}`
    }]);

  // 4. Crear egreso en caja
  const { error: errCaja } = await supabase
    .from('movimientos_caja')
    .insert([{
      tipo: 'egreso',
      categoria: categoriaCaja || 'compra_material',
      monto: costoCompra,
      descripcion: `Compra material: ${material.nombre} - ${cantidadCompra} ${material.unidad}`,
      metodo_pago: metodoPago || 'efectivo',
      activo: true
    }]);

  if (errCaja) return { data: null, error: handleRLSError(errCaja) };

  return { data: { nuevoStock, nuevoCosto }, error: null };
};

// Inventario de materiales: resumen con valor total y alertas
export const getInventarioMateriales = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data: materiales, error } = await supabase
    .from('materiales')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  if (error) return { data: null, error: handleRLSError(error) };

  let valorTotal = 0;
  let alertas = 0;
  (materiales || []).forEach(m => {
    valorTotal += (parseFloat(m.stock) || 0) * (parseFloat(m.costo_unitario) || 0);
    if (m.stock_minimo > 0 && m.stock <= m.stock_minimo) alertas++;
  });

  return {
    data: {
      materiales: materiales || [],
      valorTotal,
      alertas,
      totalMateriales: (materiales || []).length
    },
    error: null
  };
};

export default supabase;

// =====================================================
// MÓDULO DE COMPRAS Y PROVEEDORES (FASE 9)
// =====================================================

// Proveedores
export const getProveedores = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .eq('activo', true)
    .order('nombre');
  return { data, error: handleRLSError(error) };
};

export const createProveedor = async (proveedor) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('proveedores')
    .insert([proveedor])
    .select()
    .single();
  return { data, error: handleRLSError(error) };
};

// Compras de Material
export const getComprasMaterial = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('compras_material')
    .select(`
      *,
      proveedores (nombre)
    `)
    .order('fecha_compra', { ascending: false });
  return { data, error: handleRLSError(error) };
};

export const getCompraDetalles = async (compraId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('detalle_compra_material')
    .select(`
      *,
      materiales (nombre, unidad)
    `)
    .eq('compra_id', compraId);
  return { data, error: handleRLSError(error) };
};

export const crearCompraCompleta = async (compra, detalles) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // 1. Crear cabecera
  const { data: nuevaCompra, error: errCabecera } = await supabase
    .from('compras_material')
    .insert([compra])
    .select()
    .single();

  if (errCabecera) return { data: null, error: handleRLSError(errCabecera) };

  // 2. Crear detalles (esto dispara los triggers de stock y total)
  const lineasDetalle = detalles.map(d => ({
    compra_id: nuevaCompra.id,
    material_id: d.material_id,
    cantidad: d.cantidad,
    costo_unitario: d.costo_unitario
  }));

  const { error: errDetalle } = await supabase
    .from('detalle_compra_material')
    .insert(lineasDetalle);

  if (errDetalle) return { data: null, error: handleRLSError(errDetalle) };

  return { data: nuevaCompra, error: null };
};

// Editar solo la fecha de vencimiento de una compra (compras viejas sin fecha,
// o corregir una mal puesta). UPDATE puro: no dispara triggers de stock ni caja,
// no toca detalle ni pagos. fecha = 'YYYY-MM-DD' o null para limpiarla.
export const updateCompraVencimiento = async (id, fecha) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data, error } = await supabase
    .from('compras_material')
    .update({ fecha_vencimiento: fecha || null })
    .eq('id', id)
    .select()
    .single();

  return { data, error: handleRLSError(error) };
};

// Pagos a Proveedores
export const getPagosProveedor = async (compraId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('pagos_proveedores')
    .select('*')
    .eq('compra_id', compraId)
    .order('fecha_pago', { ascending: false });
  return { data, error: handleRLSError(error) };
};

export const registrarPagoProveedor = async (pago) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  // El egreso en movimientos_caja lo crea automáticamente el trigger
  // BEFORE INSERT `fn_pago_proveedor_a_caja` (categoría 'compra_material')
  // y liga el movimiento_caja_id. La BD es la única fuente de verdad:
  // garantiza el egreso en cada abono y lo revierte si se borra el pago.
  const { data: nuevoPago, error: errPago } = await supabase
    .from('pagos_proveedores')
    .insert([pago])
    .select()
    .single();

  return { data: nuevoPago, error: handleRLSError(errPago) };
};

export const eliminarPagoProveedor = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };

  // Borrar el abono dispara el trigger AFTER DELETE `fn_actualizar_pago_compra`,
  // que hace las dos cosas: apaga el egreso de caja ligado (activo=false) y
  // recalcula monto_pagado de la compra → la deuda (saldo_pendiente) vuelve a subir.
  // Este es el ÚNICO camino correcto para revertir un abono: NO borrar el egreso
  // desde la vista de Caja (eso deja el abono huérfano y la deuda descuadrada).
  const { error } = await supabase
    .from('pagos_proveedores')
    .delete()
    .eq('id', id);

  return { error: handleRLSError(error) };
};

// =====================================================
// FASE 10: COTIZACIONES + TIERS DE PRECIO
// =====================================================

// Catálogo de tiers (canales). slug alineado a ventas.tipo_venta.
export const getTiersPrecio = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('tiers_precio')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true });
  return { data, error: handleRLSError(error) };
};

// Precio sugerido = costo de producción dinámico × multiplicador del tier.
// La UI lo usa para prellenar el precio (editable, con Price Floor en >= costo).
export const calcularPrecioSugerido = (costo, multiplicador) => {
  const c = parseFloat(costo) || 0;
  const m = parseFloat(multiplicador) || 1;
  return Math.round(c * m * 100) / 100;
};

export const getCotizaciones = async () => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('cotizaciones')
    .select(`
      *,
      clientes (nombre),
      tiers_precio (nombre, slug, multiplicador)
    `)
    .order('fecha', { ascending: false });
  return { data, error: handleRLSError(error) };
};

export const getCotizacionDetalle = async (cotizacionId) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('detalle_cotizacion')
    .select(`
      *,
      productos (linea_nombre),
      variantes_producto (sku, material, color, talla)
    `)
    .eq('cotizacion_id', cotizacionId);
  return { data, error: handleRLSError(error) };
};

// Crea cabecera + líneas. El folio lo pone el trigger BEFORE INSERT;
// el total lo recalcula el trigger desde las líneas. Cada línea guarda su
// snapshot (costo_snapshot, tier_multiplicador) para análisis histórico.
export const crearCotizacionCompleta = async (cabecera, lineas) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };

  const { data: nuevaCot, error: errCab } = await supabase
    .from('cotizaciones')
    .insert([cabecera])
    .select()
    .single();

  if (errCab) return { data: null, error: handleRLSError(errCab) };

  if (lineas && lineas.length > 0) {
    // Sanitizar FKs enteros: la UI puede mandar '' (sin variante seleccionada)
    // y Postgres rechaza '' en columnas INTEGER. '' → null, lo demás a número.
    const aIntONull = (v) => (v === '' || v === null || v === undefined ? null : parseInt(v, 10));
    const filas = lineas.map(l => ({
      ...l,
      cotizacion_id: nuevaCot.id,
      producto_id: aIntONull(l.producto_id),
      variante_id: aIntONull(l.variante_id)
    }));
    const { error: errDet } = await supabase
      .from('detalle_cotizacion')
      .insert(filas);
    if (errDet) return { data: null, error: handleRLSError(errDet) };
  }

  return { data: nuevaCot, error: null };
};

export const updateCotizacion = async (id, updates) => {
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  const { data, error } = await supabase
    .from('cotizaciones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data, error: handleRLSError(error) };
};

export const eliminarCotizacion = async (id) => {
  if (!supabase) return { error: 'Supabase no configurado' };
  // ON DELETE CASCADE borra las líneas de detalle_cotizacion.
  const { error } = await supabase
    .from('cotizaciones')
    .delete()
    .eq('id', id);
  return { error: handleRLSError(error) };
};

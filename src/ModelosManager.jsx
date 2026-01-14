import React, { useState, useEffect, useRef } from 'react';
import {
  supabase,
  isSupabaseConfigured,
  getModelos,
  createModelo,
  updateModelo,
  deleteModelo,
  uploadImagen,
  uploadPDF,
  addComentario,
  updateStock,
  deleteImagen,
  deletePDF
} from './supabaseClient';

// Colores del tema
const colors = {
  cream: '#FDF6E9',
  sand: '#D4C5B5',
  camel: '#A67B5B',
  terracotta: '#C75B39',
  olive: '#5C6B4A',
  espresso: '#2C1810',
  gold: '#B8860B',
  cotton: '#FAF9F6',
  linen: '#E8E4DC',
  sage: '#9CAF88'
};

// Modelos iniciales (cuando no hay Supabase)
const modelosInicialesLocal = {
  publicitaria: [
    { id: 1, nombre: 'Corporativo Simple', tipo: 'Serigrafía 1 tinta', estado: 'activo', descripcion: 'Logo empresa centrado', stock: 50, imagenes: [], pdfs: [], comentarios: [] },
    { id: 2, nombre: 'Evento Masivo', tipo: 'Serigrafía 2 tintas', estado: 'desarrollo', descripcion: 'Diseño para ferias y expos', stock: 0, imagenes: [], pdfs: [], comentarios: [] },
  ],
  eco: [
    { id: 1, nombre: 'Botanical Garden', tipo: 'Estampado floral', estado: 'activo', descripcion: 'Hojas y flores tropicales', stock: 25, imagenes: [], pdfs: [], comentarios: [] },
    { id: 2, nombre: 'Geometric Minimal', tipo: 'Geométrico', estado: 'activo', descripcion: 'Líneas y formas simples', stock: 30, imagenes: [], pdfs: [], comentarios: [] },
    { id: 3, nombre: 'Ocean Waves', tipo: 'Abstracto', estado: 'desarrollo', descripcion: 'Ondas en tonos azules', stock: 0, imagenes: [], pdfs: [], comentarios: [] },
  ],
  ecoForro: [
    { id: 1, nombre: 'Azteca Modern', tipo: 'Étnico', estado: 'activo', descripcion: 'Patrones aztecas contemporáneos', stock: 15, imagenes: [], pdfs: [], comentarios: [] },
    { id: 2, nombre: 'Sunset Vibes', tipo: 'Degradado', estado: 'activo', descripcion: 'Colores cálidos del atardecer', stock: 20, imagenes: [], pdfs: [], comentarios: [] },
  ],
  basica: [
    { id: 1, nombre: 'Classic Stripes', tipo: 'Rayas', estado: 'activo', descripcion: 'Rayas clásicas marineras', stock: 40, imagenes: [], pdfs: [], comentarios: [] },
    { id: 2, nombre: 'Polka Dots', tipo: 'Lunares', estado: 'activo', descripcion: 'Lunares vintage', stock: 35, imagenes: [], pdfs: [], comentarios: [] },
    { id: 3, nombre: 'Chevron', tipo: 'Geométrico', estado: 'desarrollo', descripcion: 'Patrón zigzag moderno', stock: 0, imagenes: [], pdfs: [], comentarios: [] },
  ],
  estandar: [
    { id: 1, nombre: 'Bohemian Dream', tipo: 'Boho', estado: 'activo', descripcion: 'Estilo bohemio con mandalas', stock: 18, imagenes: [], pdfs: [], comentarios: [] },
    { id: 2, nombre: 'Urban Art', tipo: 'Street art', estado: 'activo', descripcion: 'Graffiti y arte urbano', stock: 22, imagenes: [], pdfs: [], comentarios: [] },
    { id: 3, nombre: 'Nature Walk', tipo: 'Naturaleza', estado: 'activo', descripcion: 'Bosques y montañas', stock: 28, imagenes: [], pdfs: [], comentarios: [] },
    { id: 4, nombre: 'Retro 80s', tipo: 'Retro', estado: 'desarrollo', descripcion: 'Colores neón y formas 80s', stock: 0, imagenes: [], pdfs: [], comentarios: [] },
  ],
  premium: [
    { id: 1, nombre: 'Artisan Craft', tipo: 'Artesanal', estado: 'activo', descripcion: 'Bordado tradicional mexicano', stock: 10, imagenes: [], pdfs: [], comentarios: [] },
    { id: 2, nombre: 'Luxury Marble', tipo: 'Mármol', estado: 'activo', descripcion: 'Textura mármol elegante', stock: 12, imagenes: [], pdfs: [], comentarios: [] },
    { id: 3, nombre: 'Gold Foliage', tipo: 'Botánico premium', estado: 'activo', descripcion: 'Hojas con detalles dorados', stock: 8, imagenes: [], pdfs: [], comentarios: [] },
    { id: 4, nombre: 'Abstract Elegance', tipo: 'Arte abstracto', estado: 'desarrollo', descripcion: 'Pinceladas artísticas', stock: 0, imagenes: [], pdfs: [], comentarios: [] },
    { id: 5, nombre: 'Talavera Classic', tipo: 'Talavera', estado: 'desarrollo', descripcion: 'Azulejo poblano tradicional', stock: 0, imagenes: [], pdfs: [], comentarios: [] },
  ]
};

// Productos info
const productosInfo = {
  publicitaria: { nombre: 'PUBLICITARIA', icon: '📢', color: '#95A5A6', colorLight: '#F2F3F4', descripcion: 'Manta Cruda • Serigrafía • Ultra Económica' },
  eco: { nombre: 'ECO', icon: '🌿', color: '#27AE60', colorLight: '#D5F5E3', descripcion: 'Loneta 2.40m • 100% Algodón Orgánico' },
  ecoForro: { nombre: 'ECO+FORRO', icon: '🌱', color: '#2ECC71', colorLight: '#D5F5E3', descripcion: 'Loneta 2.40m + Forro Manta' },
  basica: { nombre: 'BÁSICA', icon: '🛍️', color: '#E67E22', colorLight: '#FDEBD0', descripcion: 'Loneta 100% Algodón • Sin Forro' },
  estandar: { nombre: 'ESTÁNDAR', icon: '👜', color: '#2980B9', colorLight: '#D6EAF8', descripcion: 'Loneta + Forro Económico • 2 Bolsillos' },
  premium: { nombre: 'PREMIUM', icon: '👛', color: '#8E44AD', colorLight: '#E8DAEF', descripcion: 'Loneta + Manta Teñida • Artesanal' }
};

// Tipos de diseño
const tiposDiseno = [
  'Floral', 'Geométrico', 'Abstracto', 'Étnico', 'Minimalista',
  'Boho', 'Vintage', 'Tropical', 'Artesanal', 'Serigrafía 1 tinta',
  'Serigrafía 2 tintas', 'Serigrafía 3 tintas', 'Bordado', 'Otro'
];

// Componente Modal para detalles del modelo
const ModeloDetalleModal = ({ modelo, linea, onClose, onUpdate, onDelete, isLocal }) => {
  const [editando, setEditando] = useState(false);
  const [datosEdit, setDatosEdit] = useState({ ...modelo });
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [stockMovimiento, setStockMovimiento] = useState({ cantidad: 0, tipo: 'entrada', nota: '' });
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const prod = productosInfo[linea];

  const handleGuardar = () => {
    onUpdate(linea, modelo.id, datosEdit);
    setEditando(false);
  };

  const handleSubirImagen = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isLocal) {
      // Modo local: crear URL temporal
      const url = URL.createObjectURL(file);
      const nuevaImagen = { id: Date.now(), url, nombre: file.name };
      onUpdate(linea, modelo.id, {
        ...modelo,
        imagenes: [...(modelo.imagenes || []), nuevaImagen]
      });
    } else {
      // Modo Supabase
      setSubiendo(true);
      const { data, error } = await uploadImagen(modelo.id, file);
      setSubiendo(false);
      if (!error && data) {
        onUpdate(linea, modelo.id, {
          ...modelo,
          imagenes: [...(modelo.imagenes || []), data]
        });
      }
    }
  };

  const handleSubirPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isLocal) {
      const url = URL.createObjectURL(file);
      const nuevoPDF = { id: Date.now(), url, nombre: file.name };
      onUpdate(linea, modelo.id, {
        ...modelo,
        pdfs: [...(modelo.pdfs || []), nuevoPDF]
      });
    } else {
      setSubiendo(true);
      const { data, error } = await uploadPDF(modelo.id, file);
      setSubiendo(false);
      if (!error && data) {
        onUpdate(linea, modelo.id, {
          ...modelo,
          pdfs: [...(modelo.pdfs || []), data]
        });
      }
    }
  };

  const handleAgregarComentario = () => {
    if (!nuevoComentario.trim()) return;

    const comentario = {
      id: Date.now(),
      texto: nuevoComentario,
      fecha: new Date().toISOString(),
      autor: 'Admin'
    };

    onUpdate(linea, modelo.id, {
      ...modelo,
      comentarios: [...(modelo.comentarios || []), comentario]
    });

    setNuevoComentario('');
  };

  const handleMovimientoStock = async () => {
    if (stockMovimiento.cantidad <= 0) return;

    const nuevoStock = stockMovimiento.tipo === 'entrada'
      ? (modelo.stock || 0) + stockMovimiento.cantidad
      : Math.max(0, (modelo.stock || 0) - stockMovimiento.cantidad);

    // Actualizar estado local
    onUpdate(linea, modelo.id, {
      ...modelo,
      stock: nuevoStock
    });

    // Guardar movimiento en Supabase
    if (!isLocal) {
      await updateStock(modelo.id, stockMovimiento.cantidad, stockMovimiento.tipo, stockMovimiento.nota);
      console.log('Movimiento de stock guardado:', stockMovimiento);
    }

    setStockMovimiento({ cantidad: 0, tipo: 'entrada', nota: '' });
  };

  const handleEliminarImagen = (imgId) => {
    onUpdate(linea, modelo.id, {
      ...modelo,
      imagenes: (modelo.imagenes || []).filter(img => img.id !== imgId)
    });
  };

  const handleEliminarPDF = (pdfId) => {
    onUpdate(linea, modelo.id, {
      ...modelo,
      pdfs: (modelo.pdfs || []).filter(pdf => pdf.id !== pdfId)
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          background: prod.color,
          padding: '20px',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '36px' }}>{prod.icon}</span>
            <div>
              {editando ? (
                <input
                  type="text"
                  value={datosEdit.nombre}
                  onChange={(e) => setDatosEdit({ ...datosEdit, nombre: e.target.value })}
                  style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    borderRadius: '4px',
                    padding: '5px 10px',
                    color: 'white'
                  }}
                />
              ) : (
                <h2 style={{ margin: 0, fontSize: '22px' }}>{modelo.nombre}</h2>
              )}
              <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '13px' }}>{prod.nombre} • {modelo.tipo}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {editando ? (
              <>
                <button onClick={handleGuardar} style={{ padding: '8px 16px', background: colors.olive, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Guardar
                </button>
                <button onClick={() => setEditando(false)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </>
            ) : (
              <button onClick={() => setEditando(true)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Editar
              </button>
            )}
            <button onClick={onClose} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '18px' }}>
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Estado y Stock */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            {/* Estado */}
            <div style={{ background: colors.cream, padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '8px' }}>ESTADO</div>
              {editando ? (
                <select
                  value={datosEdit.estado}
                  onChange={(e) => setDatosEdit({ ...datosEdit, estado: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${colors.sand}` }}
                >
                  <option value="activo">Activo</option>
                  <option value="desarrollo">En Desarrollo</option>
                  <option value="pausado">Pausado</option>
                </select>
              ) : (
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  background: modelo.estado === 'activo' ? `${colors.olive}30` : modelo.estado === 'desarrollo' ? `${colors.terracotta}30` : `${colors.camel}30`,
                  color: modelo.estado === 'activo' ? colors.olive : modelo.estado === 'desarrollo' ? colors.terracotta : colors.camel
                }}>
                  {modelo.estado === 'activo' ? '✓ Activo' : modelo.estado === 'desarrollo' ? '⚙ Desarrollo' : '⏸ Pausado'}
                </span>
              )}
            </div>

            {/* Stock Actual */}
            <div style={{ background: colors.cream, padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '8px' }}>STOCK ACTUAL</div>
              <div style={{ fontSize: '32px', fontWeight: '700', color: (modelo.stock || 0) > 0 ? colors.olive : colors.terracotta }}>
                {modelo.stock || 0}
              </div>
              <div style={{ fontSize: '11px', color: colors.camel }}>unidades</div>
            </div>

            {/* Tipo */}
            <div style={{ background: colors.cream, padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: colors.camel, marginBottom: '8px' }}>TIPO DE DISEÑO</div>
              {editando ? (
                <select
                  value={datosEdit.tipo}
                  onChange={(e) => setDatosEdit({ ...datosEdit, tipo: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${colors.sand}` }}
                >
                  {tiposDiseno.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.espresso }}>{modelo.tipo}</div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso, marginBottom: '8px' }}>DESCRIPCIÓN</div>
            {editando ? (
              <textarea
                value={datosEdit.descripcion}
                onChange={(e) => setDatosEdit({ ...datosEdit, descripcion: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: `1px solid ${colors.sand}`, minHeight: '80px', resize: 'vertical' }}
              />
            ) : (
              <p style={{ margin: 0, color: colors.camel, fontSize: '14px' }}>{modelo.descripcion}</p>
            )}
          </div>

          {/* Imágenes */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso }}>
                IMÁGENES ({(modelo.imagenes || []).length})
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={subiendo}
                style={{
                  padding: '8px 16px',
                  background: prod.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {subiendo ? 'Subiendo...' : '+ Agregar Imagen'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSubirImagen}
                style={{ display: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              {(modelo.imagenes || []).map((img, idx) => (
                <div key={img.id || idx} style={{ position: 'relative', paddingBottom: '100%', background: colors.sand, borderRadius: '8px', overflow: 'hidden' }}>
                  <img
                    src={img.url}
                    alt={img.nombre}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => handleEliminarImagen(img.id)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'rgba(231,76,60,0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {(modelo.imagenes || []).length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '40px',
                  textAlign: 'center',
                  background: colors.cream,
                  borderRadius: '8px',
                  color: colors.camel
                }}>
                  No hay imágenes. Haz clic en "Agregar Imagen" para subir.
                </div>
              )}
            </div>
          </div>

          {/* PDFs */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso }}>
                ARCHIVOS PDF ({(modelo.pdfs || []).length})
              </div>
              <button
                onClick={() => pdfInputRef.current?.click()}
                disabled={subiendo}
                style={{
                  padding: '8px 16px',
                  background: colors.terracotta,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {subiendo ? 'Subiendo...' : '+ Agregar PDF'}
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf"
                onChange={handleSubirPDF}
                style={{ display: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(modelo.pdfs || []).map((pdf, idx) => (
                <div key={pdf.id || idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 15px',
                  background: colors.cream,
                  borderRadius: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>📄</span>
                    <span style={{ fontSize: '13px', color: colors.espresso }}>{pdf.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={pdf.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        background: colors.olive,
                        color: 'white',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '11px'
                      }}
                    >
                      Ver
                    </a>
                    <button
                      onClick={() => handleEliminarPDF(pdf.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#E74C3C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px'
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              {(modelo.pdfs || []).length === 0 && (
                <div style={{
                  padding: '30px',
                  textAlign: 'center',
                  background: colors.cream,
                  borderRadius: '8px',
                  color: colors.camel,
                  fontSize: '13px'
                }}>
                  No hay PDFs. Sube fichas técnicas, patrones o especificaciones.
                </div>
              )}
            </div>
          </div>

          {/* Control de Stock */}
          <div style={{ marginBottom: '25px', background: `${colors.gold}15`, padding: '20px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso, marginBottom: '15px' }}>
              MOVIMIENTO DE STOCK
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '11px', color: colors.camel, display: 'block', marginBottom: '5px' }}>TIPO</label>
                <select
                  value={stockMovimiento.tipo}
                  onChange={(e) => setStockMovimiento({ ...stockMovimiento, tipo: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.sand}` }}
                >
                  <option value="entrada">+ Entrada (Confección)</option>
                  <option value="salida">- Salida (Venta)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: colors.camel, display: 'block', marginBottom: '5px' }}>CANTIDAD</label>
                <input
                  type="number"
                  min="0"
                  value={stockMovimiento.cantidad}
                  onChange={(e) => setStockMovimiento({ ...stockMovimiento, cantidad: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.sand}` }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: colors.camel, display: 'block', marginBottom: '5px' }}>NOTA (opcional)</label>
                <input
                  type="text"
                  value={stockMovimiento.nota}
                  onChange={(e) => setStockMovimiento({ ...stockMovimiento, nota: e.target.value })}
                  placeholder="Ej: Producción semanal"
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${colors.sand}` }}
                />
              </div>
              <button
                onClick={handleMovimientoStock}
                disabled={stockMovimiento.cantidad <= 0}
                style={{
                  padding: '10px 20px',
                  background: stockMovimiento.cantidad > 0 ? colors.olive : colors.sand,
                  color: stockMovimiento.cantidad > 0 ? 'white' : colors.camel,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: stockMovimiento.cantidad > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Registrar
              </button>
            </div>
          </div>

          {/* Comentarios */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso, marginBottom: '12px' }}>
              COMENTARIOS ({(modelo.comentarios || []).length})
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input
                type="text"
                value={nuevoComentario}
                onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe un comentario..."
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${colors.sand}`,
                  fontSize: '13px'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAgregarComentario()}
              />
              <button
                onClick={handleAgregarComentario}
                disabled={!nuevoComentario.trim()}
                style={{
                  padding: '12px 24px',
                  background: nuevoComentario.trim() ? prod.color : colors.sand,
                  color: nuevoComentario.trim() ? 'white' : colors.camel,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: nuevoComentario.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '600'
                }}
              >
                Comentar
              </button>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {(modelo.comentarios || []).slice().reverse().map((com, idx) => (
                <div key={com.id || idx} style={{
                  padding: '12px',
                  background: colors.cream,
                  borderRadius: '6px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: colors.espresso }}>{com.autor || 'Admin'}</span>
                    <span style={{ fontSize: '11px', color: colors.camel }}>
                      {new Date(com.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: colors.espresso }}>{com.texto}</p>
                </div>
              ))}
              {(modelo.comentarios || []).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: colors.camel, fontSize: '13px' }}>
                  No hay comentarios todavía.
                </div>
              )}
            </div>
          </div>

          {/* Botón eliminar */}
          <div style={{ borderTop: `1px solid ${colors.sand}`, paddingTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => {
                if (window.confirm('¿Estás seguro de eliminar este modelo? Esta acción no se puede deshacer.')) {
                  onDelete(linea, modelo.id);
                  onClose();
                }
              }}
              style={{
                padding: '12px 30px',
                background: '#E74C3C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Eliminar Modelo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal ModelosManager
const ModelosManager = ({ modelosPorLinea, setModelosPorLinea }) => {
  const [lineaActiva, setLineaActiva] = useState('estandar');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoModelo, setNuevoModelo] = useState({ nombre: '', tipo: '', descripcion: '' });
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [datosSupabase, setDatosSupabase] = useState(null);

  const isLocal = !isSupabaseConfigured;

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    const cargarDatosSupabase = async () => {
      if (!isSupabaseConfigured) {
        console.log('Supabase no configurado, usando datos locales');
        return;
      }

      console.log('Cargando datos desde Supabase...');
      setCargando(true);
      const { data, error } = await getModelos();
      setCargando(false);

      console.log('Respuesta Supabase:', { data, error });

      if (error) {
        console.error('Error cargando modelos:', error);
        return;
      }

      if (data && data.length > 0) {
        // Organizar los modelos por línea
        const modelosOrganizados = {
          publicitaria: [],
          eco: [],
          ecoForro: [],
          basica: [],
          estandar: [],
          premium: []
        };

        data.forEach(modelo => {
          const linea = modelo.linea;
          console.log('Procesando modelo:', modelo.nombre, 'linea:', linea);
          if (modelosOrganizados[linea] !== undefined) {
            modelosOrganizados[linea].push({
              id: modelo.id,
              nombre: modelo.nombre,
              tipo: modelo.tipo || '',
              descripcion: modelo.descripcion || '',
              estado: modelo.estado || 'desarrollo',
              stock: modelo.stock_actual || 0,
              imagenes: modelo.modelo_imagenes || [],
              pdfs: modelo.modelo_pdfs || [],
              comentarios: modelo.modelo_comentarios || []
            });
          } else {
            console.warn('Línea no reconocida:', linea);
          }
        });

        console.log('Modelos organizados:', modelosOrganizados);
        setDatosSupabase(modelosOrganizados);
        if (setModelosPorLinea) {
          setModelosPorLinea(modelosOrganizados);
        }
      } else {
        console.log('No hay modelos en Supabase, manteniendo datos locales');
      }
    };

    cargarDatosSupabase();
  }, []);

  // Usar datos de Supabase si están disponibles, sino usar locales
  const modelos = datosSupabase || modelosPorLinea || modelosInicialesLocal;

  const totalModelos = Object.values(modelos).reduce((sum, arr) => sum + arr.length, 0);
  const modelosActivos = Object.values(modelos).reduce((sum, arr) => sum + arr.filter(m => m.estado === 'activo').length, 0);
  const stockTotal = Object.values(modelos).reduce((sum, arr) => sum + arr.reduce((s, m) => s + (m.stock || 0), 0), 0);

  const agregarModelo = async () => {
    if (!nuevoModelo.nombre || !nuevoModelo.tipo) return;

    if (isSupabaseConfigured) {
      // Guardar en Supabase
      setCargando(true);
      const { data, error } = await createModelo({
        linea: lineaActiva,
        nombre: nuevoModelo.nombre,
        tipo: nuevoModelo.tipo,
        descripcion: nuevoModelo.descripcion || 'Sin descripción',
        estado: 'desarrollo',
        stock_actual: 0
      });
      setCargando(false);

      if (!error && data) {
        const modeloNuevo = {
          id: data.id,
          nombre: data.nombre,
          tipo: data.tipo,
          descripcion: data.descripcion,
          estado: data.estado,
          stock: data.stock_actual || 0,
          imagenes: [],
          pdfs: [],
          comentarios: []
        };

        setDatosSupabase(prev => ({
          ...prev,
          [lineaActiva]: [...(prev?.[lineaActiva] || []), modeloNuevo]
        }));

        if (setModelosPorLinea) {
          setModelosPorLinea(prev => ({
            ...prev,
            [lineaActiva]: [...(prev[lineaActiva] || []), modeloNuevo]
          }));
        }
      }
    } else {
      // Modo local
      const nuevoId = Math.max(...(modelos[lineaActiva]?.map(m => m.id) || [0]), 0) + 1;
      const modeloNuevo = {
        id: nuevoId,
        nombre: nuevoModelo.nombre,
        tipo: nuevoModelo.tipo,
        descripcion: nuevoModelo.descripcion || 'Sin descripción',
        estado: 'desarrollo',
        stock: 0,
        imagenes: [],
        pdfs: [],
        comentarios: []
      };

      if (setModelosPorLinea) {
        setModelosPorLinea(prev => ({
          ...prev,
          [lineaActiva]: [...(prev[lineaActiva] || []), modeloNuevo]
        }));
      }
    }

    setNuevoModelo({ nombre: '', tipo: '', descripcion: '' });
    setMostrarFormulario(false);
  };

  const actualizarModelo = async (lineaKey, modeloId, datosActualizados) => {
    // Actualizar estado local primero
    const actualizarEstado = (prev) => ({
      ...prev,
      [lineaKey]: prev[lineaKey].map(m =>
        m.id === modeloId ? { ...m, ...datosActualizados } : m
      )
    });

    if (setModelosPorLinea) {
      setModelosPorLinea(actualizarEstado);
    }
    setDatosSupabase(prev => prev ? actualizarEstado(prev) : prev);
    setModeloSeleccionado(datosActualizados);

    // Sincronizar con Supabase si está conectado
    if (isSupabaseConfigured) {
      await updateModelo(modeloId, {
        nombre: datosActualizados.nombre,
        tipo: datosActualizados.tipo,
        descripcion: datosActualizados.descripcion,
        estado: datosActualizados.estado,
        stock_actual: datosActualizados.stock
      });
    }
  };

  const eliminarModelo = async (lineaKey, modeloId) => {
    // Actualizar estado local
    const actualizarEstado = (prev) => ({
      ...prev,
      [lineaKey]: prev[lineaKey].filter(m => m.id !== modeloId)
    });

    if (setModelosPorLinea) {
      setModelosPorLinea(actualizarEstado);
    }
    setDatosSupabase(prev => prev ? actualizarEstado(prev) : prev);

    // Eliminar de Supabase si está conectado
    if (isSupabaseConfigured) {
      await deleteModelo(modeloId);
    }
  };

  return (
    <div>
      {/* Banner de estado de conexión */}
      <div style={{
        background: isLocal ? `${colors.terracotta}20` : `${colors.olive}20`,
        border: `1px solid ${isLocal ? colors.terracotta : colors.olive}`,
        padding: '12px 20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>{isLocal ? '💾' : '☁️'}</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: colors.espresso }}>
              {isLocal ? 'Modo Local (sin conexión a Supabase)' : 'Conectado a Supabase'}
            </div>
            <div style={{ fontSize: '11px', color: colors.camel }}>
              {isLocal ? 'Los datos se guardan en memoria. Configura Supabase para persistencia.' : 'Los datos se sincronizan en la nube.'}
            </div>
          </div>
        </div>
        {isLocal && (
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 16px',
              background: colors.olive,
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '12px'
            }}
          >
            Configurar Supabase
          </a>
        )}
      </div>

      <h2 style={{ margin: '0 0 25px', fontSize: '24px', fontWeight: '300', letterSpacing: '2px', color: colors.espresso }}>
        Gestión de Modelos por Línea
      </h2>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {[
          { label: 'Total Modelos', value: totalModelos, sub: 'en catálogo', color: colors.gold, icon: '📦' },
          { label: 'Modelos Activos', value: modelosActivos, sub: 'disponibles', color: colors.olive, icon: '✅' },
          { label: 'Stock Total', value: stockTotal, sub: 'unidades', color: colors.terracotta, icon: '📊' },
          { label: 'Líneas', value: 6, sub: 'de productos', color: colors.sage, icon: '🏷️' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: colors.cotton, border: `1px solid ${colors.sand}`, padding: '20px', textAlign: 'center', borderRadius: '8px' }}>
            <span style={{ fontSize: '28px' }}>{kpi.icon}</span>
            <div style={{ fontSize: '32px', fontWeight: '600', color: kpi.color, marginTop: '5px' }}>{kpi.value}</div>
            <div style={{ fontSize: '11px', color: colors.espresso, marginTop: '5px' }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Selector de líneas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '25px' }}>
        {Object.entries(productosInfo).map(([key, p]) => (
          <div
            key={key}
            onClick={() => setLineaActiva(key)}
            style={{
              background: lineaActiva === key ? p.colorLight : colors.cotton,
              border: `2px solid ${lineaActiva === key ? p.color : colors.sand}`,
              padding: '15px',
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
          >
            <span style={{ fontSize: '28px' }}>{p.icon}</span>
            <div style={{ fontSize: '12px', fontWeight: '600', color: p.color, marginTop: '5px' }}>{p.nombre}</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: colors.espresso }}>{(modelos[key] || []).length}</div>
            <div style={{ fontSize: '9px', color: colors.camel }}>modelos</div>
          </div>
        ))}
      </div>

      {/* Panel de modelos */}
      <div style={{
        background: colors.cotton,
        border: `2px solid ${productosInfo[lineaActiva]?.color}`,
        padding: '25px',
        borderRadius: '8px',
        marginBottom: '25px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '48px' }}>{productosInfo[lineaActiva]?.icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '22px', color: productosInfo[lineaActiva]?.color }}>
                Modelos — {productosInfo[lineaActiva]?.nombre}
              </h3>
              <p style={{ margin: '5px 0 0', color: colors.camel, fontSize: '13px' }}>
                {productosInfo[lineaActiva]?.descripcion}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            style={{
              padding: '12px 25px',
              background: productosInfo[lineaActiva]?.color,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600'
            }}
          >
            {mostrarFormulario ? '✕ Cancelar' : '+ Agregar Modelo'}
          </button>
        </div>

        {/* Formulario nuevo modelo */}
        {mostrarFormulario && (
          <div style={{
            background: `${productosInfo[lineaActiva]?.color}15`,
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px dashed ${productosInfo[lineaActiva]?.color}`
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ fontSize: '11px', color: colors.camel, display: 'block', marginBottom: '5px' }}>NOMBRE *</label>
                <input
                  type="text"
                  value={nuevoModelo.nombre}
                  onChange={(e) => setNuevoModelo(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Tropical Paradise"
                  style={{ width: '100%', padding: '10px', border: `1px solid ${colors.sand}`, borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: colors.camel, display: 'block', marginBottom: '5px' }}>TIPO *</label>
                <select
                  value={nuevoModelo.tipo}
                  onChange={(e) => setNuevoModelo(prev => ({ ...prev, tipo: e.target.value }))}
                  style={{ width: '100%', padding: '10px', border: `1px solid ${colors.sand}`, borderRadius: '4px' }}
                >
                  <option value="">Seleccionar...</option>
                  {tiposDiseno.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: colors.camel, display: 'block', marginBottom: '5px' }}>DESCRIPCIÓN</label>
                <input
                  type="text"
                  value={nuevoModelo.descripcion}
                  onChange={(e) => setNuevoModelo(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Breve descripción..."
                  style={{ width: '100%', padding: '10px', border: `1px solid ${colors.sand}`, borderRadius: '4px' }}
                />
              </div>
            </div>
            <button
              onClick={agregarModelo}
              disabled={!nuevoModelo.nombre || !nuevoModelo.tipo}
              style={{
                padding: '10px 30px',
                background: nuevoModelo.nombre && nuevoModelo.tipo ? colors.olive : colors.sand,
                color: nuevoModelo.nombre && nuevoModelo.tipo ? 'white' : colors.camel,
                border: 'none',
                borderRadius: '4px',
                cursor: nuevoModelo.nombre && nuevoModelo.tipo ? 'pointer' : 'not-allowed',
                fontWeight: '600'
              }}
            >
              Guardar Modelo
            </button>
          </div>
        )}

        {/* Lista de modelos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {(modelos[lineaActiva] || []).map((modelo) => (
            <div
              key={modelo.id}
              onClick={() => setModeloSeleccionado(modelo)}
              style={{
                background: modelo.estado === 'activo' ? colors.cream : `${colors.terracotta}10`,
                border: `1px solid ${modelo.estado === 'activo' ? colors.olive : colors.terracotta}`,
                padding: '15px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      background: modelo.estado === 'activo' ? `${colors.olive}30` : `${colors.terracotta}30`,
                      color: modelo.estado === 'activo' ? colors.olive : colors.terracotta
                    }}>
                      {modelo.estado === 'activo' ? '✓ Activo' : '⚙ Desarrollo'}
                    </span>
                    <span style={{ fontSize: '10px', color: colors.camel }}>{modelo.tipo}</span>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: colors.espresso }}>{modelo.nombre}</div>
                  <div style={{ fontSize: '11px', color: colors.camel, marginTop: '3px' }}>{modelo.descripcion}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: (modelo.stock || 0) > 0 ? colors.olive : colors.camel }}>
                    {modelo.stock || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: colors.camel }}>stock</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${colors.sand}` }}>
                <span style={{ fontSize: '11px', color: colors.camel }}>
                  📷 {(modelo.imagenes || []).length}
                </span>
                <span style={{ fontSize: '11px', color: colors.camel }}>
                  📄 {(modelo.pdfs || []).length}
                </span>
                <span style={{ fontSize: '11px', color: colors.camel }}>
                  💬 {(modelo.comentarios || []).length}
                </span>
              </div>
            </div>
          ))}
          {(modelos[lineaActiva] || []).length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: colors.camel, background: colors.cream, borderRadius: '8px' }}>
              <span style={{ fontSize: '48px' }}>📭</span>
              <div style={{ marginTop: '15px' }}>No hay modelos en esta línea</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle */}
      {modeloSeleccionado && (
        <ModeloDetalleModal
          modelo={modeloSeleccionado}
          linea={lineaActiva}
          onClose={() => setModeloSeleccionado(null)}
          onUpdate={actualizarModelo}
          onDelete={eliminarModelo}
          isLocal={isLocal}
        />
      )}
    </div>
  );
};

export default ModelosManager;

---
name: security-review
description: Revisa el codigo del proyecto en busca de vulnerabilidades de seguridad, credenciales expuestas, inyecciones y problemas OWASP Top 10
allowed-tools: Read, Grep, Glob
argument-hint: "[archivo o directorio opcional]"
---

# Revision de Seguridad del Codigo

Realiza una revision exhaustiva de seguridad del codigo del proyecto totebag-dashboard.

## Alcance

Si se proporciona un archivo o directorio como argumento, revisa solo ese scope.
Si no se proporciona argumento, revisa todo `src/`.

## Checklist de Revision

### 1. Credenciales y Secrets
- Buscar API keys, passwords, tokens hardcodeados
- Verificar que `.env` y archivos sensibles estan en `.gitignore`
- Revisar que `supabaseClient.js` NO expone la service_role key (solo anon key es aceptable en frontend)
- Buscar patrones: `password`, `secret`, `token`, `api_key`, `private_key`

### 2. Supabase y Base de Datos
- Verificar que RLS (Row Level Security) esta habilitado en todas las tablas
- Revisar que las politicas RLS son correctas y no permiten acceso no autorizado
- Verificar que las consultas usan parametros y no concatenan strings (prevencion SQL injection)
- Revisar que el auth context valida correctamente roles (admin vs usuario)

### 3. XSS (Cross-Site Scripting)
- Buscar uso de `dangerouslySetInnerHTML`
- Verificar que inputs del usuario se sanitizan antes de renderizar
- Revisar que URLs generadas dinamicamente no permiten `javascript:` protocol
- Buscar `eval()`, `Function()`, `innerHTML` directo

### 4. Autenticacion y Autorizacion
- Revisar que `AuthContext.jsx` maneja correctamente sesiones
- Verificar que rutas protegidas validan autenticacion
- Revisar que acciones de admin verifican rol antes de ejecutar
- Buscar bypass de autorizacion en funciones de escritura/actualizacion

### 5. Datos Sensibles en Frontend
- Verificar que no se exponen datos sensibles en el DOM o console.log
- Revisar que localStorage no almacena tokens sin necesidad
- Verificar manejo correcto de sesion al cerrar tab/navegador

### 6. Dependencias
- Revisar `package.json` por dependencias conocidas como vulnerables
- Verificar versiones de React, Supabase client, y otras librerias

## Formato de Reporte

Para cada hallazgo reportar:

```
SEVERIDAD: [CRITICA | ALTA | MEDIA | BAJA | INFO]
ARCHIVO: ruta:linea
DESCRIPCION: Que se encontro
RIESGO: Que podria pasar si se explota
RECOMENDACION: Como corregirlo
```

Al final, incluir un resumen:
- Total de hallazgos por severidad
- Puntuacion general de seguridad (A-F)
- Top 3 acciones prioritarias

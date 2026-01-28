---
name: nueva-seccion
description: Crea una nueva seccion en el Dashboard siguiendo la arquitectura y patrones existentes del proyecto totebag-dashboard
allowed-tools: Read, Grep, Glob, Edit, Write
argument-hint: "[nombre de la seccion]"
---

# Crear Nueva Seccion en el Dashboard

Genera una nueva seccion/vista para el Dashboard de ToteBag siguiendo los patrones existentes.

## Contexto del Proyecto

- **Framework**: React con Vite
- **Estilos**: CSS-in-JS (inline styles)
- **Backend**: Supabase (auth, database, storage)
- **Archivo principal**: `src/Dashboard.jsx` (componente monolitico)
- **Paleta de colores**: Usar objeto `colors` definido al inicio de Dashboard.jsx
- **Auth**: `useAuth()` hook desde `AuthContext.jsx`

## Colores del Proyecto

```javascript
colors.sidebarBg    // #005F84 - Azul sidebar
colors.sidebarText  // #D4C5A0 - Texto dorado sidebar
colors.espresso     // #3C2415 - Texto oscuro
colors.camel        // #C4A265 - Texto secundario
colors.cream        // #FDF8F0 - Fondo claro
colors.cotton       // #FEFCF9 - Fondo cards
colors.sand         // #E8DCC8 - Bordes
colors.olive        // #ABD55E - Verde exito
colors.terracotta   // #C4784A - Naranja error
colors.gold         // #DA9F17 - Dorado marcos
```

## Patron para Nueva Vista

1. Crear componente funcional `NombreView` dentro de `Dashboard.jsx`
2. Agregar entrada en el sidebar con icono
3. Agregar case en el switch de renderizado de secciones
4. Usar estados con `useState` para manejo local
5. Si necesita datos de Supabase, agregar funciones en `supabaseClient.js`
6. Bordes de contenedores: `2px solid #DA9F17`
7. Botones: fondo `colors.sidebarBg`, texto `colors.sidebarText`, con hover invertido
8. Labels de formulario: color `colors.sidebarBg`
9. Inputs: borde `2px solid #DA9F17`, fondo `colors.cream`

## Pasos

1. Leer Dashboard.jsx para entender la estructura actual
2. Crear el componente `$ARGUMENTSView`
3. Agregar al sidebar en la seccion correspondiente
4. Agregar al switch case de renderizado
5. Si requiere tabla Supabase, crear archivo SQL de migracion
6. Agregar funciones CRUD en supabaseClient.js si es necesario

## Verificacion

- El componente sigue el estilo visual del dashboard
- Los colores usan el objeto `colors`
- Admin-only features verifican `isAdmin`
- Los formularios tienen validacion basica

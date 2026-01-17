# 🎨 Paleta de Colores CMYK

Aplicación de escritorio para convertir colores CMYK a RGB y Hexadecimal.

## Características

- ✅ Entrada de valores CMYK (0-100%)
- ✅ Conversión automática a RGB y Hexadecimal
- ✅ Vista previa del color en tiempo real
- ✅ Sliders para ajuste rápido
- ✅ Copiar valores al portapapeles
- ✅ Guardar colores en paleta (persistente)
- ✅ Cargar colores guardados con un clic

## Requisitos

- Node.js 18+ (https://nodejs.org)
- npm (incluido con Node.js)

## Instalación Rápida

### Windows

1. Abre PowerShell o CMD en esta carpeta
2. Ejecuta:
```bash
npm install
npm start
```

### Linux/Mac

1. Abre terminal en esta carpeta
2. Ejecuta:
```bash
npm install
npm start
```

## Crear Ejecutable

### Windows (archivo portable .exe)
```bash
npm run build-win
```
El ejecutable estará en: `dist/Paleta Colores CMYK.exe`

### Linux (AppImage)
```bash
npm run build-linux
```
El ejecutable estará en: `dist/Paleta Colores CMYK.AppImage`

### Todos los sistemas
```bash
npm run build
```

## Estructura del Proyecto

```
color-palette-app/
├── package.json     # Configuración del proyecto
├── main.js          # Proceso principal de Electron
├── index.html       # Interfaz de usuario
├── icon.png         # Ícono de la aplicación
└── README.md        # Este archivo
```

## Uso

1. Ingresa valores CMYK (0-100) usando los campos numéricos o sliders
2. El color se actualiza automáticamente en la vista previa
3. Copia los valores RGB o Hex con los botones de copiar
4. Guarda colores favoritos en la paleta
5. Haz clic en colores guardados para recargarlos

## Fórmulas de Conversión

**CMYK a RGB:**
```
R = 255 × (1 - C/100) × (1 - K/100)
G = 255 × (1 - M/100) × (1 - K/100)
B = 255 × (1 - Y/100) × (1 - K/100)
```

**RGB a Hexadecimal:**
```
HEX = #RRGGBB (cada componente en base 16)
```

## Autor

Creado por Rigo - 2025

## Licencia

MIT

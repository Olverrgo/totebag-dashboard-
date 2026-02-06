---
name: pre-push
description: Revision rapida antes de push - verifica build, seguridad basica y estado de git
allowed-tools: Read, Grep, Glob, Bash
---

# Revision Pre-Push

Ejecuta verificaciones rapidas antes de hacer push al repositorio.

## Pasos

### 1. Estado de Git
- Revisar archivos pendientes de commit
- Verificar que no hay archivos sensibles staged (.env, credentials, keys)
- Mostrar resumen de commits pendientes de push

### 2. Build
- Ejecutar `npm run build`
- Reportar errores si los hay
- Verificar que el build fue exitoso

### 3. Seguridad Rapida
- Buscar `console.log` con datos sensibles (passwords, tokens)
- Verificar que no hay API keys hardcodeadas en archivos modificados
- Revisar que `.env` no esta en staging area
- Buscar archivos `nul` u otros artefactos que no deben subirse

### 4. Reporte

Mostrar resumen:
- Estado del build
- Archivos que se van a pushear
- Alertas de seguridad (si las hay)
- Recomendacion: OK para push o necesita atencion

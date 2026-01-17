@echo off
echo ========================================
echo   Creando Ejecutable Portable
echo ========================================
echo.

echo [1/3] Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    call npm install
)

echo.
echo [2/3] Construyendo ejecutable...
echo Esto puede tomar varios minutos...
call npm run build-win

echo.
echo [3/3] Completado!
echo.
echo El ejecutable esta en la carpeta: dist\
echo Busca el archivo: "Paleta Colores CMYK.exe"
echo.
pause

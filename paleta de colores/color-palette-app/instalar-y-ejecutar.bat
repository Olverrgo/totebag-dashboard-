@echo off
echo ========================================
echo   Paleta de Colores CMYK - Instalador
echo ========================================
echo.

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org
    pause
    exit /b 1
)
echo Node.js encontrado!

echo.
echo [2/3] Instalando dependencias...
call npm install

echo.
echo [3/3] Iniciando aplicacion...
call npm start

pause

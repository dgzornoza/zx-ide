@echo off
set SCRIPT_DIR=%~dp0
set LINK=%SCRIPT_DIR%skills
set TARGET=%SCRIPT_DIR%..\ .agents\skills

REM Quitar espacios accidentales en la ruta
set TARGET=%TARGET: =%

if exist "%LINK%" (
    echo El enlace o carpeta "%LINK%" ya existe. No se crea nada.
    exit /b 1
)

mklink /D "%LINK%" "%TARGET%"
echo Enlace simbolico creado: %LINK% -> %TARGET%

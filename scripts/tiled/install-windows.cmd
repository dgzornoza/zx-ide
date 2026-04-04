@echo off
set SRC=zxide-export.js
set DEST=%USERPROFILE%\AppData\Local\Tiled\extensions

echo Copiando %SRC% a %DEST% ...
if not exist "%DEST%" mkdir "%DEST%"
copy "%SRC%" "%DEST%" /Y

echo Hecho.

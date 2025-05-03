@echo off
REM Iniciar XAMPP Control (opcional, fuera de terminal)
start "" "C:\xampp\xampp-control.exe"
timeout /t 3 >nul

REM Abrir Windows Terminal con varias pestañas:
REM 1. Apache
REM 2. MySQL
REM 3. VSCode + ng serve (en la terminal de VSCode)

REM NOTA: Usamos 'code -r' para abrir VSCode en la ruta, y luego lanzamos ng serve en esa terminal.
REM La pestaña de VSCode se cierra tras lanzar VSCode, y ng serve se ejecuta en la terminal de VSCode.

wt ^
  --tabColor "#0078D7" --title "Apache" cmd /k "cd /d C:\xampp && apache_start.bat" ^
  ; new-tab --tabColor "#0078D7" --title "MySQL" cmd /k "cd /d C:\xampp && mysql_start.bat" ^
  ; new-tab --tabColor "#43A047" --title "VSCode & Angular" cmd /k "cd /d C:\xampp\htdocs\CosmoViajesPlus && code -r . && timeout /t 2 >nul && cd cosmos-viajes-front && ng serve"

REM Abrir navegador después de un retraso
timeout /t 10 >nul
start http://localhost:4200/

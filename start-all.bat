@echo off
echo ===================================================
echo   STARTING RCM INSIGHT REVENUE CYCLE COMMAND CENTER
echo   Team XIRO TECH - Hackathon Demo Launcher
echo ===================================================

echo [1/3] Starting Python ML Prediction Service on port 8000...
start "RCM ML Service" cmd /k "cd /d "%~dp0ml-service" && python -m uvicorn app:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo [2/3] Starting Java Spring Boot Backend on port 8080...
start "RCM Backend" cmd /k "cd /d "%~dp0backend" && mvn spring-boot:run"

timeout /t 5 /nobreak > nul

echo [3/3] Starting React Frontend on port 5173...
start "RCM Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo All services launched!
echo Open your browser at: http://localhost:5173
echo ===================================================
pause

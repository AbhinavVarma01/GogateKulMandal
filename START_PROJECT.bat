@echo off
echo Starting GogteKulavrutta Project Services...
echo.

REM Start Backend (Port 4000)
echo [1/3] Starting Backend Auth Server on port 4000...
cd backend
start "Backend Auth Server" npm run dev
cd ..
timeout /t 3

REM Start Form Server (Port 5000)
echo [2/3] Starting Form Server on port 5000...
cd form\server
start "Form/Family Server" npm run dev
cd ..\..
timeout /t 3

REM Start Frontend (Port 3000)
echo [3/3] Starting Frontend on port 3000...
cd frontend
start "Frontend App" npm start
cd ..

echo.
echo ================================
echo All services started!
echo ================================
echo Backend:  http://localhost:4000
echo Form API: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Test Credentials:
echo ADMIN_EMAIL: admin@gmail.com
echo ADMIN_PASSWORD: admin123
echo.

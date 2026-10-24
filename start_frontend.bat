@echo off
title Restaurant Billing - React POS Frontend (Port 5173)
echo =========================================================================
echo   Starting Restaurant Billing Software - React + Tailwind Frontend
echo   Terminal UI: http://localhost:5173
echo =========================================================================
cd /d S:\Billing_software\frontend

if not exist node_modules (
    echo Installing dependencies (first run)...
    npm install
)

npm run dev
pause

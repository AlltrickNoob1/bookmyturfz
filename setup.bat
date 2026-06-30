@echo off
REM Razorpay Payment Integration Setup Script for Turfz

echo.
echo ============================================
echo  Turfz Razorpay Payment Setup
echo ============================================
echo.

REM Check if Node.js is installed
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    echo https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found
echo.

REM Create backend .env if it doesn't exist
if not exist "backend\.env" (
    echo [INFO] Creating backend\.env...
    copy "backend\.env.example" "backend\.env"
    echo [OK] backend\.env created
    echo [ACTION] Please edit backend\.env and add your Razorpay credentials
    echo.
) else (
    echo [OK] backend\.env already exists
)

REM Create frontend .env if it doesn't exist
if not exist ".env" (
    echo [INFO] Creating .env...
    copy ".env.example" ".env"
    echo [OK] .env created
    echo [ACTION] Please edit .env and add your Razorpay Key ID
    echo.
) else (
    echo [OK] .env already exists
)

echo.
echo ============================================
echo  Setup Instructions
echo ============================================
echo.
echo 1. Edit backend\.env:
echo    - Add RAZORPAY_KEY_ID (from Razorpay dashboard)
echo    - Add RAZORPAY_KEY_SECRET (from Razorpay dashboard)
echo.
echo 2. Edit .env:
echo    - Add REACT_APP_RAZORPAY_KEY_ID (Key ID only)
echo    - REACT_APP_BACKEND_URL=http://localhost:5000
echo.
echo 3. Install backend dependencies:
echo    cd backend
echo    npm install
echo    npm start
echo.
echo 4. In a new terminal, start frontend:
echo    npm start
echo.
echo 5. Test the payment flow:
echo    - Login and book a turf
echo    - Select "Pay with QR" and complete payment
echo    - Use test card: 4111111111111111
echo.
echo For detailed guide, see RAZORPAY_SETUP_GUIDE.md
echo.

pause

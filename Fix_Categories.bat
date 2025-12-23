@echo off
echo ========================================================
echo          FIX CATEGORIES & DUPLICATES
echo ========================================================
echo.
echo This script will:
echo 1. Move "Skyline/BMW" posters from Nature -> Car
echo 2. Move "Luffy/Goku" posters from Nature -> Anime
echo 3. Delete duplicates if found.
echo.
pause
cd backend
node fix_categories.js
echo.
echo ========================================================
echo          DONE!
echo ========================================================
pause

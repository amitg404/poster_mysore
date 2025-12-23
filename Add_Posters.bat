@echo off
echo ========================================================
echo          ADD NEW POSTERS TO STORE
echo ========================================================
echo.
echo INSTRUCTIONS:
echo 1. Put your images in the 'backend/uploads' folder.
echo 2. Name them Like: "Anime-Naruto.jpg" or "Movies-Joker.png"
echo    (The part before '-' becomes the Category)
echo.
echo Current Status: Ready to sync any new files found in uploads...
echo.
pause
cd backend
node import_and_migrate_all.js
echo.
echo.
echo ========================================================
echo          DONE!
echo ========================================================
pause

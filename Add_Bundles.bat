@echo off
echo ========================================================
echo          ADD NEW BUNDLES TO STORE
echo ========================================================
echo.
echo INSTRUCTIONS:
echo 1. Go to 'backend/uploads'
echo 2. Create a NEW FOLDER for your bundle.
echo 3. Name the folder like this: "Name_Of_Bundle_799rs"
echo    Example: "One_piece_gang_799rs"
echo 4. Put all the poster images INSIDE that folder.
echo.
echo    The script will:
echo    - Use "One Piece Gang" as the Title
echo    - Use 799 as the Price
echo    - Upload all images inside as one product.
echo.
echo Current Status: Ready to sync...
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

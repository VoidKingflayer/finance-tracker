@echo off
chcp 65001 > nul
echo ========================================================
echo  Отправка проекта ФинТрекер в GitHub (VoidKingflayer)
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [УСПЕХ] Проект успешно загружен на GitHub!
) else (
    echo [ОШИБКА] Проверьте подключение или авторизацию.
)
echo.
pause

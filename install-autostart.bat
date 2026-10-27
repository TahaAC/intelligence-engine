@echo off
REM =====================================================================
REM  LOTTO INTELLIGENCE ENGINE - Auto-start Installer
REM
REM  Run this ONCE to make the dashboard auto-launch at Windows login.
REM  Creates a shortcut in the Windows Startup folder.
REM
REM  To UNINSTALL later:
REM    Press Win+R, type:  shell:startup
REM    Delete the "Lotto Engine" shortcut.
REM =====================================================================

setlocal

set "STARTUP_DIR=%AppData%\Microsoft\Windows\Start Menu\Programs\Startup"
set "BAT_DIR=%~dp0"
set "BAT_DIR=%BAT_DIR:~0,-1%"
set "TARGET_BAT=%BAT_DIR%\start-lotto.bat"

REM Check that start-lotto.bat exists next to this installer
if not exist "%TARGET_BAT%" (
    echo.
    echo [ERROR] start-lotto.bat not found in the same folder as this script.
    echo.
    echo Please make sure both files are in your project folder:
    echo   - start-lotto.bat
    echo   - install-autostart.bat
    echo.
    pause
    exit /b 1
)

echo ============================================
echo    Installing Lotto Engine auto-start
echo ============================================
echo.
echo  Source shortcut target:  %TARGET_BAT%
echo  Startup folder:          %STARTUP_DIR%
echo.

REM Build a VBScript helper to create the .lnk shortcut
set "VBS=%TEMP%\lotto_make_shortcut.vbs"
echo Set WshShell = CreateObject("WScript.Shell") > "%VBS%"
echo Set sc = WshShell.CreateShortcut("%STARTUP_DIR%\Lotto Engine.lnk") >> "%VBS%"
echo sc.TargetPath = "%TARGET_BAT%" >> "%VBS%"
echo sc.WorkingDirectory = "%BAT_DIR%" >> "%VBS%"
echo sc.WindowStyle = 7 >> "%VBS%"
echo sc.Description = "Lotto Intelligence Engine - auto launcher" >> "%VBS%"
echo sc.Save >> "%VBS%"

wscript "%VBS%"
del "%VBS%"

if exist "%STARTUP_DIR%\Lotto Engine.lnk" (
    echo.
    echo ============================================
    echo    SUCCESS! Auto-start installed.
    echo ============================================
    echo.
    echo  The dashboard will now launch automatically every
    echo  time you log in to Windows. The dev-server window
    echo  starts minimized, and the dashboard opens in your
    echo  browser ~10 seconds later.
    echo.
    echo  To UNINSTALL:
    echo    1. Press Win+R
    echo    2. Type:  shell:startup
    echo    3. Press Enter
    echo    4. Delete the "Lotto Engine" shortcut
    echo.
) else (
    echo.
    echo [ERROR] Shortcut creation failed.
    echo Try running this script as Administrator.
    echo.
)

pause

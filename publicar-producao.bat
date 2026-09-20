@echo off
title Publicando Limpeza Express SP em Produção
chcp 65001 > nul
echo ========================================================
echo   🚀 PUBLICANDO ATUALIZAÇÕES - LIMPEZA EXPRESS SP
echo ========================================================
echo.
cd /d "%~dp0"
echo Verificando status e enviando para o GitHub...
echo.
git push origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo   ✅ SUCESSO! Alterações enviadas com sucesso!
    echo   A Vercel já iniciou a publicação automática.
    echo   Em cerca de 45 segundos a nova versão estará no ar:
    echo   👉 https://app-limpeza-express.vercel.app/
    echo ========================================================
) else (
    echo ========================================================
    echo   ⚠️ Ops! O envio não foi concluído.
    echo   Se abriu uma janela do navegador, faça o login no GitHub.
    echo ========================================================
)
echo.
pause

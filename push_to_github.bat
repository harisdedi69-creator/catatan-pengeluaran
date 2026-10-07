@echo off
title Push CatatDuit Pro ke GitHub (harisdedi69-creator)
color 0b

echo ================================================================
echo   MENGUNGGAH PROJEK KE GITHUB: harisdedi69-creator
echo ================================================================
echo.
echo Pastikan Anda sudah membuat repository di GitHub:
echo https://github.com/new
echo Nama Repository: catatan-pengeluaran
echo (Jangan centang 'Add a README file')
echo.
echo Menjalankan: git push -u origin main ...
echo.

git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ================================================================
    echo [SUKSES] Projek berhasil diunggah ke GitHub!
    echo URL: https://github.com/harisdedi69-creator/catatan-pengeluaran
    echo ================================================================
) else (
    echo ================================================================
    echo [INFO / PERHATIAN]
    echo Jika gagal atau ditolak, pastikan:
    echo 1. Repository 'catatan-pengeluaran' sudah dibuat di https://github.com/new
    echo 2. Anda sudah login dengan akun 'harisdedi69-creator'
    echo ================================================================
)

echo.
pause

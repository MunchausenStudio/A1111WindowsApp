@echo off
setlocal EnableDelayedExpansion

set /a "count=0"

:loop
if !count! lss 10 (
    echo Hello world %random%
    set /a "count+=1"
    timeout /t 2 >nul
    goto loop
)

endlocal
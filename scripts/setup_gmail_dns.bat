@echo off
echo Adding Google Workspace MX Records to strainwise.app...

:: Primary
call vercel dns add strainwise.app MX ASPMX.L.GOOGLE.COM 1
if %ERRORLEVEL% NEQ 0 echo Failed to add ASPMX.L.GOOGLE.COM

:: Alternates
call vercel dns add strainwise.app MX ALT1.ASPMX.L.GOOGLE.COM 5
call vercel dns add strainwise.app MX ALT2.ASPMX.L.GOOGLE.COM 5
call vercel dns add strainwise.app MX ALT3.ASPMX.L.GOOGLE.COM 10
call vercel dns add strainwise.app MX ALT4.ASPMX.L.GOOGLE.COM 10

echo DNS Configuration Complete.
pause

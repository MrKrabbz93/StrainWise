@echo off
echo Final DNS Attempt...

:: Trying: vercel dns add <domain> <name> <type> <value> <priority>
call vercel dns add strainwise.app @ MX ASPMX.L.GOOGLE.COM 1
call vercel dns add strainwise.app @ MX ALT1.ASPMX.L.GOOGLE.COM 5
call vercel dns add strainwise.app @ MX ALT2.ASPMX.L.GOOGLE.COM 5
call vercel dns add strainwise.app @ MX ALT3.ASPMX.L.GOOGLE.COM 10
call vercel dns add strainwise.app @ MX ALT4.ASPMX.L.GOOGLE.COM 10

echo Final Attempt Complete.
pause

@echo off
echo Retrying Google Workspace DNS...

:: Syntax: vercel dns add <domain> <name> <type> <value>
:: For MX, value matches "priority host" format or separate args depending on version. 
:: Trying: vercel dns add strainwise.app @ MX "1 ASPMX.L.GOOGLE.COM"

call vercel dns add strainwise.app @ MX "1 ASPMX.L.GOOGLE.COM"
call vercel dns add strainwise.app @ MX "5 ALT1.ASPMX.L.GOOGLE.COM"
call vercel dns add strainwise.app @ MX "5 ALT2.ASPMX.L.GOOGLE.COM"
call vercel dns add strainwise.app @ MX "10 ALT3.ASPMX.L.GOOGLE.COM"
call vercel dns add strainwise.app @ MX "10 ALT4.ASPMX.L.GOOGLE.COM"

echo DNS Fix Complete.
pause

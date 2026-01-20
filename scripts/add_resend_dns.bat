@echo off
echo Adding Resend Verification Records to strainwise.app...

:: DKIM
call vercel dns add strainwise.app resend._domainkey TXT "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDW3WRdxNa8JAqd89J9OAkUIbGwfGxI3RSOHk/x4Jf7bYd++TUrZF3vvp4U3yaM9D5p/WEvman20LJR7A5Y9WWKmrKRQzNjPlUq8WNF+WiPZDiK++eG+jks1TekyndLlcVh+VdkHP55TGpOzubekniumpwCeZOORvCJ2VssrbqkmwIDAQAB"

:: SPF (MX)
call vercel dns add strainwise.app send MX feedback-smtp.us-east-1.amazonses.com 10

:: SPF (TXT)
call vercel dns add strainwise.app send TXT "v=spf1 include:amazonses.com ~all"

:: DMARC
call vercel dns add strainwise.app _dmarc TXT "v=DMARC1; p=none;"

:: Inbound MX
call vercel dns add strainwise.app @ MX inbound-smtp.us-east-1.amazonaws.com 0

echo DNS update complete.
pause

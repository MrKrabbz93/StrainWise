# 🔐 Domain Verification Checklist: strainwise.app → Vercel

This checklist guides you through verifying ownership of `strainwise.app` and transferring it to your `strain-wise-technical` Vercel team.

---

## ✅ Pre-Flight Check

- [ ] You have access to your domain registrar (where you bought `strainwise.app`)
- [ ] You have admin access to the Vercel `strain-wise-technical` team
- [ ] You know where `strainwise.app` is currently hosted (if anywhere)

---

## Step 1: Get Verification Code from Vercel

1. [ ] Navigate to: https://vercel.com/strain-wise-technical
2. [ ] Click on your **StrainWise** project
3. [ ] Go to **Settings** → **Domains**
4. [ ] Click **"Add Domain"**
5. [ ] Enter: `strainwise.app`
6. [ ] Click **"Add"**
7. [ ] **Copy the verification code** shown in the error message
   - It will look like: `vc-domain-verify=abc123xyz456...`
   - **Write it here**: `_______________________________________`

---

## Step 2: Identify Your DNS Provider

Where did you register `strainwise.app`? Check one:

- [ ] **Namecheap** → Go to: https://ap.www.namecheap.com/domains/list/
- [ ] **GoDaddy** → Go to: https://dcc.godaddy.com/domains
- [ ] **Cloudflare** → Go to: https://dash.cloudflare.com
- [ ] **Google Domains** → Go to: https://domains.google.com
- [ ] **AWS Route 53** → Go to: https://console.aws.amazon.com/route53
- [ ] **Other**: `_______________________`

---

## Step 3: Add TXT Record for Verification

### For Namecheap:
1. [ ] Log into Namecheap
2. [ ] Go to **Domain List** → Click **Manage** next to `strainwise.app`
3. [ ] Click **Advanced DNS** tab
4. [ ] Click **Add New Record**
5. [ ] Configure:
   - **Type**: `TXT Record`
   - **Host**: `_vercel`
   - **Value**: `[paste verification code from Step 1]`
   - **TTL**: `Automatic` or `3600`
6. [ ] Click **Save All Changes**

### For GoDaddy:
1. [ ] Log into GoDaddy
2. [ ] Go to **My Products** → **Domains** → Click **DNS** next to `strainwise.app`
3. [ ] Scroll to **Records** section
4. [ ] Click **Add** → Select **TXT**
5. [ ] Configure:
   - **Name**: `_vercel`
   - **Value**: `[paste verification code from Step 1]`
   - **TTL**: `600` or `1 Hour`
6. [ ] Click **Save**

### For Cloudflare:
1. [ ] Log into Cloudflare
2. [ ] Select `strainwise.app` from your domains
3. [ ] Go to **DNS** → **Records**
4. [ ] Click **Add record**
5. [ ] Configure:
   - **Type**: `TXT`
   - **Name**: `_vercel`
   - **Content**: `[paste verification code from Step 1]`
   - **TTL**: `Auto`
6. [ ] Click **Save**

### For Google Domains:
1. [ ] Log into Google Domains
2. [ ] Click on `strainwise.app`
3. [ ] Go to **DNS** tab
4. [ ] Scroll to **Custom resource records**
5. [ ] Configure:
   - **Name**: `_vercel`
   - **Type**: `TXT`
   - **TTL**: `3600`
   - **Data**: `[paste verification code from Step 1]`
6. [ ] Click **Add**

### For AWS Route 53:
1. [ ] Log into AWS Console
2. [ ] Go to **Route 53** → **Hosted zones**
3. [ ] Click on `strainwise.app`
4. [ ] Click **Create record**
5. [ ] Configure:
   - **Record name**: `_vercel`
   - **Record type**: `TXT`
   - **Value**: `[paste verification code from Step 1]`
   - **TTL**: `300`
6. [ ] Click **Create records**

---

## Step 4: Wait for DNS Propagation

1. [ ] Wait **5-15 minutes** for DNS changes to propagate
2. [ ] Check propagation status at: https://dnschecker.org
   - Enter: `_vercel.strainwise.app`
   - Select: `TXT` record type
   - Click **Search**
   - **Wait until green checkmarks appear** in multiple locations

---

## Step 5: Verify Domain in Vercel

1. [ ] Return to Vercel: https://vercel.com/strain-wise-technical
2. [ ] Go to your **StrainWise** project → **Settings** → **Domains**
3. [ ] Click **"Verify"** or **"Retry"** next to `strainwise.app`
4. [ ] **Success!** You should see: "Domain verified successfully"

---

## Step 6: Configure DNS for Production

Once verified, you need to point the domain to Vercel's servers:

### Option A: A Records (Recommended)

Add these **A records** to your DNS:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `76.76.21.21` | 3600 |
| A | www | `76.76.21.21` | 3600 |

### Option B: CNAME Record (Alternative)

If your DNS provider supports CNAME flattening:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | @ | `cname.vercel-dns.com` | 3600 |
| CNAME | www | `cname.vercel-dns.com` | 3600 |

**Note**: Vercel will show you the exact DNS records in the dashboard after verification.

---

## Step 7: Wait for SSL Certificate

1. [ ] Vercel automatically provisions SSL certificates
2. [ ] This takes **5-10 minutes**
3. [ ] You'll see a green checkmark when SSL is active
4. [ ] Visit: `https://strainwise.app` to verify

---

## Step 8: Clean Up (Optional)

1. [ ] Remove the `_vercel` TXT record from your DNS (no longer needed)
2. [ ] If the domain was linked to another Vercel account:
   - Log into that account
   - Remove `strainwise.app` from the old project

---

## ✅ Final Verification

Once everything is complete, verify:

- [ ] `https://strainwise.app` loads your StrainWise application
- [ ] SSL certificate is active (green padlock in browser)
- [ ] `https://www.strainwise.app` redirects to `https://strainwise.app`
- [ ] `/api/status` endpoint returns healthy status
- [ ] Tutorial images load correctly
- [ ] Authentication works

---

## 🚨 Troubleshooting

### "Verification failed"
- **Wait longer**: DNS can take up to 24 hours to propagate globally
- **Check TXT record**: Use `nslookup -type=TXT _vercel.strainwise.app` in terminal
- **Verify value**: Ensure the verification code matches exactly (no extra spaces)

### "Domain already in use"
- The domain is still linked to another Vercel account
- You must remove it from the old account first
- Or contact Vercel support to transfer ownership

### "SSL provisioning failed"
- Wait 30 minutes and check again
- Ensure DNS records point to Vercel's servers
- Check Vercel dashboard for specific error messages

### "Site not loading"
- DNS propagation can take 24-48 hours
- Check DNS records are correct
- Verify deployment is successful in Vercel dashboard

---

## 📞 Need Help?

- **Vercel Support**: https://vercel.com/support
- **DNS Checker**: https://dnschecker.org
- **Vercel Docs**: https://vercel.com/docs/concepts/projects/domains

---

**Once complete, your StrainWise platform will be live at `https://strainwise.app`!** 🌿✨

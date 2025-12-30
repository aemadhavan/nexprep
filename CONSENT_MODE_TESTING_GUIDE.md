# Google Consent Mode v2 Testing Guide

## Prerequisites
- Chrome browser (recommended for best DevTools support)
- Google Tag Assistant extension (optional but helpful)
- Access to Google Tag Manager container (GTM-WB29SPFG)

## Step-by-Step Testing Instructions

### Step 1: Start Your Development Server

```bash
npm run dev
```

**Expected Result:** Server starts at `http://localhost:3000`

---

### Step 2: Open Browser DevTools

1. Open your site in Chrome: `http://localhost:3000`
2. Press `F12` or right-click → Inspect
3. Go to the **Console** tab

**Expected Result:** DevTools opens with Console visible

---

### Step 3: Verify Default Consent State (Before Banner Interaction)

**In the Console tab, type:**
```javascript
dataLayer
```

**Expected Result:**
You should see an array containing a consent object similar to:
```javascript
[
  {
    0: "consent",
    1: "default",
    2: {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied"
    }
  },
  // ... other entries
]
```

**✅ PASS:** All consent types show "denied"
**❌ FAIL:** If dataLayer is undefined or consent is "granted"

---

### Step 4: Verify Consent Banner Appears

**What to Check:**
- Look at the bottom of the page
- You should see a cookie consent banner with:
  - Title: "Cookie Consent"
  - Description with privacy policy link
  - Two buttons: "Reject All" and "Accept All"

**Expected Result:** Banner is visible at bottom of page

**✅ PASS:** Banner appears on first visit
**❌ FAIL:** If no banner appears, check browser console for errors

---

### Step 5: Test "Accept All" Flow

1. **Before clicking**, open DevTools → **Application** tab → **Local Storage** → `http://localhost:3000`
2. Note: No `cookie-consent` key exists yet
3. Click **"Accept All"** button

**Expected Results:**

**A. Banner Behavior:**
- Banner disappears immediately

**B. Console Check:**
Type in Console:
```javascript
dataLayer.filter(item => item.event === 'consent_update')
```
Expected: Should show at least one consent_update event

**C. Local Storage:**
- Go to Application → Local Storage → `http://localhost:3000`
- You should see: `cookie-consent: "granted"`

**D. Consent State:**
Type in Console:
```javascript
dataLayer
```
Look for the most recent consent update entry:
```javascript
{
  event: "consent_update"
}
```

**✅ PASS:** All four checks pass
**❌ FAIL:** If consent not updated or localStorage not set

---

### Step 6: Test Consent Persistence

1. **Refresh the page** (F5)
2. Observe the consent banner

**Expected Result:**
- Banner should **NOT appear** (because consent was already given)
- Check Console for dataLayer - consent should still be stored

**✅ PASS:** Banner stays hidden on refresh
**❌ FAIL:** If banner appears again

---

### Step 7: Test "Reject All" Flow

1. **Clear localStorage:**
   - DevTools → Application → Local Storage → Right-click → Clear
2. **Refresh the page**
3. Banner should appear again
4. Click **"Reject All"** button

**Expected Results:**

**A. Local Storage:**
```
cookie-consent: "denied"
```

**B. Consent State:**
All consent types remain "denied"

**C. Banner:**
Disappears after clicking

**✅ PASS:** Consent saved as denied, banner hidden
**❌ FAIL:** If consent changes to granted

---

### Step 8: Verify GTM Container Loading

**In Console, type:**
```javascript
google_tag_manager
```

**Expected Result:**
Should show an object with your container ID (GTM-WB29SPFG)

**Alternative check:**
```javascript
window.google_tag_manager['GTM-WB29SPFG']
```

Should return an object (not undefined)

**✅ PASS:** GTM container loaded
**❌ FAIL:** If undefined or error

---

### Step 9: Check Network Requests

1. DevTools → **Network** tab
2. **Clear** network log
3. **Refresh page**
4. Filter by "gtm"

**Expected Requests:**

**Before Consent (Rejected/Default):**
- `gtm.js?id=GTM-WB29SPFG` - loads
- Analytics requests should be limited (cookieless mode)

**After Consent (Accepted):**
- Additional tracking requests may fire
- Check for Google Analytics hits

**✅ PASS:** GTM loads, requests behave according to consent state
**❌ FAIL:** If GTM doesn't load

---

### Step 10: Test Consent Update Function

**In Console, manually update consent:**
```javascript
gtag('consent', 'update', {
  'analytics_storage': 'granted'
});
```

**Then check:**
```javascript
dataLayer
```

**Expected Result:**
New entry in dataLayer with updated consent state

**✅ PASS:** Consent updates dynamically
**❌ FAIL:** If gtag function not found

---

### Step 11: Verify Script Load Order

1. DevTools → Network tab
2. Refresh page
3. Look at the request timeline

**Expected Order:**
1. HTML document loads
2. Consent mode script executes FIRST (beforeInteractive)
3. GTM script loads AFTER (afterInteractive)

**✅ PASS:** Consent mode sets defaults before GTM
**❌ FAIL:** If GTM loads before consent configuration

---

### Step 12: Test on Different Pages

Navigate to different routes on your site:
- `/sign-up`
- `/sign-in`
- Any other page

**Expected Result:**
- Consent banner behavior is consistent across all pages
- localStorage persists across navigation

**✅ PASS:** Banner works on all pages
**❌ FAIL:** If banner doesn't appear or consent resets

---

### Step 13: Validate with Google Tag Assistant (Optional)

1. Install [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk)
2. Click the extension icon
3. Click "Enable" and refresh your page
4. Click the extension again to see report

**Expected Result:**
- GTM tag detected
- No critical errors
- Consent mode info may be visible

**✅ PASS:** Tags fire correctly
**❌ FAIL:** Critical errors present

---

### Step 14: Test in Production (After Deployment)

Once deployed, verify:

**A. Google Analytics Real-Time:**
1. Go to Google Analytics (if GA4 configured in GTM)
2. Reports → Realtime
3. Visit your site (with consent accepted)
4. You should see your visit in real-time

**B. GTM Preview Mode:**
1. Go to GTM → Your Container
2. Click "Preview"
3. Enter your production URL
4. Check consent states in preview mode

**Expected Result:**
- Consent mode functioning in production
- Analytics tracking when consent granted

---

## Common Issues & Solutions

### Issue: Banner doesn't appear
**Solution:**
- Check console for errors
- Verify `ConsentBanner` component is imported
- Clear localStorage and cache

### Issue: Consent not updating
**Solution:**
- Check that `gtag` function is defined
- Verify dataLayer exists
- Ensure GTM script loaded successfully

### Issue: Banner appears every time
**Solution:**
- Check localStorage is working
- Verify same origin (http vs https can cause issues)
- Check browser doesn't block localStorage

### Issue: GTM not loading
**Solution:**
- Verify container ID is correct: GTM-WB29SPFG
- Check network tab for 404s or blocks
- Disable ad blockers for testing

---

## Success Criteria Checklist

✅ Default consent state is "denied" for all types
✅ Consent banner appears on first visit
✅ "Accept All" updates consent to "granted"
✅ "Reject All" keeps consent as "denied"
✅ User choice persists in localStorage
✅ Banner doesn't appear on subsequent visits
✅ GTM container loads correctly
✅ Consent mode script loads before GTM
✅ dataLayer contains consent events
✅ Works across all pages of the site

---

## Additional Validation Commands

### Check all consent-related dataLayer entries:
```javascript
dataLayer.filter(item => item[0] === 'consent' || item.event === 'consent_update')
```

### Check current gtag consent state:
```javascript
// This is stored internally, but you can trigger a test update to see it working
gtag('consent', 'update', {
  'analytics_storage': 'granted'
});
console.log('Consent updated - check dataLayer');
```

### Monitor consent changes:
```javascript
// Run this before interacting with banner
let originalPush = dataLayer.push;
dataLayer.push = function() {
  console.log('DataLayer push:', arguments);
  return originalPush.apply(dataLayer, arguments);
};
```

---

## Expected Timeline

- **Step 1-4:** 5 minutes (Setup and initial verification)
- **Step 5-7:** 5 minutes (Banner interaction testing)
- **Step 8-11:** 5 minutes (Technical validation)
- **Step 12-13:** 3 minutes (Cross-page and tag assistant)
- **Step 14:** 10 minutes (Production validation after deploy)

**Total estimated time:** ~30 minutes for complete testing

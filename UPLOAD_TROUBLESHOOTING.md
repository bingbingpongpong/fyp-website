# File Upload Troubleshooting Guide

## Current Status
The upload API has been updated to support JS files and includes debugging.

## What Was Fixed

1. **Formidable v3 Import**: Fixed the import to use `IncomingForm` class correctly
2. **File Extension Detection**: Improved to handle filenames with special characters (like `shell.js@node`)
3. **Debugging**: Added console logs to help identify issues
4. **File Validation**: Enhanced to check both mimetype and extension

## How to Debug Upload Issues

### Step 1: Check Server Console
When you upload a file, check the server console for debug messages:
```
[UPLOAD DEBUG] Fields: ...
[UPLOAD DEBUG] Files: ...
[UPLOAD DEBUG] Uploaded file: { originalFilename, mimetype, size, ... }
[UPLOAD DEBUG] Validation: { mimetype, extension, isAllowedType }
```

### Step 2: Check Browser Console
Open browser DevTools (F12) and check:
- Network tab → Look for `/api/upload` request
- Check the response status and error message
- Check the request payload

### Step 3: Common Issues

#### Issue: "No file uploaded"
**Possible causes:**
- File input name doesn't match
- FormData not being sent correctly
- File size too large

**Solution:**
- Check that file input has `name="image"` or the API checks for `files.file`
- Verify FormData is being created correctly
- Check file size (max 10MB)

#### Issue: "File type not allowed"
**Possible causes:**
- MIME type not recognized
- File extension not in allowed list
- Filename has special characters

**Solution:**
- Check the debug output for detected mimetype and extension
- Ensure `.js` extension is present
- The code now handles filenames like `shell.js@node` by extracting `.js`

#### Issue: Formidable errors
**Possible causes:**
- Formidable not installed correctly
- Version mismatch

**Solution:**
```bash
npm install formidable
npm list formidable  # Check version
```

## Testing the Upload

### Test with cURL:
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "image=@path/to/shell.js" \
  -v
```

### Test in Browser:
1. Go to `/admin/home`
2. Fill in product form
3. Select your `shell.js` file
4. Check browser console for errors
5. Check server console for debug logs
6. Submit the form

## Expected Behavior

When uploading `shell.js`:
1. File should be detected with mimetype `application/javascript` or `text/javascript`
2. Extension `.js` should be extracted (even from `shell.js@node`)
3. File should be saved to `public/uploads/` directory
4. Response should return: `{ success: true, path: "/uploads/...", filename: "..." }`

## File Naming

- Original filename: `shell.js@node`
- Saved as: `{timestamp}-shell_js@node.js` (sanitized) or `{timestamp}-{random}.js` (generated)

## Allowed File Types

**Extensions:**
- `.js`, `.css`, `.html`, `.txt`, `.json`, `.pdf`
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`

**MIME Types:**
- `application/javascript`, `text/javascript`
- `text/css`, `text/html`, `text/plain`
- `application/json`, `application/pdf`
- All image types

## Next Steps if Still Not Working

1. **Check the exact error message** from server console
2. **Verify file exists** - check if file is actually being selected
3. **Check file size** - must be under 10MB
4. **Try a simple test file** - create a simple `test.js` with just `console.log('test');`
5. **Check uploads directory** - verify `public/uploads/` exists and is writable

## Debug Output Example

When working correctly, you should see:
```
[UPLOAD DEBUG] Files: { image: [File] }
[UPLOAD DEBUG] Uploaded file: {
  originalFilename: 'shell.js@node',
  mimetype: 'application/javascript',
  size: 1234,
  filepath: '/tmp/...'
}
[UPLOAD DEBUG] Validation: {
  mimetype: 'application/javascript',
  extension: '.js',
  isAllowedType: true,
  originalName: 'shell.js@node'
}
```

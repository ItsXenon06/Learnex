# Uploads Directory Configuration

## Current Configuration

**Backend Property:** `learnex.upload.dir`
**Default Value:** `C:\Users\Minh Phu\Downloads\Learnex\uploads`
**Environment Variable:** `UPLOAD_DIR`

## How It Works

1. **Application Properties** (`application.properties`):
   - Sets the directory where files are uploaded and stored
   - Uses environment variable `UPLOAD_DIR` if set, otherwise uses the default path

2. **WebMvcConfig** (`WebMvcConfig.java`):
   - Reads the configured directory path
   - Maps `/uploads/**` endpoint to serve files from this directory
   - Uses `file:` protocol for file system access

## Using the Configured Path

The backend will automatically:
- Upload POST requests to: `C:\Users\Minh Phu\Downloads\Learnex\uploads\`
- Serve GET requests from: `http://localhost:1008/Learnex/uploads/filename.png`

## Changing the Upload Directory

### Option 1: Environment Variable (Recommended for production)
```bash
set UPLOAD_DIR=C:\Your\Custom\Path\uploads
# Then restart the backend
```

### Option 2: Update application.properties
Edit `backend/src/main/resources/application.properties`:
```properties
learnex.upload.dir=C:\\Your\\Custom\\Path\\uploads
```

## Important Notes

- Windows paths must use **double backslashes** (`\\`) or forward slashes (`/`)
- The directory must exist and be readable/writable by the Java process
- The frontend will request files at: `http://localhost:1008/Learnex/uploads/filename.png`
- Spring Security permits `/uploads/**` without authentication

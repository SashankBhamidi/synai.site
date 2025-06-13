
# Deployment Instructions

## Vercel Deployment

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "New Project"
   - Import this repository

2. **Build Settings**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables** (if needed):
   - Add any API keys in the Vercel dashboard under Settings > Environment Variables

## cPanel Deployment

1. **Build the Project Locally**:
   ```bash
   npm install
   npm run build
   ```

2. **Upload Files**:
   - Compress the contents of the `dist` folder into a ZIP file
   - Log into your cPanel
   - Go to File Manager
   - Navigate to `public_html` (or your domain's document root)
   - Upload and extract the ZIP file
   - Copy the `.htaccess` file to the same directory

3. **File Structure** (in public_html):
   ```
   public_html/
   ├── .htaccess
   ├── index.html
   ├── assets/
   └── other build files...
   ```

4. **Important Notes**:
   - Make sure the `.htaccess` file is in the root directory
   - Ensure your hosting supports SPAs (Single Page Applications)
   - If you have a subdomain, place files in the subdomain's document root

## Build Commands

- Development: `npm run dev`
- Production Build: `npm run build`
- Preview Build: `npm run preview`

## Domain Configuration

- **Vercel**: Automatic HTTPS, custom domains available
- **cPanel**: Configure SSL certificate through your hosting provider

# GoDaddy Deployment Guide

## Pre-Deployment Checklist

### 1. Security Requirements ✓
- [x] Removed all hardcoded MongoDB credentials
- [x] Configured environment variables for all sensitive data
- [x] Updated CORS for production domain
- [x] Configured production URLs

### 2. Required Changes Before Deployment

#### **CRITICAL: Change MongoDB Password**
```bash
# Your current MongoDB credentials are exposed in git history
# You MUST change your MongoDB password immediately:

1. Log into MongoDB Atlas
2. Go to Database Access
3. Edit the user 'gogtekulam'
4. Change the password to a strong password
5. Update MONGO_URI in your production environment variables
```

## GoDaddy Hosting Setup

### Backend Deployment (Node.js Application)

#### Option 1: cPanel with Node.js Support

1. **Upload Backend Files**
   ```bash
   # Upload these folders to your GoDaddy hosting:
   - backend/
   - backend/form/
   ```

2. **Setup Node.js Application (via cPanel)**
   - Log into GoDaddy cPanel
   - Navigate to "Setup Node.js App"
   - Click "Create Application"
   - Configure:
     - Node.js version: 16.x or higher
     - Application mode: Production
     - Application root: /backend
     - Application URL: yourdomain.com (or subdomain)
     - Application startup file: server.js

3. **Configure Environment Variables**
   In cPanel Node.js App settings, add these environment variables:
   ```
   MONGO_URI=mongodb+srv://username:NEW_PASSWORD@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your_very_strong_random_secret_key_minimum_32_characters
   PORT=4000
   NODE_ENV=production
   CLIENT_URL=https://yourdomain.com
   CLIENT_ORIGIN=https://yourdomain.com
   PRODUCTION_URL=https://yourdomain.com
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password
   EMAIL_FROM=GogateKulMandal Heritage <your_email@gmail.com>
   FORM_SERVER_PORT=5000
   FORM_SERVER_URL=https://yourdomain.com/api
   ```

4. **Setup Form Server (Second Node.js App)**
   - Create another Node.js application
   - Application root: /backend/form/server
   - Application startup file: server.js
   - Port: 5000
   - Add same environment variables

5. **Install Dependencies**
   ```bash
   cd backend
   npm install --production
   
   cd form/server
   npm install --production
   ```

6. **Start Applications**
   - Use cPanel Node.js App interface to start both apps
   - Verify they're running

#### Option 2: VPS/Dedicated Server

If you have VPS access:

```bash
# 1. Connect via SSH
ssh your_username@your_godaddy_server

# 2. Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone your repository
git clone https://github.com/AbhinavVarma01/GogateKulMandal.git
cd GogateKulMandal

# 4. Setup backend
cd backend
cp .env.production.example .env
nano .env  # Edit with your production values

npm install --production
npm start &

# 5. Setup form server
cd form/server
cp .env.example .env
nano .env  # Edit with your production values

npm install --production
npm start &

# 6. Setup PM2 for process management (recommended)
sudo npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "backend"

# Start form server
cd backend/form/server
pm2 start server.js --name "form-server"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Frontend Deployment

1. **Build Frontend**
   ```bash
   cd frontend
   
   # Create production environment file
   cp .env.production.example .env.production
   # Edit .env.production with your production API URL
   
   # Build for production
   npm install
   npm run build
   ```

2. **Upload to GoDaddy**
   - The build creates a `dist` folder
   - Upload all contents of `/frontend/dist/` to your public_html folder (or subdirectory)
   - You can use:
     - FTP/SFTP client (FileZilla)
     - cPanel File Manager
     - Git deployment

3. **Configure .htaccess for React Router** (if using cPanel)
   Create `/public_html/.htaccess`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

## DNS Configuration

### If Backend is on Same Domain

1. **Configure Subdomain for API** (Recommended)
   - Create subdomain: `api.yourdomain.com`
   - Point to backend server IP or directory
   - Update environment variables:
     ```
     VITE_API_URL=https://api.yourdomain.com
     ```

### SSL Certificate

1. **Enable SSL in cPanel**
   - Navigate to "SSL/TLS Status"
   - Enable AutoSSL for your domain
   - Verify HTTPS is working

2. **Force HTTPS** (Add to .htaccess)
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

## Post-Deployment Configuration

### 1. Update Email Service
In your production environment variables:
```
GMAIL_USER=your_actual_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_specific_password
```

To get Gmail App Password:
1. Go to Google Account Settings
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate new
4. Use generated password in GMAIL_APP_PASSWORD

### 2. Update MongoDB Atlas

1. **IP Whitelist**
   - Log into MongoDB Atlas
   - Network Access → Add IP Address
   - Add your GoDaddy server IP
   - OR use 0.0.0.0/0 (allow from anywhere - less secure)

2. **Database User**
   - Database Access
   - Create new user with strong password
   - Assign read/write permissions
   - Update MONGO_URI with new credentials

### 3. Test Deployment

```bash
# Test backend
curl https://yourdomain.com/api/test
curl https://yourdomain.com/api/family/members

# Test frontend
curl https://yourdomain.com

# Test email (if configured)
# Login and trigger registration approval
```

## Environment Variables Summary

### Backend (.env)
```env
MONGO_URI=mongodb+srv://user:NEWPASS@cluster.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=strong_random_secret_minimum_32_characters
PORT=4000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
CLIENT_ORIGIN=https://yourdomain.com
PRODUCTION_URL=https://yourdomain.com
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
EMAIL_FROM=GogateKulMandal Heritage <your_email@gmail.com>
FORM_SERVER_URL=https://yourdomain.com/api
FORM_SERVER_PORT=5000
```

### Form Server (.env)
```env
MONGO_URI=mongodb+srv://user:NEWPASS@cluster.mongodb.net/?retryWrites=true&w=majority
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
CLIENT_ORIGIN=https://yourdomain.com
PRODUCTION_URL=https://yourdomain.com
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

### Frontend (.env.production)
```env
VITE_API_URL=https://yourdomain.com/api
REACT_APP_API_URL=https://yourdomain.com/api
NODE_ENV=production
```

## Troubleshooting

### Backend Not Starting
```bash
# Check logs in cPanel or via PM2
pm2 logs backend

# Common issues:
# 1. MONGO_URI not set - Check environment variables
# 2. Port already in use - Change PORT in .env
# 3. Dependencies missing - Run npm install
```

### Frontend 404 Errors
```bash
# Ensure .htaccess is configured for SPA
# Check that all files from dist/ are uploaded
# Verify API URL in .env.production
```

### CORS Errors
```bash
# Verify PRODUCTION_URL matches your domain exactly
# Check backend CORS configuration includes your domain
# Ensure https:// protocol is used
```

### Database Connection Errors
```bash
# Verify MongoDB Atlas IP whitelist includes server IP
# Check MONGO_URI format and credentials
# Test connection with MongoDB Compass
```

## Security Checklist

- [ ] Changed MongoDB password
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Enabled HTTPS/SSL
- [ ] Updated MongoDB Atlas IP whitelist
- [ ] Configured Gmail App Password (not regular password)
- [ ] Removed all hardcoded credentials from code
- [ ] Set NODE_ENV=production
- [ ] Configured proper CORS for production domain
- [ ] Removed debug console.log statements (if desired)
- [ ] Set up regular database backups
- [ ] Configured firewall rules (if VPS)

## Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart backend

# Form Server
cd form/server
npm install --production
pm2 restart form-server

# Frontend
cd frontend
npm install
npm run build
# Upload new dist/ contents
```

### Monitor Logs
```bash
# Using PM2
pm2 logs backend --lines 100
pm2 logs form-server --lines 100

# Or check cPanel error logs
```

### Backup Database
```bash
# MongoDB Atlas provides automatic backups
# Configure backup schedule in Atlas dashboard
# Or use mongodump for manual backups
```

## Support

For issues during deployment:
1. Check application logs
2. Verify all environment variables
3. Test API endpoints individually
4. Check MongoDB Atlas connection
5. Review GoDaddy support documentation

## Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js on cPanel](https://docs.cpanel.net/knowledge-base/web-services/guide-to-nodejs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [React Production Build](https://reactjs.org/docs/optimizing-performance.html#use-the-production-build)

# Deployment Guide

This guide covers multiple deployment options for Beast Domain Checker.

## Table of Contents
- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [Railway Deployment](#railway-deployment)
- [Render Deployment](#render-deployment)
- [Self-Hosting](#self-hosting)
- [Environment Variables](#environment-variables)

## Vercel Deployment

Vercel is the recommended platform for deployment with zero configuration.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/l3lackcurtains/beast-domain-checker)

### Manual Deployment

1. **Fork the repository** on GitHub

2. **Connect to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." → "Project"
   - Import your forked repository

3. **Configure Environment Variables:**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add the following variables:
     ```
     NODE_ENV=production
     PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
     PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
     ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your project

### Vercel Configuration

The project includes a `vercel.json` file with optimized settings:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "astro",
  "functions": {
    ".vercel/output/functions/**/*.func": {
      "maxDuration": 300,
      "memory": 3008
    }
  },
  "regions": ["iad1"],
  "installCommand": "npm install && npx puppeteer browsers install chrome"
}
```

**Note:** Vercel deployment requires Pro plan ($20/month) for extended function timeout (300 seconds).

## Docker Deployment

### Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/l3lackcurtains/beast-domain-checker.git
   cd beast-domain-checker
   ```

2. **Start with Docker Compose:**
   ```bash
   docker compose up -d
   ```

3. **Access the application:**
   Open [http://localhost:6006](http://localhost:6006) in your browser.

### Docker Manual

1. **Build the image:**
   ```bash
   docker build -t beast-domain-checker .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name beast-domain-checker \
     -p 6006:6006 \
     beast-domain-checker
   ```

3. **Stop the container:**
   ```bash
   docker stop beast-domain-checker
   ```

4. **Remove the container:**
   ```bash
   docker rm beast-domain-checker
   ```

### Docker with Custom Port

To run on a different port:

```bash
docker run -d \
  --name beast-domain-checker \
  -p 3000:6006 \
  beast-domain-checker
```

Then access at [http://localhost:3000](http://localhost:3000).

## Railway Deployment

Railway offers easy deployment with free tier available.

1. **Create Railway account:** [railway.app](https://railway.app)

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your forked repository

3. **Configure:**
   - Railway will auto-detect the Dockerfile
   - Add environment variables if needed

4. **Deploy:**
   - Railway will automatically build and deploy
   - Get your public URL from the dashboard

## Render Deployment

Render offers free tier for static sites and web services.

1. **Create Render account:** [render.com](https://render.com)

2. **Create new Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node ./dist/server/entry.mjs`
   - **Port:** 6006

4. **Environment Variables:**
   ```
   NODE_ENV=production
   HOST=0.0.0.0
   PORT=6006
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy automatically

## Self-Hosting

### Prerequisites

- Node.js 18 or higher
- npm or pnpm
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/l3lackcurtains/beast-domain-checker.git
   cd beast-domain-checker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Start production server:**
   ```bash
   node ./dist/server/entry.mjs
   ```

### Using PM2 for Production

For production deployments, use PM2 for process management:

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Start with PM2:**
   ```bash
   pm2 start ./dist/server/entry.mjs --name "domain-checker"
   ```

3. **Save PM2 configuration:**
   ```bash
   pm2 save
   pm2 startup
   ```

### Systemd Service

Create a systemd service for automatic startup:

1. **Create service file:**
   ```bash
   sudo nano /etc/systemd/system/domain-checker.service
   ```

2. **Add configuration:**
   ```ini
   [Unit]
   Description=Beast Domain Checker
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/opt/beast-domain-checker
   ExecStart=/usr/bin/node ./dist/server/entry.mjs
   Restart=always
   Environment=NODE_ENV=production
   Environment=HOST=0.0.0.0
   Environment=PORT=6006

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start:**
   ```bash
   sudo systemctl enable domain-checker
   sudo systemctl start domain-checker
   ```

## Environment Variables

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `6006` |
| `HOST` | Server host | `localhost` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | Skip Chromium download | `false` |
| `PUPPETEER_EXECUTABLE_PATH` | Path to Chrome executable | - |

### Setting Environment Variables

#### Vercel
Add in Vercel dashboard → Settings → Environment Variables

#### Docker
Add to `docker-compose.yml`:
```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - PORT=6006
```

#### Manual
Create `.env` file:
```bash
NODE_ENV=production
PORT=6006
```

## Performance Optimization

### Vercel
- Use Pro plan for extended function timeout
- Deploy to closest region (currently `iad1`)
- Enable edge caching

### Docker
- Use multi-stage builds for smaller images
- Set appropriate memory limits
- Use health checks

### Self-Hosting
- Use reverse proxy (Nginx, Caddy)
- Enable gzip compression
- Set up SSL/TLS certificates

## Troubleshooting

### Common Issues

#### Puppeteer/Chromium Issues
If you encounter Puppeteer errors:

1. **Install Chrome dependencies:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install -y chromium-browser
   
   # Or use puppeteer's bundled Chrome
   npx puppeteer browsers install chrome
   ```

2. **Set executable path:**
   ```bash
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```

#### Memory Issues
For large domain lists:

1. **Increase Node.js memory:**
   ```bash
   node --max-old-space-size=4096 ./dist/server/entry.mjs
   ```

2. **Docker memory limit:**
   ```bash
   docker run -m 4g beast-domain-checker
   ```

#### Port Already in Use
Change the port:

```bash
PORT=3000 node ./dist/server/entry.mjs
```

### Logs

#### Docker
```bash
docker logs beast-domain-checker
docker logs -f beast-domain-checker  # Follow logs
```

#### PM2
```bash
pm2 logs domain-checker
```

#### Systemd
```bash
sudo journalctl -u domain-checker -f
```

## Security Considerations

### Production Deployment

1. **Use HTTPS:**
   - Vercel: Automatic SSL
   - Docker: Use reverse proxy with SSL
   - Self-hosting: Use Let's Encrypt

2. **Rate Limiting:**
   - Implement rate limiting for API endpoints
   - Use reverse proxy rate limiting

3. **Environment Security:**
   - Never commit `.env` files
   - Use secret management in production
   - Rotate API keys regularly

4. **Container Security:**
   - Use non-root user in Docker
   - Keep base images updated
   - Scan for vulnerabilities

## Monitoring

### Health Checks

Add health check endpoint:

```javascript
// In your Astro API route
export async function GET() {
  return new Response(JSON.stringify({ status: 'healthy' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

Set up monitoring for:
- HTTP endpoint: `https://your-domain.com/`
- Response time < 2 seconds
- SSL certificate validity

## Backup and Recovery

### Data Backup

The application doesn't store persistent data by default. If you customize storage:

1. **Backup volume (Docker):**
   ```bash
   docker run --volumes-from beast-domain-checker \
     -v $(pwd):/backup ubuntu \
     tar cvf /backup/backup.tar /app/data
   ```

2. **Database backup (if using external DB):**
   ```bash
   # MongoDB
   mongodump --uri="mongodb://..." --out=/backup
   
   # PostgreSQL
   pg_dump -h localhost -U user dbname > backup.sql
   ```

### Recovery

1. **Restore Docker volume:**
   ```bash
   docker run --volumes-from beast-domain-checker \
     -v $(pwd):/backup ubuntu \
     tar xvf /backup/backup.tar -C /
   ```

2. **Restart services:**
   ```bash
   docker compose restart
   ```

## Scaling

### Horizontal Scaling

For high traffic:

1. **Load balancer:**
   ```nginx
   upstream domain_checker {
       server app1:6006;
       server app2:6006;
       server app3:6006;
   }
   ```

2. **Docker Swarm:**
   ```bash
   docker service create \
     --replicas 3 \
     --publish 6006:6006 \
     beast-domain-checker
   ```

### Vertical Scaling

Increase resources:

1. **Vercel:** Upgrade to Pro/Enterprise plan
2. **Docker:** Increase memory/CPU limits
3. **Self-hosting:** Upgrade server hardware

## Support

For deployment issues:

1. Check [GitHub Issues](https://github.com/l3lackcurtains/beast-domain-checker/issues)
2. Create new issue with:
   - Deployment platform
   - Error logs
   - Configuration used

---

**Last Updated:** April 19, 2026
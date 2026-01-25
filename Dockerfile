FROM node:20-slim

# Install dependencies for Playwright/Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Playwright Chromium
RUN npx playwright install chromium

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose port
EXPOSE 6006

ENV HOST=0.0.0.0
ENV PORT=6006

# Start the standalone server
CMD ["node", "./dist/server/entry.mjs"]

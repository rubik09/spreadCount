FROM node:latest

WORKDIR /app

# Установка зависимостей Puppeteer
RUN apt-get update \
    && apt-get install -y \
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxi6 \
        libxtst6 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0 \
        libpango-1.0-0 \
        libcairo2 \
        libfontconfig1 \
        libgdk-pixbuf2.0-0 \
        libgbm1 \
        libasound2 \
        libxss1 \
        fonts-liberation \
        libappindicator1 \
        libappindicator3-1 \
        gconf-service \
        libdbus-glib-1-2 \
        xvfb \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci --only prod

COPY . .

CMD ["npm", "start"]

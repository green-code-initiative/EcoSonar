# See : https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
FROM node:22-slim

# Uncomment if you need to configure proxy.
#ENV HTTP_PROXY=$http_proxy
#ENV HTTPS_PROXY=$https_proxy
#ENV NO_PROXY=$no_proxy

RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 libx11-xcb1 libnss3-tools curl \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

#RUN npm config set proxy $HTTP_PROXY

RUN npm i \
    && npm link \
    && groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app/

USER pptruser

RUN npm i \
    && node node_modules/puppeteer/install.mjs

ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
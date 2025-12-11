# 1. Aşama: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. Aşama: Serve
FROM nginx:alpine

# React build dosyalarını kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# --- GARANTİLİ NGINX AYARI (Dosya kopyalama yok, direkt yazıyoruz) ---
# mime.types dosyasını zorla dahil ediyoruz ve 
# JS/CSS dosyalarının doğru header ile gitmesini sağlıyoruz.

RUN printf 'server { \n\
    listen 80; \n\
    include /etc/nginx/mime.types; \n\
    \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    # CSS ve JS dosyaları için özel header (Garanti olsun) \n\
    location ~ \.(css|js)$ { \n\
        try_files $uri =404; \n\
        expires 1y; \n\
        access_log off; \n\
        add_header Cache-Control "public"; \n\
    } \n\
    \n\
    # API Proxy \n\
    location /api { \n\
        proxy_pass https://posapi.theon.com.tr; \n\
        proxy_http_version 1.1; \n\
        proxy_set_header Upgrade $http_upgrade; \n\
        proxy_set_header Connection "upgrade"; \n\
    } \n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# 1. Aşama: Build
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Build sonucunu kontrol et (Loglarda görünmesi için)
RUN echo "Build klasörü içeriği:" && ls -la /app/dist && ls -la /app/dist/assets

# 2. Aşama: Serve
FROM nginx:alpine

# React build dosyalarını kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# İzinleri ayarla (CSS'in yüklenmemesinin gizli sebebi bu olabilir)
RUN chmod -R 755 /usr/share/nginx/html

# Nginx ayarını oluştur
RUN printf 'server { \n\
    listen 80; \n\
    include /etc/nginx/mime.types; \n\
    \n\
    root /usr/share/nginx/html; \n\
    index index.html; \n\
    \n\
    # Ana sayfa ve React Router \n\
    location / { \n\
        try_files $uri $uri/ /index.html; \n\
    } \n\
    \n\
    # CSS ve JS dosyaları ASLA index.html e düşmemeli \n\
    # Eğer dosya yoksa 404 ver ki tarayıcı anlasın \n\
    location ~ ^/assets/ { \n\
        try_files $uri =404; \n\
        access_log off; \n\
        expires 1y; \n\
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
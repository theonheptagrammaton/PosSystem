# Aşama 1: Build
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Aşama 2: Serve (Nginx)
FROM nginx:alpine
# React build dosyalarını Nginx'in html klasörüne kopyala
COPY --from=build /app/dist /usr/share/nginx/html
# Özel Nginx ayarını kopyala (birazdan oluşturacağız)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
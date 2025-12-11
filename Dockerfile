# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Paketleri yükle
COPY package*.json ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Client klasörünü kopyalamaya gerek yok, dockerignore ile hariç tutacağız
# Ama şimdilik basit tutalım, her şeyi kopyalasın, client hariç (aşağıda .dockerignore yapacağız)

EXPOSE 5000

CMD ["node", "app.js"]
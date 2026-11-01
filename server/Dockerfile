# ─── DEV ───
FROM node:20-alpine

WORKDIR /app

# Outils utiles
RUN apk add --no-cache python3 make g++ sqlite

# Install deps (cache layer)
COPY package*.json ./
RUN npm install

# Copier le code (sera écrasé par le volume en dev)
COPY . .

# Créer les dossiers d'upload
RUN mkdir -p uploads/avatars uploads/scholarship-docs uploads/certificates

EXPOSE 4000

CMD ["npm", "run", "dev"]
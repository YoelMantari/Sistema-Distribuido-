# cliente/Dockerfile

FROM node:20-slim

# 1) Directorio de trabajo
WORKDIR /app

# 2) Copiar package.json y package-lock.json (si existe)
COPY package.json package-lock.json ./

# 3) Instalar dependencias
RUN npm install --production

# 4) Copiar el resto de archivos
COPY . .

# 5) Exponer (no es necesario a menos que quieras puerto en GUI, pero como es CLI, no exponemos puertos)

# 6) Punto de entrada: ejecuta index.js
CMD ["node", "index.js"]

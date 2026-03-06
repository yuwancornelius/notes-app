FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN chmod -R +x node_modules/.bin/ 2>/dev/null || true

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "dev"]

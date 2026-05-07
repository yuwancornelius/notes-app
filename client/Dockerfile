FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0"]

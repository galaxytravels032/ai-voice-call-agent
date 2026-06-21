FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY src ./src
COPY index.html vite.config.ts tsconfig.json tsconfig.node.json ./

EXPOSE 5173

CMD ["npm", "run", "dev"]

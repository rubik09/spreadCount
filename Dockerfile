FROM node:18-alpine3.16

WORKDIR /app

COPY package*.json ./

RUN npm ci --only prod

COPY . .

CMD ["npm", "start"]
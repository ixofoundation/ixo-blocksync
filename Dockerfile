# create a file named Dockerfile
FROM node:latest
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
COPY build/dist /usr/src/app/dist
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
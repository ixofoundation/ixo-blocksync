FROM node:12

# Create app directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies and build
COPY package*.json ./
RUN npm install
RUN npm run build

# Copy rest of files
COPY . .

EXPOSE 8080

# Start
CMD ["npm", "start"]

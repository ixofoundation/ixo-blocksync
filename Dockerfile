FROM node:12

# Create app directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy rest of files
COPY . .

EXPOSE 8080

# Start
CMD ["npm", "start"]

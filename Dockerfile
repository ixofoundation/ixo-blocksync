FROM node:16.14.2

# Create app directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN yarn install

# Copy rest of files
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 8080

# Start
CMD ["yarn", "start"]

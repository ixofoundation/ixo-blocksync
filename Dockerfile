FROM node:16.14.2 as build

WORKDIR /usr/src/app

COPY package*.json ./
RUN yarn

COPY . .

RUN npx prisma generate


RUN yarn build

FROM node:16.14.2-alpine3.15
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/build/ ./build
COPY --from=build /usr/src/app/node_modules/ ./node_modules
COPY --from=build /usr/src/app/package*.json ./

RUN tsc

# Start
CMD ["npx tsc","&&","node","build/dist/index.js"]

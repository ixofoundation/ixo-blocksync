FROM node:22-bookworm-slim

# Pull in latest debian security patches at build time so the produced
# image doesn't ship with stale base-layer CVEs the upstream tag has
# already had fixes published for.
RUN apt-get update \
  && apt-get -y upgrade \
  && apt-get -y --no-install-recommends install ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# The npm bundled with the base image ships a vulnerable node-tar
# (CVE-2026-59873); npm 12 bundles the fixed tar >=7.5.19.
RUN npm install -g npm@12 && npm cache clean --force

WORKDIR /usr/src/app

# Install app dependencies
COPY package.json yarn.lock ./
RUN yarn --pure-lockfile --production && yarn cache clean

# Copy rest of files
COPY . .

EXPOSE 8080

CMD ["yarn", "start"]

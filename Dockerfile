# ---- Stage 1: build ---------------------------------------------------------
# Full toolchain (yarn, typescript): compiles src/ to build/dist and installs
# a separate production-only dependency tree for the runtime stage.
FROM node:22-trixie-slim AS build

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

COPY tsconfig.json ./
COPY src ./src
RUN yarn build

# Production dependencies only, in their own directory so the runtime stage
# copies no build tooling (typescript, ts-node, typedoc are devDependencies).
RUN mkdir /prod \
  && cp package.json yarn.lock /prod/ \
  && cd /prod \
  && yarn install --frozen-lockfile --production \
  && yarn cache clean

# ---- Stage 2: runtime -------------------------------------------------------
FROM node:22-trixie-slim

# Pull in latest debian security patches at build time so the produced
# image doesn't ship with stale base-layer CVEs the upstream tag has
# already had fixes published for.
# The bundled package managers (npm, npx, corepack, yarn) are removed: the
# runtime only needs `node`, and their vendored dependencies were the source
# of most image-scan findings.
RUN apt-get update \
  && apt-get -y upgrade \
  && apt-get -y --no-install-recommends install ca-certificates tini \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /usr/local/lib/node_modules \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    /opt/yarn*

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package.json ./
COPY --from=build /prod/node_modules ./node_modules
COPY --from=build /usr/src/app/build ./build
# node-pg-migrate reads the SQL migrations at startup from the cwd-relative
# path "src/postgres/migrations" (src/postgres/migrations.ts).
COPY src/postgres/migrations ./src/postgres/migrations

EXPOSE 8080

# node is no longer started through `yarn start`, so it would run as PID 1,
# where the kernel ignores SIGTERM for a process without a handler: every
# `docker stop` / pod termination would wait out the grace period and end in
# SIGKILL. tini runs as PID 1 and forwards signals, restoring the previous
# immediate shutdown on SIGTERM.
ENTRYPOINT ["/usr/bin/tini", "--", "docker-entrypoint.sh"]
CMD ["node", "build/dist/index.js"]

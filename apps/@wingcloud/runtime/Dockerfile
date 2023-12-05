###############################################################################
FROM docker/buildx-bin:v0.11 as buildx

###############################################################################
FROM node:20-alpine3.17 as node

RUN npm i -g pnpm

WORKDIR /app
COPY package.json ./package.json
RUN pnpm install

###############################################################################
FROM docker:24-git

RUN apk update
RUN apk add bash ip6tables pigz sysstat procps lsof nodejs npm
RUN npm i -g pnpm projen winglang@latest

WORKDIR /app

COPY --from=buildx /buildx /root/.docker/cli-plugins/docker-buildx
COPY --from=node /app/node_modules /app/node_modules

COPY etc ./etc
COPY docker-entrypoint.d ./docker-entrypoint.d
COPY entrypoint.sh ./entrypoint.sh
COPY lib ./lib
COPY package.json ./package.json
COPY platform.js platform.js

ARG SETUP_DOCKER="true"
RUN if [ "$SETUP_DOCKER" == "false" ]; then rm -rf ./docker-entrypoint.d; fi

ENV DOCKER_TMPDIR=/data/docker/tmp

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "lib/entrypoint-flyio.js"]

###############################################################################
FROM docker/buildx-bin:v0.11 as buildx

###############################################################################
FROM node:20-alpine3.17 as node

RUN npm i -g pnpm

WORKDIR /app
COPY package.json ./package.json
RUN pnpm install

###############################################################################
FROM docker:24.0.6-git

RUN apk update
RUN apk add bash ip6tables pigz sysstat procps lsof libstdc++
ENV NODE_PACKAGE_URL https://unofficial-builds.nodejs.org/download/release/v20.11.1/node-v20.11.1-linux-x64-musl.tar.gz
WORKDIR /opt
RUN wget $NODE_PACKAGE_URL
RUN mkdir -p /opt/nodejs
RUN tar -zxvf *.tar.gz --directory /opt/nodejs --strip-components=1
RUN rm *.tar.gz
RUN ln -s /opt/nodejs/bin/node /usr/local/bin/node
RUN ln -s /opt/nodejs/bin/npm /usr/local/bin/npm
RUN npm install -g npm@10.4.0

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

FROM docker/buildx-bin:v0.11 as buildx

FROM docker:24-git

RUN apk update
RUN apk add bash ip6tables pigz sysstat procps lsof nodejs npm

WORKDIR /app

COPY --from=buildx /buildx /root/.docker/cli-plugins/docker-buildx

RUN npm i -g pnpm projen

COPY package.json ./package.json
RUN pnpm install

COPY ./src ./src
COPY ./.projen ./.projen
COPY ./etc ./etc
COPY ./docker-entrypoint.d ./docker-entrypoint.d
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsup.config.ts ./tsup.config.ts
COPY ./entrypoint.sh ./entrypoint.sh
RUN pnpm run compile

ARG SETUP_DOCKER="true"
RUN if [ "$SETUP_DOCKER" == "false" ]; then rm -rf ./docker-entrypoint.d; fi

ENV DOCKER_TMPDIR=/data/docker/tmp

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "lib/entrypoint-flyio.js"]

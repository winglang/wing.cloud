FROM docker/buildx-bin:v0.11 as buildx

FROM docker:24-git

RUN apk update
RUN apk add bash ip6tables pigz sysstat procps lsof nodejs npm

WORKDIR /app

COPY --from=buildx /buildx /root/.docker/cli-plugins/docker-buildx

COPY . .

RUN npm install
RUN npm run compile

ENV DOCKER_TMPDIR=/data/docker/tmp

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "dist/entrypoint-flyio.js"]
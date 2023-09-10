#!/bin/bash

set -e

if [[ -d "docker-entrypoint.d" ]]
then
echo "Running docker-entrypoint.d files"
/bin/run-parts docker-entrypoint.d
fi

echo "Running dockerd"
dockerd -p /var/run/docker.pid &

echo "Running $@"

exec "$@"
#!/usr/bin/env sh
set -eux

if [ "$NODE_ENV" != "production" ]; then
    yarn install
fi

exec $@

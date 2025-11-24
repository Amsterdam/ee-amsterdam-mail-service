#!/usr/bin/env sh
set -eux

if [ "$NODE_ENV" != "production" ]; then
    NODE_OPTIONS_BAK="$NODE_OPTIONS"
    export NODE_OPTIONS=""
    yarn install
    export NODE_OPTIONS="$NODE_OPTIONS_BAK"
fi

exec $@

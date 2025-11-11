#!/usr/bin/env sh
set -eux

NODE_OPTIONS_BAK="$NODE_OPTIONS"
export NODE_OPTIONS=""

if [ "$NODE_ENV" != "production" ]; then
    yarn install
fi

export NODE_OPTIONS="$NODE_OPTIONS_BAK"

exec $@

#!/usr/bin/env sh
set -eux

if [ "$NODE_ENV" != "production" ]; then
    yarn install
fi

export NODE_OPTIONS="--experimental-loader=@opentelemetry/instrumentation/hook.mjs --import ./src/telemetry.ts --trace-deprecation"

exec $@

FROM node:24-alpine

WORKDIR /app

COPY entrypoint.sh /

ADD package.json yarn.lock /app

RUN yarn install --immutable --production && yarn cache clean

ENV NODE_OPTIONS="--experimental-loader=@opentelemetry/instrumentation/hook.mjs --import /app/src/telemetry.ts --trace-deprecation"

COPY . /app

ENTRYPOINT ["/entrypoint.sh"]
CMD ["yarn", "run", "start:prod"]

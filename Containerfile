FROM node:24-alpine

WORKDIR /app

COPY entrypoint.sh /

ADD package.json yarn.lock /app

RUN yarn install --immutable --production

COPY . /app

ENTRYPOINT ["/entrypoint.sh"]
CMD ["yarn", "run", "start:prod"]

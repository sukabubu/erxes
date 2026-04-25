FROM alpine:3.11 AS jo-builder
RUN apk add --no-cache alpine-sdk && \
    cd /tmp && curl -s -LO https://github.com/jpmens/jo/releases/download/1.3/jo-1.3.tar.gz && \
    tar xzf jo-1.3.tar.gz && \
    cd jo-1.3 && \
    ./configure && \
    make check && \
    make install

FROM node:22-alpine AS build
WORKDIR /app
ENV CI=true
ENV NX_DAEMON=false
ENV NODE_OPTIONS=--max-old-space-size=1536

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --child-concurrency=1

COPY . .
RUN pnpm nx build china_leads_ui --configuration=production --verbose

FROM nginx:alpine

COPY --from=jo-builder /usr/local/bin/jo /usr/local/bin/jo

RUN apk add --no-cache bash

COPY --from=build /app/dist/frontend/plugins/china_leads_ui /usr/share/nginx/html
COPY --from=build /app/frontend/core-ui/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/frontend/core-ui/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/core-ui/docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    chmod +x /usr/local/bin/jo && \
    mkdir -p /usr/share/nginx/html/js

EXPOSE 80

ENTRYPOINT ["sh", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

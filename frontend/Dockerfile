# Stage 1: Build
FROM node:26-slim@sha256:deae974a69e140f44f434ab29cb519fb5f8fe250fd364b8ca446bd0761acdc6a AS build

WORKDIR /app

COPY src src

COPY public public

COPY css css

COPY index.html package.json package-lock.json vite.config.js ./

RUN npm ci

RUN npm run build

# Stage 2: Runtime
FROM nginxinc/nginx-unprivileged:alpine@sha256:59ccf0943b0b8e8d9e6ea9039a39555730f544701a655c596f7df7d096c593f5

COPY config/nginx/default.conf.template  /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

COPY public/config.js /usr/share/nginx/html/public/config.js

EXPOSE 80

# Switch to non-root user.
USER 10001

CMD ["nginx", "-g", "daemon off;"]

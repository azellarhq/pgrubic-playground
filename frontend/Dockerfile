# Stage 1: Build
FROM node:26-slim@sha256:ffc78385a788964bb3cbab5e434ff79a10bdc25b8ae6db03fe5fe6cb14053c09 AS build

WORKDIR /app

COPY src src

COPY public public

COPY css css

COPY index.html package.json package-lock.json vite.config.js ./

RUN npm ci

RUN npm run build

# Stage 2: Runtime
FROM nginxinc/nginx-unprivileged:alpine@sha256:6320020c7da8714feab524e02c08c5a1958675c4e68700e93a2fd8970b065786

COPY config/nginx/default.conf.template  /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

COPY public/config.js /usr/share/nginx/html/public/config.js

EXPOSE 80

# Switch to non-root user.
USER 10001

CMD ["nginx", "-g", "daemon off;"]

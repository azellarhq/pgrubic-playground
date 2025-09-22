# Stage 1: Build
FROM node:24-slim@sha256:cadbfafeb6baf87eaaffa40b3640209c4b7fd38cebde65059d15bc39cd636b85 AS build

WORKDIR /app

COPY src src

COPY public public

COPY css css

COPY index.html package.json package-lock.json vite.config.js ./

RUN npm ci

RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine-slim@sha256:94f1c83ea210e0568f87884517b4fe9a39c74b7677e0ad3de72700cfa3da7268

COPY config/nginx/default.conf.template  /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

COPY public/config.js /usr/share/nginx/html/public/config.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

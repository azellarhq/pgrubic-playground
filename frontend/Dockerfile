# Stage 1: Build
FROM node:24-slim@sha256:37ff334612f77d8f999c10af8797727b731629c26f2e83caa6af390998bdc49c AS build

WORKDIR /app

COPY src src

COPY public public

COPY css css

COPY index.html package.json package-lock.json vite.config.js ./

RUN npm ci

RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine-slim@sha256:64daa9307345a975d3952f4252827ed4be7f03ea675ad7bb5821f75ad3d43095

COPY config/nginx/default.conf.template  /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

COPY public/config.js /usr/share/nginx/html/public/config.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

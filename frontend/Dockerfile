# Stage 1: Build
FROM node:24-slim@sha256:c0eadb278e6b0b608681b359291592692979133567710eaa703d6f989f33c6c1 AS build

WORKDIR /app

COPY src src

COPY public public

COPY css css

COPY index.html package.json package-lock.json vite.config.js ./

RUN npm ci

RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine-slim@sha256:91fff1c842f0da2bbfb6df7d727d74e0a7ad01cb1fa9415f2f9bfa8b0aa5d62d

COPY config/nginx/default.conf.template  /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

COPY public/config.js /usr/share/nginx/html/public/config.js

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Static SPA: build with vite, serve with nginx. Not an app server.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build           # vite -> /app/build (outDir in vite.config.js)

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
# Override the dev /config.js that vite copies from public/ with the production one
# (base_url -> the ntfy API host). This is the only env-specific file in the image.
COPY deploy/config.js /usr/share/nginx/html/config.js
EXPOSE 80

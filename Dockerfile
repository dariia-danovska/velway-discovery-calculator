# Optional self-hosting: static build served by nginx.
#   docker build --build-arg VITE_INTERNAL_PASSPHRASE=... -t velway-calc .
#   docker run -d -p 8080:80 --name velway-calc velway-calc
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_INTERNAL_PASSPHRASE=""
ENV VITE_INTERNAL_PASSPHRASE=$VITE_INTERNAL_PASSPHRASE
RUN npm test && npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

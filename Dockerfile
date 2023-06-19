FROM arm32v7/node:18-alpine as build

WORKDIR /app
ENV PATH /app/node-modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
#RUN npm install react-scripts@4.0.3 -g
COPY ./src ./src
COPY ./public ./public
# REACT_APP requires env before building react package
COPY ./.env ./.env

RUN npm run build

# production environment, use nginx as static server
FROM arm32v7/nginx:stable-alpine

EXPOSE 3000
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]

LABEL org.opencontainers.image.source="https://github.com/UPRI-earthquake/sender-frontend"
LABEL org.opencontainers.image.description="Base docker image for sender frontend"
LABEL org.opencontainers.image.authors="earthquake@science.upd.edu.ph"

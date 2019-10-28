FROM node:alpine as build

WORKDIR /home/app/

COPY package.json .

RUN npm install

COPY . . 

CMD [ "npm" "start" ]

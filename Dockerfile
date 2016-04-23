FROM node:4.4.3
MAINTAINER Adam K Dean <adamkdean@googlemail.com>

RUN mkdir /var/app
COPY . /var/app
WORKDIR /var/app

RUN npm config set loglevel warn
RUN npm install --global gulp
RUN npm install

CMD ["npm", "start"]

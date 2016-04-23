FROM node:4.4.3
MAINTAINER Adam K Dean <adamkdean@googlemail.com>

RUN mkdir /var/app
COPY . /var/app
WORKDIR /var/app
RUN npm install --production --global gulp
RUN npm install --production

CMD ["npm", "start"]

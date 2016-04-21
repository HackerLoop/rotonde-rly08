FROM resin/raspberrypi-node:latest

RUN apt-get update && \
    apt-get install -y unzip

ADD https://github.com/HackerLoop/rotonde-rly08/archive/master.zip /tmp/master.zip
RUN unzip /tmp/master.zip -d /usr/local/ && mv /usr/local/rotonde-rly08-master /usr/local/rotonde-rly08

WORKDIR "/usr/local/rotonde-rly08/"

RUN npm install

RUN apt-get autoremove -y unzip && \
    apt-get purge

CMD ["/usr/local/bin/node", "index.js"]

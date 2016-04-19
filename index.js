'use strict';

const _ = require('lodash');

const client = require('rotonde-client/node/rotonde-client')('ws://rotonde:4224');

const vendorId = 1240;
const productId = 65518;

const sendCommand = (port, cmd) => {
  const promise = client.eventHandlers.makePromise('SERIAL_WRITE_STATUS');
  client.sendAction('SERIAL_WRITE', {
    port: port.comName,
    data: new Buffer(cmd).toString('base64'),
    response: 'SERIAL_WRITE_STATUS',
  });
  return promise;
}

const processCommands = (port) => {
  console.log('Start treating actions');
  client.eventHandlers.attach('SERIAL_LOST', (e) => {
    if (!(e.data.vendorId == vendorId && event.data.productId == productId)) {
      return;
    }
    console.log('Lost serial link to device');
    process.exit(1);
  });

  client.addLocalDefinition('action', 'RLY08_SET_STATES', [
    {
      'name': 'channels',
      'type': 'array of 8 booleans',
      'units': 'each channels entry contains a boolean indication on or off for this channel'
    }
  ]);
  client.actionHandlers.attach('RLY08_SET_STATES', (a) => {
    let statusByte = _.reduce(a.data.channels, (statusByte, channel, i) => channel ? statusByte | (1 << i) : statusByte, 0);
    sendCommand(port, [92, statusByte]);
  });
}

const openPort = (port) => {
  if (!(port.vendorId == vendorId && port.productId == productId)) {
    return;
  }
  console.log('Port found, opening:');
  const statusPromise = client.eventHandlers.attachOnce('SERIAL_OPEN_STATUS', (event) => {
    if (event.data.status == 'FAILED') {
      console.log('SERIAL_OPEN returned FAILED status !');
      process.exit(1);
    }
    processCommands(port);
  });
  client.sendAction('SERIAL_OPEN', {
    port: port.comName,
    baud: 9600,
    parser: 'RAW',
    isBinary: true,
    response: 'SERIAL_OPEN_STATUS'
  });
}

client.onReady(() => {
  client.bootstrap({
   'SERIAL_LIST': {}
  }, ['SERIAL_PORTS_AVAILABLE'], ['SERIAL_PORT_DISCOVERED', 'SERIAL_PORT_LOST']).then((events) => {
    _.forEach(events[0].data.ports, (port) => {
      openPort(port);
    });
    const discovered = (event) => {
      openPort(event.data);
    }
    client.eventHandlers.attach('SERIAL_PORT_DISCOVERED', discovered);
  });
});

client.connect();

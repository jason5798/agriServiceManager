var mqtt = require('mqtt');
var config = require('../config');

var options = {
	port:sconfig.gIotPort,
    host: config.gIotHost,
    clientId:config.client_Id,
    username:config.gIotName,
    password:config.gIotPw,
    keepalive: 0,
	reconnectPeriod: 1000,
	protocolId: 'MQIsdp',
	protocolVersion: 3,
	//clean: false
};
console.log('giotClient port:'+options.port);
console.log('giotClient host:'+options.host);
console.log('giotClient clientId:'+options.clientId);
console.log('giotClient username:'+options.username);
console.log('giotClient password:'+options.password);

var GIotClient = mqtt.connect(options);

module.exports = GIotClient;
var zmq = require('zmq');
var client = zmq.socket('sub');
var spawn = require('child_process').spawn;

var service = 'badjs';
var badjsKey = '635658';
var port = 'tcp://10.143.132.205:10000';
var path = '/usr/local/agenttools/agent/agentRepSum';

var total = 0;
var keyMap = {};
var badjsIdMap = {};

client.connect(port);
client.subscribe(service);

var datetime = function() {
    return (new Date).toString().substring(4, 24);
};

client.on('message', function(data) {
    // total message
    total += 1;

    // statistic
    try {
        var dataStr = data.toString();
        var newData = JSON.parse(dataStr.substring(dataStr.indexOf(' '))) || {};
        var ext = newData.ext ? JSON.parse(newData.ext) : null;
        badjsIdMap[newData.id] = (badjsIdMap[newData.id] >> 0 ) +1;
        if(newData.level == 4 ){
            ext && ext.msid && (keyMap[ext.msid] = (keyMap[ext.msid] >> 0) + 1); // jshint ignore:line
        }
    } catch (ex) {
        console.log(datetime(), 'message parse error');
    }
});

// 1 min report once
setInterval(function() {

    console.log("total : " , total)
    spawn(path, [badjsKey, total]).stdout.on('data', function(data) {
        console.log(datetime(), 'report badjs pv success  ');
    });

    //  console.log(datetime(), 'report monitor keyMap: ', badjsIdMap);
    for (var key in keyMap) {
        spawn(path, [key, keyMap[key]]).stdout.on('data', function(data) {}); // jshint ignore:line
    }

    keyMap = {};
    badjsIdMap = {};
    total = 0;

}, 1000 * 60);
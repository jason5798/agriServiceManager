var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var todos = require('./routes/todos'),
    map = require('./routes/map')
    user = require('./routes/user');
//Jason add on 2017.02.16 - start

var http = require('http'),
    https = require('https');
var session = require('express-session');
var config = require('./config');
var flash = require('connect-flash');
var linebot = require('linebot');
//Jason add on 2017.02.16 - end
var app = express();
var JsonFileTools =  require('./modules/jsonFileTools.js');
var userPath = './public/data/user.json';

var bot = linebot({
    channelId: config.channelId,
    channelSecret: config.channelSecret,
    channelAccessToken: config.channelAccessToken
});

const linebotParser = bot.parser();

bot.on('message', function(event) {
    // 把收到訊息的 event 印出來
    console.log(event);
    var msg = new Date() + event.message.text;
    event.reply(msg).then(function (data) {
        // success
        console.log('event reply : ' + JSON.stringify(data));
    }).catch(function (error) {
        // error
        console.log('event reply : ' + JSON.stringify(error));
    });
    event.source.profile().then(function (profile) {
        console.log('uaer profile : ' + JSON.stringify(profile));
    }).catch(function (error) {
        // error
        console.log('uaer profile error : ' + JSON.stringify(error));
    });
});

bot.on('follow',   function (event) {
  //紀錄好友資料
  console.log('line follow  : ' + event.source.userId);
  addFriend(event.source.userId);
});

bot.on('unfollow', function (event) {
  //刪除好友紀錄
  console.log('line unfollow  : ' + event.source.userId);
  removeFriend(event.source.userId)
 });

bot.on('join',     function (event) {
  //紀錄加入者資料資料
  addFriend(event.source.userId);
  console.log('line join : ' + event.source.userId);
 });

app.post('/webhook', linebotParser);

var port = process.env.PORT || config.hostPort;
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: config.cookieSecret,
  key: config.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: false,
  saveUninitialized: true
}));
app.use('/todos', todos);
app.use('/user'  + config.baseurl, user);//Login,logout,User
app.use('/map' + config.baseurl, map);//Device type map


routes(app);
var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
var hasRed = false;
if (hasRed) {
    var RED = require("node-red");
    var setting = {
            httpAdminRoot:"/red",
            httpNodeRoot: "/",
            userDir:"./.nodered/",
            functionGlobalContext: {
            momentModule:require("moment"),
            //DbTools:require("./modules/mongo/devicedevice.js"),
            //msgTools:require("./modules/msgTools.js")
        }    // enables global context
    };
    // Initialise the runtime with a server and settings
    RED.init(server,setting);
    // Serve the editor UI from /red
    app.use(setting.httpAdminRoot,RED.httpAdmin);
    // Serve the http nodes UI from /api
    app.use(setting.httpNodeRoot,RED.httpNode);
    // Start the runtime
    RED.start();
}

server.listen(port);

function getUser() {
  try {
        var user = JsonFileTools.getJsonFromFile(userPath);
    }
    catch (e) {
        var user = {};
    }

  if (user.friend === undefined) {
    user.friend = [];
  }
  return user;
}

function saveUser(user) {
  JsonFileTools.saveJsonToFile(userPath,user);
}

function addFriend(id) {
  var user = getUser();
  var index = user.friend.indexOf(id);
  if (index === -1) {
      user.friend.push(id);
  }
  saveUser(user);
}

function removeFriend(id) {
  var user = getUser();
  var index = user.friend.indexOf(id);
  if (index > -1) {
      array.splice(index, 1);
  }
  saveUser(user);
}
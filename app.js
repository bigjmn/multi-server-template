var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var debug = require('debug')('expressappejs:server');
var http = require('http');
var shortid = require('shortid')


var app = express();

const server = require("http").createServer(app);
const port = process.env.PORT || 3000;
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
var socketio = require('socket.io')


var roomlist = []
var lobbylist = []
var lobbydict = {}

function shownrooms(){
  var nonhiddens = lobbylist.filter((item) => item.privacy != 'hidden')
  var justnames = nonhiddens.map((item) => item.name)
  return justnames

}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var io = socketio(server)

app.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', rooms: shownrooms() });
});

//bit of middleware. I'll probs rewrite it to make it
//actual middleware at some point.
//creates a new namespace, and builds a new associated lobby
//and server instance
app.post('/create', function(req, res, next) {

  var roomname = req.body.roomname
  var privacysetting = req.body.privacy
  var password = req.body.password

  var roomid = shortid.generate()
  roomlist.push(roomid)


  //build the new url
  var namesp = '/game/'+roomid
  var newlobby = require('./Lobby.js')(roomname, privacysetting, password)
  lobbydict[namesp] = newlobby


  var nsp = io.of('/game/'+roomid)
  nsp.on('connection', (socket) => {
    console.log('connected')
    socket.lobby = lobbydict[nsp.name]

    //if the room is empty when joined, the joiner is the host.
    socket.host = socket.lobby.userlist.length == 0
    socket.lobby.userlist.push(socket) //doesn't make the world explode, don't worry
    socket.username = 'player'+socket.lobby.userlist.length.toString()
    socket.emit('welcome')
    //and now let's store the rest of this logic somwhere else
    require('./serversocks')(nsp, socket)


  })
  lobbylist.push(nsp)
  console.log('and now')
  res.redirect('/game/'+roomid);
});

app.get('/game/:roomid', function(req, res, next){
  if (roomlist.includes(req.params.roomid)){
    res.render('gameroom', {title:req.params.roomid})
  }
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen(port, () => {
  console.log(`application is running at: http://localhost:${port}`);
});

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var debug = require('debug')('expressappejs:server');
var http = require('http');
var shortid = require('shortid')
var _ = require('lodash')

var crypto = require('crypto');

//for encoding admin password. there's def a better way...
function hashpass(secret){
  var hash = crypto.createHmac('sha256', secret)
                 .update('onealmond')
                 .digest('hex');

  return hash

}
console.log(hashpass('jnicks'))

'160c6be7d60242b70b1988d173d963bc8aaccba69e4a76e877e640bab86007fa'

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
  var nonhiddens = lobbylist.filter((item) => item.privacysetting != 'hidden')
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
  res.render('index', { title: 'Tetris Buddies', rooms: shownrooms() });
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
  var urlpath = '/game/'+roomid

  var nsp = io.of(urlpath)
  nsp.on('connection', (socket) => {
    console.log('connected')
    socket.lobby = lobbylist[_.findIndex(lobbylist,{nsp:socket.nsp})]

    //if user is the first one there, they're the host
    socket.host = socket.lobby.userlist.length == 1
    //socket.lobby.userlist.push(socket) //doesn't make the world explode, don't worry

    //username changes occur after joining
    socket.username = 'player'+socket.lobby.userlist.length.toString()
    socket.emit('welcome')
    //and now let's store the rest of this logic somwhere else
    require('./serversocket')(nsp, socket)


  })
  var newlobby = require('./Lobby.js')(roomname, privacysetting, password, roomid, urlpath, nsp)

  lobbylist.push(newlobby)
  //take host to their newly created lobby
  res.redirect(newlobby.urlpath)
});
//NOT CURRENTLY USED, MIGHT MIGHT RE-IMPLEMENT
app.post('/join/:roomname', function(req, res, next){
  let name = req.params.roomname
  let pass = req.body.guesspassword

  var lobbywanted = _.find(lobbylist, (x) => {return (x.name == name && x.password == pass && x.midgame == false)})
  lobbywanted ? res.redirect(lobbywanted.urlpath) : res.redirect('/')
})



app.get('/game/:roomid', function(req, res, next){
  var foundlobby = _.find(lobbylist, {roomid:req.params.roomid})
  foundlobby ? res.render('gameroom', {title:foundlobby.name, nameofroom:foundlobby.name}) : res.render('error', {message:'Game not found'})
})

//not super secure, but easy enough to buff up I think.
app.get('/admin/:adminpass', function(req, res, next){
  var privkey = req.params.adminpass
  var isAdmin = hashpass(privkey) == '160c6be7d60242b70b1988d173d963bc8aaccba69e4a76e877e640bab86007fa'

  isAdmin ? res.render('admin', {lobbylist:lobbylist}) : res.redirect('/')
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

module.exports = lobbylist

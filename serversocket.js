var lobbylist = require('./app')
var newcontrols  = require('./helpers')
module.exports = function(io, socket){
  socket.on('refresh', () => {
    if (socket.host){
      //give the host the start button.
      socket.emit('getstartbutton')
    }
    socket.emit('clientchange', {new_mode:socket.lobby.gamemode})
    //give list of usernames.
    var justnames = socket.lobby.userlist.map(user => [user.username, user.id])
    io.emit('takeusers', {namelist:justnames})
  })
  socket.on('changename', (data) => {

    socket.username = data.name
    var justnames = socket.lobby.userlist.map(user => [user.username,user.id])
    io.emit('takeusers', {namelist:justnames})
  })

  socket.on('changemode', (data) => {
    socket.lobby.gamemode = data.newmode
    io.emit('clientchange', {new_mode:data.newmode})
  })

  socket.on('disconnect', () => {

    socket.lobby.userlist.filter((user) => user.id != socket.id)
    if (socket.lobby.userlist.length == 0){
      if (socket.lobby.dropinterval){
        clearInterval(socket.lobby.dropinterval)
      }
      lobbylist.splice(lobbylist.indexOf(socket.lobby),1)
      return
    }
    io.emit('userleft')
  })

  //giving host a new piece, everyone new controls
  socket.on('nextpiece', () => {
    socket.lobby.readyusers++
    if (socket.lobby.readyusers < socket.lobby.userlist.length){
      return;
    }
    socket.lobby.readyusers = 0
    newcontrols(socket.lobby.userlist)
    var controlinfo = socket.lobby.userlist.map(item => [item.id, item.rights])
    io.emit('rightstoshow', {info:controlinfo})

  })
  socket.on('nowthepiece', (data) => {
    socket.lobby.readyusers++
    if (socket.lobby.readyusers < socket.lobby.userlist.length){
      return
    }

    socket.lobby.readyusers = 0
    var piecenum = Math.floor(7*Math.random())
    io.emit('takepiece', {piece:piecenum})
    if (socket.lobby.dropinterval){
      clearInterval(socket.lobby.dropinterval)
    }
    socket.lobby.dropinterval = setInterval(dropfunc, data.gamespeed)
  })
  function dropfunc(){
    io.emit('dropit')
  }


  //tetris controls
  socket.on('trymove', (data) => {
    if (data.move == 'auto'){
      io.emit('move', {move:data.move})
      return
    }
    if (socket.rights[data.move]){
      io.emit('move', {move:data.move})
      return;
    }
    io.emit('illegal')
  })


  socket.on('gameprep', () => {socket.lobby.userlist.forEach((item) => {

    //decorate sockets
    item.rights = {'left':false,'rotate':false,'right':false}
  })
  var firstondeck = Math.floor(7*Math.random())

  io.emit('takelisteners', {deck:firstondeck})
})
socket.on('endgame', () => {
  socket.lobby.midgame = false;
  if (socket.lobby.dropinterval){
    clearInterval(socket.lobby.dropinterval)
  }
  socket.emit('cleanup')

})

}

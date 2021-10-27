var lobbylist = require('./app')
var newcontrols  = require('./helpers')
module.exports = function(io, socket){
  socket.on('refresh', () => {
    if (socket.host){
      //give the host the start button.
      socket.emit('getstartbutton')
    }
    //give list of usernames.
    var justnames = socket.lobby.userlist.map(user => [user.username, user.id])
    io.emit('takeusers', {namelist:justnames})
  })
  socket.on('changename', (data) => {

    socket.username = data.name
    var justnames = socket.lobby.userlist.map(user => [user.username,user.id])
    io.emit('takeusers', {namelist:justnames})
  })

  socket.on('disconnect', () => {
    console.log('disconnecting')

    socket.lobby.userlist.filter((user) => user.id != socket.id)
    if (socket.lobby.userlist.length == 0){
      console.log('no more')
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
    console.log(controlinfo)
    io.emit('rightstoshow', {info:controlinfo})

  })
  socket.on('nowthepiece', () => {
    socket.lobby.readyusers++
    if (socket.lobby.readyusers < socket.lobby.userlist.length){
      return
    }
    socket.lobby.readyusers = 0
    var piecenum = Math.floor(7*Math.random())
    io.emit('takepiece', {piece:piecenum})
  })
  //tetris controls
  socket.on('trymove', (data) => {
    console.log(socket.username+'tried'+data.move)
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

  socket.on('sharecan', (data) => {io.emit('showthis', {newcan:data.can})})

  socket.on('gameprep', () => {socket.lobby.userlist.forEach((item) => {
    console.log('prepping')

    //decorate sockets
    item.rights = {'left':false,'rotate':false,'right':false}
  })
  io.emit('takelisteners')
  console.log(socket.lobby.userlist)
  //socket.emit('gotime')
})

}

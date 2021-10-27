var lobbylist = require('./app')
var newcontrols  = require('./helpers')
module.exports = function(io, socket){
  socket.on('refresh', () => {
    if (socket.host){
      //give the host the start button.
      socket.emit('getstartbutton')
    }
    //give list of usernames.
    var justnames = socket.lobby.userlist.map(user => user.username)
    io.emit('takeusers', {namelist:justnames})
  })
  socket.on('changename', (data) => {

    socket.username = data.name
    var justnames = socket.lobby.userlist.map(user => user.username)
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
    newcontrols(socket.lobby.userlist)
    var controlinfo = socket.lobby.userlist.map(item => [item.username, item.rights])
    console.log(controlinfo)
    io.emit('rightstoshow', {info:controlinfo})
    socket.emit('takepiece')
  })
  //tetris controls
  socket.on('trymove', (data) => {
    socket.rights[data.move] ? io.to('host').emit('move', {move:data.move}) : io.to('host').emit('illegal')

  })

  socket.on('sharecan', (data) => {io.emit('showthis', {newcan:data.can})})

  socket.on('gameprep', () => {socket.lobby.userlist.forEach((item) => {
    //decorate sockets
    item.rights = {'right':false,'left':false,'rotate':false}
  })
  io.emit('takelisteners')
  console.log(socket.lobby.userlist)
  socket.emit('gotime')
})

}

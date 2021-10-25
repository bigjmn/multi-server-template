module.exports = function(io, socket){
  socket.on('refresh', () => {
    if (socket.host){
      socket.emit('getstartbutton')
    }
    var justnames = socket.lobby.userlist.map(user => user.username)
    io.emit('takeusers', {namelist:justnames})
  })
}

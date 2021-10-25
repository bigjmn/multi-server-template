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

    io.emit('userleft')
  })
}

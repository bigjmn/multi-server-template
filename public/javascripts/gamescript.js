var socket = io(location.href)
console.log('hi')

socket.on('welcome', () => {socket.emit('refresh') })

socket.on('takeusers', (data) => {

  var namelist = ''
  data.namelist.forEach((item) => {
    namelist += '<div>'+item+'</div>'
  });
  $('#nameholder').html(namelist)

})
socket.on('getstartbutton', () => {
  //not the most elegant, but that's fine
  var buttonstring = "<button onclick='startgame()'>Start the Game!</button>"
  $('#waitmessage').html(buttonstring)
})

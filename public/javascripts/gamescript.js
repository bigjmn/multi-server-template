var socket = io(location.href)

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
document.getElementById('changeusername').addEventListener('click', function(){
  var newname = $('#newusername').val()
  if (newname){
    socket.emit('changename', {name:newname})
  }
  
})

socket.on('userleft', () => {socket.emit('refresh')})

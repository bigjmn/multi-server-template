var socket = io(location.href)
var midgame = false;

import {playertags} from './tagmaker.js'
socket.on('welcome', () => {socket.emit('refresh') })

socket.on('takeusers', (data) => {
  var namelist = playertags(data.namelist)


  $('#nameholder').html(namelist)

})

socket.on('getstartbutton', () => {
  //not the most elegant, but that's fine
  var hostbutton = document.createElement('button')
  hostbutton.id = 'hostbutton'
  hostbutton.className = 'bubbleborder'
  hostbutton.innerHTML = 'START THE GAME'
  hostbutton.addEventListener('click', () => {
    if (midgame){
      return;
    }
    midgame = true;
    socket.emit('gameprep')
  })
  $('#waitmessage').html(hostbutton)
})
document.getElementById('changeusername').addEventListener('click', function(){
  var newname = $('#newusername').val()
  if (newname){
    socket.emit('changename', {name:newname})
    $('#newusername').val('')

  }

})
$('#newusername').on('keydown', (e) => {
  if (e.key == 'Enter'){
    $('#changeusername').click()
  }
})



//TETRIS
var board;
var active;
var ondeck;
var linesCleared;
var level;
var clicksound;
var setsound;
var penaltysound
var sfx = true;

var penalties;
var gamemode;

var upcoming;

var gamespeed = 1000;

function endgame(){
  board = null
  active = null
  linesCleared = 0
  level = 1
  penalties = 0
  board = new Board()
  setTimeout(backtolobby,3000)
}

function backtolobby(){
  $('#gameoversign').hide()
  $('#options-area').show()

}

function startgame(){
  var panelshow = socket.id
  if (gamemode == 'allView'){
    $('.playercontrols').show()

  }
  if (gamemode == 'selfView'){
    $('.playercontrolmask').show()
    $('#'+panelshow+'controlmask').hide()
    $('#'+panelshow).show()
  }
  if (gamemode == 'friendView'){
    $('.playercontrols').show()
    $('#'+panelshow).hide()
    $('#'+panelshow+'controlmask').show()
  }
  gameArea.start()
  previewArea.init()



  board = new Board()

  level = 1
  linesCleared = 0
  penalties = 0

  $('#options-area').hide()
  socket.emit('nextpiece')
  return;


}

var previewArea = {
  canvas:document.getElementById('previewcan'),
  init : function(){
    this.blocksize = 30
    this.dtx = this.canvas.getContext('2d')

  },
  update: function(){
    this.dtx.clearRect(0,0,150,120)
    var x = upcoming;
    var prevarray;
    var prevcolor;
    switch (x) {
      case 0:
      prevarray = [[.5,1.5], [1.5,1.5],[2.5,1.5],[3.5,1.5]]
      prevcolor = "lightblue";


        break;
      case 1:
      prevarray = [[1,2],[2,2],[3,2],[2,1]]
      prevcolor = "orange";
        break;
      case 2:
      prevarray = [[1,1],[2,1],[2,2],[3,2]]
      prevcolor = "lightgreen";
        break;
      case 3:
      prevarray = [[1,2],[2,2],[2,1],[3,1]]
      prevcolor = "yellow";
        break;
      case 4:
      prevarray = [[1,1],[2,1],[3,1],[1,2]]
      prevcolor = "blue";
        break;
      case 5:
      prevarray = [[1,1],[2,1],[3,1],[3,2]]
      prevcolor = "violet";
        break;
      case 6:
      prevarray = [[1.5, 1], [2.5,1],[1.5,2],[2.5,2]]
      prevcolor = "red";
        break;
      default:
      return;


    }
    prevarray.forEach((item) => {

      var topleftX = item[0]*30
      var topleftY = item[1]*30

      this.dtx.fillStyle = prevcolor;
      this.dtx.fillRect(topleftX, topleftY, this.blocksize, this.blocksize)
      this.dtx.strokeRect(topleftX, topleftY, this.blocksize, this.blocksize)

    });



  }
}

var gameArea = {
  canvas : document.getElementById('canvas'),
  start: function(){


    this.ctx = this.canvas.getContext('2d')



    this.interval = setInterval(updateGame, 20)
    this.blocksize = 30
  },
  clear: function(){
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}
function updateGame(){
  gameArea.clear()
  board.drawSolids()
  if (active){active.redraw()}
  return



}
//BOARD
function createBoard(){
  var solids = []
  for (var i=0;i<19;i++){
    solids.push([])
  }
  return solids
}










function overlap(active, board){
  for (var i=0;i<4;i++){
    let blockcheck = active[i]
    let rowtocheck = blockcheck[1]
    let boardrow = board[rowtocheck]
    for (var j=0; j<boardrow.length;j++){
      if (boardrow[j][0] == blockcheck[0]){
        return true;
      }
    }

  }
  return false;
}

//check if a given pos ray would be out of range
function outofrange(arr){
  for (var i = 0; i<arr.length;i++){
    let blockcheck = arr[i];
    if (blockcheck[0]<0 || blockcheck[0] >= 10
        || blockcheck[1] >= 19 || blockcheck[1] <0){
          return true;
        }

  }
  return false;
}

function Board(){
  this.board = createBoard()
  this.drawSolids = function (){
    let blocksize = gameArea.blocksize
    let ctx = gameArea.ctx

    //for the board rows
    for (var i=0;i<19;i++){
      //ignore empty rows
      if (this.board[i].length == 0){
        continue
      }
      //
      for (var j=0;j<this.board[i].length;j++){
        let x_cor = i-1
        let y_cor = this.board[i][j][0]
        let coltofill = this.board[i][j][1]

        ctx.fillStyle = coltofill
        ctx.fillRect(y_cor*blocksize,x_cor*blocksize,blocksize,blocksize)
        ctx.strokeRect(y_cor*blocksize,x_cor*blocksize,blocksize,blocksize)

      }



    }
  }

}

//piece
function piece(arr, color){
  this.block_array = arr
  this.color = color
  this.fallrate = 1000


  //this will help w autodrops I think
  this.canmove = true

  this.redraw = function(){
    var ctx = gameArea.ctx
    var blocksize = gameArea.blocksize

    for (var i=0;i<4;i++){
      ctx.fillStyle = this.color

      ctx.fillRect(this.block_array[i][0]*blocksize,(this.block_array[i][1]-1)*blocksize,blocksize,blocksize);
      ctx.strokeRect(this.block_array[i][0]*blocksize,(this.block_array[i][1]-1)*blocksize,blocksize,blocksize)

    }
  }
  this.left = function(){
    let newpos = this.block_array.map(x => [x[0]-1,x[1]])
    if (outofrange(newpos) || overlap(newpos, board.board)){
      return
    }
    this.block_array = newpos
    return this

  }
  this.right = function(){
    let newpos = this.block_array.map(x => [x[0]+1,x[1]])
    if (outofrange(newpos, board) || overlap(newpos, board.board)){
      return
    }
    this.block_array = newpos
    return this
  }

  this.rotate = function(){
    let newpos = this.block_array.map(x => rotate_block(x, this.block_array[0]))
    if (outofrange(newpos) || overlap(newpos, board.board)){
      return
    }
    this.block_array = newpos
    return this
  }

  this.set = function(){
    for (var i=0; i<4; i++){
      let xtoload = this.block_array[i][0]
      let ytoload = this.block_array[i][1]

      board.board[ytoload].push([xtoload, this.color])

    }
    handleset()
    return
  }

  this.down = function(){

  if (this.canmove == false){

    return;
  }
  let newpos = this.block_array.map(x => [x[0],x[1]+1])
  if (outofrange(newpos) || overlap(newpos, board.board)){

    //if block can't move down, it's ready to be set

    this.canmove = false
    this.set()
    return false
    }
  this.block_array = newpos;
  return true;


  }

  this.autodrop = function(){
    while (this.canmove){
      this.down()
    }

    return;


  }
  this.movedict = function(m){
    switch (m) {
      case 'left':
      this.left()

        break;
      case 'right':
      this.right()
        break;
      case 'rotate':
      this.rotate()
        break;

      case 'auto':
      this.autodrop()


        break;
      default:

    }

  }




}


function rotate_block(block,pivot){
  let b_x = block[0],
      b_y = block[1],
      piv_x = pivot[0],
      piv_y = pivot[1];


  var norm_x = b_x - piv_x;
  var norm_y = b_y - piv_y;

  var turn_x = -norm_y;
  var turn_y = norm_x;

  return [turn_x+piv_x,turn_y+piv_y];

}

function makepiece(x){
var new_piece;
let blocksize = 1


switch (x) {

  case 0: //long boy

  new_piece = new piece([[6*blocksize,0],[5*blocksize,0],[7*blocksize,0],[8*blocksize,0]], 'lightblue')
  return new_piece;

  case 1: //T boy

  new_piece = new piece([[6*blocksize,0],[5*blocksize,0],[7*blocksize,0],[6*blocksize,blocksize]], 'orange')
  return new_piece;

  case 2: //z boy

  new_piece = new piece([[5*blocksize,blocksize],[6*blocksize,blocksize],[5*blocksize,0],[4*blocksize,0]], 'lightgreen')
  return new_piece;

  case 3: //flip z boy

  new_piece = new piece([[5,1],[4*1,1],[5*1,0],[6*1,0]], 'yellow')
  return new_piece;

  case 4: //L boy

  new_piece = new piece([[5*blocksize,0],[4*blocksize,0],[6*blocksize,0],[4*blocksize,blocksize]], 'blue')
  return new_piece;

  case 5: //flip L boy

  new_piece = new piece([[5*blocksize,0],[4*blocksize,0],[6*blocksize,0],[6*blocksize,blocksize]], 'violet')
  return new_piece;

  case 6: // square boy. rotation disabled here for simplicity.

  new_piece = new piece([[5*blocksize,0],[5*blocksize,blocksize],[6*blocksize,0],[6*blocksize,blocksize]], 'red')
  new_piece.rotate = function(){
    return this;
  }
  return new_piece;






}
}

function handleset(){
  $('#setbutton').click()
  for (var i=0;i<19;i++){
    if (board.board[i].length == 10){
      linesCleared++
      board.board.splice(i,1);
      board.board.unshift([]);
    }
  }


  if (board.board[0].length > 0){
    active = null
    socket.emit('endgame')
    return;
  }
  updateState()
  displaystats()
  socket.emit('nextpiece')
}





function updateState(){

  level = Math.floor(linesCleared/5)+1
  gamespeed = Math.max(500, 1000-(level-1)*50)

  return;
}

function displaystats(){
  $('#level').text(level.toString())
  $('#linescleared').text(linesCleared.toString())
  $('#penalties').text(penalties.toString())
}
function hideorshowStartGame(){
  $('#options-area').hide()
  $('#usernamepicker').hide()

  $('.playercontrols').show()
}

function sendmove(e){
  var sentkey = null;
  switch (e.key) {
    case ' ': sentkey = 'auto'; break;


    case 'ArrowLeft': sentkey = 'left'; break;
    case 'ArrowRight': sentkey = 'right'; break;
    case 'ArrowUp': sentkey = 'rotate'; break;
  }

  if (sentkey){

    socket.emit('trymove', {move:sentkey})
  }
  return;

}

$('.tablinks').on('click', function(){
  var gametype = $(this).attr('id')

  socket.emit('changemode', {newmode:gametype})
})





socket.on('takelisteners', (data) => {
document.addEventListener('keydown', sendmove)
upcoming = data.deck
startgame()
setaudio()
})

socket.on('clientchange', (data) => {
  var new_mode = data.new_mode
  $('.tablinks').css('background-color', "#aaf5f8")
  $('.tablinks').css('border-color', "#27b2d8")


  $('#'+new_mode).css('border-color', 'black')
  $('#'+new_mode).css('background-color', '#27e2d8')
  var newmode = new_mode+'content'
  $('.tabcontent').hide()
  $('#'+newmode).show()
  gamemode = data.new_mode

})



socket.on('move', (data) => {
  $('#playbutton').click()

  active.movedict(data.move)
})

socket.on('rightstoshow', (data) => {
  $('.control').css('visibility','hidden')
  var infos = data.info
  infos.forEach((item) => {
    ['left', 'rotate', 'right'].forEach((control) => {
      if (item[1][control]){
        var idtoshow = item[0]+control
        $('#'+idtoshow).css('visibility', 'visible')

      }


    });


  });
  socket.emit('nowthepiece', {gamespeed:gamespeed})


})
socket.on('takepiece', (data) => {
  active = makepiece(upcoming)
  upcoming = data.piece
  previewArea.update()
})
socket.on('illegal', () => {
  penalties++
  active.autodrop()
  $('#penaltybutton').click()
})

socket.on('cleanup', () => {
  midgame = false;
  $('#gameoversign').show()
  endgame()



})

socket.on('dropit', () => {
  if (active){
    active.down()
    return;
  }
})

var pageno = 0
function nextslide(){
  pageno++
  $('.slidepage').hide()
  $('#slide'+pageno.toString()).show()
  $('.changebut').show()
  if (pageno == 3){$('#nextbut').hide()}

}

function prevslide(){
  pageno--
  $('.slidepage').hide()
  $('#slide'+pageno.toString()).show()
  $('.changebut').show()
  if (pageno == 0){$('#prevbut').hide()}

}

function showslide(){
  $('#slideshowholder').show()
}

function exit(){
  pageno = 0
  $('.slidepage').hide()
  $('#slide'+pageno.toString()).show()
  $('.changebut').show()
  if (pageno == 0){$('#prevbut').hide()}
  $('#slideshowholder').hide()


}
$('#rulebutton').on('click', function(){
  showslide()
})

$('#nextbut').on('click', function(){
  nextslide()
})

$('#prevbut').on('click', function(){
  prevslide()
})

$('#backbutton').on('click', function(){
  exit()
})

function setaudio(){


clicksound = new Audio();
clicksound.src='../sounds/piecemove.wav';

$('#playbutton').on('click', () => {
  if (sfx){
    clicksound.currentTime = 0
    clicksound.play()
  }

})


setsound = new Audio();
setsound.src='../sounds/settingpiece.mp3';



$('#setbutton').on('click', () => {
  if (sfx){
    setsound.currentTime = 0
    setsound.play()
  }

})

penaltysound = new Audio();
penaltysound.src='../sounds/baddrop.mp3';



$('#penaltybutton').on('click', () => {
  if (sfx){
    penaltysound.currentTime = 0
    penaltysound.play()
  }

})

}
function soundtoggle(){
  if (sfx){
    $('#sfxbut').html('<i style="font-size:30px" class="fas fa-volume-mute"></i>')
    sfx = false;
    return
  }
  sfx = true;
  $('#sfxbut').html("<i style='font-size:30px' class='fas'>&#xf028;</i>")
  return;
}
$('#sfxbut').on('click', function(){
  soundtoggle()
  $('#sfxbut').blur()
})

var socket = io(location.href)
var midgame = false;
import {playertags} from './testhelp.js'
socket.on('welcome', () => {socket.emit('refresh') })

socket.on('takeusers', (data) => {
  var namelist = playertags(data.namelist)


  $('#nameholder').html(namelist)

})

socket.on('getstartbutton', () => {
  //not the most elegant, but that's fine
  var hostbutton = document.createElement('button')
  hostbutton.innerHTML = 'start the game'
  hostbutton.addEventListener('click', () => {
    if (midgame){
      return;
    }
    midgame = true;
    console.log('preptime')
    socket.emit('gameprep')
  })
  $('#waitmessage').html(hostbutton)
})
document.getElementById('changeusername').addEventListener('click', function(){
  var newname = $('#newusername').val()
  if (newname){
    socket.emit('changename', {name:newname})
  }

})



//TETRIS
var board;
var active;

function startgame(){
  console.log('starting')
  $('.playercontrols').show()
  gameArea.start()
  board = new Board()
  socket.emit('nextpiece')


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
          console.log('imout')
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
        let x_cor = i
        let y_cor = this.board[i][j][0]
        let coltofill = this.board[i][j][1]

        ctx.fillStyle = coltofill
        ctx.fillRect(y_cor*blocksize,x_cor*blocksize,blocksize,blocksize)
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

      ctx.fillRect(this.block_array[i][0]*blocksize,this.block_array[i][1]*blocksize,blocksize,blocksize);
      ctx.strokeRect(this.block_array[i][0]*blocksize,this.block_array[i][1]*blocksize,blocksize,blocksize)

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
    console.log('true')

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

  new_piece = new piece([[5*blocksize,blocksize],[6*blocksize,blocksize],[5*blocksize,0],[4*blocksize,0]], 'green')
  return new_piece;

  case 3: //flip z boy

  new_piece = new piece([[5,1],[4*1,1],[5*1,0],[6*1,0]], 'yellow')
  console.log('makingpiece')
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
  for (var i=0;i<19;i++){
    if (board.board[i].length == 10){
      board.board.splice(i,1);
      board.board.unshift([]);
    }
  }
  socket.emit('nextpiece')
}

// document.addEventListener('keydown', function(e){
//   if (e.key == 'ArrowDown'){
//     active.down()
//   }
//   if (e.key == 'ArrowLeft'){
//     active.left()
//   }
//   if (e.key == 'ArrowUp'){
//     active.rotate()
//   }
//   if (e.key == 'ArrowRight'){
//     active.right()
//   }
//   if (e.key == 'Spacebar' || e.key == " "){
//     active.autodrop()
//   }
// })

// var dropper = setInterval(dropifable,1000)
// function dropifable(){
//   if (active){
//     active.down()
//   }
// }


socket.on('takelisteners', () => {



document.addEventListener('keydown', function(e){
  console.log('i hear')
  var sentkey = null;
  switch (e.key) {
    case 'Enter': sentkey = 'auto';console.log('dropboy'); break;


    case 'ArrowLeft': sentkey = 'left'; break;
    case 'ArrowRight': sentkey = 'right'; break;
    case 'ArrowUp': sentkey = 'rotate'; break;
  }

  if (sentkey){
    console.log(sentkey)
    socket.emit('trymove', {move:sentkey})
  }
  return;

})
startgame()
})
socket.on('gotime', () => {
  socket.emit('nextpiece')
})


socket.on('move', (data) => { active.movedict(data.move) })

socket.on('rightstoshow', (data) => {
  $('.control').css('visibility','hidden')
  var infos = data.info
  infos.forEach((item) => {
    if (socket.id != item[0]){
    ['left', 'rotate', 'right'].forEach((control) => {
      if (item[1][control]){
        var idtoshow = item[0]+control
        $('#'+idtoshow).css('visibility','visible')
      }
    });
  }

  });

  socket.emit('nowthepiece')
})
socket.on('takepiece', (data) => {
  active = makepiece(data.piece)
})
socket.on('illegal', () => {active.autodrop()})

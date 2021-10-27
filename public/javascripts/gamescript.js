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

//TETRIS
var board;
var active;

function startgame(){
  gameArea.start()
  board = new Board()
  socket.emit('gameprep')


}
var gameArea = {
  canvas : document.createElement('canvas'),
  start: function(){
    this.canvas.width = 300;
    this.canvas.height = 540
    this.canvas.style = "background:gray"

    this.ctx = this.canvas.getContext('2d')
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);


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
  socket.emit('sharecan', {can:gameArea.canvas.toDataURL()})


}
//BOARD
function createBoard(){
  var solids = []
  for (var i=0;i<19;i++){
    solids.push([])
  }
  return solids
}

function showSolids(board){
  let blocksize = gameArea.blocksize
  let ctx = gameArea.ctx

  //for the board rows
  for (var i=0;i<19;i++){
    //ignore empty rows
    if (board[i].length == 0){
      continue
    }
    //
    let x_cor = i
    let y_cor = board[i][j][0]
    let colorfill = board[i][j][1]

    ctx.fillStyle = colorfill
    ctx.fillRect(x_cor*blocksize, y_cor*blocksize, blocksize, blocksize)


  }
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
  for (i = 0; i<arr.length;i++){
    let blockcheck = arr[i];
    if (blockcheck[0]<0 || blockcheck[0] >= 10
        || blockcheck[1] >= 19 ){
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
  console.log(this.block_array)
  if (this.canmove == false){
    return;
  }
  let newpos = this.block_array.map(x => [x[0],x[1]+1])
  if (outofrange(newpos) || overlap(newpos, board.board)){
    console.log('true')

    //if block can't move down, it's ready to be set
    this.set()
    this.canmove = false
    return false
    }
  this.block_array = newpos;
  return true;


  }

  this.autodrop = function(board){
    while (this.canmove){
      this.down(board)
    }
    return
  }
  this.movedict = function(m,){
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

function makepiece(){
var new_piece;
let blocksize = 1
let x = Math.floor(7*Math.random())

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
  for (i=0;i<19;i++){
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

var dropper = setInterval(dropifable,1000)
function dropifable(){
  if (active){
    active.down()
  }
}

socket.on('timetostart', () => {
  startgame()
})
socket.on('takelisteners', () => {


document.addEventListener('keydown', function(e){
  var sentkey = null;
  switch (e.key) {
    case ('Spacebar' || " "):
    socket.emit('auto')
    return;

    case 'ArrowLeft': sentkey = 'left'; break;
    case 'ArrowRight': sentkey = 'right'; break;
    case 'ArrowUp': sentkey = 'rotate'; break;
  }
  if (sentkey){
    socket.emit('trymove', {move:sentkey})
  }

})
})
socket.on('gotime', () => {
  socket.emit('nextpiece')
})


socket.on('showthis', (data) => {document.getElementById('gamepic').src = data.newcan})
socket.on('move', (data) => { active.movedict(data.move) })

socket.on('rightstoshow', (data) => {console.log(data.info)})
socket.on('takepiece', () => {
  active = makepiece()
})

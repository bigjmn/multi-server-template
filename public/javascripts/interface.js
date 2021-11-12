
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
$('#rulesbutton').on('click', function(){
  showslide()
})

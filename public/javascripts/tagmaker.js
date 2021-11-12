export function playertags(users){
  var fullstring = ""
  users.forEach((item) => {
    var playstring = `
    <div class='playertag'>
      <div class='playername' id=${item[0]}>${item[0]}</div>
      <div class='controltypes'>
      <div class='playercontrols' id=${item[1]}>
        <div class='control' id=${item[1]}left>⬅️</div>
        <div class='control' id=${item[1]}rotate>🔄</div>
        <div class='control' id=${item[1]}right>➡️</div>
      </div>
      <div class='playercontrolmask' id=${item[1]}controlmask>
        <div class='controlmask'>?</div>
        <div class='controlmask'>?</div>
        <div class='controlmask'>?</div>

      </div>
      </div>

      </div>
      <br>
    `
    fullstring += playstring
  });
  return fullstring

}

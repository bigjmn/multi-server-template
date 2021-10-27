export function playertags(users){
  var fullstring = ""
  users.forEach((item) => {
    var tagstring = "<div class='playertag'><div class='playername' id="+item[1]+">"+item[0]+"</div><div class='playercontrols'><div class=control id="+item[1]+"left>⬅️</div><div class='control' id="+item[1]+"rotate>🔄</div><div class='control' id="+item[1]+"right>➡️</div></div>"
    fullstring += tagstring
  });
  return fullstring

}

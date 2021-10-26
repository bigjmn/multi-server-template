module.exports = function Lobby(name, privacysetting, password, roomid, urlpath, nsp){
  return{
    name:name,
    privacysetting:privacysetting,
    password:password,
    roomid:roomid,
    urlpath:urlpath,
    nsp:nsp,
    get userlist(){


      var sockmap = Array.from(nsp.sockets.values())
      return sockmap
    },




    midgame:false,
  }


}

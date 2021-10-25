module.exports = function Lobby(name, privacysetting, password, urlpath, nsp){
  return{
    name:name,
    privacysetting:privacysetting,
    password:password,
    urlpath:urlpath,
    nsp:nsp,

    userlist:[],
    midgame:false;
  }


}

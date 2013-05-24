var loginPro = require("../socket.io-chat-loginpro").userList;
var websiteKey2 = "证金贵金属";
var websiteKey = websiteKey2 + "_在线管理系统";
exports.index = function(req,res){
	res.render("indexs",{title : websiteKey + "_首页"});
}

exports.login = function(req,res){
	res.render("login",{title : websiteKey + "_登录" , errInfo : ""});
}

exports.loginPost = function(req,res){
	/**var pass = req.params.pass; //this is for method-get*/
	var pass = req.body.pass;
	var pwd = req.body.pwd;
	var userObj = judgeLogin(loginPro , pass , pwd);
	if(userObj.flag){
		req.session.user = userObj.info;
		res.render("onlineList",{title : websiteKey + "_在线用户列表页" , userInfo : userObj.info});
	}else{
		res.render("login",{title : websiteKey + "_登录" , errInfo : "用户名和密码错误，登录失败！"});
	}
}

exports.judgeLogin = judgeLogin;

var judgeLogin = function(arr,pass,pwd){
	var flag = false;
	var tmpUserInfo = {};
	//console.log(JSON.stringify(arr),pass,pwd);
	for(var i=0;i<arr.length;i++){
		var tmp = arr[i];

		if(tmp.pass == pass && tmp.pwd == pwd){
			flag = true;
			tmpUserInfo = tmp;
			break;
		}
	}
	return {flag : flag , info : tmpUserInfo};
}

exports.chat = function(req,res){
	res.render("chat",{title : websiteKey2 + "_聊天室demo"});

}
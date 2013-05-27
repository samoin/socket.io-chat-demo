var loginPro = require("./socket.io-chat-loginpro")
, routesIndex = require('./routes/index');;
//是否允许唯一key多个浏览器窗口登录
var canMoreClientForUqKey = loginPro.canMoreClientForUqKey;
//在不允许唯一key多个浏览器窗口登录的前提下，是否发送脚本踢掉上一个登录用户
var kickMoreClientForUqKey = loginPro.kickMoreClientForUqKey;
//如需要踢人，对应调用的函数名
var kickMoreClientForUqKeyFuncName = loginPro.kickMoreClientForUqKeyFuncName;
//该进程内的所有聊天室的相关信息，map结构
var chatMap = {};
//命令的备注
cmdObj = {"register" : 1 , "leave" : 2 , "talk" : 3 , "func" : 4};
var parseCookie = require('connect').utils.parseCookie
, MemoryStore = require('connect/lib/middleware/session/memory');
//建立一个memory store的实例
var storeMemory = new MemoryStore({
	reapInterval: loginPro.memoryStoreReapInterval
});
var express = require('express'), app, server, io; 
	app = express();
var cluster = require('cluster');
if (cluster.isMaster) {
	var numCPUs = require('os').cpus().length; 
	numCPUs = 1;
	for ( var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
	//server.serverCluster = cluster.workers;
	//  this is for version 0.6.x
	cluster.on('death', function(worker) {
		 console.log("worker " , worker.pid , " died , restarting ...");
		 cluster.fork();
	});
	//  this is for version 0.8.x +
	cluster.on('exit', function(worker, code, signal) {
		console.log("worker " , worker.process.pid , " exit , restarting ...");
		cluster.fork();
	});
} else if(cluster.isWorker){
	createServer();
}

function createServer(){
	server = require('http').createServer(app);
	io = require('socket.io').listen(server); 

	server.listen(loginPro.port);

	if(loginPro.expressLogger){
		app.use(express.logger(loginPro.expressLogger));
	}

	//对socket.io进行一些基本的设置
	if(loginPro.socketioProperty){
		for(var key in loginPro.socketioProperty){
			var value = loginPro.socketioProperty[key];
			io.set(key , value);
		}
	}

	// Configuration，对app进行设置
	app.configure(function(){
	  app.use(express.bodyParser());//解析post
	  app.use(express.cookieParser());//解析cookie
	  //设置session
	  app.use(express.session({
			  secret : loginPro.sessionSecret,
			  store : storeMemory
	  }));

	  app.set('views', __dirname + '/views');
	  app.set('view engine', 'jade');
	  app.use(app.router);
	  app.use(express.static(__dirname + '/public'));
	  app.use(express.static(__dirname + '/config'));
	});

	/**增加对所有链接的过滤*/
	app.all("/*",function(req,res,next){
		next();
	});
	//进入聊天室
	app.get("/chat",routesIndex.chat);
	//默认欢迎页
	app.get("/index",routesIndex.index);
	//登录页
	app.get("/login",routesIndex.login);
	//登录的提交页
	app.post("/login",routesIndex.loginPost);
	//用户在线的查询
	app.get("/onlineUserList",function(req,res){
		var room = req.query.room;
		var pass = req.query.pass;
		res.json(renderChatMapJson(room,pass,false));
	});
	//用户在线的详细信息的查询
	app.get("/onlineUserInfoList",function(req,res){
		var room = req.query.room;
		var pass = req.query.pass;
		res.json(renderChatMapJson(room,pass,true));
	});

	io.sockets.on('connection', function (socket) {
	  // 用户断开后的处理
	  socket.on('disconnect', function (data) {
		var moduleKey = socket["moudle"];
		var uqKey = socket["uqKey"];
		var randomKey = socket["randomKey"];
		//console.log(getNow(),">",moduleKey ,",",uqKey,",",randomKey, ">>>>>>>disconnect" , ",", data);
		if(!data || data.toString() == "close timeout" || data.toString() == "socket end"){
			if(getCountFromMap(chatMap[moduleKey][uqKey]) == 1){
				emitByMoudle(moduleKey , {cmd : cmdObj["leave"] , msg : {uqKey : uqKey}});
			}
			if(chatMap[moduleKey] && chatMap[moduleKey][uqKey]){
				delete(chatMap[moduleKey][uqKey][randomKey]);
				console.log("<>" , getCountFromMap(chatMap[moduleKey][uqKey]));
			}
			if(chatMap[moduleKey] && chatMap[moduleKey][uqKey] && getCountFromMap(chatMap[moduleKey][uqKey]) == 0){
				delete(chatMap[moduleKey][uqKey]);
				//console.log(">>>>>>" , JSON.stringify(chatMap[moduleKey][uqKey]));
			}
		}
	  });
	  socket.on('msgs', function (data) {
		  // 用户在建立连接后的注册操作
		  if(data.cmd == cmdObj["register"]){
			var msg = data.msg;
			var moduleKey = msg.moudle;
			var uqKey = msg.uqKey;
			var randomKey = msg.randomKey;
			//console.log(moduleKey ,",",uqKey,",",randomKey, ">>>>>>>registed" , ",", data);
			socket["ip"] = socket.handshake.address.address; 
			socket["uqKey"] = msg.uqKey;
			socket["moudle"] = moduleKey;
			socket["randomKey"] = randomKey;
			if(!chatMap[moduleKey]){
				chatMap[moduleKey] = {};
			}
			if(!chatMap[moduleKey][uqKey]){
				chatMap[moduleKey][uqKey] = {};
			}
			if( !canMoreClientForUqKey){
				if(kickMoreClientForUqKey && getCountFromMap(chatMap[moduleKey][uqKey]) > 0){
					//console.log(moduleKey ,",",uqKey,",",randomKey, ">>>>>>>" ,getCountFromMap(chatMap[moduleKey][uqKey]));
					// 这里通过函数方式给客户端传递函数调用
					emitByMap(moduleKey,chatMap[moduleKey][uqKey] , {cmd : cmdObj["func"] , msg : {func : kickMoreClientForUqKeyFuncName}});
				}
				chatMap[moduleKey][uqKey] = {};
			}
			
			chatMap[moduleKey][uqKey][randomKey] = socket;		
			if(getCountFromMap(chatMap[moduleKey][uqKey]) == 1){
				emitByMoudle(msg.moudle , data);
			}else{
				emitBySocket(moduleKey,socket,data);
			}
		  }
		  // 用户常用的聊天内容的操作
		  if(data.cmd == cmdObj["talk"]){
			var msg = data.msg;
			var toId = msg.toId;
			var moduleKey = socket["moudle"];
			
			if(toId == ""){
				//console.log(moduleKey, "emit to all");
				emitByMoudle(moduleKey , data);
			}else{
				//console.log(moduleKey, "emit to  <" + toId + ">");
				emitByMoudleAndId(moduleKey , toId , data);
				emitByMoudleAndId(moduleKey , socket["uqKey"] , data);
			}
		  }
		  //TODO 这里将来考虑数据落地，作为聊天记录的原始依据，现在暂时记录日志中
		  console.log(getNow(),">",JSON.stringify(data));
	  });
	});
}

/**
* 根据传入的条件，返回当前用户在线状态的结果集，Map结构
* @params room 所在房间id
* @params pass 用户的唯一passport
* @params isWithInfo 是否返回相关信息，如不存在或false则返回对应的计数
* @return map<key,map<key,array>>
**/
function renderChatMapJson(room,pass,isWithInfo){
	var result = {};
	for(var k1 in chatMap){
		var v1 = chatMap[k1];
		if(room && room != k1){
			if(!pass){
				continue;
			}
		}
		result[k1] = {};
		if(v1){
			var tmpCount = 0 ;
			for(var k2 in v1){
				if(pass){
					if(pass == k2){
						if(!room || (room && room == k1)){
							result[k1][k2] = isWithInfo ? getStaticInfoFromMap(v1[k2]) : getCountFromMap(v1[k2]);
							tmpCount++;
						}
					}
				}else{
					result[k1][k2] = isWithInfo ? getStaticInfoFromMap(v1[k2]) : getCountFromMap(v1[k2]);
					tmpCount++;
				}
			}
			if(tmpCount == 0){
				delete(result[k1]);
			}
		}
	}
	return result;
}

//根据所在模块(房间)给该模块下的所有socket推送消息
function emitByMoudle(moudleKey , data){
	for(var key in chatMap[moudleKey]){
		emitByMoudleAndId(moudleKey , key , data);
	}
}
//根据所在模块(房间)给对应的唯一id推送消息
function emitByMoudleAndId(moudleKey , uqId , data){
	if(chatMap[moudleKey]){
		var socketTmpObj = chatMap[moudleKey][uqId];
		console.log(uqId);
		emitByMap(moudleKey,socketTmpObj,data);
	}else{
		console.log("key > ",moudleKey," does not exist in chatMap,no socket to send...");
	}
}
//根据所在模块(房间)给对应的socket集合推送消息
function emitByMap(moudleKey,socketTmpObj,data){
	for(var key in socketTmpObj){
		var socketTmp = socketTmpObj[key];
		emitBySocket(moudleKey,socketTmp,data)
	}
}
//根据所在模块(房间)给对应的socket推送消息
function emitBySocket(moudleKey,socketTmp,data){
	if(socketTmp){
		try{
			socketTmp.emit("msgs" , data);
		}catch(e){
			console.log("emit error >> " , e);
		}
	}else{
		delete(chatMap[moudleKey][uqId][key]);
	}
}
//从object（map）对象中，返回存在的key的个数
function getCountFromMap(map){
	var count = 0;
	for(var key in map){
		count++;
	}
	return count;
}
//从object（map）对象中，返回存在的key的详细信息汇总
function getStaticInfoFromMap(map){
	var arr = [];;
	for(var key in map){
		var objTmp = map[key];
		var tmp = {};
		tmp["ip"] = objTmp["ip"];
		tmp["uqKey"] = objTmp["uqKey"];
		tmp["moudle"] = objTmp["moudle"];
		tmp["randomKey"] = objTmp["randomKey"];
		arr.push(tmp);
	}
	return arr;
}

// extend Date
Date.prototype.format = function(format) {
	var o = {
		"M+" : this.getMonth() + 1, // month
		"d+" : this.getDate(), // day
		"h+" : this.getHours(), // hour
		"m+" : this.getMinutes(), // minute
		"s+" : this.getSeconds(), // second
		"q+" : Math.floor((this.getMonth() + 3) / 3), // quarter
		"S" : this.getMilliseconds()
	// millisecond
	}

	if (/(y+)/.test(format)) {
		format = format.replace(RegExp.$1, (this.getFullYear() + "")
				.substr(4 - RegExp.$1.length));
	}

	for ( var k in o) {
		if (new RegExp("(" + k + ")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
					: ("00" + o[k]).substr(("" + o[k]).length));
		}
	}
	return format;
}
function getNow() {
	return getNowByFmt("yyyy-MM-dd hh:mm:ss");
}
function getToday() {
	return getNowByFmt("yyyy-MM-dd");
}
function getNowByFmt(fmt) {
	return new Date().format(fmt);
}

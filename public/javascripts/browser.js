var chat = {};
chat.kickUser = function (){
	alert("抱歉，您已在其它地方登录！");
	location.reload();
}
chat.cmdObj = {"register" : 1 , "leave" : 2 , "talk" : 3 , "func" : 4};
chat.login = function (){
	chat.connectServer();
};

chat.connectServer = function(){	
	chat.userName = $("#chatUserName").val();
	chat.moudle = $("#chatName").val();
	chat.socket = io.connect();
	chat.socket.on("connect",function(){
		var random = new Date().getTime() + "-" + parseInt(Math.random() * 10000);
		chat.socket.emit("msgs" , {cmd : chat.cmdObj["register"] , msg : {uqKey : chat.userName , moudle : chat.moudle , randomKey : random}});
	 });
	chat.socket.on('msgs', function (data) {
		var msg = data.msg;
		if(data.cmd == chat.cmdObj["register"]){
			var ele = $("#chat_msg");
			$("#login").hide();
			if(msg.uqKey != chat.userName){
				var msg = "<p><a href='#' onclick='chat.changeTalk(\"" + msg.uqKey + "\");'>" + msg.uqKey + "</a>进入直播室</p>";
				ele.append(msg);
			}
			$("#chat").show();
		}
		if(data.cmd == chat.cmdObj["leave"]){
			var ele = $("#chat_msg");
			$("#login").hide();
			var msg = "<p>" + msg.uqKey +"离开直播室</p>";
			ele.append(msg);
			$("#chat").show();
		}
		if(data.cmd == chat.cmdObj["talk"]){
			var ele = $("#chat_msg");
			$("#login").hide();
			var msg = "<p>" + (msg.from == chat.userName ? "我" : "<a href='#' onclick='chat.changeTalk(\"" + msg.from + "\");'>" + msg.from + "</a>") +" 对 " + (msg.toId == "" ? "<a href='#' onclick='chat.changeTalk(\"\");'>大家</a>" : (msg.toId == chat.userName ? "我" : "<a href='#' onclick='chat.changeTalk(\"" + msg.toId + "\");'>" + msg.toId + "</a>")) + "说:" + msg.info + "</p>";
			ele.append(msg);
			$("#chat").show();
			$("#chat_msg").scrollTop($("#chat_msg").scrollTop() + 100);
		}
		if(data.cmd == chat.cmdObj["func"]){
			var func = msg.func;
			eval(func);
		}
		if(data.cmd == chat.cmdObj["hb"]){
			var ele = $("#chat_msg");
			$("#login").hide();
			var msg = "<p>收到自定义心跳包的回复</p>";
			ele.append(msg);
			$("#chat").show();
			$("#chat_msg").scrollTop($("#chat_msg").scrollTop() + 100);
		}
	});
};
chat.talk = function(){
	var talk_info = $("#talk_info").val();
	var to_id = $("#to_id").val();
	chat.socket.emit("msgs" , {cmd : chat.cmdObj["talk"] , msg : {from : chat.userName ,moudle : chat.moudle ,info : talk_info , toId : to_id}});
	$("#talk_info").val("");
};

chat.changeTalk =  function(uqName){
	$("#to_id").val(uqName);
};



//alert($.browser.msie +":"+ $.browser.version);
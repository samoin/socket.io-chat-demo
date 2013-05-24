function checkLogin(){
	var pass = $("#pass").val();
	var pwd = $("#pwd").val();
	if(pass == ""){
		alert("用户名不能为空");
		return false;
	}
	if(pwd == ""){
		alert("密码不能为空");
		return false;
	}
	return true;
}

function initOnlineUserList(){
	$.get("./onlineUserInfoList",{},function(data){
		var html = "";
		for(var k1 in data){
			var v1 = data[k1];
			if(v1){
				for(var k2 in v1){
					var titleTmp = "";
					for(var k3 = 0 ; k3 < v1[k2].length ; k3++){
						var infoTmp = v1[k2][k3];
						if(k3 > 0){
							titleTmp += "\r\n";
						}
						titleTmp += "{ip:" + infoTmp.ip + ",randonKey: " + infoTmp.randomKey + "}";
					}
					html += "<li><p>频道：" + k1 + "</p><p>用户:" + k2 + "</p><p style='width:69%;'>打开浏览器详细信息：<span title='" + titleTmp + "'>" + v1[k2].length + "个 </span>";
					
					html += "</p></li>";
				}
			}
		}
		$("#onlineListUl").html(html);
	});
}
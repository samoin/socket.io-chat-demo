var arr = [];
arr.push({pass : "admin" , pwd : "admin123456" , type : "admin"});
var socketioProperty = {};
socketioProperty["log level"] = 0;
socketioProperty["transports"] = ["websocket" ,  "htmlfile" , "xhr-polling" , "jsonp-polling"];
socketioProperty["close timeout"] = 25;
socketioProperty["heartbeat timeout"] = 25;
socketioProperty["heartbeat interval"] = 12;
socketioProperty["polling duration"] = 10;

//服务开放的端口号
exports.port=443;
//用来配置后台可登录的用户，这里没有数据落地，如需数据落地，可进行相关代码的修改
exports.userList=arr;
//对express的logger的配置，调用为app.use(express.logger('dev'));
exports.expressLogger="";
//对socket.io的一些设置，目前只做了这一些，如有需求，可继续添加和修改
exports.socketioProperty = socketioProperty;
//memoryStore的ReapInterval
exports.memoryStoreReapInterval = 1000 * 60 * 10;
//session的Secret-key
exports.sessionSecret = 'socket.io-chat';
//是否允许唯一key多个浏览器窗口登录
exports.canMoreClientForUqKey = true;
//在不允许唯一key多个浏览器窗口登录的前提下，是否发送脚本踢掉上一个登录用户
exports.kickMoreClientForUqKey = true;
//如需要踢人，对应调用的函数名
exports.kickMoreClientForUqKeyFuncName = "chat.kickUser()";
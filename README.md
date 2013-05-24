socket.io-chat-demo
===================

基于node.js + socket.io + express + jade做的一个聊天室，现在很多同学总是喊着求这种聊天室，最近闲来就找时间做了这么个东西，里面有很多基础的功能，如需要其它自定制功能，可在目前制定的协议基础上继续开发。


简单的帮助文档
/**@author samoin
*  @since 2013-05-21
*  @desc 简单的运行，可以用demo包里的html和js，将他们复制出来放到外层目录，也可以直接启动服务"node socket.io-chat"。目前的demo提供简单的聊天室的功能，即登录，聊天，重复登录的处理等。管理功能提供了管理人员的登录以及相关查询的接口。socket.io-chat-loginpro.js文件中为目前抽取出来的可配置参数，里面有详细的备注和说明。
*/<hr/>
关于url的文档：
1.访问聊天室
http://ip:port/chat
输入房间和用户名登录即可
2.http://ip:port/onlineUserInfoList?pass=xx&room=xx
根据参数的匹配，pass为用户名，room为房间，可提供相关的查询，该url返回的结果中，含有对应的信息
如下：
{
　 "test2": {
   "ff": [
　     {
　       "ip": "127.0.0.1",
       "uqKey": "ff",
　       "moudle": "test2",
　       "randomKey": "1369301594810-8749"
      },
      {
        "ip": "127.0.0.1",
        "uqKey": "ff",
        "moudle": "test2",
        "randomKey": "1369301594874-261"
　     }
    ]
  }
}
3.http://ip:port/onlineUserList?pass=xx&room=xx
根据参数的匹配，pass为用户名，room为房间，可提供相关的查询，该url返回的结果中，含有对应的个数统计
如下：
{
  "test2": {
    "ff": 2
  }
}
4.http://localhost:443/login
管理后台的登录入口，如需增加用户名和密码，可参见socket.io-chat-loginpro.js文件中的exports.userList

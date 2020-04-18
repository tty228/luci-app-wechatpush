m=Map("serverchan",translate("ServerChan"),
translate("「Server酱」，英文名「ServerChan」，是一款从服务器推送报警信息和日志到微信的工具。<br /><br />如果你在使用中遇到问题，请到这里提交：")
.. [[<a href="https://github.com/tty228/luci-app-serverchan" target="_blank">]]
.. translate("github 项目地址")
.. [[</a>]]
)

m:section(SimpleSection).template  = "serverchan/status"

s = m:section(TypedSection, "serverchan", "基本设置")
s.anonymous = true
s.addremove = false

a=s:option(Flag,"serverchan_enable","启用")
a.default=0
a.rmempty=true

a=s:option(ListValue,"send_tg","推送模式")
a.default=""
a:value("",translate("微信"))
a:value("1",translate("Telegram"))

a=s:option(Value,"sckey","SCKEY", translate("Serverchan Sckey").."<br>调用代码获取<a href='http://sc.ftqq.com' target='_blank'>点击这里</a><br><br>")
a:depends("send_tg","")
a=s:option(Value,"tgtoken","tg推送链接",translate("").."<br>获取机器人<a href='https://t.me/notificationme_bot' target='_blank'>点击这里</a><br><br>")
a:depends("send_tg","1")
a.placeholder="https://tgbot.lbyczf.com/sendMessage/:Token"

device_name=s:option(Value,"device_name","本设备名称")
device_name.rmempty=true
device_name.description = translate("在推送信息标题中会标识本设备名称，用于区分推送信息的来源设备")

sleeptime=s:option(Value,"sleeptime","检测时间间隔")
sleeptime.default = "60"
sleeptime.description = translate("越短的时间时间响应越及时，但会占用更多的系统资源")
debuglevel=s:option(Flag,"debuglevel","开启日志")
device_aliases= s:option(DynamicList, "device_aliases","设备别名")
device_aliases.rmempty = true 
device_aliases.description = translate("<br/> 请输入设备 MAC 和设备别名，用“-”隔开，如：<br/> XX:XX:XX:XX:XX:XX-我的手机")


return m



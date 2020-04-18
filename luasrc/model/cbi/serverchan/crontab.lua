m=Map("serverchan",translate(""))

s = m:section(TypedSection, "serverchan", "")
s.anonymous = true
s.addremove = false

e=s:option(ListValue,"send_mode",translate("定时任务设定"))
e.default=""
e:value("",translate("关闭"))
e:value("1",translate("定时发送"))
e:value("2",translate("间隔发送"))

e=s:option(ListValue,"regular_time",translate("发送时间"))
for t=0,23 do
e:value(t,translate("每天"..t.."点"))
end	
e.default=8	
e.datatype=uinteger
e:depends("send_mode","1")

e=s:option(ListValue,"regular_time_2",translate("发送时间"))
e:value("",translate("关闭"))
for t=0,23 do
e:value(t,translate("每天"..t.."点"))
end	
e.default="关闭"
e.datatype=uinteger
e:depends("send_mode","1")

e=s:option(ListValue,"regular_time_3",translate("发送时间"))
e:value("",translate("关闭"))
for t=0,23 do
e:value(t,translate("每天"..t.."点"))
end	
e.default="关闭"
e.datatype=uinteger
e:depends("send_mode","1")

e=s:option(ListValue,"interval_time",translate("发送间隔"))
for t=1,23 do
e:value(t,translate(t.."小时"))
end
e.default=6
e.datatype=uinteger
e:depends("send_mode","2")
e.description = translate("<br/>从 00:00 开始，每 * 小时发送一次")

title= s:option(Value, "send_title", translate("微信推送标题"))
title:depends("send_mode","1")
title:depends("send_mode","2")
title.placeholder = "OpenWrt By tty228 路由状态："
title.description = translate("<br/>使用特殊符号可能会造成发送失败")

router_status=s:option(Flag,"router_status",translate("系统运行情况"))
router_status:depends("send_mode","1")
router_status:depends("send_mode","2")

router_temp=s:option(Flag,"router_temp",translate("设备温度"))
router_temp:depends("send_mode","1")
router_temp:depends("send_mode","2")
 
router_wan=s:option(Flag,"router_wan",translate("WAN信息"))
router_wan:depends("send_mode","1")
router_wan:depends("send_mode","2")

client_list=s:option(Flag,"client_list",translate("客户端列表"))
client_list:depends("send_mode","1")
client_list:depends("send_mode","2") 

e=s:option(Button,"_add",translate("手动发送"))
e.inputtitle=translate("发送")
e:depends("send_mode","1")
e:depends("send_mode","2")
e.inputstyle = "apply"
function e.write(self, section)

luci.sys.call("cbi.apply")
        luci.sys.call("/usr/bin/serverchan/serverchan send &")
end


return m



local nt = require "luci.sys".net
local net = require "luci.model.network".init()
local sys = require "luci.sys"
local ifaces = sys.net:devices()

m=Map("serverchan",translate(""))

s = m:section(TypedSection, "serverchan", "")
s.anonymous = true
s.addremove = false

sheep=s:option(ListValue,"serverchan_sheep",translate("免打扰时段设置"),translate("在指定整点时间段内，暂停推送消息<br/>免打扰时间中，定时推送也会被阻止。"))
sheep:value("0",translate("关闭"))
sheep:value("1",translate("模式一：脚本挂起"))
sheep:value("2",translate("模式二：静默模式"))
sheep.description = translate("模式一停止一切检测，包括无人值守。")
sheep.rmempty = true 
sheep=s:option(ListValue,"starttime",translate("免打扰开始时间"))
for t=0,23 do
sheep:value(t,translate("每天"..t.."点"))
end
sheep.default=0
sheep.datatype=uinteger
sheep:depends({serverchan_sheep="1"})
sheep:depends({serverchan_sheep="2"})
sheep=s:option(ListValue,"endtime",translate("免打扰结束时间"))
for t=0,23 do
sheep:value(t,translate("每天"..t.."点"))
end
sheep.default=8
sheep.datatype=uinteger
sheep:depends({serverchan_sheep="1"})
sheep:depends({serverchan_sheep="2"})

mac=s:option(ListValue,"macmechanism",translate("MAC过滤"))
mac:value("",translate("disable"))
mac:value("allow",translate("忽略列表内设备"))
mac:value("block",translate("仅通知列表内设备"))
mac:value("interface",translate("仅通知此接口设备"))

allowedmac = s:option(DynamicList, "serverchan_whitelist", translate("忽略列表"))
nt.mac_hints(function(mac, name) allowedmac :value(mac, "%s (%s)" %{ mac, name }) end)
allowedmac.rmempty = true 
allowedmac:depends({macmechanism="allow"})

blockedmac = s:option(DynamicList, "serverchan_blacklist", translate("关注列表"))
nt.mac_hints(function(mac, name) blockedmac:value(mac, "%s (%s)" %{ mac, name }) end)
blockedmac.rmempty = true 
blockedmac:depends({macmechanism="block"})

n = s:option(ListValue, "serverchan_interface", translate("接口名称"))
n:depends({macmechanism="interface"})
for _, iface in ipairs(ifaces) do
	if not (iface == "lo" or iface:match("^ifb.*")) then
		local nets = net:get_interface(iface)
		nets = nets and nets:get_networks() or {}
		for k, v in pairs(nets) do
			nets[k] = nets[k].sid
		end
		nets = table.concat(nets, ",")
		n:value(iface, ((#nets > 0) and "%s (%s)" % {iface, nets} or iface))
	end
end

return m
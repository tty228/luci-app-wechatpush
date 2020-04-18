local net = require "luci.model.network".init()
local sys = require "luci.sys"
local ifaces = sys.net:devices()

m=Map("serverchan",translate(""))

s = m:section(TypedSection, "serverchan", "")
s.anonymous = true
s.addremove = false

a=s:option(ListValue,"serverchan_ipv4",translate("ipv4 变动通知"))
a.default="disable"
a:value("0",translate("关闭"))
a:value("1",translate("通过接口获取"))
a:value("2",translate("通过URL获取"))
a = s:option(ListValue, "ipv4_interface", translate("接口名称"))
a:depends({serverchan_ipv4="1"})
for _, iface in ipairs(ifaces) do
	if not (iface == "lo" or iface:match("^ifb.*")) then
		local nets = net:get_interface(iface)
		nets = nets and nets:get_networks() or {}
		for k, v in pairs(nets) do
			nets[k] = nets[k].sid
		end
		nets = table.concat(nets, ",")
		a:value(iface, ((#nets > 0) and "%s (%s)" % {iface, nets} or iface))
	end
end
a.description = translate("<br/>一般选择 wan 接口，多拨环境请自行选择")
a= s:option(Value, "ipv4_URL", "URL 地址")
a.rmempty = true 
a.default = "members.3322.org/dyndns/getip"
a:depends({serverchan_ipv4="2"})
a.description = translate("<br/>会因服务器稳定性/连接频繁等原因导致获取失败")

a=s:option(ListValue,"serverchan_ipv6",translate("ipv6 变动通知"))
a.default="disable"
a:value("0",translate("关闭"))
a:value("1",translate("通过接口获取"))
a:value("2",translate("通过URL获取"))
a = s:option(ListValue, "ipv6_interface", translate("接口名称"))
a:depends({serverchan_ipv6="1"})
for _, iface in ipairs(ifaces) do
	if not (iface == "lo" or iface:match("^ifb.*")) then
		local nets = net:get_interface(iface)
		nets = nets and nets:get_networks() or {}
		for k, v in pairs(nets) do
			nets[k] = nets[k].sid
		end
		nets = table.concat(nets, ",")
		a:value(iface, ((#nets > 0) and "%s (%s)" % {iface, nets} or iface))
	end
end
a.description = translate("<br/>一般选择 wan 接口，多拨环境请自行选择")
a= s:option(Value, "ipv6_URL", "URL 地址")
a.rmempty = true 
a.default = "v6.ip.zxinc.org/getip"
a:depends({serverchan_ipv6="2"})
a.description = translate("<br/>会因服务器稳定性/连接频繁等原因导致获取失败")

a=s:option(Flag,"serverchan_up",translate("设备上线通知"))
a.default=0
a.rmempty=true
a=s:option(Flag,"serverchan_down",translate("设备下线通知"))
a.default=0
a.rmempty=true
a=s:option(Flag,"cpuload_enable",translate("CPU 负载报警"))
a.default=0
a.rmempty=true
a= s:option(Value, "cpuload", "负载报警阈值")
a.default = "3.0"
a.rmempty = true 
a:depends({cpuload_enable="1"})
a=s:option(Flag,"temperature_enable",translate("CPU 温度报警"))
a.default=0
a.rmempty=true
a= s:option(Value, "temperature",translate("温度报警阈值"))
a.rmempty = true 
a.default = "80"
a.datatype="uinteger"
a:depends({temperature_enable="1"})
a.description = translate("<br/>设备报警只会在连续五分钟超过设定值时才会推送<br/>而且一个小时内不会再提醒第二次")


return m



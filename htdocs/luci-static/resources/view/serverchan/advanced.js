'use strict';
'require view';
'require fs';
'require ui';
'require uci';
'require rpc';
'require form';
'require tools.widgets as widgets';
'require tools.firewall as fwtool';

return view.extend({
	render: function (serverchan) {
		var m, s, o;
		var programPath = '/usr/share/serverchan/serverchan';

		m = new form.Map('serverchan', _(''))
		m.description = ("如果你不了解这些选项的含义，请不要修改这些选项")

		s = m.section(form.TypedSection, "serverchan", "高级设置")
		s.anonymous = true
		s.addremove = false

		o = s.option(form.Value, "up_timeout", ('设备上线检测超时（s）'))
		o.default = "2"
		o.optional = false
		o.datatype = "uinteger"

		o = s.option(form.Value, "down_timeout", ('设备离线检测超时（s）'))
		o.default = "20"
		o.optional = false
		o.datatype = "uinteger"

		o = s.option(form.Value, "timeout_retry_count", ('离线检测次数'))
		o.default = "2"
		o.optional = false
		o.datatype = "uinteger"
		o.description = ("若无二级路由设备，信号强度良好，可以减少以上数值<br/>因夜间 wifi 休眠较为玄学，遇到设备频繁推送断开，烦请自行调整参数<br/>..╮(╯_╰）╭..")

		o = s.option(form.Flag, "passive_option", ("关闭主动探测"))
		o.default = 0
		o.rmempty = true
		o.description = ("关闭客户端在线状态的主动探测，启用此功能后设备上下线将不再提示<br/>适用于对在线设备不敏感，但需要其他功能的用户")

		o = s.option(form.Value, "thread_num", ('最大并发进程数'))
		o.default = "3"
		o.datatype = "uinteger"
		o.description = ("低性能设备请勿更改设置值，或酌情减少参数")

		o = s.option(form.Value, "soc_code", "自定义温度读取命令")
		o.rmempty = true
		o.value("", ("默认"))
		o.value("pve", ("PVE 虚拟机"))
		o.description = ("自定义命令如需使用特殊符号，如引号、$、!等，则需要自行转义<br/>可以使用 eval `echo $(uci get serverchan.serverchan.soc_code)` 命令查看命令输出及错误信息<br/>执行结果需为纯数字（可带小数），用于温度对比<br/>一个无需转义的例子：<br/>cat /sys/class/thermal/thermal_zone0/temp|sort -nr|head -n1|cut -c-2")

		o = s.option(form.Value, "server_host", ("宿主机地址"))
		o.rmempty = true
		o.default = "10.0.0.2"
		o.description = ("")
		o.depends('soc_code', 'pve');

		o = s.option(form.Value, "server_port", ("宿主机 SSH 端口"))
		o.rmempty = true
		o.default = "22"
		o.description = ("SSH 端口默认为 22，如有自定义，请填写自定义 SSH 端口<br/>请确认已经设置好密钥登陆，否则会引起脚本无法运行等错误！<br/>PVE 安装 sensors 命令自行百度<br/>密钥登陆例（自行修改地址与端口号）：<br/>opkg update #更新列表<br/>opkg install openssh-client openssh-keygen #安装openssh客户端<br/>echo -e \"\\n\" | ssh-keygen -t rsa # 生成密钥文件（空密码）<br/>pve_host=`uci get serverchan.serverchan.server_host` || pve_host=\"10.0.0.3\" # 读取配置文件中的 pve 主机地址，如果不存在请自行填写 <br/>pve_port=`uci get serverchan.serverchan.server_port` || pve_host=\"22\"       # 读取配置文件中的 pve 主机 ssh 端口号，，如果不存在请自行填写 <br/>ssh root@${pve_host} -p ${pve_port} \"tee -a ~/.ssh/id_rso.pub\" < ~/.ssh/id_rso.pub # 传送公钥到 PVE<br/>ssh root@${pve_host} -p ${pve_port} \"cat ~/.ssh/id_rso.pub >> ~/.ssh/authorized_keys\" # 写入公钥到 PVE<br/>ssh -i /root/.ssh/id_rsa root@${pve_host} -p ${pve_port} sensors # 使用私钥连接 PVE 测试温度命令<br/>刷机党自行将 /root/.ssh/ 加入备份列表，避免重复操作")
		o.depends('soc_code', 'pve');

		o = s.option(form.Button, '_soc', _('测试温度命令'), _('你可能需要先保存配置再进行发送，待修改'));
		o.inputstyle = 'action';
		o.onclick = function () {
			var _this = this;
			return fs.exec(programPath, ['soc']).then(function (res) {
				if (!res.stdout) {
					throw new Error(_('返回的温度值为空'));
				}
				_this.description = res.stdout.trim();
				return _this.map.reset();
			}).catch(function (err) {
				_this.description = _('失败：') + err.message;
				return _this.map.reset();
			});
		};

		o = s.option(form.Flag, "gateway_info_enable", ("从光猫获取主机名等信息"));
		o.default = 0;
		o.rmempty = true;
		o.description = ("适用于 OpenWrt 作为旁路网关，无法获取设备主机名及完整的局域网设备列表时<br/>仅测试通过 HG5143F/HN8145V 天翼网关，不保证通用性");

		o = s.option(form.Value, "gateway_host_url", ('光猫登录地址 URL'));
		o.rmempty = true;
		o.default = "http://192.168.1.1/cgi-bin/luci";
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Value, "gateway_info_url", ('设备列表 JSON URL'));
		o.rmempty = true;
		o.default = "http://192.168.1.1/cgi-bin/luci/admin/allInfo";
		o.description = ('使用 F12 控制台自行抓取<br/>ip、devName、model 为必须项，JSON 文件信息范例：<br/>{"pc1":{"devName":"RouterOS","model":"","type":"pc","ip":"192.168.1.7"}}');
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Value, "gateway_logout_url", ('光猫注销登录 URL'))
		o.rmempty = true
		o.default = "http://192.168.1.1/cgi-bin/luci/admin/logout"
		o.description = ("非必须项，但可能会影响其他用户登录 Web 管理页面，如 HG5143F")
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Value, "gateway_username_id", ('登录页面帐号输入框 ID'))
		o.rmempty = true
		o.default = "username"
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Value, "gateway_password_id", ('登录页面密码输入框 ID'))
		o.rmempty = true
		o.default = "psd"
		o.description = ("浏览器右键-检查元素")
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Value, "gateway_username", ('光猫登录帐号'))
		o.rmempty = true
		o.default = "useradmin"
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Value, "gateway_password", ('光猫登录密码'))
		o.rmempty = true
		o.description = ("使用普通账号即可，不需要超密")
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Value, 'gateway_sleeptime', _('抓取光猫信息时间间隔'));
		o.rmempty = false;
		o.placeholder = '600';
		o.datatype = 'and(uinteger,min(60))'
		o.description = ("一般不需要频繁抓取，酌情设置")
		o.depends('gateway_info_enable', '1');

		o = s.option(form.Flag, "err_enable", ("无人值守任务"))
		o.default = 0
		o.rmempty = true
		o.description = ("请确认脚本可以正常运行，否则可能造成频繁重启等错误！")

		o = s.option(form.Flag, 'zerotier_helper', _('IP 变化后重启 zerotier'));
		o.description = _('zerotier 的陈年老问题<br/>断网后不能重新打洞，我也不知道修了没有 emmm');
		o.depends('err_enable', '1');

		o = s.option(form.Flag, "err_sheep_enable", ("仅在免打扰时段重拨"))
		o.default = 0
		o.rmempty = true
		o.description = ("避免白天重拨 DDNS 域名等待解析，此功能不影响断网检测<br/>因夜间跑流量问题，该功能可能不稳定")
		o.depends('err_enable', '1');

		o = s.option(form.DynamicList, "err_device_aliases", ("关注列表"))
		o.rmempty = true
		o.description = ("只会在列表中设备都不在线时才会执行<br/>免打扰时段一小时后，关注设备五分钟低流量（约100kb/m）将视为离线")
		//nt.mac_hints(function(mac, name) o :value(mac, "%s (%s)" %{ mac, name }) end)
		o.depends('err_enable', '1');

		o = s.option(form.ListValue, "network_err_event", ("网络断开时"))
		o.default = ""
		o.value("", ("无操作"))
		o.value("1", ("重启路由器"))
		o.value("2", ("重新拨号"))
		o.value("3", ("修改相关设置项，尝试自动修复网络"))
		o.description = ("选项 1 选项 2 不会修改设置，并最多尝试 2 次。<br/>选项 3 会将设置项备份于 /usr/share/serverchan/configbak 目录，并在失败后还原。<br/>【！！无法保证兼容性！！】不熟悉系统设置项，不会救砖请勿使用")
		o.depends('err_enable', '1');

		o = s.option(form.ListValue, "system_time_event", ("定时重启"))
		o.default = ""
		o.value("", ("无操作"))
		o.value("1", ("重启路由器"))
		o.value("2", ("重新拨号"))
		o.depends('err_enable', '1');

		o = s.option(form.Value, "autoreboot_time", "系统运行时间大于")
		o.rmempty = true
		o.default = "24"
		o.datatype = "uinteger"
		o.description = ("单位为小时")
		o.depends('system_time_event', '1');

		o = s.option(form.Value, "network_restart_time", "网络在线时间大于")
		o.rmempty = true
		o.default = "24"
		o.datatype = "uinteger"
		o.description = ("单位为小时")
		o.depends('system_time_event', '2');

		o = s.option(form.Flag, "public_ip_event", ("重拨尝试获取公网 IP"))
		o.default = 0
		o.rmempty = true
		o.description = ("重拨时不会推送 IP 变动通知，并会导致你的域名无法及时更新 IP 地址<br/>请确认你可以通过重拨获取公网 IP，否则这不仅徒劳无功还会引起频繁断网<br/>移动等大内网你就别挣扎了！！")
		o.depends('err_enable', '1');

		o = s.option(form.Value, "public_ip_retry_count", "当天最大重试次数")
		o.rmempty = true
		o.default = "10"
		o.datatype = "uinteger"
		o.depends('public_ip_event', '1');

		return m.render();
	}
});

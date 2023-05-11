'use strict';
'require view';
'require fs';
'require ui';
'require uci';
'require rpc';
'require form';

'require poll';
'require tools.widgets as widgets';
'require tools.firewall as fwtool';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('serverchan'), {}).then(function (res) {
		console.log(res);
		var isRunning = false;
		try {
			isRunning = res['serverchan']['instances']['instance1']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning) {
	var spanTemp = '<em><span style="color:%s"><strong>%s %s</strong></span></em>';
	var renderHTML;
	if (isRunning) {
		renderHTML = String.format(spanTemp, 'green', _('ServerChan'), _('RUNNING'));
	} else {
		renderHTML = String.format(spanTemp, 'red', _('ServerChan'), _('NOT RUNNING'));
	}

	return renderHTML;
}
return view.extend({
	callHostHints: rpc.declare({
		object: 'luci-rpc',
		method: 'getHostHints',
		expect: { '': {} }
	}),

	load: function () {
		return Promise.all([
			this.callHostHints()
		]);
	},

	render: function (data) {
		if (fwtool.checkLegacySNAT())
			return fwtool.renderMigration();
		else
			return this.renderForwards(data);
	},

	renderForwards: function (data) {
		var hosts = data[0],
			m, s, o,
			programPath = '/usr/share/serverchan/serverchan';

		m = new form.Map('serverchan', _('ServerChan'), _('「Server酱」，英文名「ServerChan」，是一款从服务器推送报警信息和日志到微信的工具。<br /><br />如果你在使用中遇到问题，请到这里提交：') + '<a href="https://github.com/tty228/luci-app-serverchan" target="_blank">' + _('GitHub 项目地址') + '</a>');

		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function () {
			var statusView = E('p', { id: 'service_status' }, _('Collecting data ...'));
			poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function (res) {
					statusView.innerHTML = renderStatus(res);
				});
			});

			setTimeout(function () {
				poll.start();
			}, 100);

			return E('div', { class: 'cbi-section', id: 'status_bar' }, [
				statusView
			]);
		}

		s = m.section(form.NamedSection, 'serverchan', 'serverchan', _(''));
		s.tab('basic', _('基本设置'));
		s.tab('content', _('推送内容'));
		s.tab('ipset', _('自动封禁'));
		s.tab('crontab', _('定时推送'));
		s.tab('disturb', _('免打扰'));
		s.addremove = false;
		s.anonymous = true;

		// 基本设置
		o = s.taboption('basic', form.Flag, 'serverchan_enable', _('启用'));

		o = s.taboption('basic', form.MultiValue, 'lite_enable', _('精简模式'));
		o.value('device', _('精简当前设备列表'));
		o.value('nowtime', _('精简当前时间'));
		o.value('content', _('只推送标题'));
		o.modalonly = true;

		o = s.taboption('basic', form.ListValue, 'jsonpath', _('推送模式'));
		o.default = '/usr/share/serverchan/api/serverchan.json';
		o.value('/usr/share/serverchan/api/serverchan.json', _('微信 Server酱'));
		o.value('/usr/share/serverchan/api/qywx_mpnews.json', _('企业微信 图文消息'));
		o.value('/usr/share/serverchan/api/qywx_markdown.json', _('企业微信 markdown版（不支持公众号）'));
		o.value('/usr/share/serverchan/api/wxpusher.json', _('wxpusher'));
		o.value('/usr/share/serverchan/api/pushplus.json', _('pushplus'));
		o.value('/usr/share/serverchan/api/telegram.json', _('Telegram'));
		o.value('/usr/share/serverchan/api/diy.json', _('自定义推送'));

		o = s.taboption('basic', form.Value, 'sckey', _('微信推送/新旧共用'));
		o.description = _('Server酱 sendkey') + ' <a href="https://sct.ftqq.com/" target="_blank">' + _('点击这里') + '</a>';
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/serverchan.json');

		o = s.taboption('basic', form.Value, 'corpid', _('企业ID(corpid)'));
		o.description = _('获取说明') + ' <a href="https://work.weixin.qq.com/api/doc/10013" target="_blank">' + _('点击这里') + '</a>';
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_mpnews.json');
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_markdown.json');

		o = s.taboption('basic', form.Value, 'userid', _('帐号(userid)'));
		o.rmempty = false;
		o.description = _('群发到应用请填入 @all ');
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_mpnews.json');
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_markdown.json');

		o = s.taboption('basic', form.Value, 'agentid', _('应用id(agentid)'));
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_mpnews.json');
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_markdown.json');

		o = s.taboption('basic', form.Value, 'corpsecret', _('应用密钥(Secret)'));
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_mpnews.json');
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_markdown.json');

		o = s.taboption('basic', form.Value, 'mediapath', _('图片缩略图文件路径'))
		o.rmempty = false;
		o.default = '/usr/share/serverchan/api/logo.jpg';
		o.depends('jsonpath', '/usr/share/serverchan/api/qywx_mpnews.json');
		o.description = _('只支持 2MB 以内 JPG,PNG 格式 <br> 900*383 或 2.35:1 为佳 ');

		o = s.taboption('basic', form.Value, 'wxpusher_apptoken', _('appToken'));
		o.description = _('获取 appToken') + ' <a href="https://wxpusher.zjiecode.com/docs/#/?id=%e5%bf%ab%e9%80%9f%e6%8e%a5%e5%85%a5" target="_blank">' + _('点击这里') + '</a>';
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/wxpusher.json');

		o = s.taboption('basic', form.Value, 'wxpusher_uids', _('uids'));
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/wxpusher.json');

		o = s.taboption('basic', form.Value, 'wxpusher_topicIds', _('topicIds(群发)'));
		o.description = _('接口说明') + ' <a href="https://wxpusher.zjiecode.com/docs/#/?id=%e5%8f%91%e9%80%81%e6%b6%88%e6%81%af-1" target="_blank">' + _('点击这里') + '</a>';
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/wxpusher.json');

		o = s.taboption('basic', form.Value, 'pushplus_token', _('pushplus_token'));
		o.description = _('获取 pushplus_token') + ' <a href="http://www.pushplus.plus/" target="_blank">' + _('点击这里') + '</a>';
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/pushplus.json');

		o = s.taboption('basic', form.Value, 'tg_token', _('TG_token'));
		o.description = _('获取机器人') + ' <a href="https://t.me/BotFather" target="_blank">' + _('点击这里') + '</a>' + ('<br />与创建的机器人发一条消息，开启对话');
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/telegram.json');

		o = s.taboption('basic', form.Value, 'chat_id', _('TG_chatid'));
		o.description = _('获取 chat_id') + ' <a href="https://t.me/getuserIDbot" target="_blank">' + _('点击这里') + '</a>';
		o.rmempty = false;
		o.depends('jsonpath', '/usr/share/serverchan/api/telegram.json');

		o = s.taboption('basic', form.TextValue, 'diy_json', _('自定义推送'));
		o.rows = 28;
		o.wrap = 'oft';
		o.cfgvalue = function (section_id) {
			return fs.trimmed('/usr/share/serverchan/api/diy.json');
		};
		o.write = function (section_id, formvalue) {
			return this.cfgvalue(section_id).then(function (value) {
				if (value == formvalue) {
					return
				}
				return fs.write('/usr/share/serverchan/api/diy.json', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
			});
		};
		o.depends('jsonpath', '/usr/share/serverchan/api/diy.json');

		o = s.taboption('basic', form.Button, '_test', _('发送测试'), _('你可能需要先保存配置再进行发送'));
		o.inputstyle = 'add';
		o.onclick = function () {
			var _this = this;
			return fs.exec(programPath, ['test']).then(function (res) {
				if (res.code === 0)
					_this.description = _('发送成功，如果收不到信息，请查看日志手动处理。');
				else if (res.code === 1)
					_this.description = _('发送失败。');

				return _this.map.reset();
			}).catch(function (err) {
				ui.addNotification(null, E('p', [_('未知错误：%s。').format(err)]));
				_this.description = _('发送失败。');
				return _this.map.reset();
			});
		}

		o = s.taboption('basic', form.Value, 'device_name', _('本设备名称'));
		o.description = _('在推送信息标题中会标识本设备名称，用于区分推送信息的来源设备');

		o = s.taboption('basic', form.Value, 'sleeptime', _('检测时间间隔（s）'));
		o.rmempty = false;
		o.placeholder = '60';
		o.datatype = 'and(uinteger,min(10))';
		o.description = _('越短的时间响应越及时，但会占用更多的系统资源');

		o = s.taboption('basic', form.ListValue, 'oui_data', _('MAC设备信息数据库'));
		o.default = '';
		o.value('', _('关闭'));
		o.value('1', _('简化版'));
		o.value('2', _('完整版'));
		o.value('3', _('网络查询'));
		o.description = _('需下载 4.36 MB 原始数据，处理后完整版约 1.2 MB，简化版约 250 kB <br/>若无梯子，请勿使用网络查询');

		o = s.taboption('basic', form.Flag, 'oui_dir', _('下载到内存'));
		o.depends('oui_data', '1');
		o.depends('oui_data', '2');
		o.description = _('懒得做自动更新了，下载到内存中，重启会重新下载 <br/>若无梯子，还是下到机身吧');

		o = s.taboption('basic', form.Flag, 'reset_regularly', _('每天零点重置流量数据'));

		o = s.taboption('basic', form.Flag, 'debuglevel', _('开启日志'));

		o = s.taboption('basic', form.DynamicList, 'device_aliases', _('设备别名'));
		o.description = _('<br/> 请输入设备 MAC 和设备别名，用“-”隔开，如：<br/> XX:XX:XX:XX:XX:XX-我的手机');

		// 推送内容
		o = s.taboption('content', form.ListValue, 'serverchan_ipv4', _('IPv4 变动通知'));
		o.default = '';
		o.value('', _('关闭'));
		o.value('1', _('通过接口获取'));
		o.value('2', _('通过URL获取'));

		o = s.taboption('content', widgets.NetworkSelect, 'ipv4_interface', _("接口名称"));
		o.description = _('一般选择 wan 接口，多拨环境请自行选择');
		o.modalonly = true;
		o.multiple = false;
		o.default = 'wan';
		o.depends('serverchan_ipv4', '1');

		o = s.taboption('content', form.TextValue, 'ipv4_list', _('IPv4 API列表'));
		o.description = _('<br/>会因服务器稳定性、连接频繁等原因导致获取失败<br/>如接口可以正常获取 IP，不推荐使用<br/>从以上列表中随机地址访问');
		o.depends('serverchan_ipv4', '2');
		o.optional = false;
		o.rows = 8;
		o.wrap = 'oft';
		o.cfgvalue = function (section_id) {
			return fs.trimmed('/usr/share/serverchan/api/ipv4.list');
		};
		o.write = function (section_id, formvalue) {
			return this.cfgvalue(section_id).then(function (value) {
				if (value == formvalue) {
					return
				}
				return fs.write('/usr/share/serverchan/api/ipv4.list', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
			});
		};

		o = s.taboption('content', form.ListValue, 'serverchan_ipv6', _('IPv6 变动通知'));
		o.default = 'disable';
		o.value('0', _('关闭'));
		o.value('1', _('通过接口获取'));
		o.value('2', _('通过URL获取'));

		o = s.taboption('content', widgets.NetworkSelect, 'ipv6_interface', _("接口名称"));
		o.description = _('一般选择 wan 接口，多拨环境请自行选择');
		o.modalonly = true;
		o.multiple = false;
		o.default = 'wan';
		o.depends('serverchan_ipv6', '1');

		o = s.taboption('content', form.TextValue, 'ipv6_list', _('IPv6 API列表'));
		o.description = _('<br/>会因服务器稳定性、连接频繁等原因导致获取失败<br/>如接口可以正常获取 IP，不推荐使用<br/>从以上列表中随机地址访问');
		o.depends('serverchan_ipv6', '2')
		o.rows = 8;
		o.wrap = 'oft';
		o.cfgvalue = function (section_id) {
			return fs.trimmed('/usr/share/serverchan/api/ipv6.list');
		};
		o.write = function (section_id, formvalue) {
			return this.cfgvalue(section_id).then(function (value) {
				if (value == formvalue) {
					return
				}
				return fs.write('/usr/share/serverchan/api/ipv6.list', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
			});
		};

		o = s.taboption('content', form.Flag, 'serverchan_up', _('设备上线通知'));
		o.default = '1';

		o = s.taboption('content', form.Flag, 'serverchan_down', _('设备下线通知'));
		o.default = '1';

		o = s.taboption('content', form.Flag, 'cpuload_enable', _('CPU 负载报警'));
		o.default = '1';

		o = s.taboption('content', form.Value, 'cpuload', '负载报警阈值');
		o.rmempty = false;
		o.placeholder = '2';
		o.depends('cpuload_enable', '1');
		o.validate = function (section_id, value) {
			var floatValue = parseFloat(value);
			if (!isNaN(floatValue) && floatValue.toString() === value) {
				return true;
			}
			return '请输入纯数字';
		};

		o = s.taboption('content', form.Flag, 'temperature_enable', _('CPU 温度报警'));
		o.default = '1';
		o.description = _('请确认设备可以获取温度，如需修改命令，请移步高级设置');

		o = s.taboption('content', form.Value, 'temperature', '温度报警阈值');
		o.rmempty = false;
		o.placeholder = '80';
		o.datatype = 'and(uinteger,min(1))';
		o.depends('temperature_enable', '1');
		o.description = _('<br/>设备报警只会在连续五分钟超过设定值时才会推送<br/>而且一个小时内不会再提醒第二次');

		o = s.taboption('content', form.Flag, 'client_usage', _('设备异常流量'));
		o.default = '0';

		o = s.taboption('content', form.Value, 'client_usage_max', '每分钟流量限制');
		o.placeholder = '10M';
		o.rmempty = false;
		o.depends('client_usage', '1');
		o.description = _('设备异常流量警报（byte），你可以追加 K 或者 M');

		o = s.taboption('content', form.Flag, 'client_usage_disturb', _('异常流量免打扰'));
		o.default = '0';
		o.depends('client_usage', '1');

		o = fwtool.addMACOption(s, 'content', 'client_usage_whitelist', _('异常流量关注列表'),
			_('请输入设备 MAC'), hosts);
		o.rmempty = true;
		o.datatype = 'list(neg(macaddr))';
		o.depends('client_usage_disturb', '1');

		o = s.taboption('content', form.Flag, 'web_logged', _('web 登录提醒'));
		o.default = '0';

		o = s.taboption('content', form.Flag, 'ssh_logged', _('ssh 登录提醒'));
		o.default = '0';

		o = s.taboption('content', form.Flag, 'web_login_failed', _('web 错误尝试提醒'));
		o.default = '0';

		o = s.taboption('content', form.Flag, 'ssh_login_failed', _('ssh 错误尝试提醒'));
		o.default = '0';

		o = s.taboption('content', form.Value, 'login_max_num', '错误尝试次数');
		o.default = '3';
		o.rmempty = false;
		o.datatype = 'and(uinteger,min(1))';
		o.depends('web_login_failed', '1');
		o.depends('ssh_login_failed', '1');
		o.description = _('超过次数后推送提醒，并可选自动拉黑');

		// 自动封禁
		o = s.taboption('ipset', form.Flag, 'web_login_black', _('自动拉黑非法登录设备'));
		o.default = '0';
		o.depends('web_login_failed', '1');
		o.depends('ssh_login_failed', '1');

		o = s.taboption('ipset', form.Value, 'ip_black_timeout', '拉黑时间(秒)');
		o.default = '86400';
		o.rmempty = false;
		o.datatype = 'and(uinteger,min(0))';
		o.depends('web_login_black', '1');
		o.description = _('0 为永久拉黑，慎用<br>如不幸误操作，请更改设备 IP 进入 LUCI 界面清空规则');

		o = fwtool.addIPOption(s, 'ipset', 'ip_white_list', _('白名单 IP 列表'), null, 'ipv4', hosts, true);
		o.datatype = 'ipaddr';
		o.depends('web_logged', '1');
		o.depends('ssh_logged', '1');
		o.depends('web_login_failed', '1');
		o.depends('ssh_login_failed', '1');
		o.description = _('忽略推送，仅在日志中记录，并忽略拉黑操作，暂不支持掩码位表示');

		o = s.taboption('ipset', form.Flag, 'port_knocking', _('端口敲门'));
		o.default = '0';
		o.description = _('登录成功后开放端口');
		o.description = _('如在 防火墙 - 区域设置 中禁用了 LAN 口入站和转发，将不起作用<br/>写起来太鸡儿麻烦了，告辞');
		o.depends('web_login_failed', '1');
		o.depends('ssh_login_failed', '1');

		o = s.taboption('ipset', form.Value, 'ip_port_white', '端口');
		o.default = '';
		o.description = _('例：\'22\'、\'21:25\'、\'21:25,135:139\'');
		o.depends('port_knocking', '1');

		o = s.taboption('ipset', form.DynamicList, 'port_forward_list', '端口转发');
		o.default = '';
		o.description = _('例：将本机(10.0.0.1)的 13389 端口转发到 10.0.0.2 的3389：<br/>\'10.0.0.1,13389,10.0.0.2,3389\'<br/>IPv6 未测试');
		o.depends('port_knocking', '1');

		o = s.taboption('ipset', form.Value, 'ip_white_timeout', '放行时间(秒)');
		o.default = '600';
		o.datatype = 'and(uinteger,min(0))';
		o.description = _('0 为永久放行，慎用<br/>连接成功后不断开就不需要重新连接，故不需要设置太大<br/>注：响应时间与检测间隔和每一次检测所需的时间相关，故反应不是很快，将就用吧');
		o.depends('port_knocking', '1');

		o = s.taboption('ipset', form.TextValue, 'ip_black_list', _('IP 黑名单列表'));
		o.optional = false;
		o.rows = 8;
		o.wrap = 'soft';
		o.cfgvalue = function (section_id) {
			return fs.trimmed('/usr/share/serverchan/api/ip_blacklist');
		};
		o.write = function (section_id, formvalue) {
			return this.cfgvalue(section_id).then(function (value) {
				if (value == formvalue) {
					return
				}
				return fs.write('/usr/share/serverchan/api/ip_blacklist', formvalue.trim().replace(/\r\n/g, '\n') + '\n');
			});
		};
		o.depends('web_login_black', '1');
		o.description = _('可在此处添加或删除，timeout 后的数字为剩余时间(秒)，添加时只需要输入 IP');

		// 定时推送
		o = s.taboption('crontab', form.ListValue, 'crontab', _('定时任务设定'));
		o.default = '';
		o.value('', _('关闭'));
		o.value('1', _('定时发送'));
		o.value('2', _('间隔发送'));
		o = s.taboption("crontab", form.ListValue, "regular_time", _("发送时间"));

		o.value('', _('关闭'));
		for (var t = 0; t <= 23; t++) {
			o.value(t, _("每天") + t + _("点"));
		}
		o.default = 8;
		o.datatype = "uinteger";
		o.depends("crontab", "1");

		o = s.taboption('crontab', form.ListValue, 'regular_time_2', _('发送时间'));
		o.value('', _('关闭'));
		for (var t = 0; t <= 23; t++) {
			o.value(t, _("每天") + t + _("点"));
		}
		o.default = '';
		o.datatype = "uinteger";
		o.depends('crontab', '1');

		o = s.taboption('crontab', form.ListValue, 'regular_time_3', _('发送时间'));
		o.value('', _('关闭'));
		for (var t = 0; t <= 23; t++) {
			o.value(t, _("每天") + t + _("点"));
		}
		o.default = '';
		o.datatype = "uinteger";
		o.depends('crontab', '1');

		o = s.taboption('crontab', form.ListValue, 'interval_time', _('发送间隔'));
		o.default = "6"
		for (var t = 0; t <= 23; t++) {
			o.value(t, _("每天") + t + _("点"));
		}
		o.default = '';
		o.datatype = "uinteger";
		o.depends('crontab', '2');
		o.description = _('<br/>从 00:00 开始，每 * 小时发送一次');

		o = s.taboption('crontab', form.Value, 'send_title', _('微信推送标题'));
		o.depends('crontab', '1');
		o.depends('crontab', '2');
		o.placeholder = 'OpenWrt 路由状态：';
		o.description = _('<br/>使用特殊符号可能会造成发送失败');

		o = s.taboption('crontab', form.Flag, 'router_status', _('系统运行情况'));
		o.default = '0';
		o.depends('crontab', '1');
		o.depends('crontab', '2');

		o = s.taboption('crontab', form.Flag, 'router_temp', _('设备温度'));
		o.default = '0';
		o.depends('crontab', '1');
		o.depends('crontab', '2');

		o = s.taboption('crontab', form.Flag, 'router_wan', _('WAN信息'));
		o.default = '0';
		o.depends('crontab', '1');
		o.depends('crontab', '2');

		o = s.taboption('crontab', form.Flag, 'client_list', _('客户端列表'));
		o.default = '0';
		o.depends('crontab', '1');
		o.depends('crontab', '2');

		o = s.taboption('crontab', form.Button, '_send', _('手动发送'), _('你可能需要先保存配置再进行发送'));
		o.inputstyle = 'add';
		o.onclick = function () {
			var _this = this;
			return fs.exec(programPath, ['send']).then(function (res) {
				if (res.code === 0)
					_this.description = _('发送成功，如果收不到信息，请查看日志手动处理。');
				else if (res.code === 1)
					_this.description = _('发送失败。');

				return _this.map.reset();
			}).catch(function (err) {
				ui.addNotification(null, E('p', [_('未知错误：%s。').format(err)]));
				_this.description = _('发送失败。');
				return _this.map.reset();
			});
		}

		// 免打扰
		o = s.taboption('disturb', form.ListValue, 'serverchan_sheep', _('免打扰时段设置'), _('在指定整点时间段内，暂停推送消息<br/>免打扰时间中，定时推送也会被阻止。'));
		o.value('', _('关闭'));
		o.value('1', _('模式一：脚本挂起'));
		o.value('2', _('模式二：静默模式'));
		o.description = _('模式一停止一切检测，包括无人值守。');

		o = s.taboption('disturb', form.ListValue, 'starttime', _('免打扰开始时间'));
		for (var t = 0; t <= 23; t++) {
			o.value(t, _("每天") + t + _("点"));
		}
		o.default = '0';
		o.datatype = "uinteger"
		o.depends('serverchan_sheep', '1');
		o.depends('serverchan_sheep', '2');

		o = s.taboption('disturb', form.ListValue, 'endtime', _('免打扰结束时间'));
		for (var t = 0; t <= 23; t++) {
			o.value(t, _("每天") + t + _("点"));
		}
		o.default = 8
		o.datatype = "uinteger"
		o.depends('serverchan_sheep', '1');
		o.depends('serverchan_sheep', '2');

		o = s.taboption('disturb', form.ListValue, 'macmechanism', _('MAC过滤'));
		o.value('', _('disable'));
		o.value('allow', _('忽略列表内设备'));
		o.value('block', _('仅通知列表内设备'));
		o.value('interface', _('仅通知此接口设备'));

		o = fwtool.addMACOption(s, 'disturb', 'serverchan_whitelist', _('忽略列表'),
			_('请输入设备 MAC'), hosts);
		o.datatype = 'list(neg(macaddr))';
		o.depends('macmechanism', 'allow');
		o.description = _('Ao:Ao:Ao:Ao:Ao:AA\\|BB:BB:BB:BB:BB:B 可以将多个 MAC 视为同一用户<br/>任一设备在线后不再推送，设备全部离线时才会推送，避免双 wifi 频繁推送');

		o = fwtool.addMACOption(s, 'disturb', 'serverchan_blacklist', _('关注列表'),
			_('请输入设备 MAC'), hosts);
		o.datatype = 'list(neg(macaddr))';
		o.depends('macmechanism', 'block');
		o.description = _('Ao:Ao:Ao:Ao:Ao:AA\\|BB:BB:BB:BB:BB:B 可以将多个 MAC 视为同一用户<br/>任一设备在线后不再推送，设备全部离线时才会推送，避免双 wifi 频繁推送');

		o = s.taboption('disturb', widgets.NetworkSelect, 'serverchan_interface', _("接口名称"));
		o.description = _('仅通知此接口设备');
		o.modalonly = true;
		o.multiple = false;
		o.depends('macmechanism', 'interface');

		o = s.taboption('disturb', form.ListValue, 'macmechanism2', _('MAC过滤2'));
		o.value('', _('关闭'));
		o.value('MAC_online', _('列表内任意设备在线时免打扰'));
		o.value('MAC_offline', _('列表内设备都离线后免打扰'));

		o = fwtool.addMACOption(s, 'disturb', 'MAC_online_list', _('在线免打扰列表'),
			_('请输入设备 MAC'), hosts);
		o.datatype = 'list(neg(macaddr))';
		o.depends('macmechanism2', 'MAC_online');

		o = fwtool.addMACOption(s, 'disturb', 'MAC_offline_list', _('任意离线免打扰列表'),
			_('请输入设备 MAC'), hosts);
		o.datatype = 'list(neg(macaddr))';
		o.depends('macmechanism2', 'MAC_offline');

		return m.render();
	}
});

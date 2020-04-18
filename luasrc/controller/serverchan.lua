module("luci.controller.serverchan",package.seeall)

function index()

	if not nixio.fs.access("/etc/config/serverchan")then
		return
	end

	entry({"admin", "services", "serverchan"}, alias("admin", "services", "serverchan", "basic"),_("微信推送"), 10).dependent = true
	entry({"admin","services","serverchan","status"},call("act_status")).leaf=true
	entry({"admin", "services", "serverchan", "basic"}, cbi("serverchan/basic"),_("基本设置"), 10).leaf = true

	entry({"admin", "services", "serverchan", "content"}, cbi("serverchan/content"),
          _("推送内容"), 20).dependent = true

	entry({"admin", "services", "serverchan", "crontab"}, cbi("serverchan/crontab"),
          _("定时任务"), 30).dependent = true

	entry({"admin", "services", "serverchan", "disturb"}, cbi("serverchan/disturb"),
          _("免打扰"), 40).dependent = true

	entry({"admin", "services", "serverchan", "advanced"}, cbi("serverchan/advanced"),
          _("高级设置"), 50).dependent = true

	entry({"admin", "services", "serverchan", "log"}, form("serverchan/log"),
          _("运行日志"), 99).leaf = true

	entry({"admin", "services", "serverchan", "get_log"}, call("get_log")).leaf = true
    entry({"admin", "services", "serverchan", "clear_log"}, call("clear_log")).leaf = true
end

function act_status()
	local e={}
	 e.running=luci.sys.call("pgrep -f serverchan/serverchan >/dev/null")==0
	 luci.http.prepare_content("application/json")
	luci.http.write_json(e)
end

function get_log()
    luci.http.write(luci.sys.exec(
		"[ -f '/tmp/serverchan/serverchan.log' ] && cat /tmp/serverchan/serverchan.log"))
end

function clear_log()
	luci.sys.call("echo '' > /tmp/serverchan/serverchan.log")
end
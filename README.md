# 说明
- 用于 OpenWRT/LEDE 路由器上进行 Server酱 微信推送的插件
- 基于 serverchan 提供的接口发送信息，Server酱说明：http://sc.ftqq.com/1.version
- 已经自带 luci

#### 主要功能
- 路由 ip 变动推送
- 设备别名
- 设备上下线推送
- CPU 负载、温度监视
- 定时推送设备运行状态
- MAC 白名单、黑名单、仅检测某接口设备
- 免打扰时间

#### 已知BUG

- 多拨环境下无法获取 wan ip，详情查看https://github.com/tty228/luci-app-serverchan/issues/8
- 可能因为编译环境不同或者别的原因，makefile 提升权限失败，造成无法启动，对makefile没研究过，不太了解
如遇到此问题请查阅 @zxlhhyccc 的解决方案
https://github.com/tty228/luci-app-serverchan/issues/1
- 设备温度文件基于斐讯K3，其他设备如遇到设备温度无法正常读取，请自行修改
“cut -c1-2 /sys/class/thermal/thermal_zone0/temp” @KFERMercer 
- 潘多拉等系统，请将脚本开头sh改成bash

#### ps

- 新功能不考虑添加
- 好久没有折腾，飞机到期，编译环境不可用
- 沉迷怀旧服
- 别问了，再问就是我太懒

- 提交bug时请带上日志跟设备

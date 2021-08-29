# Copyright (C) 2016 Openwrt.org
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-serverchan
PKG_VERSION:=2.0.3
PKG_RELEASE:=9

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  DEPENDS:=+iputils-arping +curl +jq
  TITLE:=LuCI support for serverchan
  PKGARCH:=all
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/conffiles
/etc/config/serverchan
/usr/bin/serverchan/api/diy.json
/usr/bin/serverchan/api/logo.jpg
/usr/bin/serverchan/api/ipv4.list
/usr/bin/serverchan/api/ipv6.list
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci
	cp -pR ./luasrc/* $(1)/usr/lib/lua/luci
	$(INSTALL_DIR) $(1)/
	cp -pR ./root/* $(1)/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))

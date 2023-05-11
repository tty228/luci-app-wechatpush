'use strict';
'require view';
'require fs';
'require ui';

return view.extend({
	load: function () {
		return L.resolveDefault(fs.exec_direct('/usr/libexec/serverchan-call', ['get_client'], 'json'), { devices: [] });
	},
	render: function (data) {

		var devices = data.devices;
		var totalDevices = devices.length;
		var headers = [_('主机名'), _('IP 地址'), _('MAC 地址'), _('接口'), _('在线时间'), _('流量使用情况')];
		var columns = ['name', 'ip', 'mac', 'interface', 'uptime', 'usage'];
		var visibleColumns = [];
		var hasData = false;

		for (var i = 0; i < columns.length; i++) {
			var column = columns[i];
			var hasColumnData = false;

			for (var j = 0; j < devices.length; j++) {
				if (devices[j][column] !== '') {
					hasColumnData = true;
					hasData = true;
					break;
				}
			}

			if (hasColumnData) {
				visibleColumns.push(i);
			}
		}

		var style = `
			.device-table {
				width: 80%;
				border-collapse: collapse;
			}
			.device-table th,
				.device-table td {
				padding: 0.5rem;
				text-align: center;
				border: 1px solid #ccc;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.device-table td:first-child {
				word-wrap: break-word;
			}
			.device-table th {
				background-color: #f2f2f2;
				font-weight: bold;
				color: #666;
			}
			.device-table tbody tr:nth-of-type(even) {
				background-color: #f9f9f9;
			}
			@media (max-width: 767px) {
				.device-table th:nth-of-type(4),
				.device-table td:nth-of-type(4) {
				display: none;
				}
			.device-table th,
			.device-table td {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				}
			.device-table td:first-child {
				max-width: 150px;
				word-wrap: break-word;
				}
			/*.device-table td:nth-of-type(5) {
				max-width: 20px;
				}*/
			}
		`;

		var table = E('table', { 'class': 'device-table' }, [
			E('thead', {}, E('tr', {}, headers.filter(function (header, i) {
				return visibleColumns.includes(i);
			}).map(function (header) {
				return E('th', {}, header);
			}))),
			E('tbody', {}, devices.map(function (device) {
				var cells = [];
				for (var i = 0; i < columns.length; i++) {
					if (visibleColumns.includes(i)) {
						cells.push(E('td', {}, device[columns[i]]));
					}
				}
				return E('tr', {}, cells);
			}))
		]);

		return E('div', {}, [
			E('h2', {}, _('当前共 ') + totalDevices + (' 台设备在线')),
			E('div', { 'class': 'device-table' }, [
				table
			]),
			E('style', {}, style)
		]);
	},
	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});

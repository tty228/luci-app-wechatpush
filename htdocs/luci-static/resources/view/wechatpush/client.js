'use strict';
'require view';
'require fs';
'require ui';
'require poll';
'require uci';

return view.extend({
    load: function () {
        var self = this;
        // 清除 localStorage 中的排序设置
        localStorage.removeItem('sortColumn');
        localStorage.removeItem('sortDirection');
        uci.load('wechatpush')
        return this.fetchAndRenderDevices().then(function () {
            self.setupAutoRefresh();
        });
    },

    fetchAndRenderDevices: function () {
        var self = this;
        return this.fetchDevices().then(function (data) {
            var container = self.render(data);
            self.switchContent(container);
        }).catch(function (error) {
            console.error('Error fetching or rendering devices:', error);
        });
    },

    fetchDevices: function () {
        return fs.read('/tmp/wechatpush/devices.json').then(function (content) {
            try {
                var data = JSON.parse(content);
                return { devices: data.devices };
            } catch (e) {
                console.error('Error parsing JSON:', e);
                return { devices: [] };
            }
        });
    },

    render: function (data) {
        if (!data || !data.devices || !Array.isArray(data.devices)) {
            return document.createElement('div');
        }
        var devices = data.devices.filter(device => device.status === 'online');
        var totalDevices = devices.length;
        var headers = [_('Hostname'), _('IPv4 address'), _('MAC address'), _('Interfaces'), _('Online time'), _('Details')];
        var columns = ['name', 'ip', 'mac', 'interface', 'uptime', 'usage'];
        var visibleColumns = [];
        var hasData = false;

        // 获取配置中的默认排序列
        var defaultSortColumn = uci.get('wechatpush', 'config', 'defaultSortColumn') || 'ip';
        var defaultSortDirection = (defaultSortColumn === 'uptime') ? 'desc' : 'asc';

        // 获取存储的排序设置，如果没有则使用默认设置
        var storedSortColumn = localStorage.getItem('sortColumn');
        var storedSortDirection = localStorage.getItem('sortDirection');

        var currentSortColumn = storedSortColumn || defaultSortColumn;
        var currentSortDirection = storedSortDirection || defaultSortDirection;

        devices.sort(function (a, b) {
            return compareDevices(a, b, currentSortColumn, currentSortDirection);
        });

        // 根据数据源决定可见列
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
                cursor: pointer;
            }
            .device-table tbody tr:nth-of-type(even) {
                background-color: #f9f9f9;
            }
            .sortable {
                cursor: pointer;
                position: relative;
            }
            .sortable::after {
                content: '';
                position: absolute;
                right: -10px;
                top: 50%;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 5px 5px 0 5px;
                border-color: #aaa transparent transparent transparent;
                opacity: 0.6;
            }
            .sortable.asc::after {
                border-color: #666 transparent transparent transparent;
            }
            .sortable.desc::after {
                border-color: transparent transparent #666 transparent;
            }
            .device-table .hide {
                display: none;
            }
            @media (max-width: 767px) {
                .device-table th:nth-of-type(3),
                .device-table td:nth-of-type(3) {
                    display: none;
                }
                .device-table th:nth-of-type(4),
                .device-table td:nth-of-type(4) {
                    display: none;
                }
                .device-table th,
                .device-table td {
                    padding: 0.35rem;
                }
                .device-table td:first-child {
                    max-width: 150px;
                }
            }
        `;

        function createTable() {
            var table = document.createElement('table');
            table.classList.add('device-table');

            var thead = document.createElement('thead');
            var tr = document.createElement('tr');

            for (var i = 0; i < headers.length; i++) {
                var th = document.createElement('th');
                th.textContent = headers[i];

                if (visibleColumns.includes(i)) {
                    th.classList.add('sortable');
                    th.dataset.column = columns[i];
                    if (columns[i] === currentSortColumn) {
                        th.classList.add(currentSortDirection === 'asc' ? 'asc' : 'desc');
                    }
                } else {
                    th.classList.add('hide');
                }

                tr.appendChild(th);
            }

            thead.appendChild(tr);
            table.appendChild(thead);

            var tbody = document.createElement('tbody');
            devices.forEach(function (device) {
                var row = document.createElement('tr');
                for (var i = 0; i < columns.length; i++) {
                    if (visibleColumns.includes(i)) {
                        var cell = document.createElement('td');
                        if (columns[i] === 'uptime') {
                            cell.textContent = calculateUptime(device['uptime']);
                        } else if (columns[i] === 'ip' && device['http_access']) {
                            var link = document.createElement('a');
                            link.href = `${device['http_access']}://${device['ip']}`;
                            link.textContent = device['ip'];
                            link.target = '_blank';
                            cell.appendChild(link);
                        } else {
                            cell.textContent = device[columns[i]];
                        }
                        row.appendChild(cell);
                    }
                }
                tbody.appendChild(row);
            });

            table.appendChild(tbody);

            return table;
        }

        function calculateUptime(uptime) {
            // 将时间戳转换为时间格式
            var startTimeStamp = parseInt(uptime);
            var currentTimeStamp = Math.floor(Date.now() / 1000);
            var uptimeInSeconds = currentTimeStamp - startTimeStamp;

            var days = Math.floor(uptimeInSeconds / (3600 * 24));
            var hours = Math.floor((uptimeInSeconds % (3600 * 24)) / 3600);
            var minutes = Math.floor((uptimeInSeconds % 3600) / 60);
            var seconds = uptimeInSeconds % 60;

            if (days > 0) {
                return days + ' 天 ' + hours + ' 小时';
            } else if (hours > 0) {
                return hours + ' 小时 ' + minutes + ' 分钟';
            } else if (minutes > 0) {
                return minutes + ' 分钟 ' + seconds + ' 秒';
            } else {
                return seconds + ' 秒';
            }
        }

        function compareDevices(a, b, column, direction) {
            var value1 = getValueForSorting(a, column);
            var value2 = getValueForSorting(b, column);

            if (value1 < value2) {
                return direction === 'asc' ? -1 : 1;
            } else if (value1 > value2) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        }

        function getValueForSorting(device, column) {
            var value = device[column];
            if (column === 'uptime') {
                // 使用时间戳排序
                return parseInt(device['uptime']);
            } else if (column === 'ip') {
                return ipToNumber(value);
            }
            return value;
        }

        function ipToNumber(ipAddress) {
            var parts = ipAddress.split('.');
            var number = 0;

            for (var i = 0; i < parts.length; i++) {
                number = number * 256 + parseInt(parts[i]);
            }

            return number;
        }

        var container = document.createElement('div');
        container.appendChild(document.createElement('h2')).textContent = _('当前共 ') + totalDevices + _(' 台设备在线');
        container.appendChild(createTable());
        container.appendChild(document.createElement('style')).textContent = style;

        container.addEventListener('click', function (event) {
            if (event.target.tagName === 'TH' && event.target.parentNode.rowIndex === 0) {
                var columnIndex = event.target.cellIndex;
                var column = columns[columnIndex];
                var direction = 'asc';

                // 使在线时间第一次点击方向为倒序
                if (column === 'uptime') {
                    direction = currentSortDirection === 'desc' ? 'asc' : 'desc';
                } else if (column === currentSortColumn) {
                    direction = currentSortDirection === 'asc' ? 'desc' : 'asc';
                }

                sortTable(column, direction, container);
            }
        });

        function sortTable(column, direction, container) {
            devices.sort(function (a, b) {
                return compareDevices(a, b, column, direction);
            });

            currentSortColumn = column;
            currentSortDirection = direction;

            // 存储排序设置
            localStorage.setItem('sortColumn', currentSortColumn);
            localStorage.setItem('sortDirection', currentSortDirection);

            container.innerHTML = '';
            container.appendChild(document.createElement('h2')).textContent = _('当前共 ') + totalDevices + _(' 台设备在线');
            container.appendChild(createTable());
            container.appendChild(document.createElement('style')).textContent = style;
        }

        return container;
    },

    setupAutoRefresh: function () {
        var self = this;
        poll.add(L.bind(function () {
            self.fetchAndRenderDevices();
        }));
    },

    switchContent: function (newContent) {
        var existingContainer = document.querySelector('#view');
        if (!existingContainer) {
            console.error('Table container not found.');
            return;
        }
        existingContainer.innerHTML = '';
        existingContainer.appendChild(newContent);
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null
});

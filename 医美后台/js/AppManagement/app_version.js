/*
 *  APP管理模块--版本管理
 *  app_version.html
 */
(function($) {
    var pageObj = {
        init: function() {
            this.versionListInit();
            this.domListener();
        },
        domListener: function() {
            var self = this;
            // 点击添加新版本
            $('#addVersion').on('click', function() {
                if (!$.isEmpty('#version', '版本号') && !$.isEmpty('#fileSize', '文件大小') && !$.isEmpty('#downloadLink', '下载链接') && !$.isEmpty('#upgradeNotice', '升级提示信息')) {
                    self.addVersion();
                }
            });
        },
        versionListInit: function() {
            var jsonObj = {
                begin: 0,
                rows: 15
            },
            successFunc = function(data) {
                var dataContent = data.content,
                    dataContentCount = dataContent.length,
                    versionListStr = '',
                    startNo = parseInt($('#versionTable').attr('data-begin'));

                if (dataContentCount != 0) {
                    for (var i = 0; i < dataContentCount; i ++) {
                        var tempObj = dataContent[i];
                        versionListStr += '<tr>' +
                                                '<td>' + (startNo + i) + '</td>' +
                                                '<td>' + tempObj.version + '</td>' +
                                                '<td>' + $.formatTime(tempObj.createTime, 'full') + '</td>' +
                                                '<td>' + tempObj.downloadLink + '</td>' +
                                                '<td>' + tempObj.upgradeNotice + '</td>' +
                                                '<td>' + tempObj.fileSize + 'MB</td>' +
                                                '<td>' + ((tempObj.state == 0) ? '是': '否') + '</td>' +
                                            '</tr>';
                    }
                } else {
                    versionListStr = '<tr class="text-center"><td colspan="7">暂无版本信息</td></tr>'
                }
                $('#versionTable').empty().append(versionListStr);


                if ($('#pager').hasClass('init')) {
                    $('#pager').smartpaginator({
                        totalrecords: data.count, 
                        recordsperpage: 15, 
                        length: 5,
                        controlsalways: true, 
                        onchange: function (newPage) {
                            var jsonData = {
                                begin: ((parseInt(newPage) - 1) * 15),
                                rows : 15
                            };
                            $('#versionTable').html('').append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                            getLists(jsonData);
                        }
                    });
                    $('#pager').removeClass('init');
                }
            },
            failFunc = function(err) {
                $.alert('danger', '网络繁忙，请稍后重试！');
            };

            /* 设置table中订单的编号 */
            $('#versionTable').attr('data-begin', (parseInt(jsonObj.begin) + 1));
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/appVersionInfo/getAppVersionInfoList.htm', jsonObj, successFunc, failFunc);
        },
        addVersion: function() {
            var self = this,
                jsonObj = $.submitObj('.submit-input'),
                successFunc = function(data) {
                    console.log(data);
                    if (data.status == 'success') {
                        $.alert('success', '添加成功');
                        $('#addModal').modal('hide');
                        self.versionListInit();                 
                    }
                },
                failFunc = function(err) {
                    $.alert('danger', '网络繁忙，请稍后重试！');
                };

            
            console.log(jsonObj);
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/appVersionInfo/insertAppVersionInfo.htm', jsonObj, successFunc, failFunc);
        }
    };

    pageObj.init();
})(jQuery);
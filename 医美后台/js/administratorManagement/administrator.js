/*
 *  管理员模块
 *  administrator.html
 */
(function($) {
    var pageObj = {
        init: function() {
            this.domListener();
            this.adminListInit();
            this.roleListInit();
        },
        domListener: function() {
            var self = this;

            // 点击按钮检验账号是否已存在
            $('.J_validate').on('click', function() {
                var username = $('#usernameSecond').val(),
                    jsonObj = {
                    username: username
                },
                successFunc = function(data) {
                    if (data.status == 'success') {
                        if (data.object) {
                            alert('账号已存在');
                        } else {
                            alert('账号可用');
                        }
                    } else {
                        alert(data.message);
                    }
                },
                failFunc = function(err){
                    alert('网络繁忙，请重试！');
                };

                if (self.userValidation($('#usernameSecond').val())) {
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/queryAdminUserByUsername.htm', jsonObj, successFunc, failFunc);
                }       
            });

            // 弹出创建管理员模态框
            $('#addAdmin').on('click', function() {
                if ($.checkMenuItemPermission('adminUser:add')) {
                    $('#addAdminModal').modal('toggle');
                }
            });

            // 确认创建管理员
            $('#addSure').on('click', function() {
                var $adminListOption = $('#adminList').find('option:selected'),
                    jsonObj = {
                        username: $('#usernameSecond').val(),
                        mobile: $('#mobileSecond').val(),
                        roleId: $adminListOption.attr('value'),
                        roleName: $adminListOption.text(),
                        organizeNo: 0
                    },
                    successFunc = function(data) {
                        var jsonData = {
                                begin: 0,
                                rows: 15
                            };
                        if (data.status == 'success') {
                            $('#addAdminModal').modal('hide');
                            $('#pager').addClass('init');
                            self.getAdminList(jsonData);
                        } else {
                            alert(data.message);
                        }
                    },
                    failFunc = function(err) {
                        alert('网络异常，请重试！');
                    }
                
                if (self.userValidation($('#usernameSecond').val()) && self.mobileValidation($('#mobileSecond').val())) {
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/insertAdminUser.htm', jsonObj, successFunc, failFunc);
                }
                
            });

            // 删除管理员
            $('.ibox-content').on('click', '.admin-delete', function() {
                if ($.checkMenuItemPermission('adminUser:delete')) {
                    var jsonObj = {
                        username: $(this).attr('data-username')
                    },
                    successFunc = function(data) {
                        var jsonData = {
                                begin: 0,
                                rows: 15
                            };
                        if (data.status == 'success') {
                            $('#pager').addClass('init');
                            self.getAdminList(jsonData);
                        } else {
                            alert(data.message);
                        }
                    },
                    failFunc = function(err) {
                        alert('网络异常，请重试！');
                    };
                    
                    if(confirm("确定要删除吗？")){
                        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/deleteAdminUser.htm', jsonObj, successFunc, failFunc);
                    }
                }
            });

            // 弹出修改管理员模态框
            $('.ibox-content').on('click', '.admin-modify', function() {
                if ($.checkMenuItemPermission('adminUser:update')) {
                    var thisIndex = $(this).attr('data-index');

                    $('.submit-input').each(function() {
                        var $this = $(this),
                            id = $this.attr('id');

                        $this.val(tempDataObj[thisIndex][id]);
                    });
                    // 初始化select中的值
                    $('#roleName').find('option').each(function() {
                        if ($(this).text() == tempDataObj[thisIndex].roleName) {
                            $(this).attr('selected', true);
                        } else {
                            $(this).removeAttr('selected');
                        }
                    });
                }
            });

            // 确认修改
            $('#modifySure').on('click', function() {
                var selectedRole = $('#roleName').find('option:selected'),
                    jsonObj = {
                    username: $('#username').val(),
                    password: $('#password').val(),
                    mobile: $('#mobile').val(),
                    roleName: selectedRole.text(),
                    roleId: selectedRole.attr('value')
                },
                successFunc = function(data) {
                    var jsonData = {
                            begin: (parseInt($('#listTable').attr('data-begin')) - 1),
                            rows: 15
                        };
                    if (data.status == 'success') {
                        $('.modifyModal').modal('hide');
                        self.getAdminList(jsonData)
                    } else {
                        alert(data.message);
                    }
                },
                failFunc = function(err) {
                    alert('网络异常，请重试！');
                };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/updateAdminUser.htm', jsonObj, successFunc, failFunc);
            });
        },
        adminListInit: function() {
            var self = this,
                jsonData = {
                    begin: 0,
                    rows: 15
                };

            self.getAdminList(jsonData);
        },
        getAdminList: function(jsonObj) {
            var self = this,
                successFunc = function(data) {
                window.tempDataObj = data.content;
                var dataObj = data.content,
                    adminArr ='',
                    startNo = parseInt($('#listTable').attr('data-begin')),
                    isSuperAdminArr = '';
            if (dataObj.length == 0) {
                adminArr = '<tr class="text-center"><td colspan="10">暂无管理员！</td></tr>';
            } else {
                for (var i = 0; i < dataObj.length; i ++) {
                    var tempObj = dataObj[i];
                    
                    isSuperAdminArr = (tempObj.roleId == 1) ?　'' : ('| <a class="admin-delete" data-username="' + tempObj.username + '">删除</a></td>');
                    adminArr += '<tr>' +
                                    '<td>' + (startNo + i) + '</td>' +
                                    '<td>' + tempObj.username + '</td>' +
                                    '<td>' + tempObj.password + '</td>' +
                                    '<td>' + tempObj.mobile + '</td>' +
                                    '<td>' + tempObj.roleName + '</td>' +
                                    '<td>2016-12-13 15:50:01</td>' +
                                    '<td><a class="admin-modify" data-index="' + i + '" data-toggle="modal" data-target=".modifyModal" data-backdrop="static">修改</a> ' +
                                    isSuperAdminArr +
                                    '</td>'
                                '</tr>';
                }
            }
            $('#listTable').empty().append(adminArr);


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
                            $('#listTable').html('').append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                            self.getAdminList(jsonData);
                        }
                    });
                    $('#pager').removeClass('init');
                }
            },
            failFunc = function(err) {
                alert('网络异常，请重试！');
            };       

            /* 设置table中订单的编号 */
            $('#listTable').attr('data-begin', (parseInt(jsonObj.begin) + 1));
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/selectAdminUserList.htm', jsonObj, successFunc, failFunc);
        },
        roleListInit: function() {
            var jsonObj = {
                    begin: 0,
                    rows: 250
                },
                successFunc = function(data) {
                    var dataObj = data.content,
                        optionArr = '';

                    for (var i = 0; i < dataObj.length; i ++) {
                        if (dataObj[i].roleId != 1) {
                            optionArr += '<option value="' + dataObj[i].roleId + '">' + dataObj[i].roleName + '</option>'; 
                        }
                    }
                    $('.role-select').empty().append(optionArr);
                },
                failFunc = function(err) {
                    alert('网络繁忙，请重试！');
                };
            
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/selectAdminRoleList.htm', jsonObj, successFunc, failFunc);
        },
        // 用户名校验
        userValidation: function(value) {
            var reg = new RegExp("[\\u4E00-\\u9FFF]+","g");  
            if (value.trim() == '') {
                $.alert('danger', '用户名不能为空');
                return false;
            } else if (reg.test(value)) {
                $.alert('danger', '用户名不能有中文');
                return false;
            }
            return true;
        },
        // 手机号校验
        mobileValidation: function(mobile) {
            if (mobile.trim() == '') {
                $.alert('danger', '手机号码不能为空');
                return false;
            } else if (!/^0?1[3|4|5|8][0-9]\d{8}$/.test(mobile)) {
                $.alert('danger', '手机号码不正确');
                return false;
            }
            return true;
        }
    };
    pageObj.init();
})(jQuery);
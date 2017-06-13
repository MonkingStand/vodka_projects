(function($) {
    var pageObj = {
        init: function() {
            this.domListener();
            this.roleListsInit();
            this.permissonListsInit();
        },
        domListener: function() {
            var self = this;
            // 弹出创建角色模态框
            $('#addRole').on('click', function() {
                if ($.checkMenuItemPermission('adminRole:add')) {
                    $('#addRoleModal').modal('toggle');
                }
            });

            // 确认创建角色
            $('#sure').on('click', function() {
                var checkboxArr = [];
                //筛选所有被选中的checkbox
                $('#new-roleList').find("input[type='checkbox']").each(function(index, arr) {
                    if ($(this).is(':checked')) {
                        checkboxArr.push($(this).attr('value'));
                    }
                });
                
                var jsonObj = {
                        roleName: $('#roleNameSecond').val(),
                        permission: checkboxArr.join(",")
                    },
                    successFunc = function(data){
                        var jsonData = {
                                begin: 0,
                                rows: 15
                            };
                        if (data.status == 'success') {
                            $('#addRoleModal').modal('hide');
                            $('#pager').addClass('init');
                            /* 新增角色，全部都重新取，即重新初始化一遍 */
                            $('#pager').empty().addClass('init');
                            self.getRoleLists(jsonData);
                        } else {
                            alert(data.message);
                        }
                    },
                    failFunc = function(err) {
                        alert('网络异常，请重试！');
                    };
            
                if (!$.isEmpty('#roleNameSecond', '角色名')) {
                    if (checkboxArr.length != 0) {
                        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/insertAdminRole.htm', jsonObj, successFunc, failFunc);
                    } else {
                        $.alert('danger', '请勾选权限');
                    }
                }
                
            });

            // 删除角色
            $('.ibox-content').on('click', '.role-delete', function() {
                if ($.checkMenuItemPermission('adminRole:delete')) {
                    var jsonObj = {
                            roleId: $(this).attr('data-role')
                        },
                        successFunc = function(data) {
                            var jsonData = {
                                    begin: 0,
                                    rows: 15
                                };
                            
                            if (jsonData.begin % jsonData.rows == 0) {
                                if (jsonData.begin > 0) {
                                    jsonData.begin -= jsonData.rows;
                                }
                            }

                            if (data.status == 'success') {
                                $('#pager').addClass('init');
                                self.getRoleLists(jsonData);
                            } else {
                                alert(data.message);
                            }
                        },
                        failFunc = function(err) {
                            alert('网络异常，请重试！');
                        };
                    
                    if(confirm("确定要删除吗？")){
                        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/deleteAdminRole.htm', jsonObj, successFunc, failFunc);
                    }
                }
            });

            // 弹出修改角色模态框
            $('.ibox-content').on('click', '.role-modify', function() {
                if ($.checkMenuItemPermission('adminRole:update')) {
                    var thisIndex = $(this).attr('data-index'),
                        permissonArr = tempDataObj[thisIndex].permission.split(',');
                    window.roleId    = $(this).attr('data-roleid');
                    
                    $('.submit-input').each(function() {
                        var $this = $(this),
                            id = $this.attr('id');

                        $this.val(tempDataObj[thisIndex][id]);
                    });
                    // 权限checkbox初始化
                    $('#roleList').find("input[type='checkbox']").prop('checked', false).each(function() {
                        for (var i = 0; i < permissonArr.length; i ++) {
                            if ($(this).attr('value') == permissonArr[i]) {
                                $(this).prop('checked', true);
                            }
                        }
                    });
                }
            });

            // 确认修改
            $('#modifySure').on('click', function() {
                var checkboxArr = [];
                //筛选所有被选中的checkbox
                $('#roleList').find("input[type='checkbox']").each(function(index, arr) {
                    if ($(this).is(':checked')) {
                        checkboxArr.push($(this).attr('value'));
                    }
                });

                var jsonObj = {
                        roleName: $('#roleName').val(),
                        permission: checkboxArr.join(","),
                        roleId: roleId
                    },
                    successFunc = function(data) {
                        var jsonData = {
                                begin: (parseInt($('#listTable').attr('data-begin')) - 1),
                                rows: 15
                            };

                        if (data.status == 'success') {
                            $('.modifyModal').modal('hide');
                            self.getRoleLists(jsonData);
                        } else {
                            alert(data.message);
                        }
                    },
                    failFunc = function(err) {
                        alert('网络异常，请重试！');
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/updateAdminRole.htm', jsonObj, successFunc, failFunc);
            });
        },
        roleListsInit: function() {
            var self = this,
                jsonData = {
                    begin: 0,
                    rows: 15
                };
            self.getRoleLists(jsonData);
        },
        permissonListsInit: function() {
            var jsonObj = {
                    begin: 0,
                    rows: 5000
                },
                successFunc = function(data) {
                    var dataObj = data.content,
                        optionArr = '';
                    
                    for (var i = 0; i < dataObj.length; i ++) {
                        var menuClass = 'col-sm-3';
                        // 高亮显示菜单级权限
                        if (dataObj[i].parentId == '0') {
                            menuClass = 'col-sm-12 menu-wrap';
                        }
                        optionArr += '<div class="' + menuClass + '"><label><input value="' 
                                            + dataObj[i].perId + '" type="checkbox">' + dataObj[i].perName + 
                                            '</label>&nbsp;&nbsp;</div>'; 
                    }
                    $('.role-checkbox').empty().append(optionArr);
                },
                failFunc = function(err) {
                    alert('网络繁忙，请重试！');
                };
            
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/selectAdminPermissionList.htm', jsonObj, successFunc, failFunc);
        },
        getRoleLists: function(jsonObj) {
            var self = this,
                successFunc = function(data) {
                window.tempDataObj = data.content;
                var dataObj = data.content,
                    adminArr ='',
                    startNo = parseInt($('#listTable').attr('data-begin')),
                    isrSuperRole = '';

                if (dataObj.length == 0) {
                    adminArr = '<tr class="text-center"><td colspan="10">暂无角色！</td></tr>';
                } else {
                    for (var i = 0; i < dataObj.length; i ++) {
                        var tempObj = dataObj[i];
                        isrSuperRole = (tempObj.roleId == 1) ? '' : ('| <a class="role-delete" data-role="' + tempObj.roleId + '">删除</a></td>');
                        adminArr += '<tr>' +
                                        '<td>' + (startNo + i) + '</td>' +
                                        '<td>' + tempObj.roleName + '</td>' +
                                        '<td>2016-12-13 15:50:01</td>' +
                                        '<td><a class="role-modify" data-index="' + i + '" data-roleid="' + tempObj.roleId + '" data-toggle="modal" data-target=".modifyModal" data-backdrop="static">修改</a> ' +
                                        isrSuperRole +
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
                            $('#orderTable').html('').append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                            self.getRoleLists(jsonData);
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
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/selectAdminRoleList.htm', jsonObj, successFunc, failFunc);
        }
    }
    pageObj.init();
})(jQuery);
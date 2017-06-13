(function($) {
    var pageObj = {
        init: function() {
            this.domListener();
            this.permissionListsInit();
            this.getMenuListInit();
        },
        domListener: function() {
            var self = this;

            // 弹出创建权限模态框
            $('#addPermission').on('click', function() {
                if ($.checkMenuItemPermission('adminPermission:add')) {
                    $('#addPermissionModal').modal('toggle');
                }
            });

            // 确认创建权限
            $('#sure').on('click', function() {
                var choosePermission = $('#myTab').find('li.active').attr('data-parent'),
                    jsonObj,
                    successFunc = function(data){
                        var jsonData = {
                                begin: 0,
                                rows: 15
                            };
                        if (data.status == 'success') {
                            $('#addPermissionModal').modal('hide');
                            $('#pager').addClass('init');
                            self.getPermissionLists(jsonData)
                        } else {
                            alert(data.message);
                        }
                    },
                    failFunc = function(err) {
                        alert('网络异常，请重试！');
                    };

                // 判断用户是要创建菜单还是按钮  0-菜单   1-按钮
                if (choosePermission == 0) {
                    jsonObj = {
                        perName: $('#perNameSecond').val(),
                        parentId: 0,
                        perKey: $('#perKeySecond').val()
                    };
                } else if (choosePermission == 1) {
                    jsonObj = {
                        perName: $('#perNameSecond').val(),
                        parentId: $('#menu').find('option:selected').attr('value'),
                        perKey: $('#perKeySecond').val()
                    };
                }

                if (!$.isEmpty('#perNameSecond', '权限名') && !$.isEmpty('#perKeySecond', '权限资源')) {
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/insertAdminPermission.htm', jsonObj, successFunc, failFunc);
                }
                
            });

            // 删除权限
            $('.ibox-content').on('click', '.permission-delete', function() {
                if ($.checkMenuItemPermission('adminPermission:delete')) {
                    var jsonObj = {
                            perId: $(this).attr('data-perkey')
                        },
                        successFunc = function(data) {
                            var jsonData = {
                                    begin: 0,
                                    rows: 15
                                };
                            if (data.status == 'success') {
                                $('#pager').addClass('init');
                                self.getPermissionLists(jsonData)
                            } else {
                                alert(data.message);
                            }
                        },
                        failFunc = function(err) {
                            alert('网络异常，请重试！');
                        };

                    if(confirm("确定要删除吗？")){
                        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/deleteAdminPermission.htm', jsonObj, successFunc, failFunc);
                    }
                }
            });

            // 弹出修改权限模态框
            $('.ibox-content').on('click', '.permission-modify', function() {
                if ($.checkMenuItemPermission('adminPermission:update')) {
                    var thisIndex = $(this).attr('data-index'),
                        fatherMenuArr;
                        window.perId = $(this).attr('data-perid');
                    
                    $('.submit-input').each(function() {
                        var $this = $(this),
                            id = $this.attr('id');
                        
                        $this.val(tempDataObj[thisIndex][id]);
                    });

                    // 初始化按钮可供选择的父级菜单
                    for (var i = 0; i < fatherDataObj.length; i ++) {
                        if (fatherDataObj[i].parentId == 0) {
                            fatherMenuArr += '<option  value="' + fatherDataObj[i].perId + '">' + fatherDataObj[i].perName + '</option>';  
                        }
                    }
                    $('#modifyFatherMenu').empty().append(fatherMenuArr);

                    // 初始化父级菜单
                    $('#modifyFatherMenu').show().attr('disabled', false).find('option').each(function() {
                        
                        if ($(this).attr('value') == tempDataObj[thisIndex].parentId) {
                            $(this).attr('selected', true);
                        }
                    });
                    
                    // 如果没有父级菜单，则select不可以选取
                    if ($(this).attr('data-parentid') == 0) {
                        $('#modifyFatherMenu').hide();
                    }

                    $.setCookie('parentId', $(this).attr('data-parentid'), 720);
                }
            });

            // 确认修改权限
            $('#modifySure').on('click', function() {
                var jsonObj = {
                        perName: $('#perName').val(),
                        parentId: ($.getCookie('parentId') != 0) ? $('#modifyFatherMenu').find('option:selected').attr('value') : 0,
                        perKey: $('#perKey').val(),
                        perId: perId
                    },
                    successFunc = function(data) {
                        var jsonData = {
                                begin: 0,
                                rows: 15
                            };
                        if (data.status == 'success') {
                            $('.modifyModal').modal('hide');
                            self.getPermissionLists(jsonData)
                        } else {
                            alert(data.message);
                        }
                    },
                    failFunc = function(err) {
                        alert('网络异常，请重试！');
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/updateAdminPermission.htm', jsonObj, successFunc, failFunc);
            });
        },
        permissionListsInit: function() {
            var self = this;

            var jsonData = {
                begin: 0,
                rows: 15
            };
            self.getPermissionLists(jsonData);
        },
        // 点击创建权限时，在弹出框选择创建按钮时，初始化父级菜单，parentId=0
        getMenuListInit: function() {
            var jsonObj = {
                    begin: 0,
                    rows: 250
                },
                successFunc = function(data) {
                    window.fatherDataObj = data.content;
                    var dataObj = data.content,
                        menuOptionArr = '';

                    for (var i = 0; i < dataObj.length; i ++) {
                        if (dataObj[i].parentId == 0) {
                            menuOptionArr += '<option data-index="' + i + '" value="' + dataObj[i].perId + '">' + dataObj[i].perName + '</option>';  
                        }
                    }
                    $('#menu').empty().append(menuOptionArr);
                },
                failFunc = function(err) {
                    alert('网络异常，请重试！');
                };
            
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/selectAdminPermissionList.htm', jsonObj, successFunc, failFunc);
        },
        getPermissionLists: function(jsonObj) {
            var self = this,
                successFunc = function(data) {
                window.tempDataObj = data.content;
                var dataObj = data.content,
                    permissonArr ='',
                    startNo = parseInt($('#permissonTable').attr('data-begin')),
                    menuOptionArr = '',
                    menuState = '';
                    
                if (dataObj.length == 0) {
                    adminArr = '<tr class="text-center"><td colspan="10">什么都没有！</td></tr>';
                } else {
                    for (var i = 0; i < dataObj.length; i ++) {
                        var tempObj = dataObj[i];
                        if (tempObj.parentId == 0) {
                            menuState = '菜单级';
                        } else {
                            menuState = '按钮级';
                        }
                        permissonArr += '<tr>' +
                                        '<td>' + (startNo + i) + '</td>' +
                                        '<td>' + tempObj.perName + '</td>' +
                                        '<td>' + menuState + '</td>' +
                                        '<td>' + tempObj.perKey + '</td>' +
                                        '<td><a class="permission-modify" data-index="' + i + '" data-perid="' + tempObj.perId + '" data-parentid="' + tempObj.parentId + '" data-toggle="modal" data-target=".modifyModal" data-backdrop="static">修改</a> | ' +
                                        '<a class="permission-delete" data-perkey="' + tempObj.perId + '">删除</a></td>' +
                                    '</tr>';          
                    }
                }
                $('#permissonTable').empty().append(permissonArr);

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
                            self.getPermissionLists(jsonData);
                        }
                    });
                    $('#pager').removeClass('init');
                }
            },
            failFunc = function(err) {
                alert('网络异常，请重试！');
            };       

            /* 设置table中订单的编号 */
            $('#permissonTable').attr('data-begin', (parseInt(jsonObj.begin) + 1));
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/adminManage/selectAdminPermissionList.htm', jsonObj, successFunc, failFunc);
        }
    };

    pageObj.init();
})(jQuery);
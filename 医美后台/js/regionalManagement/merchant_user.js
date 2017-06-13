/*
 *  商户管理模块——咨询师详情
 *  merchant_user.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.merchantUserListInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;
                /* 展开、收拢信息项 */
                $('.toggle-link').on('click', function() {
                    var targetSelector = $(this).attr('data-target'),
                        $thisIcon      = $(this).find('.fa'),
                        $target        = $(targetSelector);
                    
                    if ($(this).hasClass('expanded')) {
                        $(this).removeClass('expanded');
                        $thisIcon.removeClass('fa-caret-down').addClass('fa-caret-right');
                    }
                    else {
                        $(this).addClass('expanded');
                        $thisIcon.removeClass('fa-caret-right').addClass('fa-caret-down');
                    }
                    $target.stop().slideToggle();
                });

                /* 筛选按钮切换 */
                $('.filter-item .filter-options .btn').on('click', function() {
                    var $thisItem = $(this).closest('.filter-item');
                    if (!$(this).hasClass('active')) {
                        $thisItem.find('.active.btn').removeClass('active');
                        $(this).addClass('active');
                    }
                });

                /* 隐藏、显示筛选条件 */
                $('.toggle-btn').on('click',function() {
                    var $thisIcon  = $(this).find('.fa'),
                        $thisText  = $(this).find('.toggle-text'),
                        $filterBox = $(this).closest('.filter-container').find('.filter-box');
                    
                    if ($thisIcon.hasClass('fa-angle-up')) {
                        $filterBox.stop().slideToggle();
                        $thisIcon.removeClass('fa-angle-up').addClass('fa-angle-down');
                        $thisText.text('展开筛选条件');
                    }
                    else {
                        $filterBox.stop().slideToggle();
                        $thisIcon.removeClass('fa-angle-down').addClass('fa-angle-up');
                        $thisText.text('收起筛选条件');
                    }
                });

                /* 待审核、黑名单咨询师激活 */
                $('#merchantUserTable').on('click', '.active-user-link', function() {
                    var thisUserId = $(this).attr('data-id');

                    self.activatedUser(thisUserId);
                });

                /* 把使用中的咨询师拉黑 */
                $('#merchantUserTable').on('click', '.block-user-link', function() {
                    var thisUserId = $(this).attr('data-id');

                    self.blockedUser(thisUserId);
                });

                /* 修改咨询师信息的模态框 */
                $('#merchantUserTable').on('click', '.edit-user-link', function() {
                    if ($.checkMenuItemPermission('merchantUser:update')) {
                        var thisUserId = $(this).attr('data-id');

                        self.merchantUserInit(thisUserId);
                    }
                });

                /* 点击保存修改咨询师信息 */
                $('.modal').on('click', '.edit-user-save', function() {
                    self.merchantUserInfoChange();
                });
            },
            merchantUserListInit: function() {
                var self = this,
                    jsonData = {
                        merchantNo: $.getCookie('merchantNo'),
                        begin     : 0,
                        rows      : 15
                    };
                
                self.getMerchantUserList(jsonData);
            },
            getMerchantUserList: function(jsonObj) {
                var self = this,
                    successFunc = function(data) {
                        var merchantUserArr   = data.content,
                            merchantUserCount = merchantUserArr.length,
                            merchantUserStr   = '',
                            userStateBtnStr;

                        if (data.status == 'fail') {
                            $.alert('danger', '获取人员信息列表失败');
                        }
                        else {
                            if (merchantUserCount == 0) {
                                merchantUserStr += '<tr class="text-center"><td colspan="7">该商户下暂无咨询师！</td></tr>';
                            }
                            else {
                                for (var i = 0; i < merchantUserCount; i ++) {
                                    var merchantUserTemp = merchantUserArr[i],
                                        createDate;

                                    if (merchantUserTemp.merchantUserStatus == '0') {
                                        var userStatus  = '<span class="label label-warning">待审核<br>（待商户确认）</span>';
                                        userStateBtnStr = '<button data-id="' + merchantUserTemp.userId + '" class="btn btn-success btn-xs active-user-link">激活</button>';
                                    }
                                    else if (merchantUserTemp.merchantUserStatus == '2') {
                                        var userStatus  = '<span class="label label-success">审核通过<br>（使用中）</span>';
                                        userStateBtnStr = '<button data-id="' + merchantUserTemp.userId + '" class="btn btn-danger btn-xs block-user-link">拉黑</button>';
                                    }
                                    else if (merchantUserTemp.merchantUserStatus == '-2') {
                                        var userStatus  = '<span class="label label-danger">黑名单</span>';
                                        userStateBtnStr = '<button data-id="' + merchantUserTemp.userId + '" class="btn btn-success btn-xs active-user-link">激活</button>';
                                    }

                                    // TODO 方法待修改
                                    // 后台时间2017-05-12 18:05:38.0末尾多了 “.0” 导致部分浏览器识别不了
                                    if (merchantUserTemp.createDate.length > 19) {
                                        // 有 “.0” 
                                        createDate = merchantUserTemp.createDate.slice(0,19);
                                    } else {
                                        // 没有 “.0” 
                                        createDate = $.formatTime(merchantUserTemp.createDate, 'full');
                                    }
                                    merchantUserStr +=  '<tr>' +
                                                            '<td>' + (i + 1) + '</td>' +
                                                            '<td>' + merchantUserTemp.realName + '</td>' +
                                                            '<td>' + merchantUserTemp.mobile + '</td>' +
                                                            '<td>' + merchantUserTemp.role + '（咨询师）</td>' +
                                                            '<td>' + createDate + '</td>' +
                                                            '<td>' + userStatus + '</td>' +
                                                            '<td>' +
                                                                userStateBtnStr + 
                                                                '<button data-id="' + merchantUserTemp.userId + '" class="edit-user-link btn btn-success btn-xs" data-toggle="modal" data-target=".merchantUserEditModal">修改</button>' +
                                                                '<button data-id="' + merchantUserTemp.userId + '" class="btn btn-danger btn-xs delete-user-link">删除</button>' +
                                                            '</td>' +
                                                        '<tr>';
                                }
                            }

                            $('#merchantUserCount').val(data.count);
                            setTimeout(function() {
                                $('#merchantUserTable').empty().append(merchantUserStr);
                            }, 1500);

                            if ($('#merchantUserPager').hasClass('init')) {
                                $('#merchantUserPager').smartpaginator({
                                    totalrecords: data.count, 
                                    recordsperpage: 15, 
                                    length: 5,
                                    controlsalways: true, 
                                    onchange: function (newPage) {
                                        var jsonData = {
                                                merchantNo: $.getCookie('merchantNo'),
                                                begin     : ((parseInt(newPage) - 1) * 15),
                                                rows      : 15
                                            };
                                        $('#merchantUserTable').html('').append('<tr class="text-center"><td colspan="7"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                                        self.getMerchantUserList(jsonData);
                                    }
                                });
                                $('#merchantUserPager').removeClass('init');
                            }
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getCreditMerchantUserList.htm', jsonObj, successFunc, failFunc);
            },
            // 咨询师详情初始化
            merchantUserInit: function(userId) {
                var jsonData = {
                        userId: userId
                    },
                    successFunc = function(data) {
                        var dataUser  = data.object.merchantUser,
                            $roleType = $('#roleType');
                        /* 填充数据 */
                        $.autoFillData(dataUser);

                        switch(dataUser.role) {
                            case '2':
                                $roleType.val('医院');
                                break;
                            case '3':
                                $roleType.val('房产');
                                break;
                            case '4':
                                $roleType.val('保险');
                                break;
                            default:
                                $roleType.val('--');
                        }

                        $('#realName').attr('data-userid', dataUser.userId);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantUser.htm', jsonData, successFunc, failFunc);
            },
            merchantUserInfoChange: function() {
                var self = this,
                    jsonData = $.submitObj('.submit-input'),
                    successFunc = function(data) {
                        var jsonData = {
                                merchantNo: $.getCookie('merchantNo'),
                                begin     : 0,
                                rows      : 15
                            };
                        $('.merchantUserEditModal').modal('hide');
                        $.alert('success', '修改成功！');

                        self.getMerchantUserList(jsonData);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试');
                        console.info(err);
                    };
                
                jsonData['userId'] = $('#realName').attr('data-userid');                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/updateMerchantUser.htm', jsonData, successFunc, failFunc);
            },
            activatedUser: function(userId) {
                var self = this,
                    jsonObj = {
                        userId: userId,
                        merchantUserStatus: 2
                    },
                    successFunc = function(data) {
                        var jsonData = {
                                merchantNo: $.getCookie('merchantNo'),
                                begin     : 0,
                                rows      : 15
                            };
                        if (data.status == 'success') {
                            $.alert('success', '咨询师激活成功');
                            self.getMerchantUserList(jsonData);
                        }
                        else {
                            $.alert('danger', '咨询师激活失败');
                        }                        
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试');
                    };
                    
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/updateMerchantUserStatus.htm', jsonObj, successFunc, failFunc);
            },
            blockedUser: function(userId) {
                var self = this,
                    jsonObj = {
                        userId: userId,
                        merchantUserStatus: -2
                    },
                    successFunc = function(data) {
                        var jsonData = {
                                merchantNo: $.getCookie('merchantNo'),
                                begin     : 0,
                                rows      : 15
                            };
                        if (data.status == 'success') {
                            $.alert('success', '咨询师拉黑成功');
                            self.getMerchantUserList(jsonData);
                        }
                        else {
                            $.alert('danger', '咨询师拉黑失败');
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/updateMerchantUserStatus.htm', jsonObj, successFunc, failFunc);
            }
        };
    
    pageObj.init();
})(jQuery)
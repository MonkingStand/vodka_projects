/*
 *  经理审批模块——订单详情
 *  order_approve_detail.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.capitalSourceInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;

                /* 审批同意 */
                $('#approvePass').on('click', function() {
                    if ($.checkMenuItemPermission('option:add')) {
                        if (!$.isEmpty('#approveRemark', '审批意见')) {
                            self.passApprove();
                        }
                    }
                });

                /* 审批驳回 */
                $('#approveRefuse').on('click', function() {
                    if ($.checkMenuItemPermission('option:add')) {
                        if (!$.isEmpty('#approveRemark', '驳回意见')) {
                            self.refuseApprove();
                        }
                    }
                });

                /* 个人合同 */
                $('#personalContactModalLink').on('click', function() {
                    if ($.checkMenuItemPermission('contract:see')) {
                        if ($(this).hasClass('not-created')) {
                            $.alert('danger', '风控审批还未通过，个人合同还未生成！');
                        }
                        else if ($(this).hasClass('to-created')) {
                            $.alert('danger', '用户还未确认，合同暂未生成！');
                        }
                        else if ($(this).hasClass('has-created')) {
                            self.contactInit();
                        }
                    }
                });
            },
            orderDetailInit: function() {
                var self = this,
                    jsonData = {
                        orderNo: $.getCookie('orderNo')
                    },
                    successFunc = function(data) {
                        var dataOrder = data.object.orderDetail,
                            $loanType = $('#loanType');

                        if (dataOrder.status == 1) {
                            /* 显示个人合同 */
                            $('#personalContactModalLink').removeClass('not-created').addClass('to-created');
                            $('.operate-btn-container').removeClass('hidden');
                        }
                        else if (dataOrder.status == 6 || dataOrder.status == 7) {
                            /* 用户已经确认，或者财务已经放款 */
                            $('#personalContactModalLink').removeClass('not-created').addClass('has-created').attr('href', dataOrder.contractPDF);
                            if (dataOrder.status == 7) {
                                $('.operate-btn-container').remove();
                            }
                            else {
                                $('.operate-btn-container').removeClass('hidden');
                            }
                        }
                        else {
                            $('.operate-btn-container').removeClass('hidden');
                        }

                        /* 自动填写信息到页面上 */
                        $.autoFillData(dataOrder);
                        $.autoFillData(data.object.userInfo);
                        /* 时间格式化显示 */
                        $('#effectiveDate').val($.formatTime($('#effectiveDate').val()));
                        /* 申请贷款金额格式化显示 */
                        $('#applyCapital').val(parseFloat($('#applyCapital').val()).toFixed(2));
                        if (dataOrder.status == 7 || dataOrder.status == 6 || dataOrder.status == 1) {
                        	/* 已完成审批操作，将审批的金额自动填写到审批金额input中 */
                        	$('#verifyCapital').val(parseFloat(dataOrder.verifyCapital).toFixed(2));
                        }
                        else {
                        	/* 还未审批，默认将申请的贷款金额自动填写到终贷金额中 */
                            $('#verifyCapital').val($('#applyCapital').val());
                        }
                        /* 还款方式显示（后台传回数据为0、1） */
                        $('#refundType').val(($('#refundType').val() == '0') ? '等额本息' : '等额本金');
                        /* 贷款类型判断 */
                        self.fillLoanType(dataOrder.loanType, function(loanTypeName) {
                            $loanType.val(loanTypeName);
                        });
                        /* 资金来源 */
                        var sourceFund = dataOrder.sourcesFund ? dataOrder.sourcesFund : '1';
                        $('#capitalSourceSelect').append(self.getCapitalSourceStr(sourceFund));
                        /* 如果经理还未进行审批，且订单状态为待审批，显示审批操作按钮 */
                        // if (!Boolean(dataOrder.bossComments) && Boolean(dataOrder.status == 4)) {
                        //     $('.operate-btn-container').removeClass('hidden');
                        // }
                        // else {
                        //     $('.operate-btn-container').remove();
                        // }
                    },
                    failFunc = function(err) {
                        alert('网络繁忙，请稍后重试！');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getOrderDetail.htm', jsonData, successFunc, failFunc);
            },
            /* 填写贷款类型 */
            fillLoanType: function(loanTypeVal, fillCallbackFunc) {
                var successFunc = function(data) {
                        var roleArr   = data.object,
                            roleCount = roleArr.length;
                        
                        for (var i = 0; i < roleCount; i ++) {
                            if (loanTypeVal == roleArr[i].value) {
                                fillCallbackFunc(roleArr[i].name);
                                break;
                            }
                        }
                    },
                    failFunc = function(err) {
                        console.info(err);
                        $.alert('danger', '网络连接错误，获取贷款类型失败，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantUserRole.htm', {}, successFunc, failFunc);
            },
            // 通过审批
            passApprove: function() {
                var self = this;
                var jsonData = {
                        orderNo     : $.getCookie('orderNo'),
                        bossComments: $('#bossComments').val(),
                        status      : 6
                    },
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            $.alert('success','审批成功');
                            setTimeout(function() {
                                window.history.back(-1);
                            }, 1500);
                        } else {
                            $.alert('danger', '审批通过失败，请稍后重试！');
                        }
                    },
                    failFunc = function(err) {
                        alert('网络繁忙，请稍后重试！');
                    };
                
                if (!self.submitValidation()) {
                    return false;
                }
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/addBossComments.htm', jsonData, successFunc, failFunc);               
            },
            // 驳回
            refuseApprove: function() {
                var self = this;
                var jsonData = {
                        orderNo     : $.getCookie('orderNo'),
                        bossComments: $('#bossComments').val(),
                        status      : 5
                    },
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            $.alert('success','审批成功');
                            setTimeout(function() {
                                window.history.back(-1);
                            }, 1500);
                        } else {
                            $.alert('danger', '审批驳回失败，请稍后重试！');
                        }
                    },
                    failFunc = function(err) {
                        alert('网络繁忙，请稍后重试！');
                    };

                if (!self.submitValidation()) {
                    return false;
                }
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/addBossComments.htm', jsonData, successFunc, failFunc);    
            },
            submitValidation: function() {
                /* 提交验证 */
                var bossComments = $.trim($('#bossComments').val());
                
                if (!bossComments) {
                    $.alert('danger', '审批意见不能为空');
                    return false;
                }
                return true;
            },
            // 资金来源初始化
            capitalSourceInit: function() {
                var self = this,
                    successFunc = function(data) {
                        window.sourceFund = data.object.sourceFund;
                        self.orderDetailInit();
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getSourceFund.htm', {}, successFunc, failFunc);
            },
            getCapitalSourceStr: function(val) {
                var selectStr = '';
                
                for (var key in sourceFund) {
                    var selectedTag = (val == key) ? ' selected="selected" ' : '';
                    
                    selectStr += '<option data-val="' + key + '" ' + selectedTag + '>' + sourceFund[key] + '</option>';
                }

                return selectStr;
            }
        };

    pageObj.init();
})(jQuery)
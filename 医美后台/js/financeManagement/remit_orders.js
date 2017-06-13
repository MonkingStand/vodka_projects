/*
 *  财务管理模块——放款订单列表（总）
 *  remit_order.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.capitalSourceInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;

                /* 筛选按钮切换 */
                $('.filter-item .filter-options .btn').on('click', function() {
                    var $thisItem = $(this).closest('.filter-item');
                    
                    if ($thisItem.hasClass('available')) {
                            if (!$(this).hasClass('active')) {
                                $thisItem.find('.active.btn').removeClass('active');
                                $(this).addClass('active');
                                /* 进行筛选后，订单列表初始化 */
                                var initJsonData = {
                                        begin: 0,
                                        rows: 15
                                    };
                                $('#orderTable').empty().append('<tr class="text-center"><td colspan="13"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                                self.getOrderList(initJsonData);
                            }
                        }
                        else {
                            $.alert('danger', '部分筛选功能完善中...');
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

                /* 点击任意一个订单号，查看订单详情 */
                $('#orderTable').on('click', '.order-detail-link', function() {
                    if ($.checkMenuItemPermission('financeOrder:see')) {
                        var orderNo = $(this).text();

                        /* 暂存订单号到cookie中，用于跳转到详情页后请求后台获取详情 */
                        $.setCookie('orderNo', orderNo, 3600);
                        window.location.href = './remit_detail.html';
                    }
                });

                /* 点击放款按钮放款 */
                $('#orderTable').on('click', '.remit-btn', function() {
                    var jsonData = {
                            orderNo: $(this).attr('data-no'),
                            sourcesFund: parseInt($(this).closest('tr').find('.capital-source-select').find('option:selected').attr('data-val'))
                        };
                    
                    self.remitOrder(jsonData);             
                });
            },
            ordersInit: function() {
                /* 订单列表初始化 */
                var self     = this,
                    jsonData = {
                        begin: 0,
                        rows: 15
                };
                
                self.getOrderList(jsonData);
            },
            getOrderList: function(jsonObj) {
                var self = this,
                    jsonData = self.jsonDataTrans(jsonObj),
                    successFunc = function(data) {
                        var dataArr     = data.content,
                            count       = dataArr.length,
                            domStr      = '',
                            startNo     = parseInt($('#orderTable').attr('data-begin')),
                            remitStatus, remitLabel, remitBtnClass, repayment;

                        if (dataArr.length == 0) {
                            domStr = '<tr class="text-center"><td colspan="13">暂无订单</td></tr>'
                        } else {
                            for (var i = 0; i < count; i ++) {
                                var sourceFund = (dataArr[i].status == 7) ? self.capitalSourceTrans(dataArr[i].sourcesFund) : self.getCapitalSourceStr(dataArr[i].sourcesFund);

                                    remitStatus   = $.orderStatusTrans(dataArr[i].status).text;
                                    remitLabel    = (dataArr[i].status == 7) ? 'label-success' : 'label-warning';
                                    remitBtnClass = (dataArr[i].status == 7) ? 'click-ban' : '';
                                    repayment     = (dataArr[i].status == 7) ? (dataArr[i].donePeriod + '/' + dataArr[i].period) : '-';

                                    domStr += '<tr>' +
                                                    '<td>' + (startNo + i) + '</td>' +
                                                    '<td><a class="order-detail-link">' + dataArr[i].orderNo + '</a></td>' +
                                                    '<td>' + dataArr[i].obtainUserName + '</td>' +
                                                    '<td>' + dataArr[i].obtainUserMobile + '</td>' +
                                                    '<td>' + dataArr[i].merchantName + '</td>' +
                                                    '<td>' + dataArr[i].realName + '</td>' +
                                                    '<td>' + sourceFund + '</td>' +
                                                    '<td>' + parseFloat(dataArr[i].verifyCapital).toFixed(2) + '</td>' +
                                                    '<td>' + dataArr[i].period + '个月</td>' +
                                                    '<td><span class="label ' + remitLabel + '">' + remitStatus + '</span></td>' +
                                                    '<td>' + repayment + '</td>' +
                                                    '<td>' + dataArr[i].refundDate + '</td>' +
                                                    '<td><button class="' + remitBtnClass + ' btn btn-primary btn-xs remit-btn" data-no="' + dataArr[i].orderNo + '">放款</button></td>' +
                                                '</tr>';
                                }
                        }  
                
                    $('#orderTable').empty().append(domStr);

                    if ($('#pager').hasClass('init')) {
                            $('#pager').smartpaginator({
                                totalrecords: data.count, 
                                recordsperpage: 15, 
                                length: 5,
                                controlsalways: true, 
                                onchange: function (newPage) {
                                    var tmpJsonData = {
                                            begin: ((parseInt(newPage) - 1) * 15),
                                            rows : 15
                                        };
                                    $('#orderTable').empty().append('<tr class="text-center"><td colspan="13"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                                    self.getOrderList(tmpJsonData);
                                }
                            });
                            $('#pager').removeClass('init');
                        }
                    },
                    failFunc = function(err) {
                        alert('网络繁忙，请稍后重试！');
                        console.info(err);
                    };

                /* 设置table中订单的编号 */
                $('#orderTable').attr('data-begin', (parseInt(jsonObj.begin) + 1));
                // $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getFinanceOrderList.htm', jsonObj, successFunc, failFunc);
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + jsonData.interfaceName, jsonData, successFunc, failFunc);
            },
            remitOrder: function(jsonObj) {
                var self = this,
                    successFunc = function(data) {
                        if (data.status == 'fail') {
                            $.alert('danger', data.message);
                        }
                        else {
                            /* 订单列表初始化 */
                            var jsonData = {
                                    begin: 0,
                                    rows: 15
                                };
                            
                            $('#pager').empty().addClass('init');
                            self.getOrderList(jsonData);
                        }
                    },
                    failFunc = function(err) {
                        alert('网络繁忙，请稍后重试！');
                    };

                    if (confirm("确定要放款吗？")) {
                        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/updateFinanceCreditStatus.htm', jsonObj, successFunc, failFunc);
                    }  
            },
            capitalSourceInit: function() {
                var self = this,
                    successFunc = function(data) {
                        window.sourceFund = data.object.sourceFund;
                        self.ordersInit();
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getSourceFund.htm', {}, successFunc, failFunc);
            },
            getCapitalSourceStr: function(val) {
                var selectStr = '<select class="form-control capital-source-select">';
                
                for (var key in sourceFund) {
                    var selectedTag = (val == key) ? ' selected="selected" ' : '';
                    
                    selectStr += '<option data-val="' + key + '" ' + selectedTag + '>' + sourceFund[key] + '</option>';
                }

                selectStr += '</select>';

                return selectStr;
            },
            capitalSourceTrans: function(val) {
                return sourceFund[val]
            },
            jsonDataTrans: function(pageJsonObj) {
                var jsonData = {
                        begin        : pageJsonObj.begin,
                        rows         : pageJsonObj.rows,
                        /* 默认获取医美的订单 */
                        interfaceName: '/loanOrder/getFinanceOrderList.htm'
                    },
                    filterList = {
                        interfaceList: {
                            '2': '/loanOrder/getFinanceOrderList.htm',
                            '4': '/vehicleLoanOrder/financeVehicleLoanOrderList.htm'
                        }
                    };
                
                $('.filter-item.available').each(function() {
                    var filterType = $(this).attr('data-filterType'),
                        filterVal  = $(this).find('.btn.active').attr('data-' + filterType);
                    
                    switch(filterType) {
                        case 'loanType':
                            jsonData.interfaceName = filterList.interfaceList[filterVal];
                            break;
                    }
                });

                return jsonData;
            }
        };

    pageObj.init();
})(jQuery)
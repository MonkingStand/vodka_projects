/*
 *  财务管理模块——逾期订单列表（总）
 *  remit_orders_overdue.html
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
                    if ($.checkMenuItemPermission('overdueOrder:see')) {
                        var orderNo = $(this).text();

                        /* 暂存订单号到cookie中，用于跳转到详情页后请求后台获取详情 */
                        $.setCookie('orderNo', orderNo, 3600);
                        window.location.href = './remit_detail.html';
                    }
                });
            },
            orderListInit: function() {
                /* 预期账单列表初始化 */
                var self = this,
                    jsonData = {
                        begin: 0,
                        rows : 15
                    };
                
                self.getOrderList(jsonData);
            },
            getOrderList: function(jsonObj) {
                var self = this,
                    jsonData = self.jsonDataTrans(jsonObj),
                    successFunc = function(data) {
                        var orderArr      = data.content,
                            orderCount    = orderArr.length,
                            orderStr      = '',
                            startNo       = parseInt($('#orderTable').attr('data-begin'));
                        
                        if (orderCount == 0) {
                            orderStr = '<tr class="text-center"><td colspan="13">暂无订单</td></tr>';
                        }
                        else {
                            for (var i = 0; i < orderCount; i ++) {
                                var orderObj      = orderArr[i],
                                    overdueStatus = '<div><span class="label label-warning">第' + orderObj.periodRank + '期逾期</span></div><span class="divide-space"></span>',
                                    operateBtns   = '--';
                                // 判断订单状态
                                switch (String(orderObj.payStatus)) {
                                    case '4':
                                        overdueStatus += '<div>' +
                                                            '<span class="label label-success">已还</span>' +
                                                        '</div>';
                                        break;
                                    case '-2':
                                        overdueStatus += '<div>' +
                                                            '<span class="label label-danger">已逾期7天以上</span>' +
                                                        '</div>';
                                        break;
                                    case '-4':
                                        overdueStatus = '<div>' +
                                                            '<span class="label label-danger">已逾期15天以上</span>' +
                                                        '</div>';
                                        break;
                                    case '-6':
                                        overdueStatus = '<div>' +
                                                            '<span class="label label-danger">已逾期30天以上</span>' +
                                                        '</div>';
                                        break;
                                    case '-9':
                                        overdueStatus = '<div>' +
                                                            '<span class="label label-danger">坏账</span>' +
                                                        '</div>' ;
                                        break;
                                }
                                
                                orderStr += '<tr>' +
                                                '<td>' + (startNo + i) + '</td>' +
                                                '<td><a class="order-detail-link">' + orderObj.orderNo + '</a></td>' +
                                                '<td>' + orderObj.obtainUserName + '</td>' +
                                                '<td>' + orderObj.obtainUserMobile + '</td>' +
                                                '<td>' + orderObj.merchantName + '</td>' +
                                                '<td>' + orderObj.realName + '</td>' +
                                                '<td>' + self.sourceFundTrans(orderObj.sourcesFund) + '</td>' +
                                                '<td>' + parseFloat(orderObj.verifyCapital).toFixed(2) + '</td>' +
                                                '<td>' + orderObj.period + '个月</td>' +
                                                '<td>' + overdueStatus + '</td>' +
                                                '<td>' + orderObj.overdue + '天</td>' +
                                                '<td>' + orderObj.instalmentLatefee + '</td>' +
                                                '<td>' + operateBtns + '</td>' +
                                            '</tr>';
                            }
                        }

                        setTimeout(function() {
                            $('#orderTable').empty().append(orderStr);
                        }, 1000);

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
                        $.alert('danger', '网络连接出错，请稍后重试');
                    };
                
                /* 设置table中订单的编号 */
                $('#orderTable').attr('data-begin', (parseInt(jsonObj.begin) + 1));
                // $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/financeOverdue.htm', jsonObj, successFunc, failFunc);
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + jsonData.interfaceName, jsonData, successFunc, failFunc);
            },
            capitalSourceInit: function() {
                var self = this,
                    successFunc = function(data) {
                        window.sourceFund = data.object.sourceFund;
                        self.orderListInit();
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getSourceFund.htm', {}, successFunc, failFunc);
            },
            sourceFundTrans: function(val) {
                return sourceFund[val];
            },
            jsonDataTrans: function(pageJsonObj) {
                var jsonData = {
                        begin        : pageJsonObj.begin,
                        rows         : pageJsonObj.rows,
                        /* 默认获取医美的订单 */
                        interfaceName: '/loanOrder/financeOverdue.htm'
                    },
                    filterList = {
                        interfaceList: {
                            '2': '/loanOrder/financeOverdue.htm',
                            '4': '/vehicleLoanOrder/financeOverdueVehicleLoanOrderList.htm'
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
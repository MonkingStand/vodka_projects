/*
 *  风险评估模块
 *  preloan_risk.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.orderListInit();
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
                            $('#orderTable').empty().append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
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

                
                /* 订单列表中，点击任意一个订单编号，跳到订单详情，显示对应订单的详情 */
                $('#orderTable').on('click', '.order-detail-link', function() {
                    if ($.checkMenuItemPermission('order:detail')) {
                        var orderNo  = $(this).text(),
                            loanType = $('.filter-item[data-filterType="loanType"]').find('.active.btn').attr('data-loanType');
                        
                        $.setCookie('orderNo', orderNo, 3600);
                        window.location.href = 'preloan_risk_detail.html?loanType=' + loanType;
                    }
                });
                
            },
            orderListInit: function() {
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
                        var dataArr = data.content,
                            count   = dataArr.length,
                            domStr  = '',
                            startNo = parseInt($('#orderTable').attr('data-begin'));
                        
                        if (count == 0) {
                            domStr = '<tr class="text-center"><td colspan="10">暂无订单</td></tr>';
                        }
                        else {
                            for (var i = 0; i < count; i ++) {
                                var statusObj   = $.orderStatusTrans(dataArr[i].status),
                                    orderStatus = '<td class="order-status text-center ' + statusObj.textColor + '"><i class="fa ' + statusObj.textIcon + '"></i> ' + statusObj.text + '</td>';

                                domStr += '<tr>' + 
                                            '<td>' + (startNo + i) + '</td>' +
                                            '<td><a class="order-detail-link">' + dataArr[i].orderNo + '</a></td>' +
                                            '<td>' + $.formatTime(dataArr[i].createDate, 'full') + '</td>' +
                                            '<td>' + dataArr[i].obtainUserName + '</td>' +
                                            '<td>' + dataArr[i].obtainUserMobile + '</td>' +
                                            '<td>' + (dataArr[i].merchantName ? dataArr[i].merchantName : '--') + '</td>' +
                                            '<td>' + parseFloat(dataArr[i].applyCapital).toFixed(2) + '</td>' +
                                            '<td>' + dataArr[i].period + '</td>' +
                                                orderStatus +
                                            '<td> - </td>' +
                                        '</tr>';
                            }
                        }

                        setTimeout(function() {
                            $('#orderTable').empty().append(domStr);
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
                                    $('#orderTable').empty().append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                                    self.getOrderList(tmpJsonData);
                                }
                            });
                            $('#pager').removeClass('init');
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络繁忙，请稍后重试！');
                        console.info(err);
                    };

                /* 设置table中订单的编号 */
                $('#orderTable').attr('data-begin', (parseInt(jsonObj.begin) + 1));
                // $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getCheckOrderList.htm', jsonObj, successFunc, failFunc);
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + jsonData.interfaceName, jsonData, successFunc, failFunc);
            },
            jsonDataTrans: function(pageJsonObj) {
                var jsonData = {
                        begin        : pageJsonObj.begin,
                        rows         : pageJsonObj.rows,
                        /* 默认获取医美的订单 */
                        interfaceName: '/loanOrder/getCheckOrderList.htm'
                    },
                    filterList = {
                        interfaceList: {
                            '2': '/loanOrder/getCheckOrderList.htm',
                            '4': '/vehicleLoanOrder/vehicleRiskAssessmentOrderList.htm'
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
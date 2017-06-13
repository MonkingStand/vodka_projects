/* 
 *  财务管理模块——订单详情
 *  remit_detail.html
 */
(function($) {
    var pageObj = {
        init: function() {
            this.domListener();
            this.loanFormInit();
            this.capitalSourceInit();
        },
        domListener: function() {
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

            /* 打印凭证 */
            $('#formPrint').on('click', function() {
                var options = {
                        cssLink:[
                            { url: defaultConfig.domain + defaultConfig.project + '/third/bootstrap/css/bootstrap.min.css' },
                            { url: defaultConfig.domain + defaultConfig.project + '/css/common.css' }
                        ],
                        cssStr: '' +
                            'td:not([colspan]) {' +
                                'width: 167px;' +
                            '}' +
                            '.filled-val {' +
                                'color: #666;' +
                                'font-weight: lighter;' +
                            '}' +
                            '.table-bordered{border:1px solid #000}' +
                            '.table-bordered td,.table-bordered th{border:1px solid #000!important}' +
                            '.table-bordered>tbody>tr>td,.table-bordered>tbody>tr>th,.table-bordered>tfoot>tr>td,.table-bordered>tfoot>tr>th,.table-bordered>thead>tr>td,.table-bordered>thead>tr>th{border:1px solid #000}'
                    },
                    processFunc = function(originBodyHtmlStr) {
                        var regExp = /<a.*href=.*\/a>/g,
                            result = originBodyHtmlStr.replace(regExp, '--').replace('合同链接：', '--');
                        
                        return result;
                    };
                $.print('#printContainer', options, processFunc);
            });
        },
        orderDetailInit: function() {
            var self = this,
                jsonData = {
                    orderNo: $.getCookie('orderNo')
                },
                successFunc = function(data) {
                    var dataOrderInfo       = data.object.orderInfo,
                        dataInstalmentList  = data.object.instalmentList,
                        dataInstalmentCount = dataInstalmentList ? dataInstalmentList.length : 0,
                        instalmentArr       = '';

                    $('.submit-input').each(function() {
                        var id = $(this).attr('id');

                        $(this).val(dataOrderInfo[id]);
                    });
                    // 本金金额
                    $('#applyCapital').val(parseFloat($('#applyCapital').val()).toFixed(2));
                    // 资金来源
                    $('#sourceFundText').val(self.capitalSourceTrans(dataOrderInfo.sourcesFund));
                    // 订单状态
                    $('#orderStatus').val($.orderStatusTrans(dataOrderInfo.status).text);
                    // 还款状态
                    $('#refundInfo').val((dataOrderInfo.refundedPeriod ? dataOrderInfo.refundedPeriod : 0) + '/' + dataOrderInfo.period);
                    // 用户分期订单显示
                    if (dataInstalmentCount > 0) {
                        for (var i = 0; i < dataInstalmentCount; i++) {
                            var tempObj          = dataInstalmentList[i],
                                truelyRefundDate = (tempObj.a != '') ? '' : '',
                                repayStatus      = '',
                                //操作按钮，TODO
                                operateBtns      = '--';
                            switch (String(tempObj.payStatus)) {
                                case '0':
                                    repayStatus = '<div>' +
                                                        '<span class="label label-warning">未支付</span>' +
                                                    '</div>' +
                                                    '<span class="divide-space"></span>' +
                                                    '<div>' +
                                                        '<span class="label label-success">未逾期</span>' +
                                                    '</div>';
                                    break;
                                case '2':
                                    repayStatus = '<div>' +
                                                        '<span class="label label-success">已支付</span>' +
                                                    '</div>' +
                                                    '<span class="divide-space"></span>' +
                                                    '<div>' +
                                                        '<span class="label label-success">未逾期</span>' +
                                                    '</div>';
                                    break;
                                case '4':
                                    repayStatus = '<div>' +
                                                        '<span class="label label-success">已支付</span>' +
                                                    '</div>' +
                                                    '<span class="divide-space"></span>' +
                                                    '<div>' +
                                                        '<span class="label label-danger">已逾期</span>' +
                                                    '</div>';
                                    break;
                                case '-2':
                                    repayStatus = '<div>' +
                                                        '<span class="label label-danger">未支付</span>' +
                                                    '</div>' +
                                                    '<span class="divide-space"></span>' +
                                                    '<div>' +
                                                        '<span class="label label-danger">已逾期7天以上</span>' +
                                                    '</div>';
                                    break;
                                case '-4':
                                    repayStatus = '<div>' +
                                                        '<span class="label label-danger">未支付</span>' +
                                                    '</div>' +
                                                    '<span class="divide-space"></span>' +
                                                    '<div>' +
                                                        '<span class="label label-danger">已逾期15天以上</span>' +
                                                    '</div>';
                                    break;
                                case '-6':
                                    repayStatus = '<div>' +
                                                        '<span class="label label-danger">未支付</span>' +
                                                    '</div>' +
                                                    '<span class="divide-space"></span>' +
                                                    '<div>' +
                                                        '<span class="label label-danger">已逾期30天以上</span>' +
                                                    '</div>';
                                    break;
                                case '-9':
                                    repayStatus = '<div>' +
                                                        '<span class="label label-danger">坏账</span>' +
                                                    '</div>' ;
                                    break;
                                default: 
                                    repayStatus = '--';
                            }

                            instalmentArr += '<tr>' +
                                                '<td>' + (i + 1) + '</td>' +
                                                '<td>' + tempObj.periodRank + '/' + tempObj.period + '</td>' +
                                                '<td>' + tempObj.realName + '</td>' +
                                                '<td>' + parseFloat(tempObj.instalmentCapital).toFixed(2) + '</td>' +
                                                '<td>' + parseFloat(tempObj.instalmentInterest).toFixed(2) + '</td>' +
                                                '<td>' + parseFloat(tempObj.loanInterestMerchant).toFixed(2) + '</td>' +
                                                '<td>' + parseFloat(tempObj.shouldPay).toFixed(2) + '</td>' +
                                                '<td>' + parseFloat(tempObj.capitalInterest).toFixed(2) + '</td>' +
                                                '<td>' + parseFloat(tempObj.instalmentLatefee).toFixed(2) + '</td>' +
                                                '<td>' + $.formatTime(tempObj.instalmentRefundDate) + '</td>' +
                                                '<td>' + (tempObj.payTime ? $.formatTime(tempObj.payTime) : '--') + '</td>' +
                                                '<td>' + repayStatus + '</td>' +
                                                '<td>' + operateBtns + '</td>' +
                                            '</tr>';
                        }

                        $('#refundRecordTable').empty().append(instalmentArr);
                    }
                },
                failFunc = function(err) {
                    $.alert('danger', '网络繁忙，请稍后重试！');
                    console.info(err);
                };
            
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getOrderInfoDetial.htm', jsonData, successFunc, failFunc);
        },
        loanFormInit: function() {
            /* 分期消费放款单初始化 */
            var jsonData = {
                    orderNo: $.getCookie('orderNo')
                },
                successFunc = function(data) {
                    console.log('loanForm', data)
                    var loanFormData   = data.object,
                        interestTotal  = parseFloat(loanFormData.loanInterestMerchant) + parseFloat(loanFormData.loanInterestObtainFinal),
                        contractAmount = parseFloat(loanFormData.verifyCapital) + interestTotal,
                        collectAmount  = parseFloat(loanFormData.verifyCapital),
                        repayAmountAll = parseFloat(loanFormData.verifyCapital) + parseFloat(loanFormData.loanInterestObtainFinal);
                    
                    /* 自动填写信息 */
                    $.autoFillData(loanFormData, 'remit_');
                    /* 填写银行名称（带支行） */
                    var branchName = loanFormData.merchantBankBranchname ? ('（' + loanFormData.merchantBankBranchname + '）') : '';
                    $('#remit_bankNameWithBranch').text(loanFormData.merchantBankName + branchName);
                    /* 填写合同链接 */
                    $('#remit_contractLink').attr('href', loanFormData.contractPdf)
                    /* 甲方信息 */
                    $('#remit_partyA').text('胡慧慧');
                    $('#remit_partyAID').text('330727197704302928');
                    /* 填写合同金额 */
                    $('#remit_contractAmount').text(contractAmount);
                    /* 填写客户还款总金额 */
                    $('#remit_repayAmountAll').text(repayAmountAll);
                    /* 填写支付金额（放款金额 - 商户服务费） */
                    $('#remit_collectAmount').text(collectAmount);
                    /* 期数加单位“期” */
                    $('#remit_period').text($('#remit_period').text() + '期');
                    /* 填写总服务费 */
                    $('#remit_loanInterest').text(interestTotal);
                    /* 利率添加百分号 */
                    var merchantRate = parseFloat($('#remit_loanInterestRateMerchant').text()).toFixed(4),
                        obtainRate   = parseFloat($('#remit_loanInterestRateObtain').text()).toFixed(4),
                        totalRate    = (parseFloat(merchantRate) + parseFloat(obtainRate)).toFixed(4);
                    $('#remit_loanInterestRate').text(totalRate + '%');
                    $('#remit_loanInterestRateMerchant').text(merchantRate + '%');
                    $('#remit_loanInterestRateObtain').text(obtainRate + '%');
                    /* 金额相关的保留2位小数 */
                    $('.amount-val').each(function() {
                        var thisVal = parseFloat($(this).text()).toFixed(2);

                        $(this).text(thisVal);
                    });
                },
                failFunc = function(err) {
                    $.alert('danger', '网络繁忙，请稍后重试！');
                    console.info(err);
                };
            
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/findConsumeCreditOrder.htm', jsonData, successFunc, failFunc);
        },
        capitalSourceInit: function() {
            var self = this,
                successFunc = function(data) {
                    window.sourceFund = data.object.sourceFund;
                    self.orderDetailInit();  //订单详情初始化();
                },
                failFunc = function(err) {
                    $.alert('danger', '网络连接出错，请稍后重试！');
                };
            
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getSourceFund.htm', {}, successFunc, failFunc);
        },
        capitalSourceTrans: function(val) {
            return sourceFund[val]
        }
    };
      
    pageObj.init();
})(jQuery)
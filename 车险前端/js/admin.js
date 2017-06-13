/* 基础默认配置 */
var defaultConfig = {
    domain : 'http://' + document.URL.split('/')[2],
	project: '',
    ossPre : 'http://znzzc-vodka-insurance-online.oss-cn-shanghai.aliyuncs.com'
    // ossPre : 'http://znzzc-vodka-insurance-develop.oss-cn-shanghai.aliyuncs.com'
};

/* 公共通用方法 */
(function($) {
    /****************************
     * 通用的公共js方法
     *****************************/
    /* 通用ajax调用模块 */
    $.ajaxAction = function(requestUrl, jsonData, successCallback, failCallback) {
        $.ajax({
            url     : requestUrl,
            type    : 'post',
            dataType: 'json',
            data    : jsonData,
            success : function(data) {
                successCallback(data);
            },
            error   : function(error) {
                failCallback(error);
            }
        })
    };
    /* 时间格式转换，现阶段只使用两种格式：带时分秒和不带，默认返回不带时分秒的 */
    $.formatTime = function(dateStr, formatType) {
        var dateVal    = (String(dateStr).indexOf('-') == -1 && String(dateStr).indexOf('.') == -1) ? parseInt(dateStr) : dateStr,
            date       = new Date(dateVal),

            timeMonth  = (String((parseInt(date.getMonth()) + 1)).length == 1) ? ('0' + (parseInt(date.getMonth()) + 1)) : (parseInt(date.getMonth()) + 1),
            timeDay    = (String(parseInt(date.getDate())).length == 1) ? ('0' + (parseInt(date.getDate()))) : (parseInt(date.getDate())),
            timeLeft   = date.getFullYear() + '-' + timeMonth + '-' + timeDay,
            
            timeHour   = (String(date.getHours()).length == 1) ? ('0' + date.getHours()) : date.getHours(),
            timeMinute = (String(date.getMinutes()).length == 1) ? ('0' + date.getMinutes()) : date.getMinutes(),
            timeSecond = (String(date.getSeconds()).length == 1) ? ('0' + date.getSeconds()) : date.getSeconds(),
            timeRight  = timeHour + ':' + timeMinute + ':' + timeSecond;
        
        if (formatType && formatType == 'full') {
            /* yyyy-mm-dd hh:mm:ss */
            return (timeLeft + ' ' + timeRight);
        }
        else {
            /* yyyy-mm-dd */
            return timeLeft;
        }
    };
    /* 根据传入的data，遍历页面，自动填写到input中；第二个参数选填，添加前缀，避免冲突 */
    $.autoFill = function(data, addedPrefix) {
        var prefix = (arguments.length == 1) ? '' : addedPrefix;
        if (data) {
            for (var key in data) {
                $('#' + prefix + key).val(data[key]);
            }
        }
    };
    /* 通用的弹出警告框：infoText-要提示的文字信息；infoTitle-要提示小标题（可选） */
    $.alert = function(infoText, infoTitle) {
        var title    = infoTitle ? ('<strong>' + infoTitle + '</strong>') : '',
            alertStr = '<div class="alert alert-danger alert-dismissible customer-alert" role="alert">' +
                            '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
                            title + infoText +
                        '</div>';

        $('body').append(alertStr);
        setTimeout(function() {
            $('.customer-alert').remove();
        }, 2000);
    };
    /****************************
     * 通用的业务相关js方法
     *****************************/
    $.statusTrans = function(status) {
        var statusList = {
            '0': '<span class="text-normal label label-primary">待获取保险公司报价</span>',
            '1': '<span class="text-normal label label-warning">用户还未投保支付</span>',
            '2': '<span class="text-normal label label-info">用户已投保支付（待录入保单号）</span>',
            '3': '<span class="text-normal label label-success">投保成功（已录入保单号）</span>'
        }

        return statusList[String(status)];
    };
})(jQuery)

/* js特效初始化（不包括数据） */
var pageEffectsInit = function() {
    /* 订单列表筛选标签页初始化 */
    $('#filterContainer a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
        /* 切换详情页 */
        var thisDetailSelector    = $(this).attr('data-detail'),
            currentDetailSelector = $('#detailContainer').attr('data-detail');
        
        if (thisDetailSelector !== currentDetailSelector) {
            $('#detailContainer').attr('data-detail', thisDetailSelector);
            $('#detailContainer .detail-content.active').removeClass('active').css('display', 'none');
            $(thisDetailSelector).addClass('active').fadeIn();
        }
    });

    /* 录入报价信息的时候，详情部分【信息】和【录入】的collapse初始化 */
    $('#toGetPriceDetailPanelGroup').collapse();
    /* 投保支付成功后，详情部分【信息】和【录入】的collapse初始化 */
    $('#hasPayDetailPanelGroup').collapse();

    /* 保险公司标签页切换初始化 */
    $('#companyToggleContainer a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });

    /* 时间选择插件初始化 */
    $(".form_datetime").datetimepicker({
        format   : 'yyyy-mm-dd',
        language : 'zh-CN',
        autoclose: true,
        minView  : 'month'
    });
};

/* js事件初始化（主要针对需要调用ajax接口进行数据交互的） */
var ajaxListenerInit = function() {
    /* 订单列表切换active的item */
    $('#orderListContent .tab-content').on('click', '.order-item', function() {
        var $orderItem  = $(this),
            $thisList   = $orderItem.closest('.tab-pane'),
            $activeItem = $thisList.find('.order-item.active'),

            orderNo       = $orderItem.attr('data-orderno'),
            ownerNo       = $orderItem.attr('data-ownerno'),
            orderStatus   = $orderItem.attr('data-status'),
            orderType     = $thisList.attr('data-type'),
            orderTypeList = {
                /* 根据订单所属类别，判断并获取详情并渲染到对应的标签页内容上 */
                'toGetPrice': toGetPriceDetail,
                'hasPay'    : hasPayDetail
            };
        
        /* 订单号显示在详情页面 */
        $('#' + orderType + 'Detail').find('.section-title .order-no').text(orderNo);
        /* 订单状态显示在详情页面 */
        $('#' + orderType + 'Detail').find('.section-title .status-container').empty().append($.statusTrans(orderStatus));

        if (!$orderItem.hasClass('active')) {
            $activeItem.removeClass('active');
            $orderItem.addClass('active');
            /* 获取订单详情 */
            orderTypeList[orderType](orderNo, ownerNo);
        }
    });
    /* 保存对应保险公司的报价 */
    $('.save-price-btn').on('click', function() {
        var orderNo     = $('#toGetPriceList .order-item.active').attr('data-orderno'),
            ownerNo     = $('#toGetPriceList .order-item.active').attr('data-ownerno'),
            companyName = $(this).attr('data-company'),
            btnType     = $(this).attr('data-type'),
            $tabpanel   = $(this).closest('.tab-pane'),
            prefix      = $tabpanel.attr('id') + '_',
            jsonObj     = {
                amount: 0
            },
            submitTag = true;
        
        /* 组织数据，用于保存对应保险公司的报价 */
        $tabpanel.find('.submit-input:not([disabled])').each(function() {
            var tmpId = $(this).attr('id'),
                value = $(this).val();
            
            if (value && value != '0') {
                if (!isNaN(value)) {
                    jsonObj[tmpId.replace(prefix, '')] = Number(value);
                }
            }
            else {
                submitTag = (tmpId === (prefix + 'promotionFee')) ? submitTag : false;
            }
        });
        if (!submitTag) {
            $.alert('存在部分险种报价未填写，或者未填写交强险（商业险）的保单有效期起止时间！')
            return;
        }
        /* 优惠金额重新组织 */
        jsonObj.promotionFee = jsonObj.promotionFee ? Number(jsonObj.promotionFee) : 0;
        /* 计算总金额 */
        for (var key in jsonObj) {
            if (key !== 'promotionFee') {
                jsonObj.amount += jsonObj[key]
            }
        }
        /* 计算实际要交的保费 */
        jsonObj.sumPrem = jsonObj.amount - jsonObj.promotionFee;
        /* 添加订单号等信息 */
        jsonObj.orderId        = orderNo;
        jsonObj.carOwnerInfoId = ownerNo;
        jsonObj.simpleNameEn   = companyName;
        /* 判断是否填写了报价 */
        if (jsonObj.amount === 0) {
            $.alert('请录入当前选中保险公司的报价信息！');
            return;
        }
        /* 起止时间 */
        var tpfStartDate = $('#' + prefix + 'tpfStartDate').val(),
            tpfEndDate   = $('#' + prefix + 'tpfEndDate').val(),
            bizStartDate = $('#' + prefix + 'bizStartDate').val(),
            bizEndDate   = $('#' + prefix + 'bizEndDate').val();
        
        jsonObj.tpfStartDate = tpfStartDate;
        jsonObj.tpfEndDate   = tpfEndDate;
        jsonObj.bizStartDate = bizStartDate;
        jsonObj.bizEndDate   = bizEndDate;
        jsonObj.amount       = Number(parseFloat(jsonObj.amount).toFixed(2));
        jsonObj.sumPrem      = Number(parseFloat(jsonObj.sumPrem).toFixed(2));
        jsonObj.bizPrem      = Number(parseFloat($('#' + prefix + 'bizPrem').val()));
        if (parseFloat(jsonObj.bizPrem + jsonObj.tpfPrem + jsonObj.taxPrem).toFixed(2) != jsonObj.amount) {
            $.alert('录入的商业险价格和计算所得价格有误，请核对后再保存！');
            return;
        }
        /* 判断是计算报价还是保存报价信息 */
        if (btnType == 'count') {
            $('#' + prefix + 'amount').val(jsonObj.amount);
            $('#' + prefix + 'sumPrem').val(jsonObj.sumPrem);
        }
        else {
            savePricePerCompany(jsonObj);
        }
    });
    /* 完成报价 */
    $('#finishPriceBtn').on('click', function() {
        var jsonObj = {
                orderId: $('#toGetPriceList .order-item.active').attr('data-orderno')
            };
        
        finishPrice(jsonObj);
    });
    /* 保存保单号 */
    $('#savePolicyNoBtn').on('click', function() {
        var orderNo = $('#hasPayList .order-item.active').attr('data-orderno');
        
        savePolicyNo(orderNo);
    });
};

/* 数据部分初始化 */
/* 获取待录入报价订单列表 */
var toGetPriceListInit = function() {
    var requestUrl  = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findQuotationNotCompleted.json',
        jsonData    = {},
        successFunc = function(data) {
            var listStr   = '',
                orderList  = data.object,
                orderCount = orderList ? orderList.length : 0;

            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                if (orderCount === 0) {
                    $('#toGetPriceList').empty().addClass('no-order');
                }
                else {
                    for (var i = 0; i < orderCount; i ++) {
                        var activeTag   = (i === 0) ? ' active' : '',
                            orderItem   = orderList[i],
                            orderNo     = orderItem.orderId,
                            ownerNo     = orderItem.carOwnerInfoId,
                            orderStatus = orderItem.payStatus,
                            ownerName   = orderItem.carOwner ? orderItem.carOwner : '--',
                            licenseNo   = orderItem.licenseNo ? orderItem.licenseNo : '--',
                            submitDate  = orderItem.createTime ? $.formatTime(orderItem.createTime, 'full') : '--';
                        
                        listStr += '' +
                                    '<div class="order-item' + activeTag + '" data-orderno="' + orderNo + '" data-ownerno="' + ownerNo + '" data-status="' + orderStatus + '">' +
                                        '<div class="row">' +
                                            '<div class="col-xs-6">' +
                                                '<i class="fa fa-user"></i>&nbsp;' + ownerName +
                                            '</div>' +
                                            '<div class="col-xs-6 text-right">' +
                                                '<i class="fa fa-car"></i>&nbsp;' + licenseNo +
                                            '</div>' +
                                            '<div class="col-xs-12 text-right">' +
                                                '<i class="fa fa-calendar"></i>&nbsp;' + submitDate +
                                            '</div>' +
                                        '</div>' +
                                    '</div>';
                    }

                    toGetPriceDetail(orderList[0].orderId, orderList[0].carOwnerInfoId);
                    /* 订单号显示在详情页面 */
                    $('#toGetPriceDetail').find('.section-title .order-no').text(orderList[0].orderId);
                    /* 订单状态显示在详情页面 */
                    $('#toGetPriceDetail').find('.section-title .status-container').empty().append($.statusTrans(orderList[0].payStatus));
                    
                    $('#toGetPriceList').empty().append(listStr);
                }
            }
        },
        failFunc = function(err) {
            $.alert('获取【待录入报价订单】时网络连接出错，请稍后重试');
            console.info(err);
        };

    $.ajaxAction(requestUrl, jsonData, successFunc, failFunc);
};
/* 获取待录入报价订单详情 */
var toGetPriceDetail = function(orderNo, carOwnerInfoId) {
    var requestUrl = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findOrderDetail.json',
        jsonData   = {
            orderId       : orderNo, 
            carOwnerInfoId: carOwnerInfoId
        },
        successFunc = function(data) {
            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                var carInfo        = data.object[0],
                    userInfo       = data.object[1],
                    insuranceList  = data.object.slice(2);
                
                $.autoFill(carInfo, 'toGetPrice_carInfo_');
                $.autoFill(userInfo, 'toGetPrice_userInfo_');
                /* 是否新车格式转化 */
                $('#toGetPrice_carInfo_newCarTag').val($('#toGetPrice_carInfo_newCarTag').val() == 1 ? '是' : '否');
                /* 是否过户车格式转化 */
                $('#toGetPrice_carInfo_transferFlag').val($('#toGetPrice_carInfo_transferFlag').val() == 1 ? '是' : '否');
                /* 注册日期格式化 */
                $('#toGetPrice_carInfo_createTime').val($.formatTime(carInfo.enrollDate), 'full');
                /* 清空报价输入框 */
                clearQuotation();
                /* 填写险种投保情况 */
                fillInsuranceInfo(insuranceList);
            }
        },
        failFunc = function(err) {
            $.alert('获取【订单详情】时网络连接出错，请稍后重试');
            console.info(err);
        },
        clearQuotation = function() {
            $('#cpicCompany .submit-input').val('');
            $('#pinganCompany .submit-input').val('');
            $('#piccCompany .submit-input').val('');

            $('#cpicCompany_promotionFee').val(0);
            $('#pinganCompany_promotionFee').val(0);
            $('#piccCompany_promotionFee').val(0);
        },
        fillInsuranceInfo = function(itemList) {
            /* 填写险种投保信息、填写险种报价信息 */
            var itemCount = itemList.length,
                insuranceList = {
                    '999': 'tpfPrem',                   //交强险
                    '34' : 'premPlastic',               //玻璃险
                    '36' : 'premNaturalLoss',           //自燃损失险
                    'A36': 'premNaturalLossIndemnity',  //自燃损失险不计免赔
                    '63' : 'premCarDamage',             //车损险
                    'A63': 'premCarDamageIndemnity',    //车损险不计免赔
                    '68' : 'premThirdDuty',             //第三方责任险
                    'A68': 'premThirdDutyIndemnity',    //第三方责任险不计免赔
                    '73' : 'premDriverSeat',            //司机座位险
                    'A73': 'premDriverSeatIndemnity',   //司机座位险不计免赔
                    '89' : 'premPassagerSeat',          //乘客座位险
                    'A89': 'premPassagerSeatIndemnity', //乘客座位险不计免赔
                    '74' : 'premRobbery',               //盗抢险
                    'A74': 'premRobberyIndemnity',      //盗抢险不计免赔
                    '75' : 'premScratches'              //划痕险
                };
            
            for (var i = 0; i < itemCount; i ++) {
                var tmpItem  = itemList[i],
                    kindCode = tmpItem.kindCode,
                    amount   = tmpItem.amount;
                
                if (kindCode[0] === 'A' && amount == '0') {
                    /* 是否是不计免赔 */
                    $('#toGetPrice_insurance_' + kindCode).val('不计免赔');
                }
                else {
                    $('#toGetPrice_insurance_' + kindCode).val(amount);
                }
                /* 对于已投保的险种，移除 */
                delete insuranceList[kindCode];
            }
            /* 在报价部分，对于未投保的险种，设置input为disabled */
            //重置，移除disabled属性
            $('#cpicCompany .submit-input').removeAttr('disabled');
            $('#pinganCompany .submit-input').removeAttr('disabled');
            $('#piccCompany .submit-input').removeAttr('disabled');
            for (var key in insuranceList) {
                $('#cpicCompany_' + insuranceList[key]).attr('disabled', 'disabled');
                $('#pinganCompany_' + insuranceList[key]).attr('disabled', 'disabled');
                $('#piccCompany_' + insuranceList[key]).attr('disabled', 'disabled');
            }
            /* 判断交强险是否投保 */
            if ($('#toGetPrice_insurance_999').val() !== '不投保') {
                $('#toGetPrice_insurance_999').val('投保');
            }
            /* 没有保额的险种转换 */
            //机动车损失险
            if ($('#toGetPrice_insurance_63').val() !== '不投保') { $('#toGetPrice_insurance_63').val('投保'); }
            //盗抢险
            if ($('#toGetPrice_insurance_74').val() !== '不投保') { $('#toGetPrice_insurance_74').val('投保'); }
            //自燃险
            if ($('#toGetPrice_insurance_36').val() !== '不投保') { $('#toGetPrice_insurance_36').val('投保'); }
            //玻璃险
            if ($('#toGetPrice_insurance_34').val() !== '不投保') {
                var insuranceVal = $('#toGetPrice_insurance_34').val() == 1 ? '国产' : '进口';

                $('#toGetPrice_insurance_34').val(insuranceVal);
            }
            //划痕险
            if ($('#toGetPrice_insurance_75').val() !== '不投保') { $('#toGetPrice_insurance_75').val('投保'); }
        };
    /* 投保情况初始化 */
    $('#toGetPrice_carAndInsuranceInfo .insurance_').val('不投保');
    /* 计免赔显示初始化 */
    $('#toGetPrice_carAndInsuranceInfo .insuranceA').val('--');
    $.ajaxAction(requestUrl, jsonData, successFunc, failFunc);
};
/* 保存某条订单的某个保险公司报价 */
var savePricePerCompany = function(jsonData) {
    var requestUrl = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/insertQuotationInfo.json',
        successFunc = function(data) {
            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                $.alert(companyList[jsonData.simpleNameEn] + '保存报价成功！');
            }
        },
        failFunc = function(err) {
            $.alert('初始化保险公司报价的时候出错，请稍后重试');
            console.info(err);
        },
        companyList = {
            'TAI_PING_YANG': '【太平洋保险】',
            'PING_AN'      : '【中国平安】',
            'REN_BAO'      : '【中国人民保险】'
        };
    
    if (new Date(jsonData.tpfStartDate) >= new Date(jsonData.tpfEndDate)) {
        $.alert('交强险保单有效期【开始时间】不能大于或等于【结束时间】');
        return;
    }
    if (new Date(jsonData.bizStartDate) >= new Date(jsonData.bizEndDate)) {
        $.alert('商业险保单有效期【开始时间】不能大于或等于【结束时间】');
        return;
    }
    $.ajaxAction(requestUrl, jsonData, successFunc, failFunc);
}
/* 完成报价 */
var finishPrice = function(jsonData) {
    var requestUrl = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/updateQuotationStatus.json',
        successFunc = function(data) {
            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                $.alert('完成报价');
                setTimeout(function() {
                    location.reload();
                }, 1500);
            }
        },
        failFunc = function(err) {
            $.alert('提交报价的时候出错，请稍后重试');
            console.info(err);
        };
    
    $.ajaxAction(requestUrl, jsonData, successFunc, failFunc);
};

/* 获取已投保支付订单列表 */
var hasPayListInit = function() {
    var requestUrl  = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findPaySuccessOrderList.json',
        jsonData    = {},
        successFunc = function(data) {
            var listStr   = '',
                orderList  = data.object,
                orderCount = orderList ? orderList.length : 0;

            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                if (orderCount === 0) {
                    $('#hasPayList').empty().addClass('no-order');
                }
                else {
                    for (var i = 0; i < orderCount; i ++) {
                        var activeTag  = (i === 0) ? ' active' : '',
                            orderItem  = orderList[i],
                            orderNo     = orderItem.orderId,
                            ownerNo     = orderItem.carOwnerInfoId,
                            orderStatus = orderItem.payStatus,
                            ownerName  = orderItem.carOwner ? orderItem.carOwner : '--',
                            licenseNo  = orderItem.licenseNo ? orderItem.licenseNo : '--',
                            submitDate = orderItem.createTime ? $.formatTime(orderItem.createTime, 'full') : '--';
                        
                        listStr += '' +
                                    '<div class="order-item' + activeTag + '" data-orderno="' + orderNo + '" data-ownerno="' + ownerNo + '" data-status="' + orderStatus + '">' +
                                        '<div class="row">' +
                                            '<div class="col-xs-6">' +
                                                '<i class="fa fa-user"></i>&nbsp;' + ownerName +
                                            '</div>' +
                                            '<div class="col-xs-6 text-right">' +
                                                '<i class="fa fa-car"></i>&nbsp;' + licenseNo +
                                            '</div>' +
                                            '<div class="col-xs-12 text-right">' +
                                                '<i class="fa fa-calendar"></i>&nbsp;' + submitDate +
                                            '</div>' +
                                        '</div>' +
                                    '</div>';
                    }

                    hasPayDetail(orderList[0].orderId, orderList[0].carOwnerInfoId);
                    /* 订单号显示在详情页面 */
                    $('#hasPayDetail').find('.section-title .order-no').text(orderList[0].orderId);
                    /* 订单状态显示在详情页面 */
                    $('#hasPayDetail').find('.section-title .status-container').empty().append($.statusTrans(orderList[0].payStatus));

                    $('#hasPayList').empty().append(listStr);
                }
            }
        },
        failFunc = function(err) {
            $.alert('获取【已录入报价订单】时网络连接出错，请稍后重试');
            console.info(err);
        };

    $.ajaxAction(requestUrl, jsonData, successFunc, failFunc);
};
/* 获取已录入报价订单详情（第一部分）：车辆信息、险种信息 */
var hasPayDetail = function(orderNo, carOwnerInfoId) {
    var requestUrl = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findOrderDetail.json',
        jsonData   = {
            orderId       : orderNo, 
            carOwnerInfoId: carOwnerInfoId
        },
        successFunc = function(data) {
            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                var carInfo        = data.object[0],
                    userInfo       = data.object[1],
                    insuranceList  = data.object.slice(2);
                
                $.autoFill(carInfo, 'hasPay_carInfo_');
                $.autoFill(userInfo, 'hasPay_userInfo_');
                /* 是否新车格式转化 */
                $('#hasPay_carInfo_newCarTag').val($('#hasPay_carInfo_newCarTag').val() == 1 ? '是' : '否');
                /* 是否过户车格式转化 */
                $('#hasPay_carInfo_transferFlag').val($('#hasPay_carInfo_transferFlag').val() == 1 ? '是' : '否');
                /* 注册日期格式化 */
                $('#hasPay_carInfo_createTime').val($.formatTime(carInfo.enrollDate), 'full');
                /* 填写险种投保情况 */
                fillInsuranceInfo(insuranceList);
                /* 填写已投保支付的订单的投保信息 */
                hasPayInsuranceDetail(orderNo, userInfo.carOwner, carOwnerInfoId);
            }
        },
        failFunc = function(err) {
            $.alert('获取【订单详情】时网络连接出错，请稍后重试');
            console.info(err);
        },
        fillInsuranceInfo = function(itemList) {
            /* 填写险种投保信息、填写险种报价信息 */
            var itemCount = itemList.length,
                insuranceList = {
                    '999': 'tpfPrem',                   //交强险
                    '34' : 'premPlastic',               //玻璃险
                    '36' : 'premNaturalLoss',           //自燃损失险
                    'A36': 'premNaturalLossIndemnity',  //自燃损失险不计免赔
                    '63' : 'premCarDamage',             //车损险
                    'A63': 'premCarDamageIndemnity',    //车损险不计免赔
                    '68' : 'premThirdDuty',             //第三方责任险
                    'A68': 'premThirdDutyIndemnity',    //第三方责任险不计免赔
                    '73' : 'premDriverSeat',            //司机座位险
                    'A73': 'premDriverSeatIndemnity',   //司机座位险不计免赔
                    '89' : 'premPassagerSeat',          //乘客座位险
                    'A89': 'premPassagerSeatIndemnity', //乘客座位险不计免赔
                    '74' : 'premRobbery',               //盗抢险
                    'A74': 'premRobberyIndemnity',      //盗抢险不计免赔
                    '75' : 'premScratches'              //划痕险
                };
            
            for (var i = 0; i < itemCount; i ++) {
                var tmpItem  = itemList[i],
                    kindCode = tmpItem.kindCode,
                    amount   = tmpItem.amount;
                
                if (kindCode[0] === 'A' && amount == '0') {
                    /* 是否是不计免赔 */
                    $('#hasPay_insurance_' + kindCode).val('不计免赔');
                }
                else {
                    $('#hasPay_insurance_' + kindCode).val(amount);
                }
                /* 对于已投保的险种，移除 */
                delete insuranceList[kindCode];
            }
            /* 判断交强险是否投保 */
            if ($('#hasPay_insurance_999').val() !== '不投保') {
                $('#hasPay_insurance_999').val('投保');
            }
            /* 没有保额的险种转换 */
            //机动车损失险
            if ($('#hasPay_insurance_63').val() !== '不投保') { $('#hasPay_insurance_63').val('投保'); }
            //盗抢险
            if ($('#hasPay_insurance_74').val() !== '不投保') { $('#hasPay_insurance_74').val('投保'); }
            //自燃险
            if ($('#hasPay_insurance_36').val() !== '不投保') { $('#hasPay_insurance_36').val('投保'); }
            //玻璃险
            if ($('#hasPay_insurance_34').val() !== '不投保') {
                var insuranceVal = $('#hasPay_insurance_34').val() == 1 ? '国产' : '进口';

                $('#hasPay_insurance_34').val(insuranceVal);
            }
            //划痕险
            if ($('#hasPay_insurance_75').val() !== '不投保') { $('#hasPay_insurance_75').val('投保'); }
        };
    /* 投保情况初始化 */
    $('#hasPay_carAndInsuranceInfo .insurance_').val('不投保');
    /* 计免赔显示初始化 */
    $('#hasPay_carAndInsuranceInfo .insuranceA').val('--');
    $.ajaxAction(requestUrl, jsonData, successFunc, failFunc);
};
/* 获取已录入报价订单详情（第二部分）：投保信息——保险公司选择情况、保费金额、保单邮寄地址、用户资料附件（身份证、行驶证图片）、保单号（或输入框） */
var hasPayInsuranceDetail = function(orderNo, carOwner, carOwnerInfoId) {
    var requestUrl = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findSuccessOrderInfo.json',
        jsonData   = {
            orderId: orderNo
        },
        successFunc = function(data) {
            console.info(data);
            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                var dataObj = data.object[0];

                $.autoFill(dataObj, 'hasPay_insuranceInfo_');
                /* 投保车主 */
                $('#hasPay_insuranceInfo_carOwner').val(carOwner);
                /* 后台无法取得amount，自行计算为优惠前价格 */
                var amount = parseFloat(dataObj.sumPrem) + parseFloat(dataObj.promotionFee);
                $('#hasPay_insuranceInfo_amount').val(amount);
                
                /* 用户资料附件 */
                var prefix = defaultConfig.ossPre;
                
                $('#idCardImgEmblem').attr('href', prefix + '/idCardImgEmblem/idCardImgEmblem_' + carOwnerInfoId + '.jpg');
                $('#idCardImgHead').attr('href', prefix + '/idCardImgHead/idCardImgHead_' + carOwnerInfoId + '.jpg');
                $('#drivingLicenseFirst').attr('href', prefix + '/drivingLicenseFirst/drivingLicenseFirst_' + carOwnerInfoId + '.jpg');
                $('#drivingLicenseSecond').attr('href', prefix + '/drivingLicenseSecond/drivingLicenseSecond_' + carOwnerInfoId + '.jpg');

                if (!dataObj.policyNo) {
                    $('#savePolicyNoBtn').removeClass('click-ban');
                } else {
                    $('#savePolicyNoBtn').addClass('click-ban');
                }
            }
        },
        failFunc = function(err) {
            $.alert('获取【投保信息】时网络连接出错，请稍后重试');
            console.info(err);
        };
    
    $.ajaxAction(requestUrl, jsonData, successFunc,failFunc);
};
/* 保存保单号 */
var savePolicyNo = function(orderNo) {
    var requestUrl = defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/insertPolicyNo.json',
        jsonData   = {
            orderId : orderNo,
            policyNo: $('#policyNo').val()
        },
        successFunc = function(data) {
            console.info('录入保单号', data);
            if (data.status == 'fail') {
                $.alert(data.message);
            }
            else {
                $.alert('录入保单号成功!');
                setTimeout(function() {
                    location.reload();
                }, 1000);
            }
        },
        failFunc = function(err) {
            $.alert('保存保单号时网络连接出错，请稍后重试');
            console.info(err);
        };
    
    if (!jsonData.policyNo) {
        $.alert('请输入保单号！');
        return;
    }
    $.ajaxAction(requestUrl, jsonData, successFunc,failFunc);
};

/* 初始化 */
pageEffectsInit();
ajaxListenerInit();
toGetPriceListInit();
hasPayListInit();
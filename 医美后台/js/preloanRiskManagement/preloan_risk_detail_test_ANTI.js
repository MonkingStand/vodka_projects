/*
 *  风险评估模块——订单详情
 *  preloan_risk_detail.html
 *  详细的风控报告（测试），包含同盾风控报告所有risk_item，用于测试
 */
(function($) {
    var pageObj = {
            init: function() {
                this.orderDetailInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;

                /* 查看反欺诈报告 */
                $('#antiCheatingModalLink').on('click', function() {
                    self.viewAntiReport($(this).attr('data-applylogid'));
                });

                /* 审核通过 */
                $('#checkPass').on('click', function() {
                    self.passCheck();
                });
                
                /* 审核驳回 */
                $('#checkRefuse').on('click', function() {
                    self.refuseCheck();
                });
            },
            orderDetailInit: function() {
                var jsonData = {
                        orderNo: $.getCookie('orderNo')
                    },
                    successFunc = function(data) {
                        console.info(data);
                        /* 如果订单状态为4，即审核通过，不让其再进行操作！ */
                        if (data.object.orderDetail.status == '4') {
                            $('.operate-btn-container').remove();
                        }
                        else {
                            $('.operate-btn-container').removeClass('hidden');
                        }
                        /* 自动填写信息到页面上 */
                        $.autoFillData(data.object.orderDetail);
                        $.autoFillData(data.object.userInfo);
                        /* 时间格式化显示 */
                        $('#effectiveDate').val($.formatTime($('#effectiveDate').val()));
                        /* 申请贷款金额格式化显示 */
                        $('#applyCapital').val(parseFloat($('#applyCapital').val()).toFixed(2));
                        /* 还款方式显示（后台传回数据为0、1） */
                        $('#refundType').val(($('#refundType').val() == '0') ? '等额本息' : '等额本金');
                        /* 实名认证结果转换显示 */
                        $('#realCheck').val(($('#refundType').val() == '0') ? '未实名' : '已实名');
                        /* 暂存风控报告的id，用于后续查看 */
                        $('#antiCheatingModalLink').attr('data-applylogid', data.object.orderDetail.applyLogId);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络繁忙，请稍后重试！');
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getOrderDetail.htm', jsonData, successFunc, failFunc);
            },
            viewAntiReport: function(applyLogId) {
                /* 获取反欺诈报告并显示（同盾风控） */
                var self = this,
                    jsonData = {
                        applyLogId: applyLogId
                    },
                    successFunc = function(data) {
                        if (data.status == 'fail') {
                            $.alert('danger', '获取反欺诈报告失败，请稍后重试！');
                        }
                        else {
                            /* 风控报告状态 */
                            $('#antiCheatingModal #anti_cheating_message').val(data.message);
                            /* 风控报告基本信息 */
                            self.antiBaseInfo(data.object);
                            /* 归属地解析： */
                            if (data.object.address_detect) {
                                self.addressDetect(data.object.address_detect);
                            }
                            /* 风险评估项目 */
                            if (data.object.risk_items.length >= 1) {
                                self.renderRiskItems(data.object.risk_items);
                            }
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '获取反欺诈报告失败，请稍后重试！');
                        console.log(err);
                    };
                
                if ($('#antiCheatingModal').hasClass('init')) {
                    $('#antiCheatingModal').removeClass('init');
                    // $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/report.htm', jsonData, successFunc, failFunc);
                    successFunc(testData);
                }
            },
            antiBaseInfo: function(baseInfoObj) {
                var finalDecision = '';
                if (baseInfoObj.final_decision == 'Accept') {
                    finalDecision = '建议通过';
                }
                else if (baseInfoObj.final_decision == 'Review') {
                    finalDecision = '建议继续审核';
                }
                else if (baseInfoObj.final_decision == 'Reject') {
                    finalDecision = '建议驳回';
                }
                /* 风控报告基本信息 */
                $('#antiCheatingModal #anti_cheating_apply_time').val($.formatTime(new Date(baseInfoObj.apply_time)));
                $('#antiCheatingModal #anti_cheating_final_score').val(baseInfoObj.final_score);
                $('#antiCheatingModal #anti_cheating_final_decision').val(finalDecision);
            },
            addressDetect: function(addressObj) {
                /* 归属地解析 */
                $('#antiCheatingModal #anti_cheating_id_card_address').val(addressObj.id_card_address);
                $('#antiCheatingModal #anti_cheating_mobile_address').val(addressObj.mobile_address);
            },
            renderRiskItems: function(riskItemsArr) {
                /* 风控报告显示 */
                var self    = this,
                    riskStr = '';
                
                for (var i = 0; i < riskItemsArr.length; i ++) {
                    switch(riskItemsArr[i].group) {
                        case '个人信息核查':
                            riskStr += self.riskItem1(riskItemsArr[i]);
                            break;
                        case '不良信息扫描':
                            riskStr += self.riskItem2(riskItemsArr[i]);
                            break;
                        case '多平台借贷申请检测':
                            riskStr += self.riskItem3(riskItemsArr[i]);
                            break;
                        case '关联人信息扫描':
                            riskStr += self.riskItem4(riskItemsArr[i]);
                            break;
                        case '客户行为检测':
                            riskStr += self.riskItem5(riskItemsArr[i]);
                            break;
                        case '个人基本信息核查':
                            riskStr += self.riskItem6(riskItemsArr[i]);
                            break;
                    }
                }

                setTimeout(function() {
                    $('#antiCheatingRiskItems').empty().append(riskStr);
                }, 1000);
            },
            riskItem1: function(riskObj) {
                /*
                 *  group: 个人信息核查 
                 */
                var self       = this,
                    index      = parseInt($('#antiCheatingRiskItems').attr('data-panelcount')),
                    levelObj   = self.levelTrans(riskObj.risk_level),
                    itemStr    = '<div class="panel panel-default">' +
                                    '<div class="panel-heading" role="tab" id="itemTitle' + index + '">' +
                                        '<h4 class="panel-title">' +
                                        '<span class="label ' + levelObj.className + '">风险等级：' + levelObj.text + '</span>' +
                                            '<a data-toggle="collapse" data-parent="#antiCheatingRiskItems" href="#itemContent' + index + '" aria-expanded="false" aria-controls="itemContent' + index + '">' +
                                                riskObj.group + '（' + riskObj.item_name + '）' +
                                            '</a>' +
                                        '</h4>' +
                                    '</div>' +
                                    '<div id="itemContent' + index + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="itemTitle' + index + '">' +
                                        '<div class="panel-body">' +
                                        '<div class="panel-body-header">【检测结果】：一代身份证</div>' +
                                        '</div>' +
                                    '</div>' +
                                 '</div>';
                
                $('#antiCheatingRiskItems').attr('data-panelcount', (index + 1));
                return itemStr;             
            },
            riskItem2: function(riskObj) {
                /*
                 *  group: 不良信息扫描
                 */
                var self       = this,
                    index      = parseInt($('#antiCheatingRiskItems').attr('data-panelcount')),
                    levelObj   = self.levelTrans(riskObj.risk_level),
                    detailList = self.overdueListTrans(riskObj.item_detail),
                    itemStr    = '<div class="panel panel-default">' +
                                    '<div class="panel-heading" role="tab" id="itemTitle' + index + '">' +
                                        '<h4 class="panel-title">' +
                                            '<span class="label ' + levelObj.className + '">风险等级：' + levelObj.text + '</span>' +
                                            '<a class="collapsed" data-toggle="collapse" data-parent="#antiCheatingRiskItems" href="#itemContent' + index + '" aria-expanded="true" aria-controls="itemContent' + index + '">' +
                                                riskObj.group + '（' + riskObj.item_name + '）' +
                                            '</a>' +
                                        '</h4>' +
                                    '</div>' +
                                    '<div id="itemContent' + index + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="itemTitle' + index + '">' +
                                        '<div class="panel-body">' +
                                            '<div class="panel-body-header">【统计】不良信用次数统计：' + riskObj.item_detail.discredit_times + '</div>' +
                                            '<div class="detail-list">' +
                                                detailList +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</div>';
                
                $('#antiCheatingRiskItems').attr('data-panelcount', (index + 1));
                return itemStr;                
            },
            riskItem3: function(riskObj) {
                /*
                 *  group: 多平台借贷申请检测
                 */
                var self       = this,
                    index      = parseInt($('#antiCheatingRiskItems').attr('data-panelcount')),
                    levelObj   = self.levelTrans(riskObj.risk_level),
                    detailList = self.listTrans(riskObj.item_detail.platform_detail),
                    itemStr    = '<div class="panel panel-default">' +
                                    '<div class="panel-heading" role="tab" id="itemTitle' + index + '">' +
                                        '<h4 class="panel-title">' +
                                        '<span class="label ' + levelObj.className + '">风险等级：' + levelObj.text + '</span>' +
                                            '<a data-toggle="collapse" data-parent="#antiCheatingRiskItems" href="#itemContent' + index + '" aria-expanded="false" aria-controls="itemContent' + index + '">' +
                                                riskObj.group + '（' + riskObj.item_name + '）' +
                                            '</a>' +
                                        '</h4>' +
                                    '</div>' +
                                    '<div id="itemContent' + index + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="itemTitle' + index + '">' +
                                        '<div class="panel-body">' +
                                        '<div class="panel-body-header">【平台统计】借贷申请平台总数：' + riskObj.item_detail.platform_count + '</div>' +
                                            '<div class="detail-list">' +
                                                detailList +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                 '</div>';
                
                $('#antiCheatingRiskItems').attr('data-panelcount', (index + 1));
                return itemStr;
            },
            riskItem4: function(riskObj) {
                /*
                 *  group: 关联人信息扫描
                 */
                var self       = this,
                    index      = parseInt($('#antiCheatingRiskItems').attr('data-panelcount')),
                    levelObj   = self.levelTrans(riskObj.risk_level),
                    detailList = self.overdueListTrans(riskObj.item_detail),
                    itemStr    = '<div class="panel panel-default">' +
                                    '<div class="panel-heading" role="tab" id="itemTitle' + index + '">' +
                                        '<h4 class="panel-title">' +
                                        '<span class="label ' + levelObj.className + '">风险等级：' + levelObj.text + '</span>' +
                                            '<a data-toggle="collapse" data-parent="#antiCheatingRiskItems" href="#itemContent' + index + '" aria-expanded="false" aria-controls="itemContent' + index + '">' +
                                                riskObj.group + '（' + riskObj.item_name + '）' +
                                            '</a>' +
                                        '</h4>' +
                                    '</div>' +
                                    '<div id="itemContent' + index + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="itemTitle' + index + '">' +
                                        '<div class="panel-body">' +
                                        '<div class="panel-body-header">【失信统计】关联人失信次数：' + riskObj.item_detail.discredit_times + '</div>' +
                                            '<div class="detail-list">' +
                                                detailList +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                 '</div>';
                
                $('#antiCheatingRiskItems').attr('data-panelcount', (index + 1));
                return itemStr;
            },
            riskItem5: function(riskObj) {
                /*
                 *  group: 客户行为检测
                 *  可能需要判断是否有data这个字段
                 */
                var self          = this,
                    index         = parseInt($('#antiCheatingRiskItems').attr('data-panelcount')),
                    levelObj      = self.levelTrans(riskObj.risk_level),
                    panelBodyList = self.mobileRelateListTrans(riskObj.item_detail.frequency_detail_list),
                    itemStr       = '<div class="panel panel-default">' +
                                        '<div class="panel-heading" role="tab" id="itemTitle' + index + '">' +
                                            '<h4 class="panel-title">' +
                                                '<span class="label ' + levelObj.className + '">风险等级：' + levelObj.text + '</span>' +
                                                '<a data-toggle="collapse" data-parent="#antiCheatingRiskItems" href="#itemContent' + index + '" aria-expanded="false" aria-controls="itemContent' + index + '">' +
                                                    riskObj.group + '（' + riskObj.item_name + '）' +
                                                '</a>' +
                                            '</h4>' +
                                        '</div>' +
                                        '<div id="itemContent' + index + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="itemTitle' + index + '">' +
                                            '<div class="panel-body">' +
                                                panelBodyList +
                                            '</div>' +
                                        '</div>' +
                                    '</div>';
                
                $('#antiCheatingRiskItems').attr('data-panelcount', (index + 1));
                return itemStr;
            },
            riskItem6: function(riskObj) {
                /*
                 *  group: 个人基本信息核查
                 *  可能需要判断是否有court_details
                 */
                var self          = this,
                    index         = parseInt($('#antiCheatingRiskItems').attr('data-panelcount')),
                    levelObj      = self.levelTrans(riskObj.risk_level),
                    panelBodyList = self.nameHitListTrans(riskObj.item_detail),
                    itemStr       = '<div class="panel panel-default">' +
                                    '<div class="panel-heading" role="tab" id="itemTitle' + index + '">' +
                                        '<h4 class="panel-title">' +
                                            '<span class="label ' + levelObj.className + '">风险等级：' + levelObj.text + '</span>' +
                                            '<a data-toggle="collapse" data-parent="#antiCheatingRiskItems" href="#itemContent' + index + '" aria-expanded="false" aria-controls="itemContent' + index + '">' +
                                                riskObj.group + '（' + riskObj.item_name + '）' +
                                            '</a>' +
                                        '</h4>' +
                                    '</div>' +
                                    '<div id="itemContent' + index + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="itemTitle' + index + '">' +
                                        '<div class="panel-body">' +
                                            panelBodyList +
                                        '</div>' +
                                    '</div>' +
                                '</div>';
                
                $('#antiCheatingRiskItems').attr('data-panelcount', (index + 1));
                return itemStr;
            },           
            levelTrans: function(level) {
                /* 风险等级转换 */
                var levelObj = {};

                switch(level) {
                    case 'low':
                        levelObj = {
                            className: 'label-success', text: '低'
                        };
                        break;
                    case 'medium':
                        levelObj = {
                            className: 'label-info', text: '中'
                        };
                        break;
                    case 'high':
                        levelObj = {
                            className: 'label-warning', text: '高'
                        };
                        break;
                    default:
                        levelObj = {
                            className: 'label-default', text: '无'
                        };
                }
                
                return levelObj;
            },
            listTrans: function(itemArr) {
                /* 转换成li项目 */
                var count   = itemArr ? itemArr.length : 0,
                    tempStr = '<ul>';

                for (var i = 0; i < count; i ++) {
                    tempStr += '<li>' + itemArr[i] + '</li>';
                }
                tempStr += '</ul>';
                
                return tempStr;
            },
            overdueListTrans: function(overdueObj) {
                /* 不良的信息扫描 */
                var overdueArr = overdueObj.overdue_details,
                    count      = overdueObj.discredit_times,
                    tempStr    = '';
                
                for (var i = 0; i < count; i ++) {
                    tempStr +=  '<ul>' +
                                    '<li>逾期金额：' + overdueArr[i].overdue_amount + '</li>' +
                                    '<li>逾期次数：' + overdueArr[i].overdue_count + '</li>' +
                                    '<li>逾期天数：' + overdueArr[i].overdue_day + '</li>' +
                                '</ul>' +
                                '<hr>'; 
                }

                return tempStr;
            },
            mobileRelateListTrans: function(relateDetailArr) {
                /* 手机号关联身份证个数 */
                var self    = this,
                    count   = relateDetailArr ? relateDetailArr.length : 0;
                    tempStr = '';
                
                for (var i = 0; i < count; i ++) {
                    var detailList = self.listTrans(relateDetailArr[i].data) + '<hr>';
                    tempStr +=  '<div class="panel-body-header">【检测结果】' + relateDetailArr[i].detail + '</div>' +
                                '<div class="detail-list">' +
                                    detailList +
                                '</div>';
                }

                return tempStr;
            },
            nameHitListTrans: function(itemDetail) {
                /* 身份证命中名单 */
                var fraudType  = itemDetail.fraud_type ? itemDetail.fraud_type : '',//欺诈类别，如果有，表示是命中模糊名单
                    courtList  = itemDetail.court_details ? itemDetail.court_details : [],//法院传单列表，如果有，表示是命中欺诈名单
                    courtCount = courtList.length,
                    nameList   = itemDetail.namelist_hit_details,
                    nameCount  = nameList.length,
                    tempStr    = '';
                
                if (!fraudType) {
                    /* 命中模糊名单 */
                    var detailList = '',
                        hitList    = nameList[0].fuzzy_detail_hits,
                        hitCount   = hitList.length;

                    for (var i = 0; i < hitCount; i ++) {
                        detailList += '<ul>' +
                                        '<li>人员姓名：' + hitList[i].fuzzy_name + '</li>' +
                                        '<li>身份证号：' + hitList[i].fuzzy_id_number + '</li>' +
                                        '<li>欺诈类型：' + hitList[i].fraud_type + '</li>' + 
                                      '</ul>' +
                                      '<hr>';
                    }
                    tempStr +=  '<div class="panel-body-header">【命中模糊名单】' + nameList[0].description + '</div>' +
                                '<div class="detail-list">' +
                                    detailList +
                                '</div>';
                }
                else{
                    if (courtCount == 0) {
                        /* 命中关注名单 */
                        var detailList = '';

                        for (var i = 0; i < nameCount; i ++) {
                            detailList += '<ul>' +
                                            '<li>欺诈类型：' + nameList[i].fraud_type + '</li>' +
                                            '<li>命中类型：' + nameList[i].hit_type_displayname + '</li>' +
                                            '<li>规则描述：' + nameList[i].description + '</li>' +
                                          '</ul>' +
                                          '<hr>';
                        }
                        tempStr +=  '<div class="panel-body-header">【命中关注名单】灰名单</div>' +
                                    '<div class="detail-list">' +
                                        detailList +
                                    '</div>';
                    }
                    else {
                        /* 命中欺诈名单 */
                        for (var i = 0; i < nameCount; i ++) {
                            tempStr += '<div class="panel-body-header">【命中欺诈名单】黑名单</div>' +
                                        '<div class="detail-list">' +
                                            '<ul>' +
                                                '<li>欺诈类型：' + nameList[i].fraud_type + '</li>' +
                                                '<li>命中类型：' + nameList[i].hit_type_displayname + '</li>' +
                                                '<li>规则描述：' + nameList[i].description + '</li>' +
                                                '<hr>' +
                                                '<div style="padding-left:15px;">' +
                                                    '<li style="font-weight:bold;">' + nameList[i].court_details[0].fraud_type + '</li>' +
                                                    '<li>姓名：' + nameList[i].court_details[0].name + '</li>' +
                                                    '<li>身份证号：' + nameList[i].court_details[0].id_number + '</li>' +
                                                    '<li>年龄：' + nameList[i].court_details[0].age + '</li>' +
                                                    '<li>性别：' + nameList[i].court_details[0].gender + '</li>' +
                                                    '<li>法院名称：' + nameList[i].court_details[0].court_name + '</li>' +
                                                    '<li>法院所在省份：' + nameList[i].court_details[0].province + '</li>' +
                                                    '<li>归档时间：' + nameList[i].court_details[0].filing_time + '</li>' +
                                                    '<li>执行部门：' + nameList[i].court_details[0].execution_department + '</li>' +
                                                    '<li>法律责任：' + nameList[i].court_details[0].duty + '</li>' +
                                                    '<li>案件情况：' + nameList[i].court_details[0].situation + '</li>' +
                                                    '<li>失信详情：' + nameList[i].court_details[0].discredit_detail + '</li>' +
                                                    '<li>执行编号：' + nameList[i].court_details[0].execution_base + '</li>' +
                                                    '<li>案件号：' + nameList[i].court_details[0].case_number + '</li>' +
                                                '</div>' +
                                            '</ul>' +
                                        '</div>';
                        }
                    }
                }
                
                return tempStr;
            },
            passCheck: function() {
                var jsonData = {
                        orderNo    : $.getCookie('orderNo'),
                        checkRemark: $('#checkRemark').val(),
                        status     : 4
                    },
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            $.alert('success', '审核通过成功！即将返回...');
                            setTimeout(function() {
                                window.history.back(-1);
                            }, 1500);
                        }
                        else {
                            $.alert('danger', '审核通过失败，请稍后重试！');
                            console.info(data.message);
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络繁忙，请稍后重试！');
                        console.info(err);
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/updateOrderStatus.htm', jsonData, successFunc, failFunc);
            },
            refuseCheck: function() {
                var jsonData = {
                        orderNo    : $.getCookie('orderNo'),
                        checkRemark: $('#checkRemark').val(),
                        status     : 3
                    },
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            $.alert('success', '审核驳回成功！即将返回...');
                            setTimeout(function() {
                                window.history.back(-1);
                            }, 1500);
                        }
                        else {
                            $.alert('danger', '审核驳回失败，请稍后重试！');
                            console.info(data.message);
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络繁忙，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/updateOrderStatus.htm', jsonData, successFunc, failFunc);
            }
        };

    pageObj.init();
})(jQuery)

window.testData = {
    status : 'success',
    message: '报告生成成功',
    object : {
        "success": true,
        "final_score": 80,
        "final_decision": "Review",
        "report_id": "ER2015070617512600000001",
        "apply_time": 1436841918368,
        "report_time": 1436842025749,
        "device_type": "web",
        "proxy_info": [{
            "port": "8082",
            "proxyProtocol": "HTTP",
            "proxyType": "HTTP"
        },{
            "port": "8081",
            "proxyProtocol": "PPTP",
            "proxyType": "VPN"
        }],
        "device_info": {
            "accept": "*/*",
            "acceptEncoding": "gzip,deflate,sdch",
            "acceptLanguage": "zh-CN,zh;q=0.8",
            "browser": "chrome",
            "browserType": "chrome",
            "browserVersion": "31.0.1650.63",
            "canvas": "57d1ed3766927be5de7018e7c43db5e4",
            "cookieEnabled": "true",
            "deviceId": "f14fd49ac7da52f751c791ca16391c51",
            "deviceType": "Windows XP",
            "flashEnabled": "true",
            "fontId": "a90699a33ca21b53ae8a4fa16d11829e",
            "fpCookie": "B0F75E91DAF193D39C192D6275F282E09EAF23E240ED347327C712B8BBCDBDEC4DF39C04F05E0C369788A2F483D735889A6BD108DE818070",
            "identifier": "1436805698330-8099812",
            "langRes": "zh-CN^^-^^-^^-^^-",
            "languageRes": "zh-CN^^-^^-^^-^^-",
            "os": "Windows XP",
            "pluginList": "ee52cdfa3df5df56001962d1ed9b6d3c",
            "refer": "http://www.aixuedai.com/user/authentication?refer=reg",
            "referer": "http://www.aixuedai.com/user/authentication?refer=reg",
            "screenRes": "1920^^1080^^72^^color",
            "smartId": "s_8e679e4d305546702c51413a14a43643",
            "softId": "b8cb9b155130972ca833300a65ed4db8",
            "tcpOs": "Windows XP",
            "tokenId": "aixuedaigv7ehqk0aq7sps08bchbes9qv1",
            "trueIp": "116.207.145.134",
            "userAgent": "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36",
            "version": "0.0.3"
        },
        "geo_ip": {
            "ip": "49.74.194.234", // ip地址
            "lip": 826983146, // long 型ip
            "country": "中国", // IP地址所处国家
            "province": "江苏省", // 所在省份
            "city": "南京市", // IP地址所处城市
            "county": "南京市", // IP地址所处区县
            "isp": "电信", // 互联网服务提供商，此处为电信
            "latitude": 32.1008, // 纬度
            "longitude": 118.926 // 经度
        },
        "geo_trueip": {
            "ip": "49.74.194.234", // ip地址
            "lip": 826983146, // long 型ip
            "country": "中国", // IP地址所处国家
            "province": "江苏省", // 所在省份
            "city": "南京市", // IP地址所处城市
            "county": "南京市", // IP地址所处县
            "isp": "电信", // 互联网服务提供商，此处为电信
            "latitude": 32.1008, // 纬度
            "longitude": 118.926 // 经度
        },
        "kunta_call_result": {
            "mobile_id_number_check": [{
                "result": "暂不支持移动手机号相关服务",
                "result_code": "405",
                "id_number": "640223199801016519",
                "flow_charge": false,
                "mobile": "15205153027"
            }]
        },
        "risk_items": [
        {
            "item_id": 1,
            "item_name": "身份证是否是一代身份证",
            "risk_level": "low",
            "group": "个人信息核查"
        },
        {
            "item_id": 2,
            "item_name": "身份证是否出现在信贷逾期名单",
            "risk_level": "high",
            "group": "不良信息扫描",
            "item_detail": {
                "discredit_times": 2,
                "overdue_details": [{
                    "overdue_amount": 3475.0,
                    "overdue_count": 1,
                    "overdue_day": 69
                },{
                    "overdue_amount": 3475.0,
                    "overdue_count": 1,
                    "overdue_day": 69
                }],
                "type": "discredit_count"
            }
        },
        {
            "item_id": 3,
            "item_name": "身份证是否在多平台进行借贷申请",
            "risk_level": "medium",
            "group": "多平台借贷申请检测",
            "item_detail": {
                "platform_detail": ["信贷理财:2"],
                "platform_count": 2,
                "type": "platform_detail"
            }
        },
        {
            "item_id": 3,
            "item_name": "身份证是否在多平台进行借贷申请",
            "risk_level": "medium",
            "group": "多平台借贷申请检测",
            "item_detail": {
                "platform_detail": ["信贷理财:1"],
                "platform_count": 1,
                "platform_detail_dimension": [ //各维度多头详情
                    {
                        "dimension": "借款人手机号个数", //维度名称
                        "detail": ["信贷理财:1"], //维度多头详情
                        "count": 1
                    }, {
                        "dimension": "借款人身份证个数",
                        "detail": ["信贷理财:1"],
                        "count": 1
                    }
                ],
                "type": "platform_detail"
            }
        }, 
        {
            "item_id": 4,
            "item_name": "第一联系人手机号码是否出现在信贷逾期名单",
            "risk_level": "high",
            "group": "关联人信息扫描",
            "item_detail": {
                "discredit_times": 2,
                "overdue_details": [{
                    "overdue_amount": 5628.4,
                    "overdue_count": 2,
                    "overdue_day": 37
                }, {
                    "overdue_amount": 1000,
                    "overdue_count": 1,
                    "overdue_day": 56
                }],
                "type": "discredit_count"
            }
        }, 
        {
            "item_id": 5,
            "item_name": "7天内手机号关联身份证个数",
            "risk_level": "medium",
            "group": "客户行为检测",
            "item_detail": {
                "frequency_detail_list": [{
                    "detail": "手机号关联身份证个数：3",
                    "data": [
                        "354826xxxx",
                        "409798xxxx",
                        "782698xxxx"
                    ]
                },{
                    "detail": "手机号关联身份证个数：4",
                    "data": [
                        "354826xxxx",
                        "409798xxxx",
                        "782698xxxx",
                        "782698xxxx"
                    ]
                }],
                "type": "frequency_detail"
            }
        }, 
        {
            "item_id": 6,
            "item_name": "7天内手机号出现次数过多",
            "risk_level": "medium",
            "group": "客户行为检测",
            "item_detail": {
                "frequency_detail_list": [{
                    "detail": "手机号出现次数：5"
                }],
                "type": "frequency_detail"
            }
        }, 
        {
            "item_name": "身份证命中模糊名单",
            "item_id": 4321,
            "risk_level": "high",
            "group": "个人基本信息核查",
            "item_detail": {
                "namelist_hit_details": [{
                    "fuzzy_detail_hits": [{
                        "fraud_type": "AA模糊名单",
                        "fuzzy_id_number": "341221190103****",
                        "fuzzy_name": "张三"
                    }, {
                        "fraud_type": "AA模糊名单",
                        "fuzzy_id_number": "353451190309****",
                        "fuzzy_name": "李四"
                    }],
                    "description": "规则描述XXX",
                    "type": "fuzzy_list"
                }]
            }
        }, 
        {
            "item_name": "身份证或手机号命中关注名单",
            "item_id": 1234,
            "risk_level": "high",
            "group": "个人基本信息核查",
            "item_detail": {
                "fraud_type": "AA关注名单、BB关注名单、CC关注名单、DD关注名单",
                "namelist_hit_details": [{
                    "fraud_type": "AA关注名单、BB关注名单",
                    "hit_type_displayname": "借款人身份证",
                    "description": "规则描述XXX",
                    "type": "grey_list"
                }, {
                    "fraud_type": "CC关注名单、DD关注名单",
                    "hit_type_displayname": "手机号",
                    "description": "规则描述YYY",
                    "type": "grey_list"
                }]
            }
        }, 
        {
            "item_name": "身份证或手机号命中欺诈名单",
            "item_id": 4321,
            "risk_level": "high",
            "group": "个人基本信息核查",
            "item_detail": {
                "fraud_type": "AA风险名单、法院失信、BB风险名单、法院执行",
                "court_details": [{
                    "fraud_type": "法院失信",
                    "id_number": "15222319910817803X",
                    "name": "张三",
                    "age": "37",
                    "gender": "男",
                    "court_name": "常熟市人民法院",
                    "province": "江苏",
                    "filing_time": "2013年10月17日",
                    "execution_department": "常熟市人民法院",
                    "duty": "被告周宏杰应于本判决发生法律效力之日起七日内归还原告贺启斌借款29500元。",
                    "situation": "已结案",
                    "discredit_detail": "违反财产报告制度",
                    "execution_base": "(2013)熟辛民初字第0014号",
                    "case_number": "(2013)熟辛执字第00400号"
                }, {
                    "fraud_type": "法院执行",
                    "id_number": "15222319910817803X",
                    "name": "张三",
                    "age": "37",
                    "gender": "男",
                    "court_name": "常熟市人民法院",
                    "province": "江苏",
                    "filing_time": "2013年10月17日",
                    "execution_department": "常熟市人民法院",
                    "duty": "被告周宏杰应于本判决发生法律效力之日起七日内归还原告贺启斌借款29500元。",
                    "situation": "已结案",
                    "discredit_detail": "违反财产报告制度",
                    "execution_base": "(2013)熟辛民初字第0014号",
                    "case_number": "(2013)熟辛执字第00400号"
                }],
                "namelist_hit_details": [{
                    "fraud_type": "AA风险名单、法院失信",
                    "hit_type_displayname": "借款人身份证",
                    "description": "规则描述XXX",
                    "type": "black_list",
                    "court_details": [{
                        "fraud_type": "法院失信",
                        "id_number": "15222319910817803X",
                        "name": "张三",
                        "age": "37",
                        "gender": "男",
                        "court_name": "常熟市人民法院",
                        "province": "江苏",
                        "filing_time": "2013年10月17日",
                        "execution_department": "常熟市人民法院",
                        "duty": "被告周宏杰应于本判决发生法律效力之日起七日内归还原告贺启斌借款29500元。",
                        "situation": "已结案",
                        "discredit_detail": "违反财产报告制度",
                        "execution_base": "(2013)熟辛民初字第0014号",
                        "case_number": "(2013)熟辛执字第00400号"
                    }]
                }, {
                    "fraud_type": "BB关注名单、法院执行",
                    "hit_type_displayname": "手机号",
                    "description": "规则描述YYY",
                    "type": "black_list",
                    "court_details": [{
                        "fraud_type": "法院执行",
                        "id_number": "15222319910817803X",
                        "name": "张三",
                        "age": "37",
                        "gender": "男",
                        "court_name": "常熟市人民法院",
                        "province": "江苏",
                        "filing_time": "2013年10月17日",
                        "execution_department": "常熟市人民法院",
                        "duty": "被告周宏杰应于本判决发生法律效力之日起七日内归还原告贺启斌借款29500元。",
                        "situation": "已结案",
                        "discredit_detail": "违反财产报告制度",
                        "execution_base": "(2013)熟辛民初字第0014号",
                        "case_number": "(2013)熟辛执字第00400号"
                    }]
                }]
            }
        }],
        "address_detect": {
            "id_card_address": "河南省漯河市临颍县", // 身份证地址
            "mobile_address": "浙江省杭州市", // 手机号地址
            "true_ip_address": "河南省漯河市", // IP地址
            "wifi_address": "河南省漯河市临颍县城关镇迎宾路", // wifi地址
            "cell_address": "河南省漯河市临颍县城关镇迎宾路", // 基站地址
            "bank_card_address": "农行北京分行" // 银行卡地址
        }
    }
}
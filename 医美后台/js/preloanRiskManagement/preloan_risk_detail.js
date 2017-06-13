/*
 *  风险评估模块——订单详情
 *  preloan_risk_detail.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.orderDetailInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;

                /* 查看用户上传的照片 */
                $('#attachmentModalLink').on('click', function() {
                    if ($.checkMenuItemPermission('image:see')) {
                        $('#attachmentModal').modal('toggle');
                    }
                });

                /* 查看反欺诈报告（已生成） */
                $('#antiCheatingModalLink').on('click', function() {
                    if ($.checkMenuItemPermission('deCheat:see')) {
                        if ($(this).hasClass('has-created')) {
                            $('#antiCheatingModal').modal();
                            self.viewAntiReport($(this).attr('data-applylogid'));
                        }
                        else {
                            $.alert('danger', '用户还未提交申请，对应的反欺诈报告还未生成！');
                        }
                    }
                });

                /* 查看运营商报告 */
                $('#mobileServicerModalLink').on('click', function() {
                    if ($.checkMenuItemPermission('mobileOperator:see')) {
                        var userId = $(this).attr('data-userid');
                        if ($(this).hasClass('init')) {
                            self.viewMobileServerReport(userId);
                        }
                    }
                });

                /* 审核通过 */
                $('#checkPass').on('click', function() {
                    if ($.checkMenuItemPermission('option:add')) {
                        if (!$.isEmpty('#checkRemark', '审核意见')) {
                            self.passCheck();
                        }
                    }
                });
                
                /* 审核驳回 */
                $('#checkRefuse').on('click', function() {
                    if ($.checkMenuItemPermission('option:add')) {
                        if (!$.isEmpty('#checkRemark', '驳回意见')) {
                            self.refuseCheck();
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
                        var dataOrder    = data.object.orderDetail,
                            dataUserInfo = data.object.userInfo,
                            $loanType    = $('#loanType');

                        /* 如果订单状态是0，表示用户还未提交申请，添加tag，提示对应的反欺诈报告还未生成 */
                        if (data.object.orderDetail.status != '0') {
                            $('#antiCheatingModalLink').addClass('has-created');
                        }

                        /* 如果订单状态为4，即审核通过，不让其再进行操作！ */
                        /* 如果订单状态为3，即审核驳回，也不让其再进行操作！ */
                        /* 订单状态为1、5、6、7，同样不允许再进行操作 */
                        if (data.object.orderDetail.status == '0' || data.object.orderDetail.status == '4' || data.object.orderDetail.status == '3' || data.object.orderDetail.status == '1' || data.object.orderDetail.status == '5' || data.object.orderDetail.status == '6' || data.object.orderDetail.status == '7') {
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
                        var realCheck = $('#realCheck').val();
                        $('#realCheck').val($.realCheck(realCheck, ['tongdunHeadPic', 'tongdunMobile']));
                        /* 暂存风控报告的id，用于后续查看 */
                        $('#antiCheatingModalLink').attr('data-applylogid', data.object.orderDetail.applyLogId);
                        /* 暂存用户id到运营商报告模态框按钮 */
                        $('#mobileServicerModalLink').attr('data-userid', dataOrder.obtainUserId);
                        /* 初始化时获取一下运营商报告的url */
	                    self.viewMobileServerReport(dataOrder.obtainUserId);
                        /* 贷款类型判断 */
                        self.fillLoanType(dataOrder.loanType, function(loanTypeName) {
                            $loanType.val(loanTypeName);
                        });
                        /* 图片/图片附件显示 */
                        var picArr = '';
                        picArr = '<div class="item active text-center">' +
                                    '<a style="display: inline-block;" target="_blank" href="' + dataOrder.proofImg + '">' +
                                        '<img id="proofImg_show" src="' + dataOrder.proofImg + '?' + Number(new Date()) + '" alt="..." onerror="var $tmp = $(\'#proofImg_show\');$tmp.attr(\'src\', \'../../images/default.png\');$tmp.closest(\'a\').removeAttr(\'href\');">' +
                                    '</a>' +
                                    '<div class="carousel-caption">凭证照片</div>' +
                                '</div>' +
                                '<div class="item text-center">' +
                                    '<a style="display: inline-block;" target="_blank" href="' + dataUserInfo.idCardImgEmblem + '">' +
                                        '<img id="idCardImgEmblem_show" src="' + dataUserInfo.idCardImgEmblem + '?' + Number(new Date()) + '" alt="..." onerror="var $tmp = $(\'#idCardImgEmblem_show\');$tmp.attr(\'src\', \'../../images/default.png\');$tmp.closest(\'a\').removeAttr(\'href\');">' +
                                    '</a>' +
                                    '<div class="carousel-caption">身份证照徽章面</div>' +
                                '</div>' +
                                '<div class="item text-center">' +
                                    '<a style="display: inline-block;" target="_blank" href="' + dataUserInfo.idCardImgHead + '">' +
                                        '<img id="idCardImgHead_show" src="' + dataUserInfo.idCardImgHead + '?' + Number(new Date()) + '" alt="..." onerror="var $tmp = $(\'#idCardImgHead_show\');$tmp.attr(\'src\', \'../../images/default.png\');$tmp.closest(\'a\').removeAttr(\'href\');">' +
                                    '</a>' +
                                    '<div class="carousel-caption">身份证照头像面</div>' +
                                '</div>' +
                                '<div class="item text-center">' +
                                    '<a style="display: inline-block;" target="_blank" href="' + dataUserInfo.idCardImgMan + '">' +
                                        '<img id="idCardImgMan_show" src="' + dataUserInfo.idCardImgMan + '?' + Number(new Date()) + '" alt="..." onerror="var $tmp = $(\'#idCardImgMan_show\');$tmp.attr(\'src\', \'../../images/default.png\');$tmp.closest(\'a\').removeAttr(\'href\');">' +
                                    '</a>' +
                                    '<div class="carousel-caption">手持身份证合照</div>' +
                                '</div>';
                        $('#obtainUserPic').empty().append(picArr);
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
                            self.renderRiskItems(data.object.risk_items);
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '获取反欺诈报告失败，请稍后重试！');
                    };
                
                if ($('#antiCheatingModal').hasClass('init')) {
                    $('#antiCheatingModal').removeClass('init');
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/report.htm', jsonData, successFunc, failFunc);
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
                $('#antiCheatingModal #anti_cheating_apply_time').val($.formatTime(baseInfoObj.apply_time));
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
                var self      = this,
                    riskCount = riskItemsArr.length,
                    riskStr   = '';
                
                if (riskCount == 0) {
                    riskStr += self.riskItem0();
                }
                else {
                    for (var i = 0; i < riskCount; i ++) {
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
                }

                setTimeout(function() {
                    $('#antiCheatingRiskItems').empty().append(riskStr);
                }, 1000);
            },
            riskItem0: function() {
                /*
                 *  当risk_item为0项时
                 */
                var itemStr = '<div class="panel panel-default">' +
                                 '<div class="panel-heading" role="tab" id="itemTitle0">' +
                                     '<h4 class="panel-title">' +
                                         '<span class="label label-success">风险等级：低</span>' +
                                         '<a data-toggle="collapse" data-parent="#antiCheatingRiskItems" href="#itemContent0" aria-expanded="true" aria-controls="itemContent0">' +
                                             '风险检测概览' +
                                         '</a>' +
                                     '</h4>' +
                                    '</div>' +
                                    '<div id="itemContent0" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="itemTitle0">' +
                                        '<div class="panel-body">' +
                                        '<div class="panel-body-header">【检测结果】：无风险检测项目</div>' +
                                        '</div>' +
                                    '</div>' +
                                 '</div>';
                
                return itemStr;  
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
                    detailList = riskObj.item_detail ? self.overdueListTrans(riskObj.item_detail) : '',
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
                                            '<div class="panel-body-header">【统计】不良信用次数统计：' + (riskObj.item_detail.discredit_times ? riskObj.item_detail.discredit_times : 0) + '</div>' +
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
                    detailList = riskObj.item_detail.platform_detail ? self.listTrans(riskObj.item_detail.platform_detail) : '',
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
                    detailList = riskObj.item_detail ? self.overdueListTrans(riskObj.item_detail) : '',
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
                    panelBodyList = riskObj.item_detail.frequency_detail_list ? self.mobileRelateListTrans(riskObj.item_detail.frequency_detail_list) : '',
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
                    panelBodyList = riskObj.item_detail ? self.nameHitListTrans(riskObj.item_detail) : '',
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
                    nameList   = itemDetail.namelist_hit_details ? itemDetail.namelist_hit_details : [],
                    nameCount  = nameList.length,
                    tempStr    = '';
                
                if (!fraudType && nameCount != 0) {
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
            /* 获取运营商报告（链接跳转） */
            viewMobileServerReport: function(userId) {
                var jsonData = {
                        obtainUserId: userId
                    },
                    successFunc = function(data) {
                        console.log(data)
                        if (data.status == 'success') {
                            if (data.object) {
                                if (data.object.reportUrl) {
                                    // 魔蝎数据处于安全考虑，无法嵌入到iframe中
                                    // $('#mobileServicerModal').find('iframe').attr('src', data.object.reportUrl);
                                    // $('#mobileServicerModal').modal();
                                    // 拦截了
                                    // window.open(data.object.reportUrl, '_blank');
                                    $('#mobileServicerModalLink').attr({
                                        'href'  : data.object.reportUrl,
                                        'target': '_blank'
                                    }).removeClass('init');
                                }
                                else {
                                    $.alert('danger', '手机号运营商报告还未生成，请稍后重试');
                                }
                            }
                            else {
                                $.alert('danger', '用户还未进行手机号运营商授权，请联系用户！');
                            }
                        }
                        else {
                            $.alert('danger', '网络连接出错，请稍后重试');
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络繁忙，请稍后重试！');
                        console.info(err);
                    };
                    
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/moxie/carrier/getReportDetail.htm', jsonData, successFunc, failFunc);
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
            passCheck: function() {
                var self = this,
                    jsonData = self.jsonDataTrans({
                        orderNo    : $.getCookie('orderNo'),
                        checkRemark: $('#checkRemark').val(),
                        status     : 4
                    }),
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

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + jsonData.interfaceName, jsonData, successFunc, failFunc);
            },
            refuseCheck: function() {
                var self = this,
                    jsonData = self.jsonDataTrans({
                        orderNo    : $.getCookie('orderNo'),
                        checkRemark: $('#checkRemark').val(),
                        status     : 3
                    }),
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

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + jsonData.interfaceName, jsonData, successFunc, failFunc);
            },
            jsonDataTrans: function(defaultJsonObj) {
                //TODO
                var loanType      = $.getParameter('loanType'),
                    jsonData      = defaultJsonObj,
                    interfaceList = {
                        '2': '/loanOrder/updateOrderStatus.htm',
                        //TODO，等接口
                        '4': '/loanOrder/updateOrderStatus.htm'
                    };
                
                jsonData.interfaceName = interfaceList[loanType];
                // switch(loanType) {
                //     case '2':
                //         jsonData.interfaceName = interfaceList['2'];
                //         break;
                //     case '4':
                //         jsonData.interfaceName = interfaceList['4'];
                //         break;
                // }

                return jsonData;
            }
        };

    pageObj.init();
})(jQuery)
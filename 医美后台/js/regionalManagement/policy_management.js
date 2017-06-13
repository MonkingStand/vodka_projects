/*
 *  商户管理模块——策略管理
 *  policy_management.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.policyListInit();
                this.merchantLevelInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;

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

                /* 新增策略 */
                $('#addPolicyBtn').on('click', function() {
                    if ($.checkMenuItemPermission('interest:add')) {
                        $('#policyAddModal').modal('toggle');
                    }
                });

                /* 停用、启用策略 */
                $('.policy-management-container').on('click', '.enable-policy', function() {
                    self.enablePolicy($(this).attr('data-no'));
                })
                .on('click', '.disable-policy', function() {
                    self.disablePolicy($(this).attr('data-no'));
                });

                /* 查看策略详情 */
                $('#policyTable').on('click', '.policy-detail-link', function() {
                    self.viewPolicyDetail($(this).attr('data-index'));
                });

                /* 新增策略 */
                $('#policyAddModal #savePolicyBtn').on('click', function() {
                    self.addPolicy();
                });
            },
            policyListInit: function() {
                var jsonData = {
                        begin: 0,
                        rows: 15
                    };

                this.getPolicyList(jsonData);
            },
            merchantLevelInit: function() {
                var self = this,
                    jsonData = {},
                    successFunc = function(data) {
                        var merchantLevelObj = data.object.merchantLevel,
                            merchantLevelStr = '';

                        for (key in merchantLevelObj) {
                            merchantLevelStr += '<option data-val="' + key + '">' + merchantLevelObj[key] + '</option>';
                        }

                        $('#merchantVipLevelSelect').empty().append(merchantLevelStr);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantLevelAndBank.htm', jsonData, successFunc, failFunc);
            },
            getPolicyList: function(jsonObj) {
                var self = this,
                    successFunc = function(data) {
                        /* 策略列表项设置为全局，用于查看某条策略详情 */
                        window.policyArr = data.content;

                        var policyList  = data.content,
                            policyCount = policyList.length,
                            policyStr   = '',
                            startNo     = parseInt($('#policyTable').attr('data-begin'));
                        
                        if (policyCount == 0) {
                            policyStr = '<tr class="text-center"><td colspan="10">暂无策略</td></tr>';
                        }
                        else {
                            for (var i = 0; i < policyCount; i ++) {
                                var policyStatus = '',
                                    operateBtn   = '',
                                    policyRemark = policyList[i].loanPolicyRemark ? policyList[i].loanPolicyRemark : '--';
                                
                                switch(parseInt(policyList[i].loanPolicyStatus)) {
                                    case 0:
                                        policyStatus = '<span class="label label-warning">新增</span>';
                                        operateBtn   = '<button class="btn btn-success btn-xs enable-policy" data-no="' + policyList[i].loanPolicyNo + '">启用</button>';
                                        break;
                                    case 1:
                                        policyStatus = '<span class="label label-success">使用中</span>';
                                        operateBtn   = '<button class="btn btn-danger btn-xs disable-policy" data-no="' + policyList[i].loanPolicyNo + '">停用</button>';
                                        break;
                                    case 2:
                                        policyStatus = '<span class="label label-danger">已停用</span>';
                                        operateBtn   = '<button class="btn btn-success btn-xs enable-policy" data-no="' + policyList[i].loanPolicyNo + '">启用</button>';
                                        break;
                                }

                                policyStr += '<tr><td>' + (startNo + i) + '</td>' +
                                                '<td>' + policyList[i].loanPolicyNo + '</td>' +
                                                '<td>' + policyList[i].merchantVipLevel + '</td>' +
                                                '<td>' + parseFloat(policyList[i].merchantCapitalLimit).toFixed(2) + '</td>' +
                                                '<td>' + policyList[i].merchantPaymentPeriod + '天' + '</td>' +
                                                '<td>' + policyStatus + '</td>' +
                                                '<td>' + policyRemark + '</td>' +
                                                '<td>' + $.formatTime(policyList[i].createTime, 'full') + '</td>' +
                                                '<td><a class="policy-detail-link" data-index="' + i + '">' +
                                                        '<i class="fa fa-search"></i>&nbsp;策略详情' +
                                                '</a></td>' +
                                                '<td>' + operateBtn + '</td>';
                            }
                        }
                        setTimeout(function() {
                            $('#policyTable').empty().append(policyStr);
                        }, 1000);

                        /* 分页插件 */
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
                                    $('#policyTable').empty().append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                                    self.getPolicyList(jsonData);
                                }
                            });
                            $('#pager').removeClass('init');
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                    };
                    
                /* 设置table中策略的编号 */
                $('#policyTable').attr('data-begin', (parseInt(jsonObj.begin) + 1));
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantPolicy/getMerchantPolicyList.htm', jsonObj, successFunc, failFunc);
            },
            enablePolicy: function(policyNo) {
                var self = this,
                    jsonData  = {
                        loanPolicyNo    : policyNo,
                        loanPolicyStatus: 1
                    },
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            var beginVal = $('.smart-pager a.active').text(),
                                jsonData = {
                                    begin: (parseInt($('#policyTable').attr('data-begin')) - 1),
                                    rows : 15
                                };
                            
                            $.alert('success', '修改成功！');
                            self.getPolicyList(jsonData);
                        }
                        else {
                            $.alert('danger', '修改失败！');
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                        console.info(err);
                    };
                
                $('#policyDetailModal').modal('hide');
                $('#policyTable').empty().append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantPolicy/updateMerchantPolicy.htm', jsonData, successFunc, failFunc);
            },
            disablePolicy: function(policyNo) {
                var self = this,
                    jsonData  = {
                        loanPolicyNo    : policyNo,
                        loanPolicyStatus: 2
                    }
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            var beginVal = $('.smart-pager a.active').text(),
                                jsonData = {
                                    begin: (parseInt($('#policyTable').attr('data-begin')) - 1),
                                    rows : 15
                                };
                            
                            $.alert('success', '修改成功！');
                            self.getPolicyList(jsonData);
                        }
                        else {
                            $.alert('danger', '修改失败！');
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                        console.info(err);
                    };
                
                $('#policyDetailModal').modal('hide');
                $('#policyTable').empty().append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantPolicy/updateMerchantPolicy.htm', jsonData, successFunc, failFunc);
            },
            viewPolicyDetail: function(policyIndex) {
                /* 查看某条策略的详细信息 */
                var policyObj     = policyArr[policyIndex],
                    policyStatus  = '',
                    policyLabel   = (policyObj.loanPolicyStatus == 1) ? 'label-success' : 'label-danger',
                    $policyDetail = $('#policyDetailModal');
                
                switch(parseInt(policyObj.loanPolicyStatus)) {
                    case 0:
                        policyStatus = '新增';
                        break;
                    case 1:
                        policyStatus = '使用中';
                        break;
                    case 2:
                        policyStatus = '已停用';
                        break;
                }

                /* 策略说明信息 */
                $policyDetail.find('#policyDetailNo')
                    .removeClass('label-success label-danger')
                    .addClass(policyLabel).text(policyObj.loanPolicyNo);
                $policyDetail.find('#policyDetailStatus').val(policyStatus);
                $policyDetail.find('#policyDetailPeriod').val(policyObj.merchantPaymentPeriod + '天');
                $policyDetail.find('#policyDetailLevel').val(policyObj.merchantVipLevel);
                $policyDetail.find('#policyDetailLimit').val((parseFloat(policyObj.merchantCapitalLimit)).toFixed(2));
                $policyDetail.find('#policyDetailRemark').val(policyObj.loanPolicyRemark);
                /* 策略利率信息 */
                var interestArr   = policyObj.policyInterestrate,
                    interestCount = interestArr.length,

                    theadStr    = '<thead><tr><th>角色类型\\期数</th>',
                    obtainStr   = '<tr><th><span class="role-name">借款用户</span></th>',
                    merchantStr = '<tr><th><span class="role-name">商户</span></th>',
                    tableStr    = '';
                
                for (var i = 0; i < interestCount; i ++) {
                    theadStr    += '<th>' + interestArr[i].period + '</th>';
                    obtainStr   += '<td>' + interestArr[i].loanInterestRateObtain + '%</td>';
                    merchantStr += '<td>' + interestArr[i].loanInterestRateMerchant + '%</td>';
                }
                
                obtainStr   += '</tr>';
                merchantStr += '</tr>';
                tableStr = theadStr + '<tbody>' + obtainStr + merchantStr + '</tbody>';
                $policyDetail.find('#detailTable').empty().append(tableStr);
                /* 策略详情启用/停用策略的按钮设置 */
                var btnClass = (policyObj.loanPolicyStatus == '1') ? 'btn-danger disable-policy' : 'btn-success enable-policy',
                    btnText  = (policyObj.loanPolicyStatus == '1') ? '停用' : '启用';
                $policyDetail.find('#togglePolicyBtn')
                    .removeClass('btn-success btn-danger disable-policy enable-policy')
                    .addClass(btnClass)
                    .attr('data-no', policyObj.loanPolicyNo)
                    .text(btnText);
                $policyDetail.modal();
            },
            addPolicy: function() {
                var self    = this,
                    options = {
                        /* 针对ajax传到后台的数据由数组类型的情况 */
                        contentType: 'application/json'
                    },
                    submitValidation = true,
                    interestArr      = [],
                    jsonData         = {
                        //TODO,userName暂时写死
                        userName             : '12',
                        merchantVipLevel     : parseInt($('#merchantVipLevelSelect').find('option:selected').attr('data-val')),
                        merchantCapitalLimit : parseInt($('#merchantCapitalLimitInput').val()),
                        merchantPaymentPeriod: parseInt($('#merchantPaymentPeriodInput').val()),
                        loanPolicyRemark     : $('#loanPolicyRemark').val()
                    },
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            var jsonData = {
                                    begin: 0,
                                    rows : 15
                                };
                            
                            $.alert('success', '新增策略成功！');
                            $('#pager').empty().addClass('init');
                            self.getPolicyList(jsonData);
                        }
                        else {
                            $.alert('danger', '新增策略失败！');
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试');
                        console.info(err);
                    };
                
                $('.submit-input').each(function() {
                    if (!$(this).val()) {
                        submitValidation = false;
                        return false;
                    }
                });

                if (!submitValidation) {
                    $.alert('danger', '存在未填的栏目，策略无法新增！');
                    return false;
                }

                $('#obtainInterestRate .interest-input').each(function() {
                    var period = $(this).attr('data-period'),
                        loanInterestRateObtain = parseFloat($(this).val()),
                        loanInterestRateMerchant = parseFloat($('#merchantInterestRate .interest-input[data-period="' + period + '"]').val()),
                        tempObj = {
                            period                  : period,
                            loanInterestRateObtain  : loanInterestRateObtain,
                            loanInterestRateMerchant: loanInterestRateMerchant
                        },
                        loanInterestAscription;
                    
                    if (loanInterestRateObtain == '0') {
                        loanInterestAscription = 2;
                    }
                    else if (loanInterestRateMerchant == '0') {
                        loanInterestAscription = 1;
                    }
                    else {
                        loanInterestAscription = 3;
                    }

                    tempObj.loanInterestAscription = loanInterestAscription;

                    interestArr.push(tempObj);
                });

                jsonData.policyInterestrate = interestArr;
                
                $('#policyAddModal').modal('hide');
                $('#policyTable').empty().append('<tr class="text-center"><td colspan="10"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantPolicy/insertMerchantPolicy.htm', JSON.stringify(jsonData), successFunc, failFunc, options);
            }
        };
    
    pageObj.init();
})(jQuery)
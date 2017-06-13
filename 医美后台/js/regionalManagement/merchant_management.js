/*
 *  商户管理模块——商户列表
 *  merchant_management.html
 *  tips：权限最低的咨询师，可能只能查看自己所在的商户的简要信息
 */
(function($) {
    var pageObj = {
            init: function() {
                this.merchantListInit();
                this.merchantLevelAndBankInit();
                this.merchantTypeInit();
                this.provinceListInit();
                this.policyListInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;
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

                /* 链接查看某个商户详情 */
                $('#merchantTable').on('click', '.merchant-detail-link', function() {
                    if ($.checkMenuItemPermission('merchantDetail:see')) {
                        var thisMerchantNo = $(this).attr('data-merchant');

                        /* 商户id暂存到cookie中 */
                        $.setCookie('merchantNo', thisMerchantNo, 3600);

                        window.location.href = './merchant_detail.html';
                    }
                });

                /* 链接查看某个商户的咨询师详情 */
                $('#merchantTable').on('click', '.merchant-user-link', function() {
                    if ($.checkMenuItemPermission('merchantUser:see')) {
                        var thisMerchantNo = $(this).attr('data-merchant');

                        /* 商户id暂存到cookie中 */
                        $.setCookie('merchantNo', thisMerchantNo, 3600);
                        window.location.href = './merchant_user.html';
                    }
                });
                
                /* 新增商户 */
                $('#addMerchantBtn').on('click', function() {
                    if ($.checkMenuItemPermission('merchant:add')) {
                        $('#merchantAddModal').modal('toggle');
                    }
                });

                /* 
                 *  以下部分主要是新增商户的模态框里面的监听事件
                 */
                /* 切换省份显示对应的的市列表 */
                $('#merchantAddModal').on('change', '#provinceSelect', function() {
                    var fatherLevel = $(this).find('option:selected').attr('data-no');
                    
                    /* 区选择列表全部清空 */
                    $('#regionSelect').empty().selectpicker('refresh');
                    self.cityListInit(fatherLevel);
                });
                /* 切换市显示对应的区列表 */
                $('#merchantAddModal').on('change', '#citySelect', function() {
                    var fatherLevel = $(this).find('option:selected').attr('data-no');
                    
                    self.regionListInit(fatherLevel);
                });
                /* 切换区，将对应的区编号自动填写 */
                $('#merchantAddModal').on('change', '#regionSelect', function() {
                    var regionName = $(this).val(),
                        regionNo   = $(this).find('option:selected').attr('data-no');
                    
                    $('#areaNo').val(regionNo).attr('data-name', regionName);
                });
                /* 商户类别的select发生变化的时候，将对应的value值填入对应的input中 */
                $('#merchantAddModal').on('change', '#merchantTypeSelect', function() {
                    var typeVal = $(this).find('option:selected').attr('data-val');
                    
                    $('#merchantType').val(typeVal);
                });
                /* 商户等级的select发生变化的时候，将对应的value值填入对应的input中 */
                $('#merchantAddModal').on('change', '#merchantVipLevelSelect', function() {
                    var levelVal = $(this).find('option:selected').attr('data-val');
                    
                    $('#merchntVipLevel').val(levelVal);
                });
                /* 选择某个银行后，对应的id和name发生更改的 */
                $('#merchantAddModal').on('change', '#merchantBankSelect', function() {
                    var bankId   = $(this).find('option:selected').attr('data-id'),
                        bankName = $(this).val();
                    
                    $('#merchantBankId').val(bankId);
                    $('#merchantBankName').val(bankName);
                });
                /* 选中某条策略后，显示该策略的详情，并将该策略id自动填入对应的input输入框中用于传给后台 */
                $('#merchantAddModal').on('change', '#loanPolicyList', function() {
                    var policyNo    = $(this).find('option:selected').attr('data-no'),
                        policyIndex = $(this).find('option:selected').attr('data-index');
                    
                    self.showPolicyDetail(policyIndex);
                });
                $('#saveMerchantBtn').on('click', function() {
                    if (!$.isEmpty('#merchantName', '商户名字') && !$.isEmpty('#merchantTel', '商户电话') && !$.isEmpty('#merchantTel', '商户银行账户') && !$.isEmpty('#merchantBankUserName', '商户银行用户名') && !$.isEmpty('#merchantAddress', '商户地址')) {
                        if ($('#loanPolicyList').text() != '点击选择商户策略') {
                            self.addMerchant();
                        }
                    }
                });
            },
            merchantListInit: function() {
                var self = this,
                    jsonData = {
                        begin: 0,
                        rows : 15
                    };
                
                self.getMerchantList(jsonData);
            },
            getMerchantList: function(jsonObj) {
                var self = this,
                    successFunc = function(data) {
                        var merchantArr   = data.content,
                            merchantCount = merchantArr.length,
                            merchantStr   = '';
                        
                        if (merchantCount == 0) {
                            merchantStr += '<tr class="text-center"><td colspan="8">暂无商户</td></tr>';
                        }
                        else {
                            for (var i = 0; i < merchantCount; i ++) {
                                merchantStr +=  '<tr>' +
                                                    '<td>' + (i + 1) + '</td>' +
                                                    '<td>' + merchantArr[i].merchantNo + '</td>' +
                                                    '<td>' + merchantArr[i].merchantName + '</td>' +
                                                    '<td>' + merchantArr[i].areaName + '</td>' +
                                                    '<td>' + merchantArr[i].merchantAddress + '</td>' +
                                                    '<td>' + merchantArr[i].merchantType + '</td>' +
                                                    '<td>' + merchantArr[i].merchantVipLevel + '</td>' +
                                                    '<td>' +
                                                        '<button data-merchant="' + merchantArr[i].merchantNo + '" class="merchant-detail-link btn btn-primary btn-xs">查看商户详情</button>' +
                                                        '<button data-merchant="' + merchantArr[i].merchantNo + '" class="merchant-user-link btn btn-primary btn-xs">查看咨询师详情</button>' +
                                                    '</td>' +
                                                '</tr>';
                            }
                        }

                        setTimeout(function() {
                            $('#merchantTable').empty().append(merchantStr);
                        }, 1500);

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
                                    $('#merchantTable').html('').append('<tr class="text-center"><td colspan="8"><i class="fa fa-spinner fa-pulse fa-2x"></i></td></tr>');
                                    self.getMerchantList(jsonData);
                                }
                            });
                            $('#pager').removeClass('init');
                        }
                    },
                    failFunc = function(err) {
                        console.info(err);
                        $.alert('danger', '网络连接错误，请稍后重试！');
                    };
                    
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditMerchant/getCreditMerchantList.htm', jsonObj, successFunc, failFunc);
            },
            merchantLevelAndBankInit: function() {
                var self = this,
                    jsonData = {},
                    successFunc = function(data) {
                        var merchantLevelObj = data.object.merchantLevel,
                            bankArr          = data.object.bank,
                            merchantLevelStr = '', 
                            bankSelectStr    = '';
                            
                        // 商户等级初始化
                        for (key in merchantLevelObj) {
                            merchantLevelStr += '<option data-val="' + key + '">' + merchantLevelObj[key] + '</option>';
                        }
                        $('#merchantVipLevelSelect').empty().append(merchantLevelStr);
                        // 银行列表初始化
                        for (var i = 0; i < bankArr.length; i ++) {
                            bankSelectStr += '<option data-id="' + bankArr[i].bankId + '">' + bankArr[i].bankName + '</option>';
                        }
                        $('#merchantBankSelect').empty().append(bankSelectStr).selectpicker('refresh');
                        $('#merchantBankId').val(bankArr[0].bankId);
                        $('#merchantBankName').val(bankArr[0].bankName);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantLevelAndBank.htm', jsonData, successFunc, failFunc);               
            },
            merchantTypeInit: function() {
                /* 商户类别列表初始化 */
                var successFunc = function(data) {
                        var roleArr         = data.object,
                            roleCount       = roleArr.length,
                            merchantTypeStr = '';
                        
                        for (var i = 0; i < roleCount; i ++) {
                            merchantTypeStr += '<option data-val="' + roleArr[i].value + '">' + roleArr[i].name + '</option>';
                        }
                        $('#merchantTypeSelect').empty().append(merchantTypeStr);
                        $('#merchantType').val(roleArr[0].value);
                    },
                    failFunc = function(err) {
                        console.info(err);
                        $.alert('danger', '网络连接错误，获取贷款类型失败，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantUserRole.htm', {}, successFunc, failFunc);
            },
            provinceListInit: function() {
                /* 全国各省列表初始化 */
                var self = this,
                    jsonData = {
                        fatherLevel: '86'
                    },
                    successFunc = function(data) {
                        var provinceList      = data.content,
                            provinceCount     = provinceList.length,
                            provinceSelectStr = '';
                        
                        for (var i = 0; i < provinceCount; i ++) {
                            var tempObj = provinceList[i];
                            provinceSelectStr += '<option data-no="' + tempObj.areaNo + '">' +
                                                     tempObj.areaName +
                                                 '</option>';
                        }
                        /* 初始化省份列表时，默认选中的区域编号为当前的省 */
                        $('#areaNo').val(provinceList[0].areaNo);
                        $('#areaName').val(provinceList[0].areaName);
                        $('#provinceSelect').empty().append(provinceSelectStr).selectpicker('refresh');
                        /* 默认选中第一个省后，初始化该省的市 */
                        self.cityListInit(provinceList[0].areaNo);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '初始化省份列表失败！');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/dictionary/getCommonAreaList.htm', jsonData, successFunc, failFunc);
            },
            cityListInit: function(fatherLevel) {
                /* 全国各省的市列表初始化 */
                var self = this,
                    jsonData = {
                        fatherLevel: fatherLevel
                    },
                    successFunc = function(data) {
                        var cityList      = data.content,
                            cityCount     = cityList.length,
                            citySelectStr = '';
                        
                        for (var i = 0; i < cityCount; i ++) {
                            var tempObj = cityList[i];
                            citySelectStr +=  '<option data-no="' + tempObj.areaNo + '">' +
                                                    tempObj.areaName +
                                                '</option>';
                        }
                        /* 初始化市列表时，默认选中的区域编号为当前的市 */
                        $('#areaNo').val(cityList[0].areaNo);
                        $('#areaName').val(cityList[0].areaName)
                        $('#citySelect').empty().append(citySelectStr).selectpicker('refresh');
                        /* 默认选中第一个市后，初始化该市的区 */
                        self.regionListInit(cityList[0].areaNo);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '获取市列表失败！');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/dictionary/getCommonAreaList.htm', jsonData, successFunc, failFunc);
            },
            regionListInit: function(fatherLevel) {
                /* 全国各省的市列表初始化 */
                var jsonData = {
                        fatherLevel: fatherLevel
                    },
                    successFunc = function(data) {
                        var regionList      = data.content,
                            regionCount     = regionList.length,
                            regionSelectStr = '';
                        
                        if (regionCount == 0) {
                            regionSelectStr +=  '<option data-no="' + $('#areaNo').val() + '">空</option>';
                        }
                        else {
                            for (var i = 0; i < regionCount; i ++) {
                                var tempObj = regionList[i];
                                regionSelectStr +=  '<option data-no="' + tempObj.areaNo + '">' +
                                                        tempObj.areaName +
                                                    '</option>';
                            }
                            /* 初始化区列表时，默认选中的区域编号为当前的区 */
                            $('#areaNo').val(regionList[0].areaNo);
                            $('#areaNo').attr('data-name', regionList[0].areaName);
                        }

                        $('#regionSelect').empty().append(regionSelectStr).selectpicker('refresh');
                    },
                    failFunc = function(err) {
                        $.alert('danger', '获取市列表失败！');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/dictionary/getCommonAreaList.htm', jsonData, successFunc, failFunc);
            },
            policyListInit: function() {
                /* 初始化策略列表 */
                var self = this,
                    jsonData = {
                        loanPolicyStatus: 1,
                        begin           : 0,
                        rows            : 999
                    },
                    successFunc = function(data) {
                        /* 策略列表项设置为全局，用于查看某条策略详情 */
                        window.policyArr = data.content;
                        
                        var policyList      = data.content,
                            policyCount     = policyList.length,
                            policySelectStr = '<option disabled="disabled" selected="selected">点击选择商户策略</option>';
                        
                        for (var i = 0; i < policyCount; i ++) {
                            var policyRemark = policyList[i].loanPolicyRemark ? policyList[i].loanPolicyRemark : '此策略暂无备注说明';
                            policySelectStr +=  '<option data-no="' + policyList[i].loanPolicyNo + '" data-index="' + i + '">' +
                                                    policyRemark +
                                                '</option>';
                        }

                        $('#loanPolicyList').empty().append(policySelectStr).selectpicker('refresh');
                    },
                    failFunc = function(err) {
                        $.alert('danger', '获取策略列表失败了，请稍后重试！');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantPolicy/getMerchantPolicyList.htm', jsonData, successFunc, failFunc);
            },
            showPolicyDetail: function(policyIndex) {
                /* 显示某条策略的详情 */
                var $addModal = $('#merchantAddModal'),
                    policyObj = policyArr[policyIndex];

                $addModal.find('#loanPolicyNo').val(policyObj.loanPolicyNo);
                $addModal.find('#policyDetailPeriod').val(policyObj.merchantPaymentPeriod + '天');
                $addModal.find('#policyDetailLevel').val(policyObj.merchantVipLevel);
                $addModal.find('#policyDetailLimit').val((parseFloat(policyObj.merchantCapitalLimit)).toFixed(2));

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
                $addModal.find('#detailTable').empty().append(tableStr);

            },
            addMerchant: function() {
                var self = this,
                    jsonData = $.submitObj('.submit-input'),
                    successFunc = function(data) {
                        var jsonData = {
                                begin: 0,
                                rows : 15
                            };
                        
                        if (data.status == 'success') {
                            $('#merchantAddModal').modal('hide');
                            $('#pager').empty().addClass('init');
                            self.getMerchantList(jsonData);
                        }
                        else {
                            $.alert('danger', data.message)
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                        console.info(err);
                    };

                if (!self.addValidation()) {
                    return false;
                }
                
                jsonData['areaName'] = $('#areaNo').attr('data-name');
                jsonData['merchantPolicyUpdatetime'] = new Date();

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditMerchant/insertCreditMerchant.htm', jsonData, successFunc, failFunc);
            },
            addValidation: function() {
                //TODO
                return true;
            }
        };

    pageObj.init();
})(jQuery)
/*
 *  商户管理模块——商户详情
 *  merchant_detail.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.mechantInit();
                this.merchantTypeInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;

                $('#updateMerchant').on('click', function() {
                    if ($.checkMenuItemPermission('merchant:update')) {
                        $('#merchantUpdateModal').modal('toggle');
                    }
                });

                /* 
                 *  以下部分主要是修改商户的模态框里面的监听事件
                 */
                /* 切换省份显示对应的的市列表 */
                $('#merchantUpdateModal').on('change', '#provinceSelect', function() {
                    var fatherLevel = $(this).find('option:selected').attr('data-no');
                    
                    /* 区选择列表全部清空 */
                    $('#regionSelect').empty().selectpicker('refresh');
                    self.cityListInit(fatherLevel);
                });
                /* 切换市显示对应的区列表 */
                $('#merchantUpdateModal').on('change', '#citySelect', function() {
                    var fatherLevel = $(this).find('option:selected').attr('data-no');
                    
                    self.regionListInit(fatherLevel);
                });
                /* 切换区，将对应的区编号自动填写 */
                $('#merchantUpdateModal').on('change', '#regionSelect', function() {
                    var regionName = $(this).val(),
                        regionNo   = $(this).find('option:selected').attr('data-no');
                    
                    $('#areaNo').val(regionNo).attr('data-name', regionName);
                });
                /* 商户类别的select发生变化的时候，将对应的value值填入对应的input中 */
                $('#merchantUpdateModal').on('change', '#merchantTypeSelect', function() {
                    var typeVal = $(this).find('option:selected').attr('data-val');
                    
                    $('#merchantType').val(typeVal);
                });
                /* 商户等级的select发生变化的时候，将对应的value值填入对应的input中 */
                $('#merchantUpdateModal').on('change', '#merchantVipLevelSelect', function() {
                    var levelVal = $(this).find('option:selected').attr('data-val');
                    
                    $('#merchntVipLevel').val(levelVal);
                });
                /* 选择某个银行后，对应的id和name发生更改的 */
                $('#merchantUpdateModal').on('change', '#merchantBankSelect', function() {
                    var bankId   = $(this).find('option:selected').attr('data-id'),
                        bankName = $(this).val();
                    
                    $('#merchantBankId').val(bankId);
                    $('#merchantBankName').val(bankName);
                });
                /* 选中某条策略后，显示该策略的详情，并将该策略id自动填入对应的input输入框中用于传给后台 */
                $('#merchantUpdateModal').on('change', '#loanPolicyList', function() {
                    var policyNo    = $(this).find('option:selected').attr('data-no'),
                        policyIndex = $(this).find('option:selected').attr('data-index');
                    
                    self.showPolicyDetail(policyIndex, '#detailTable');
                });

                /* 点击保存修改按钮 */
                $('#saveMerchantBtn').on('click', function() {
                    self.updateMerchant();
                });
            },
            // 商户信息初始化
            mechantInit: function() {
                var self = this,
                    jsonObj = {
                        merchantNo: $.getCookie('merchantNo')
                    },
                    successFunc = function(data) {
                        self.updateModalInit(data.object.merchant);
                        self.viewerInit(data.object.merchant);
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接错误，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditMerchant/getCreditMerchant.htm', jsonObj, successFunc, failFunc);
            },
            updateModalInit: function(merchantObj) {
                this.merchantLevelAndBankInit();
                this.provinceListInit();
                this.policyListInit(merchantObj.loanPolicyNo);
            },
            viewerInit: function(merchantObj) {
                var $merchantType = $('#view-merchantType');

                for (var key in merchantObj) {
                    var viewId = 'view-' + key,
                        id     = key;

                    $('#' + viewId).val(merchantObj[key]);
                    $('#' + id).val(merchantObj[key]);
                }
                $('#areaNo').attr('data-name', merchantObj['areaName']);
                
                if ($merchantType.val() == '2') {
                    $merchantType.val('医院');
                }
                else if ($merchantType.val() == '3') {
                    $merchantType.val('房产');
                }
                else if ($merchantType.val() == '4') {
                    $merchantType.val('保险');
                }
                
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
                            $('#areaName').val(regionList[0].areaName);
                        }

                        $('#regionSelect').empty().append(regionSelectStr).selectpicker('refresh');
                    },
                    failFunc = function(err) {
                        $.alert('danger', '获取市列表失败！');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/dictionary/getCommonAreaList.htm', jsonData, successFunc, failFunc);
            },
            policyListInit: function(loanPolicyNoToShow) {
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
                            
                            if (loanPolicyNoToShow == policyList[i].loanPolicyNo) {
                                /* 显示当前要修改的商户的策略的详情 */
                                $('#view-loanPolicyNo').val(policyList[i].loanPolicyNo);
                                $('#loanPolicyNo').val(policyList[i].loanPolicyNo);
                                $('#view-policyDetailPeriod').val(policyList[i].merchantPaymentPeriod + '天');
                                $('#policyDetailPeriod').val(policyList[i].merchantPaymentPeriod + '天');
                                $('#view-policyDetailLevel').val(policyList[i].merchantVipLevel);
                                $('#policyDetailLevel').val(policyList[i].merchantVipLevel);
                                $('#view-policyDetailLimit').val((parseFloat(policyList[i].merchantCapitalLimit)).toFixed(2));
                                $('#policyDetailLimit').val((parseFloat(policyList[i].merchantCapitalLimit)).toFixed(2));
                                $('#view-policyDetailRemark').val(policyList[i].loanPolicyRemark);
                                $('#policyDetailRemark').val(policyList[i].loanPolicyRemark);
                                self.showPolicyDetail(i, '#policyDetailTable');
                            }
                        }

                        $('#loanPolicyList').empty().append(policySelectStr).selectpicker('refresh');
                    },
                    failFunc = function(err) {
                        $.alert('danger', '获取策略列表失败了，请稍后重试！');
                        console.info(err);
                    };
                
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantPolicy/getMerchantPolicyList.htm', jsonData, successFunc, failFunc);
            },
            showPolicyDetail: function(policyIndex, domSelector) {
                /* 显示某条策略的详情 */
                var $updateModal = $('#merchantUpdateModal'),
                    policyObj = policyArr[policyIndex];

                $updateModal.find('#loanPolicyNo').val(policyObj.loanPolicyNo);
                $updateModal.find('#policyDetailPeriod').val(policyObj.merchantPaymentPeriod + '天');
                $updateModal.find('#policyDetailLevel').val(policyObj.merchantVipLevel);
                $updateModal.find('#policyDetailLimit').val((parseFloat(policyObj.merchantCapitalLimit)).toFixed(2));

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
                $(domSelector).empty().append(tableStr);
            },
            updateMerchant: function() {
                var self = this,
                    jsonData = $.submitObj('.submit-input'),
                    successFunc = function(data) {
                        if (data.status == 'success') {
                            $.alert('success', '修改成功');
                            $('#merchantUpdateModal').modal('hide');
                            self.init();
                        }
                        else {
                            $.alert('danger', data.message)
                        }
                    },
                    failFunc = function(err) {
                        $.alert('danger', '网络连接出错，请稍后重试！');
                        console.info(err);
                    };

                if (!self.updateValidation()) {
                    return false;
                }
                
                jsonData['areaName'] = $('#areaNo').attr('data-name');
                jsonData['merchantPolicyUpdatetime'] = new Date();
                jsonData['policyDetailLimit'] = $('#policyDetailLimit').val();
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditMerchant/updateCreditMerchant.htm', jsonData, successFunc, failFunc);
            },
            updateValidation: function() {
                return true;
            }
        };

    pageObj.init();
})(jQuery)
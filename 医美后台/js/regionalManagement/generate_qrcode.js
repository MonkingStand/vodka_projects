/*
 *  商户管理模块——生成商户二维码
 *  generate_qrcode.html
 */
(function($) {
    var pageObj = {
            init: function() {
                this.merchantListInit();
                this.roleListInit();
                this.domListener();
            },
            domListener: function() {
                var self = this;

                // 生成二维码
                $('#generateBtn').on('click', function() {
                    if ($.checkMenuItemPermission('merchantUser:codeCreate')) {
                        self.generateQR();
                    }
                });
            },
            merchantListInit: function() {
                /* 初始化，获取所有的商户，生成商户列表 */
                var jsonData = {
                        begin: 0,
                        rows : 500
                    },
                    successFunc = function(data) {
                        var merchantArr   = data.content,
                            merchantCount = merchantArr.length,
                            optionsStr    = '';
                        
                        for (var i = 0; i < merchantCount; i ++) {
                            optionsStr +=   '<option value="' + merchantArr[i].merchantNo + '">' +
                                                merchantArr[i].merchantName + '（' + merchantArr[i].areaName + '）' +
                                            '</option>';
                        }
                        $('#merchantIdSelect').empty().append(optionsStr).selectpicker('refresh');
                    },
                    failFunc = function(err) {
                        console.info(err);
                        $.alert('danger', '网络连接错误，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditMerchant/getCreditMerchantList.htm', jsonData, successFunc, failFunc);
            },
            roleListInit: function() {
                /* 初始化，获取所有的商户类别，生成商户类别列表 */
                var successFunc = function(data) {
                        var roleArr    = data.object,
                            roleCount  = roleArr.length,
                            optionsStr = '';
                        
                        for (var i = 0; i < roleCount; i ++) {
                            optionsStr +=   '<option value="' + roleArr[i].value + '">' +
                                                roleArr[i].name +
                                            '</option>';
                        }
                        $('#merchantTypeSelect').empty().append(optionsStr);
                    },
                    failFunc = function(err) {
                        console.info(err);
                        $.alert('danger', '网络连接错误，请稍后重试！');
                    };

                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantUserRole.htm', {}, successFunc, failFunc);
            },
            generateQR: function() {
                /* 生成二维码按钮 */
                var $merchantIdSelect   = $('#merchantIdSelect'),
                    $merchantTypeSelect = $('#merchantTypeSelect'),
                    qrcodeImgContainer  = document.querySelector('#qrcodeImg'),
                    
                    merchantNo   = $merchantIdSelect.val(),
                    merchantRole = $merchantTypeSelect.val();
                
                if (!merchantNo) {
                    $.alert('danger', '请选择商户！');
                    return false;
                }
                if (!merchantRole) {
                    $.alert('danger', '请选择商户类别！');
                    return false;
                }

                $('#qrcodeImg').empty().append('<img src="../../images/qrcode_generating.jpg">');
                var data       = 'http://wechat.xianyongzhe.cn/html/merchant_register.html?merchantNo=' + merchantNo + '&role=' + merchantRole,
                    size       = 150,
                    qrCallback = function() {  };
                
                $('#qrcodeText').removeClass('hidden');
                $('#qrcodeText .merchant-name').text($merchantIdSelect.find('option:selected').text());
                setTimeout(function() {
                    $.qrGenerate(qrcodeImgContainer, data, size, qrCallback);
                }, 1000);
            }
        };

    pageObj.init();
})(jQuery)
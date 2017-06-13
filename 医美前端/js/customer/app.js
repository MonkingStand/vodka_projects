/* 用户扫码后显示的订单页面 */
var loanFormPage = {
    init: function() {
        this.orderInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 进行图片上传 */
        $('.popup-link').on('click', function() {
            var selector = $(this).attr('data-popup'),
                loginCallback = function() {
                    /* 设置上传图片参数 */
                    var orderReg  = /^\d+/g,
                        tempOrder = document.URL.split('=')[1],
                        orderNo   = orderReg.exec(tempOrder)[0],
                        imgType   = selector,
                        imgName   = selector + '_' + orderNo,

                        targetFrameSrc  = '../upload_img.html?imgType=' + imgType + '&imgName=' + imgName + '&originUrl=' + 'null',
                        currentFrameSrc = parent.document.getElementById(selector + 'Frame').contentWindow.location.href;
                    
                    if (currentFrameSrc.indexOf('init=1') != -1) {
                        $('#' + selector + 'Frame').attr('src', targetFrameSrc);
                    }

                    $.popup('#' + selector + 'UploadPopup');
                    self.checkWXRuntime();
                };
            /* 上传凭证前进行登录操作 */
            self.loginCheck(loginCallback);
        });

        /* 关闭上传图片popup框 */
        $('.close-popup').on('click', function() {
            var frameUrl = parent.document.getElementById('proofImgFrame').contentWindow.location.href;
            
            if (frameUrl.indexOf('viewUrl=') != -1) {
                var viewUrl = (frameUrl.split('viewUrl=')[1]).split('&')[0];

                $('#proofImgUploadPopupLink .img-icon').removeClass('img-camera').addClass('img-camera-active');
                $('#proofImg').val(viewUrl);
            }
            $.closeModal('#proofImgUploadPopup');
        });
        
        /* 同意/不同意借款协议 */
        $('input[name="agreementCheckbox"]').change(function() {
            var thisCheckbox = $(this),
                applyBtn = $('.apply-btn-container .button');
                
            if (thisCheckbox.prop('checked')) {
                /* 用户点击立即申请操作后 */
                var buttons1 = [{
                        text: '立即申请',
                        bg: 'theme',
                        onClick: function() {
                            if (self.submitValidation()) {
                                self.submitApply();
                            }
                            thisCheckbox.prop('checked', false);
                        }
                    }],
                    buttons2 = [{
                        text: '取消',
                        bg: 'danger',
                        onClick: function() {
                            thisCheckbox.prop('checked', false);
                        }
                    }],
                    groups = [buttons1, buttons2];
                $.actions(groups);
            }
        });
    },
    loginCheck: function(callbackFunc) {
        var self = this;
        /* 主要用于上传凭证的时候进行登录 */
        var loginTag = ($.getCookie('loginUserId') && $.getCookie('loginUserMobile') && $.getCookie('loginUserPassword') && $.getCookie('loginUserRole')) ? true : false;
        /* 登录回调，即登录后，关闭登录模态款，弹出凭证上传模态款 */
        var loginCallback = function() {
            $.closeModal('#loginPopup');
            callbackFunc();
        };

        if (loginTag) {
            /* 已登录，进行凭证上传 */
            callbackFunc();
        }
        else {
            $.alert('用户还未登录<br>请先登录', function() {
                $.popup('#loginPopup');
                self.loginOperate(loginCallback);
            });
        }
    },
    orderInit: function() {
        var self = this;
        /* 订单初始化 */
        $.showIndicator();
        var orderReg  = /^\d+/g,
            tempOrder = document.URL.split('=')[1],
            orderNo   = orderReg.exec(tempOrder)[0],
            jsonData  = {
                orderNo: orderNo
            },
            successFunc = function(data) {
                var orderObj = data.object.loanOrder;
                /* 暂存用户的实名状态 */
                $.setCookie('loginUserReal', data.object.creditObtainUser.realCheck, 3600);
                $('#loginPopup #mobileNumber').val(orderObj.obtainUserMobile);
                self.userVerify(orderObj);
                /* 填写商户名和商户对应咨询师名 */
                 $('#merchantName').text(data.object.creditMerchantUser.merchantName);
                 $('#merchantUserName').text(data.object.creditMerchantUser.realName);
                //判断订单状态
                // 订单状态：0-新建；2-客户提交；5-审核不通过；6-审核通过；-2：删除
                if (orderObj.status != 0) {
                    $('.agreement-checkbox-container').remove();
                    $('#orderContent').remove();
                    $('#orderStatus').removeClass('hidden');
                    $('#orderStatus .order-num').text(orderObj.orderNo);
                }
                //数据渲染
                for (var key in orderObj) {
                    $('#' + key).val(orderObj[key]);
                }
                /* 用户是否已经上传过照片 */
                if (orderObj.proofImg) {
                    $('#proofImgUploadPopupLink .img-icon').removeClass('img-camera').addClass('img-camera-active');
                    $('#proofImg').val(orderObj.proofImg);
                }

                $('#peroidRadioModalLink span.radio-val').text(orderObj.period + '个月');
                $('#refundRadioModalLink span.radio-val').text(orderObj.refundType == 0 ? '等额本息' : '等额本金');
                /* 单选模态框 */
                $('#peroidRadioModalLink').on('click', function() {
                    var selectedText = $(this).find('span.radio-val').text(),
                        options = {
                            textArr: ['6个月', '12个月'],
					        valArr : ['val1', 'val2']
                        };
                    options.selectedIndex = options.textArr.indexOf(selectedText);
                    $(this).find('.radio-val').attr('data-val', options.valArr[options.selectedIndex]);
                    /* radioModal方法详见modules.js */
                    $.radioModal($(this), options);
                });
                $('#refundRadioModalLink').on('click', function() {
                    var selectedText = $(this).find('span.radio-val').text(),
                        options = {
                            textArr: ['等额本息', '等额本金'],
                            valArr: ['val1', 'val2']
                        };
                    options.selectedIndex = options.textArr.indexOf(selectedText);
                    $(this).find('.radio-val').attr('data-val', options.valArr[options.selectedIndex]);
                    /* radioModal方法详见modules.js */
                    $.radioModal($(this), options);
                });
            },
            failFunc = function(err) {
                console.info(err);
                $.toast('订单初始化失败，请稍后重试');
            };

        $.setCookie('orderNo', orderNo, 3600);
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/creditObtainUserCheckOrderBeforeSubmit.htm', jsonData, successFunc, failFunc);
    },
    userVerify: function(tempObj) {
        var self = this;
        /* 发送短信倒计时 */
        var countFunc = function() {
            var $sendBtn = $('#resendCodeBtn'),
                TIME = 59,
                countInter = setInterval(function() {
                    $sendBtn.text('(' + TIME + 's)');
                    if (TIME-- <= 0) {
                        clearInterval(countInter);
                        $sendBtn.text('重新发送').removeClass('click-ban');
                    }
                }, 1000);
            $sendBtn.text('(60s)');
        };
        /* 向后台请求发送短信验证码 */
        var requestCode = function() {
            var jsonData = {
                    mobile: tempObj.obtainUserMobile
                },
                successFunc = function(data) {
                    $.setCookie('mobileVerifyCode', data.object.code, 60);
                },
                failFunc = function(err) {
                    $.toast('短信发送失败，请稍后重试');
                };

            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/smsUtil/getCode.htm', jsonData, successFunc, failFunc);
        };

        var mobile = tempObj.obtainUserMobile,
            tempMobile = mobile.split('');

        tempMobile.splice(3, 4, '****');
        $('#mobileVerificationPopup .mobile-val').text(tempMobile.join(''));
        /* 验证用户是否已经做过手机号验证 */
        if ($.getCookie('mobileVerificationStatus')) {
            $('#loanFormPage .content').removeClass('invisible');
            $('#loanFormPage nav').removeClass('invisible');
            return false;
        }
        /* 如果未验证，弹出手机号验证 */
        $.popup('#mobileVerificationPopup');
        /* 点击【重新发送】按钮 */
        $('#resendCodeBtn').on('click', function() {
            $('#resendCodeBtn').addClass('click-ban');
            if (!$.getCookie('mobileVerifyCode')) {
                requestCode();
            }
            countFunc();
        });
        /* 点击【验证】按钮 */
        $('#verifyBtn').on('click', function() {
            if ($('#verifyCode').val() == '') {
                $.hideIndicator();
                $.toast('请填写验证码');
            }
            else if ($('#verifyCode').val() != $.getCookie('mobileVerifyCode')) {
                $.showIndicator();
                setTimeout(function() {
                    $.hideIndicator();
                    $.toast('验证码错误！');
                }, 1000);
            }
            else {
                $.showIndicator();
                /* 清除暂存的手机验证号 */
                $.clearCookie('mobileVerifyCode');
                /* 暂存手机验证完成的状态，避免重复验证 */
                $.setCookie('mobileVerificationStatus', 1, 600);
                /* 关闭手机验证popup框 */
                setTimeout(function() {
                    $.hideIndicator();
                    $('#loanFormPage #orderContent').removeClass('invisible');
                    $('#loanFormPage nav').removeClass('invisible');
                    $.closeModal('#mobileVerificationPopup');
                }, 1000);
            }
        });
    },
    submitObj: function() {
        //返回申请列表中，每个需要输入的input的键名和值
        var submitObj = {};
        $('#loanFormPage .submit-input').each(function() {
            var id  = $(this).attr('id'),
                val = $(this).val();
            submitObj[id] = val;
        });

        /* 修改effectiveDate，取用户提交申请的时间 */
        var currentTime = Date.parse(new Date());
        /* 填坑，东八区的时间，相差8个小时，后台存日期没存时区的信息 */
        var tempDate = new Date(currentTime + 8 * 60 * 60 * 1000);

        submitObj['period'] = parseInt(submitObj['period'].replace('个月', ''));
        /* 当用户修改了还款方式时 */
        if (!(submitObj['refundType'] == '0' || submitObj['refundType'] == '1')) {
            submitObj['refundType'] = (submitObj['refundType'] == '等额本息') ? 0 : 1;
        }
        submitObj['createDate']    = this.transISOTimeStr(submitObj['createDate']);
        submitObj['effectiveDate'] = tempDate.toISOString();
        submitObj['deadDate']      = new Date(tempDate.setMonth(tempDate.getMonth() + submitObj['period'])).toISOString();
        return submitObj;
    },
    submitValidation: function() {
        //TODO，订单提交前验证
        var obtainUserName = $.trim($('#obtainUserName').val()),
            applyCapital   = $.trim($('#applyCapital').val()),
            purpose        = $.trim($('#purpose').val()),
            proofImg       = $.trim($('#proofImg').val());


        if (obtainUserName == '') {
            $.toast('客户姓名不能为空！', 750);
            return false;
        }
        else if (applyCapital == '') {
            $.toast('借款金额不能为空！', 750);
            return false;
        }
        else if (purpose == '') {
            $.toast('借款用途不能为空！', 750);
            return false;
        }
        else if (proofImg == '') {
            $.toast('凭证/单据照片不能为空！', 750);
            $('input[name="agreementCheckbox"]').prop('checked', false);
            return false;
        }

        return true;
    },
    submitApply: function() {
        /* 点击【立即申请】 */
        var self = this;
        if ($.realCheck($.getCookie('loginUserReal'), ['tongdunMobile', 'tongdunHeadPic']) === '未实名') {
            /* 订单对应的借款用户还未实名 */
            /* 判断是否有登录cookie */
            var loginTag = ($.getCookie('loginUserMobile') && $.getCookie('loginUserPassword') && $.getCookie('loginUserRole')) ? true : false,
                alertInfo = '还未实名认证<br>是否' + (loginTag ? '进行实名认证？' : '登录并前往认证？');

            $.confirm(alertInfo, function() {
                /* 如果已登录，直接跳转去实名认证；如果未认证，弹出登录框，登录后跳转去实名认证 */
                var loginCallback = function() {
                    $.closeModal('#loginPopup');
                    router.linkTo('real_info.html');
                };

                if (loginTag) {
                    loginCallback();
                } else {
                    $.popup('#loginPopup');
                    self.loginOperate(loginCallback);
                }
            }, function() {
                /* 点击取消 */
                $('input[name="agreementCheckbox"]').prop('checked', false);
            })
        }
        else if ($.realCheck($.getCookie('loginUserReal'), ['tongdunMobile', 'tongdunHeadPic']) === '已实名') {
            /* 订单对应的借款用户已经实名认证 */
            var loginTag = ($.getCookie('loginUserMobile') && $.getCookie('loginUserPassword') && $.getCookie('loginUserRole')) ? true : false,
                alertInfo = loginTag ? '确认提交申请？' : '还未登录<br>是否进行登录？';
            $.confirm(alertInfo, function() {
                var submitFunc = function() {
                    var jsonData = self.submitObj(),
                        successFunc = function(data) {
                            if (data.status == 'fail') {
                                $.alert(data.message);
                            }
                            else {
                                $('.agreement-checkbox-container').remove();
                                $('#orderContent').remove();
                                $('#orderStatus').removeClass('hidden');
                                $('#orderStatus .order-num').text($.getCookie('orderNo'));
                                $.closeModal('#loginPopup');
                            }
                        },
                        failFunc = function(err) {
                            $.toast('提交失败');
                        };
                    
                    if (!self.submitValidation()) {
                        return false;
                    }
                    
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/update.htm', jsonData, successFunc, failFunc);
                };

                
                if (loginTag) {
                    submitFunc();
                }
                else {
                    $.popup('#loginPopup');
                    self.loginOperate(submitFunc);
                }
            }, function() {
                /* 点击取消 */
                $('input[name="agreementCheckbox"]').prop('checked', false);
            })
        }
    },
    loginOperate: function(loginCallback) {
        /* 手机号、密码提交前验证 */
        var loginValidation = function() {
                var mobileNum = $.trim($('#mobileNumber').val()),
                    password = $.trim($('#password').val()),
                    mobileReg = /^1[34578]\d{9}$/;

                if (mobileNum == '') {
                    $.toast('手机号不能为空！', 750);
                    return false;
                }
                else if (!mobileReg.test(mobileNum)) {
                    $.toast('手机号填写有误！', 750);
                    return false;
                }
                else if (password == '') {
                    $.toast('密码不能为空！', 750);
                    return false;
                }
                return true;
            },
            /* 暂存登录信息，到cookie中 */
            saveUserInfo = function(tempObj) {
                $.saveUserInfo(tempObj);
            };

        /* 点击【登录】按钮 */
        $('#loginBtn').on('click', function() {
            var jsonData = {
                    'mobile'   : $.trim($('#mobileNumber').val()),
                    'password' : $.trim($('#password').val()),
                    'role'     : '1',
                    'longitude': 0, 
                    'latitude' : 0, 
                    'iMei'     : ''
                },
                successCallback = function(data) {
                    if (data.object) {
                        $.toast('登录成功');
                        saveUserInfo(data.object);
                        setTimeout(function() {
                            $.hideIndicator();
                            loginCallback();
                        }, 1000);
                    } else {
                        $.hideIndicator();
                        $.alert('用户名或者密码错误<br>请重新登录！');
                    }
                },
                failCallback = function(err) {
                    $.hideIndicator();
                    $.alert('网络连接错误<br>请稍后重试');
                };

            if (!loginValidation()) {
                return false;
            }

            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
            $.showIndicator();
        })
    },
    checkWXRuntime: function() {
        /* 插件限制，当在微信浏览器中打开页面时，提示在浏览器中打开 */
        // TODO
        var ua = window.navigator.userAgent.toLowerCase();
        if(ua.match(/MicroMessenger/i) == 'micromessenger'){
            $.alert('<div style="font-size:0.85em;">图片上传功能在微信内置浏览器存在问题<br>请打开右上角菜单用其他浏览器打开</div>');
            return true;
        }
        return false;
    },
    transISOTimeStr: function(originDateStr) {
        var tempDateStr = originDateStr.replace(' ', 'T'),
            resultDate  = new Date(Number(new Date(tempDateStr)));
        
        return resultDate.toISOString();
    }
};

/* 用户登录后跳转的首页 */
var indexPage = {
    init: function() {
        /* 针对webapp端自动登录 */
        this.appLogin();
        // this.userInfoInit();
        // this.domListener();
    },
    domListener: function() {
        /* app下载页面跳转 */
        $('#appDownload').on('click', function() {
            window.location.href = defaultConfig.domain + defaultConfig.project + '/html/customer/app_download.html';
        });
    },
    userInfoInit: function() {
        /* 判断用户是否已登录 */
    	if ($.getCookie('loginUserId')) {
            if ($.getCookie('loginUserName')) {
                $('#customerName').text($.getCookie('loginUserName'));
                if ($.realCheck($.getCookie('loginUserReal'), ['tongdunMobile', 'tongdunHeadPic']) === '未实名') {
                    $('#realCheck').removeClass('no-user-name has-checked').addClass('not-checked');
                }
                else if ($.realCheck($.getCookie('loginUserReal'), ['tongdunMobile', 'tongdunHeadPic']) === '已实名') {
                    $('#realCheck').removeClass('no-user-name not-checked').addClass('has-checked');
                }
            }
    	}
    	else {
    		$.toast('请先登录！');
    		setTimeout(function() {
    			window.location.href = defaultConfig.domain + defaultConfig.project + '/html/login.html';
    		}, 1500);
    	}
    },
    appLogin: function() {
        var self = this;
        if ($.getParameter('mobile')) {
			var jsonData = {
					'mobile'   : $.getParameter('mobile'), 
					'password' : $.getParameter('pwd'),
					'role'     : $.getParameter('role'),
                    'longitude': 0, 
                    'latitude' : 0, 
                    'iMei'     : ''
				},
				successCallback = function(data) {
					if (data.status == 'success') {
						$.saveUserInfo(data.object);
						self.userInfoInit();
                        self.domListener();
					}
					else {
						$.hideIndicator();
						$.alert('用户名或者密码错误<br>请重试');						
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('网络连接错误<br>请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
			$.showIndicator();

            /* 如果是从app登录的，删除app下载链接 */
            $('#appDownload').remove();
		}
		else {
			self.userInfoInit();
            self.domListener();
            /* 如果是从web/wap登录的，显示app下载链接 */
            $('#appDownload').removeClass('hidden');
		}
    }
};

/* 我的账单（所有的分期账单） */
var repayBillAllPage = {
    init: function() {
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 勾选/取消勾选账单项目 */
        $('.repay-bill-all-page').on('change', '.repay-list input[type="checkbox"]', function() {
            self.toggleRepay();
        });
        /* 切换标签页时 */
        $('.button.tab-link').on('click', function() {
            var tabName = $(this).attr('href');
            $('.summary-container').removeClass('active');
            $('.summary-container[data-tab="' + tabName + '"]').addClass('active');
        });
    },
    countSummary: function() {
        var summary = 0;
        /* 统计还款金额 */
        $('.repay-bill-all-page .tab.active .repay-list input[type="checkbox"]').each(function() {
            if ($(this).prop('checked')) {
                var thisAmount = parseFloat($(this).attr('data-amount'));
                summary += thisAmount;
            }
        });
        $('.repay-bill-all-page .summary-container.active .summary-val').text(summary.toFixed(2));
    },
    toggleRepay: function() {
        var selected = 0,
            repayBtn = $('.repay-bill-all-page .summary-container.active .repay-btn a');

        this.countSummary();

        $('.repay-bill-all-page .tab.active input[type="checkbox"]').each(function() {
            if ($(this).prop('checked')) {
                selected += 1;
            }
        })

        if (selected == 0) {
            repayBtn.addClass('click-ban');
        } else {
            repayBtn.removeClass('click-ban');
        }
    }
};

/* 我的分期（即提交的分期订单列表） */
var loanPage = {
    init: function() {
        /* 针对webapp登录 */
        this.appLogin();
        /* 针对微信和wap端，检查是否已经登录过 */
        // this.checkRegister();
        // this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 订单列表无限滚动加载 */
        var loading = false;
        $(document).on('infinite', '.infinite-scroll', function() {
            var jsonData = {
                    begin: parseInt($('#orderListMenu').attr('data-begin')),
                    rows : 10
                };
            /* 如果滚动已经finished（即数据已经全部加载完了），注销事件，并退出 */
            if ($('#orderListMenu').hasClass('finished')) {
                $.detachInfiniteScroll($('.infinite-scroll'));
            }
            /* 正在滚动（加载），退出 */
            if (loading) return false;
            /* 设置标识 */
            loading = true;
            /* 刷新获取数据 */
            /* 添加加载提示符 */
            $('#loaderContainer').empty().append('<div class="infinite-scroll-preloader"><div class="preloader"></div></div>');
            self.getOrderList(jsonData);
            /* 重置滚动标识 */
            setTimeout(function() {
                loading = false;
            }, 1500);
        });
    },
    orderListInit: function() {
        var self = this,
            jsonData = {
                begin: 0,
                rows : 10
            };
        
        $('#orderListMenu').removeClass('finished').addClass('init').empty().attr('data-begin', '0');
        /* 已申请的订单初始化 */
        self.getOrderList(jsonData);
    },
    //订单渲染
    getOrderList: function(jsonObj) {
        var self = this,
            successFunc = function(data) {
                self.renderOrders(data);
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试！');
                console.info(err);
            };

        jsonObj.obtainUserId = $.getCookie('loginUserId');
        jsonObj.obtainUserMobile = $.getCookie('loginUserMobile');

        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getPersonalOrderList.htm', jsonObj, successFunc, failFunc);
    },
    renderOrders: function(data) {
        var orderListStr = this.getOrdersListStr(data),
            orderBegin   = parseInt($('#orderListMenu').attr('data-begin')) + 10;
        
        setTimeout(function() {
            $('.infinite-scroll-preloader').remove();
            /* 判断是否是初始状态 */
            if ($('#orderListMenu').hasClass('init')) {
                if (data.count == 0) {
                    /* 订单数为0，添加class，显示“没有订单”的提示 */
                    $('#orderListContainer').addClass('no-orders');
                    $('#orderListMenu').removeClass('init').addClass('finished');
                }
                else {
                    $('#orderListMenu').removeClass('init').append(orderListStr).attr('data-begin', orderBegin);
                }
            }
            else {
                if (data.content.length == 0) {
                    /* 订单数为0，即表示已经没有更多订单了 */
                    $('#orderListContainer').addClass('no-more-orders');
                    $('#orderListMenu').addClass('finished');
                }
                else {
                    $('#orderListMenu').append(orderListStr).attr('data-begin', orderBegin);
                }
            }
        }, 1000);
    },
    getOrdersListStr: function(data) {
        var orderList    = data.content,
            orderCount   = orderList.length,
            orderListStr = '',
            mobile       = $.getCookie('loginUserMobile');
        
        for (var i = 0; i < orderList.length; i ++) {
            var orderNo    = data.content[i].order_no,
                statusVal  = parseInt(orderList[i].status),
                statusText = $.orderStatusTrans(orderList[i].status),
                orderClick = '';
            /* 判断用户订单的状态 */
            if (statusVal == 0 || statusVal == 1 || statusVal == 2 || statusVal == 3 || statusVal == 4 || statusVal == 5 || statusVal == 6) {
                orderClick = 'onclick="router.linkTo(\'order.html?orderNo=' + orderNo + '&mobile=' + mobile + '\')"';
            }
            else if (statusVal == 7) {
                orderClick = 'onclick="router.linkTo(\'order_detail.html?orderNo=' + orderNo + '&mobile=' + mobile + '\')"';
            }
            /* 订单列表字符串 */
            orderListStr += '<li class="card">' +
                                '<div class="card-header row no-gutter" ' + orderClick + '">' +
                                    '<div class="col-50 text-left loan-amount text-yellow text-lg text-bold">' + orderList[i].finalCapital + '</div>' +
                                    '<div class="col-50 text-right loan-status">' +
                                        statusText + '<i class="icon icon-right"></i>' +
                                    '</div>' +
                                '</div>' +
                                '<div class="card-content">' +
                                    '<div class="card-content-inner">' +
                                        '<p class="business-info">' + orderList[i].merchant_name + '</p>' +
                                        '<p class="added-info">' +
                                            '<span class="loan-project">' + orderList[i].purpose + '</span>' +
                                            '<span class="loan-date">' + orderList[i].effective_date + '&nbsp;借</span>' +
                                        '</p>' +
                                    '</div>' +
                                '</div>' +
                            '</li>';
        }
        
        return orderListStr;
    },
    checkRegister: function() {
        var self    = this,
            code    = $.getParameter('code'),
            codeTag = Boolean(code);
        
        if (codeTag) {
            /* 如果存在code，表示在微信端中 */
            /* 根据用户的openId，请求后台，判断是否和已有用户绑定 */
            /* 根据url中的code参数，传给后台，获取对应的openId */
            var jsonData1 = {
                    code: code
                },
                successFunc1 = function(data) {
                    /* 根据openId，后台判断是否绑定，并自动登录 */
                    var jsonData2 = {
                            openId: data.object.openid
                        },
                        successFunc2 = function(data) {
                            if (data.status == 'success') {
                                $.hideIndicator();
                                /* 表示该openId已绑定过账号，保存登录信息后初始化分期订单列表 */
                                $.saveUserInfo(data.object);
                                self.orderListInit();
                            }
                            else {
                                /* 表示该openId还未绑定过账号，提示先登录 */
                                $.hideIndicator();
                                $.toast('请先进行登录！');
                            }
                        },
                        failFunc2 = function(err) {
                            $.hideIndicator();
                            $.alert('网络连接错误<br>请稍后重试');
                        };
                    
                    $.showIndicator();
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/judgeRegist.htm', jsonData2, successFunc2, failFunc2);
                },
                failFunc1 = function(err) {
                    $.alert('网络连接错误<br>请稍后重试');
                };
            
            /* 根据url中的code参数，向后台请求，获取对应用户的额openId */
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/share/getwechatOpenId.htm', jsonData1, successFunc1, failFunc1);
        }
        else {
            /* 如果不存在，表示在wap中 */
            if ($.getCookie('loginUserId')) {
                self.orderListInit();
            }
            else {
                $.toast('请先登录！');
                setTimeout(function() {
                    window.location.href = defaultConfig.domain + defaultConfig.project + '/html/login.html';
                }, 1500);
            }
        }
    },
    appLogin: function() {
        var self = this;
		if ($.getParameter('mobile')) {
			var jsonData = {
					'mobile'   : $.getParameter('mobile'), 
					'password' : $.getParameter('pwd'),
					'role'     : $.getParameter('role'),
                    'longitude': 0, 
                    'latitude' : 0, 
                    'iMei'     : ''
				},
				successCallback = function(data) {
					if (data.status == 'success') {
						$.saveUserInfo(data.object);
						self.checkRegister();
                        self.domListener();
					}
					else {
						$.hideIndicator();
						$.alert('用户名或者密码错误<br>请重试');						
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('网络连接错误<br>请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
			$.showIndicator();
		}
		else {
			self.checkRegister();
            self.domListener();
		}
    }
};

/* 查看单条订单的概要信息（用户提交申请之前、审核通过之前） */
var orderPage = {
    init: function() {
        this.domListener();
        this.orderInit();
    },
    domListener: function() {
        var self = this;

        /* 用户提交订单操作 */
        $('#orderRemit').on('click', function() {
            router.linkTo('loan_form.html?orderNo=' + $.getParameter('orderNo'));
        });

        /* 用户确认订单操作 */
        $('#applyRemit').on('click', function() {
            $.confirm('请核对借款金额及借款期数<br>确定提交？', 
                function() {
                    self.applyRemit();
                }
            )
        });

        /* 查看分期详情 */
        $('#repayDetailPopupLink').on('click', function() {
            self.viewRepayDetail();       
        })
    },
    orderInit: function() {
        var self = this,
            jsonData = {
                orderNo: $.getParameter('orderNo'),
                mobile: $.getParameter('mobile')
            },
            successFunc = function(data) {
                var merchant      = data.object.merchantInfo, 
                    order         = data.object.order, 
                    $orderPage    = $('#orderPage'),
                    $applyBtnContainer = $('#applyBtnContainer'),
                    $orderBtnContainer = $('#orderBtnContainer'),
                    orderStatusTipStr;

                $orderPage.removeClass('invisible');

                /* 信息填写 */
                $('#orderPage .submit-input').each(function() {
                    var id = $(this).attr('id');                

                    $(this).text(order[id]);
                });

                /* 订单状态提示,按钮处理 */
                if (order.status == 0) {
                    orderStatusTipStr = '<p class="text-lg text-bold apply-result">很可惜</p><p>您的订单还未提交</p>';
                    $orderBtnContainer.removeClass('hidden');
                }
                else if (order.status == 2) {
                    orderStatusTipStr = '<p class="text-lg text-bold apply-result">请稍等</p><p>您的借款申请正在审核</p>';
                }
                else if (order.status == 3) {
                    orderStatusTipStr = '<p class="text-lg text-bold apply-result">很抱歉</p><p>您的借款申请未通过审核</p>';
                }
                else if (order.status == 4) {
                    orderStatusTipStr = '<p class="text-lg text-bold apply-result">请稍等</p><p>您的借款申请正在审批中</p>';
                }
                else if (order.status == 5) {
                    orderStatusTipStr = '<p class="text-lg text-bold apply-result">很抱歉</p><p>您的借款申请未通过审批</p>';
                }
                else if (order.status == 1) {
                    orderStatusTipStr = '<p class="text-lg text-bold apply-result">恭喜您</p><p>您的借款申请已通过审批，请确认</p>';
                    $applyBtnContainer.removeClass('hidden');
                    // 终贷金额填写替换
                    $('#applyCapital').text(order.verifyCapital);
                    // 显示“分期详情”链接
                    $('#repayDetailPopupLink').removeClass('hidden');
                }
                else if (order.status == 6) {
                    orderStatusTipStr = '<p class="text-lg text-bold apply-result">恭喜您</p><p>您的借款申请正等待财务放款</p>';
                    // 终贷金额填写替换
                    $('#applyCapital').text(order.verifyCapital);
                    // 显示“分期详情”链接
                    $('#repayDetailPopupLink').removeClass('hidden');
                }

                $('#orderStatusTip').empty().append(orderStatusTipStr);

                $('#refundType').text((order.refundType == 0) ? '等额本息' : '等额本金');
                $('#merchantName').text(merchant.merchantName);
                $('#realName').text(merchant.realName);
                $('#interestAll').text(parseFloat(order.loanInterestObtainFinal).toFixed(2));
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试！');
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getOrderByNum.htm', jsonData, successFunc, failFunc);
    },
    applyRemit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo'),
                status: 6
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                }
                else {
                    $.hideIndicator();
                    $.alert('已提交后台<br>请耐心等待工作人员处理', function() {
                        $.router.back();
                    });
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错<br>请稍后重试！');
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/updateLoanOrderStatus.htm', jsonData, successFunc, failFunc);
    },
    viewRepayDetail: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'all'
            },
            successFunc = function(data) {
                var repayBillArr   = data.object.orderList,
                    repayBillCount = repayBillArr.length,
                    repayBillStr   = '<ul>';
                
                for (var i = 0; i < repayBillCount; i ++) {
                    var tmpObj      = repayBillArr[i],
                        repayStatus = (i + 1) + '/' + repayBillCount;
                    
                    repayBillStr += '<li class="card bottom-border top-border">' +
							            '<div class="card-header">' +
								            '<div class="text-left repay-amount text-yellow text-lg text-bold">' + parseFloat(tmpObj.finalPrice).toFixed(2) + '</div>' +
								            '<div class="text-right repay-status">' +
									            repayStatus +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="card-content">' +
                                            '<div class="card-content-inner">' +
                                                '<div class="row no-gutter">' +
                                                    '<div class="col-50">' +
                                                        '本金：<span class="text-lg">' + tmpObj.instalmentCapital + '</span>元' +
                                                    '</div>' +
                                                    '<div class="col-50">' +
                                                        '利息：<span class="text-lg">' + tmpObj.instalmentInterest + '</span>元' +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</li>';
                }
                repayBillStr += '</ul>';
                
                popupHTML = '<div id="repayDetailPopup" class="popup repay-detail-popup">' +
                                '<header class="bar bar-nav">' +
                                    '<a class="icon icon-down pull-right close-popup text-grey"></a>' +
                                    '<h1 class="title">分期详情概览</h1>' +
                                '</header>' +
                                '<div class="content">' +
                                    '<div id="repayBillContainer" class="list-block cards-list">' +
                                        repayBillStr +
                                    '</div>' +
                                '</div>' +
                            '</div>';
                
                setTimeout(function() {
                    $.hideIndicator();
                    $.popup(popupHTML);
                }, 1000);
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getRepaymentRecord.htm', jsonData, successFunc, failFunc);
    }
};

/* 查看单条订单的概要信息（用户提交的申请审批通过了） */
var orderDetailPage = {
    init: function() {
        this.orderDetailInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 借款合同popup框 */
        $('#contractPopupLink').on('click', function() {
            self.contactInit();
        });

        /* 还款记录、还款账单、还款记录的链接 */
        var orderNo = $.getParameter('orderNo'),
            mobile  = $.getParameter('mobile');

        $('#repayRecordLink').on('click', function() {
            router.linkTo('repay_record.html?orderNo=' + orderNo + '&mobile=' + mobile);
        });
        $('#repayBillLink').on('click', function() {
            router.linkTo('repay_bill_per.html?orderNo=' + orderNo + '&mobile=' + mobile);
        });
        $('#repayDetailLink').on('click', function() {
            router.linkTo('repay_detail.html?orderNo=' + orderNo + '&mobile=' + mobile);
        });
    },
    orderDetailInit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo'),
                mobile : $.getParameter('mobile')
            },
            successFunc = function(data) {
                if (data.status == 'success') {
                    var orderObj      = data.object.order,
                        effectiveDate = orderObj.effectiveDate,
                        deadDate      = orderObj.deadDate;
                    
                    var restPeriod = parseInt(orderObj.period) - parseInt(orderObj.donePeriod);
                    
                    /* 订单详情显示到页面 */
                    $('#usingCapital').text(parseFloat(data.object.usingMoney).toFixed(2));
                    if (restPeriod == 0) {
                        $('.summary-info .repay-info').text('该笔额度已还清');
                    }
                    else {
                        $('#periodVal').text(restPeriod);
                    }
                    $('#applyCapital').text(parseFloat(orderObj.verifyCapital).toFixed(2));
                    $('#contractExpire').text(effectiveDate + ' ~ ' + deadDate);
                    $('#refundType').text((orderObj.refundType == 0) ? '等额本息' : '等额本金');
                    $('#refundedPrincipal').text(parseFloat(data.object.instalmentCapitalAll).toFixed(2));
                    $('#refundedInterest').text(parseFloat(data.object.instalmentInterestAll).toFixed(2));
                }
                else {
                    $.alert('获取订单信息失败<br>请稍后重试');
                    console.info(data.message);
                }

                $.hideIndicator();
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getOrderByNum.htm', jsonData, successFunc, failFunc);
    },
    contactInit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo')
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert('网络连接出错，请稍后重试');
                    console.info(data.message);
                }
                else {
                    var contractObj = data.object;

                    for (var key in contractObj) {
                        $('#' + key).text(contractObj[key]);
                    }
                    $('#merchantBankUserName').text(contractObj.merchantName);
                    /* 还款期限，即合同起止时间 */
                    var effectiveDate = contractObj.effectiveDate.split(''),
                        deadDate      = contractObj.deadDate.split('');
                    
                    effectiveDate[4] = '年';
                    effectiveDate[7] = '月';
                    effectiveDate.push('日');
                    deadDate[4] = '年';
                    deadDate[7] = '月';
                    deadDate.push('日');
                    $('#startEndDateContainer').text(effectiveDate.join('') + '起至' + deadDate.join('') + '止');

                    setTimeout(function() {
                        $.hideIndicator();
                        $.popup('#contractPopup');
                        $('#contractPopup').removeClass('init');
                    }, 1000)
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错，请稍后重试');
                console.info(err);
            };
        
        if ($('#contractPopup').hasClass('init')) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/medicalAgreement.htm', jsonData, successFunc, failFunc);
        }
        else {
            $.popup('#contractPopup');
        }
        
    }
};

/* 还款账单（针对某一条订单的还款账单） */
var repayBillPerPage = {
    init: function() {
        this.repayBillInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 点击切换账单 */
        // $('.repay-bill-per-page').on('change', '.repay-list input[type="checkbox"]', function() {
        $('.repay-bill-per-page').on('change', '.repay-list input[type="radio"]', function() {
            self.toggleRepay();
        });

        /* 点击“立即还款” */
        $('#repayBillBtn').on('click', function() {
            $.confirm('确定立即还款？', 
                function() {
                    self.repayBill();
                }
            );
        });
    },
    repayBillInit: function() {
        var self     = this,
            jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'toRepay'
            },
            successFunc = function(data) {
                var repayBillArr   = data.content,
                    repayBillCount = repayBillArr.length,
                    repayBillStr   = '<ul>';
                
                for (var i = 0; i < repayBillCount; i ++) {
                    var capital  = parseFloat(repayBillArr[i].instalmentCapital),
                        interest = parseFloat(repayBillArr[i].instalmentInterest),
                        latefee  = repayBillArr[i].instalmentLatefee ? parseFloat(repayBillArr[i].instalmentLatefee) : 0.00,
                        total    = capital + interest + latefee;
                     
                    /* 特定的状态不显示该账单 */
                    if (repayBillArr[i].payStatus == '2' || repayBillArr[i].payStatus == '4' || repayBillArr[i].payStatus == '9') {
                        continue; 
                    }

                    repayBillStr += '<li>' +
                                        '<label class="label-checkbox item-content">' +                             
                                            '<div class="item-inner">' +
                                                '<div class="card">' +
                                                    '<div class="card-header">' +
                                                        '<div class="text-left repay-amount text-yellow text-lg text-bold">' + total.toFixed(2) + '</div>' +
                                                        '<div class="text-right repay-status text-grey text-xs">' + repayBillArr[i].instalmentRefundDate + '&nbsp;待还</div>' +
                                                    '</div>' +
                                                    '<div class="card-content added-info">' +
                                                        '<div class="card-content-inner">' +
                                                            '<div class="row no-gutter">' +
                                                                '<div class="col-50 repayed-principal">' +
                                                                    '本金：<span class="text-lg">' + capital.toFixed(2) + '</span>' +
                                                                '</div>' +
                                                                '<div class="col-50 repayed-interest">' +
                                                                    '利息：<span class="text-lg">' + interest.toFixed(2) + '</span>' +
                                                                '</div>' +
                                                                '<div class="col-50 repayed-interest">' +
                                                                    '违约金：<span class="text-lg">' + latefee.toFixed(2) + '</span>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</div>' +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>' +
                                            '<input type="radio" name="repay-item" data-amount="' + total.toFixed(2) + '" data-billno="' + repayBillArr[i].instalmentNo + '">' +
                                            '<div class="item-media"><i class="icon icon-form-checkbox"></i></div>' +
                                        '</label>'+
                                    '</li>';
                }
                repayBillStr += '</ul>';

                $('#repayBillList').empty().append(repayBillStr);
                self.pageEffectInit();
                $.hideIndicator();
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getRepayOrderList.htm', jsonData, successFunc, failFunc);
    },
    pageEffectInit: function() {
        // $('.repay-bill-per-page .repay-list input[type="checkbox"]').eq(0).prop('checked', true);
        $('.repay-bill-per-page .repay-list input[type="radio"]').eq(0).prop('checked', true);
        this.countSummary();
    },
    countSummary: function() {
        var summary = 0;
        /* 统计还款金额 */
        // $('.repay-bill-per-page .repay-list input[type="checkbox"]').each(function() {
        $('.repay-bill-per-page .repay-list input[type="radio"]').each(function() {
            if ($(this).prop('checked')) {
                var thisAmount = parseFloat($(this).attr('data-amount'));
                summary += thisAmount;
            }
        });
        $('.repay-bill-per-page .repay-summary .summary-val').text(summary.toFixed(2));
    },
    toggleRepay: function() {
        var selected = 0,
            repayBtn = $('.repay-bill-per-page .repay-btn a');

        this.countSummary();

        // $('.repay-bill-per-page .repay-list input[type="checkbox"]').each(function() {
        $('.repay-bill-per-page .repay-list input[type="radio"]').each(function() {
            if ($(this).prop('checked')) {
                selected += 1;
            }
        })

        if (selected == 0) {
            repayBtn.addClass('click-ban');
        } else {
            repayBtn.removeClass('click-ban');
        }
    },
    repayBill: function() {
        var self = this,
            jsonData = {
                userId   : $.getCookie('loginUserId'),
                tradeNum : '',
                tradeName: '还款订单',
                amount   : 0
            },
            successFunc = function(data) {
                setTimeout(function() {
                    $('#autoSubmitFormContainer').append(data);
                    $('#autoSubmitFormContainer').find('#batchForm').submit();
                }, 1500);
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('支付失败！');
            };

        $('.repay-bill-per-page .repay-list input[type="radio"]').each(function() {
            if ($(this).prop('checked')) {
                jsonData.tradeNum = $(this).attr('data-billno');
                jsonData.amount   = parseFloat($(this).attr('data-amount')) * 100;
                // for test
                // jsonData.amount = 1;
            }
        });

        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/jdpay/submit.htm', jsonData, successFunc, failFunc);
    }
};

/* 还款记录（针对某一条订单的还款记录） */
var repayRecordPage = {
    init: function() {
        this.repayRecordInit();
        this.domListener();
    },
    domListener: function() {},
    repayRecordInit: function() {
        var self     = this,
            jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'hasRepay'
            },
            successFunc = function(data) {
                var repayRecordArr   = data.object.orderList,
                    repayRecordCount = repayRecordArr.length,
                    repayRecordStr   = '<ul>';
                
                for (var i = 0; i < repayRecordCount; i ++) {
                    var tmpObj = repayRecordArr[i];
                    
                    repayRecordStr +=   '<li class="card">' +
                                            '<div class="card-header row no-gutter">' +
                                                '<div class="col-50 text-left repay-date text-sm">' +
                                                    $.formatTime(tmpObj.payTime, 'full') +
                                                '</div>' +
                                                '<div class="col-50 text-right">' +
                                                    '<span class="repay-amount text-yellow text-lg text-bold">' + parseFloat(tmpObj.finalPrice).toFixed(2) + '</span>' +
                                                '</div>' +
                                            '</div>' +
							                '<div class="card-content">' +
								                '<div class="card-content-inner">' +
									                '<div class="row no-gutter">' +
										                '<div class="col-50 text-sm repayed-principal">' +
                                                            '本金：<span class="text-bold">' + parseFloat(tmpObj.instalmentCapital).toFixed(2) +'</span>元' +
										                '</div>' +
										                '<div class="col-50 text-sm handling-charge">' +
											                '利息：<span class="text-bold">' + parseFloat(tmpObj.instalmentInterest).toFixed(2) + '</span>元' +
										                '</div>' +
									                '</div>' +
									            '<div class="row no-gutter">' +
										            '<div class="col-50 text-sm">' +
											            '违约金：<span class="text-bold">' + parseFloat(tmpObj.instalmentLatefee).toFixed(2) + '</span>元' +
										            '</div>' +
									            '</div>' +
								            '</div>' +
							            '</div>' +
						            '</li>';
                }
                repayRecordStr += '</ul>';
                
                setTimeout(function() {
                    if (repayRecordCount == 0) {
                        $('#repayRecordContainer').empty().addClass('no-records');
                    }
                    else {
                        $('#repayRecordContainer').empty().append(repayRecordStr);
                    }
                    $.hideIndicator();
                }, 1000);
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getRepaymentRecord.htm', jsonData, successFunc, failFunc);
    }
};

/* 还款详情（针对某一条订单的还款详情） */
var repayDetailPage = {
    init: function() {
        this.repayDetailInit();
        this.domListener();
    },
    domListener: function() {},
    repayDetailInit: function() {
        var self     = this,
            jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'all'
            },
            successFunc = function(data) {
                var repayBillArr   = data.object.orderList,
                    repayBillCount = repayBillArr.length,
                    repayBillStr   = '<ul>';
                
                for (var i = 0; i < repayBillCount; i ++) {
                    var tmpObj      = repayBillArr[i],
                        payTag      = (tmpObj.payStatus == '0') ? ' not-repayed' : ' has-repayed',
                        payText     = (tmpObj.payStatus == '0') ? '未还' : '已还',
                        repayDate   = (tmpObj.payStatus == '0') ? tmpObj.instalmentRefundDate : tmpObj.payTime,
                        repayStatus = (i + 1) + '/' + repayBillCount + '&nbsp;|&nbsp;' + $.formatTime(repayDate) + payText;
                    
                    repayBillStr += '<li class="card bottom-border top-border' + payTag + '">' +
							            '<div class="card-header">' +
								            '<div class="text-left repay-amount text-yellow text-lg text-bold">' + parseFloat(tmpObj.finalPrice).toFixed(2) + '</div>' +
								            '<div class="text-right repay-status">' +
									            repayStatus +
                                            '</div>' +
                                        '</div>' +
                                        '<div class="card-content">' +
                                            '<div class="card-content-inner">' +
                                                '<div class="row no-gutter">' +
                                                    '<div class="col-50">' +
                                                        '本金：<span class="text-lg">' + tmpObj.instalmentCapital + '</span>元' +
                                                    '</div>' +
                                                    '<div class="col-50">' +
                                                        '利息：<span class="text-lg">' + tmpObj.instalmentInterest + '</span>元' +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</li>';
                }
                repayBillStr += '</ul>';
                
                setTimeout(function() {
                    $('#repayBillContainer').empty().append(repayBillStr);
                    $.hideIndicator();
                }, 1000);
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getRepaymentRecord.htm', jsonData, successFunc, failFunc);
    }
};

/* 用户个人资料 */
var userInfoPage = {
    init: function() {
        /* 针对webapp端自动登录 */
        this.appLogin();
        // this.userInfoInit();
        // this.domListener();
    },
    domListener: function() {
        /* 统一pupup弹出事件 */
        $('.popup-link').on('click', function() {
            var selector = $(this).attr('data-popup');
            $.popup(selector);
        });
    },
    userInfoInit: function() {
        /* 根据用户userId，获取对应的用户信息 */
        var jsonData = {
                mobile: $.getCookie('loginUserMobile'),
                password: $.getCookie('loginUserPassword'),
                userId: $.getCookie('loginUserId')
            },
            successFunc = function(data) {
                var obtainUser = data.object.obtainUser;
                /* 用户信息暂存到cookie中 */
                $.saveUserInfo(data.object.obtainUser);
                /* 用户表中已有的用户信息显示到页面上 */
                for (var key in obtainUser) {
                    if ($('#' + key) && obtainUser[key]) {
                        $('#' + key).text(obtainUser[key]);
                    }
                }

                $.hideIndicator();
            },
            failFunc = function(err) {
                $.hideIndicator();
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/getObtainUser.htm', jsonData, successFunc, failFunc);
    },
    appLogin: function() {
        var self = this;
        if ($.getParameter('platform') == 'app') {
			var jsonData = {
					'mobile'   : $.getParameter('mobile'), 
					'password' : $.getParameter('pwd'),
					'role'     : $.getParameter('role')
				},
				successCallback = function(data) {
					if (data.status == 'success') {
						$.saveUserInfo(data.object);
						self.userInfoInit();
                        self.domListener();
					}
					else {
						$.hideIndicator();
						$.alert('用户名或者密码错误<br>请重试');						
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('网络连接错误<br>请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
			$.showIndicator();
            $('#backBtnContainer').addClass('hidden');
		}
		else {
            $('#backBtnContainer').removeClass('hidden');
			self.userInfoInit();
            self.domListener();
		}
    }
};

/* 用户修改个人资料 */
var editUserPage = {
    init: function() {
        this.userInfoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;

        /* 提示手机号无法进行修改 */
        $('#mobile').on('focus', function() {
            $.toast('手机号无法进行修改！');
        });

        /* 保存资料 */
        $('#saveInfoBtn').on('click', function() {
            var jsonData = self.submitObj(),
                successFunc = function(data) {
                    if (data.status == 'fail') {
                        $.alert('修改失败<br>请稍后重试！');
                    }
                    else {
                        $.hideIndicator();
                        $.alert('信息修改成功', function() {
                            $.router.back();
                        });
                    }
                },
                failFunc = function(err) {
                    console.info(err);
                    $.hideIndicator();
                    $.alert('网络连接出错<br>请稍后重试！');
                },
                ajaxFunc = function() {
                    $.showIndicator();
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/updateObtainUser.htm', jsonData, successFunc, failFunc);
                };

            self.submitValidation(ajaxFunc);
        })
    },
    imgPreview: function(files, popupSelector) {
		for (var i = 0; i < files.length; i ++) {
			var file      = files[i],
				imageType = /^image\//;

			if (!imageType.test(file.type)) { continue; }

			var img = document.createElement('img');
			img.classList.add('tmp-upload');
			img.file = file;

			var reader = new FileReader();
			reader.onload = (function(aImg) {
				return function(e) {
					aImg.src = e.target.result;
					imgSrc = aImg.src;
				};
			})(img);
			reader.readAsDataURL(file);

			$(popupSelector + ' .img-container .tmp-upload').remove();
			$(popupSelector + ' .img-container').removeClass('not-uploaded');
			$(popupSelector + ' .img-container').append(img);
		}
	},
    userInfoInit: function() {
        /* 根据用户userId，获取对应的用户信息 */
        var jsonData = {
                mobile: $.getCookie('loginUserMobile'),
                password: $.getCookie('loginUserPassword'),
                userId: $.getCookie('loginUserId')
            },
            successFunc = function(data) {
                
                var obtainUser = data.object.obtainUser;
                /* 用户表中已有的用户信息显示到页面上 */
                for (var key in obtainUser) {
                    if ($('#' + key) && obtainUser[key]) {
                        $('#' + key).val(obtainUser[key]);
                    }
                }
                $('#password').val($.getCookie('loginUserPassword'));
                $('#userId').val($.getCookie('loginUserId'));

                $.hideIndicator();
            },
            failFunc = function(err) {
                $.hideIndicator();
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/getObtainUser.htm', jsonData, successFunc, failFunc);
    },
    submitObj: function() {
        //返回申请列表中，每个需要输入的input的键名和值
        var submitObj = {};
        $('#editUserPage .submit-input').each(function() {
            var id = $(this).attr('id'),
                val = $(this).val();
            submitObj[id] = val;
        });

        return submitObj;
    },
    submitValidation: function(validationCallbackFunc) {
        var idCard         = $.trim($('#idCard').val()),
            bankCardNum    = $.trim($('#bankCardNum').val()),
            linkman1Name   = $.trim($('#linkman1Name').val()),
            linkman1Mobile = $.trim($('#linkman1Mobile').val()),
            linkman2Name   = $.trim($('#linkman2Name').val()),
            linkman2Mobile = $.trim($('#linkman2Mobile').val()),
            idCardReg      = /^(\d{15}$|^\d{18}$|^\d{17}(\d|X|x))$/,
            bankCardNumReg = /^(\d{16}|\d{19})$/,
            mobileReg      = /^1[34578]\d{9}$/;
        
        if (idCard && !idCardReg.test(idCard)) {
			$.toast('身份证号填写有误！', 750);
			return false;
		}
        else if (bankCardNum && !bankCardNumReg.test(bankCardNum)) {
			$.toast('银行卡号填写有误！', 750);
			return false;
		}
        else if (!linkman1Name || !linkman1Mobile) {
            $.toast('请填写紧急联系人1的信息！', 750);
            return false;
        }
        else if (!mobileReg.test(linkman1Mobile)) {
			$.toast('联系人1手机号填写有误！', 750);
			return false;
		}
        else if (!linkman2Name || !linkman2Mobile) {
            $.toast('请填写紧急联系人2的信息！', 750);
            return false;
        }
        else if (linkman2Mobile && !mobileReg.test(linkman2Mobile)) {
			$.toast('联系人2手机号填写有误！', 750);
			return false;
		}

        $.confirm('姓名、身份证号是否填写将会影响后续实名认证结果<br>确认提交？', 
            function() {
                validationCallbackFunc();
            }
        );
    }
};

/* 信用管理 */
var creditManagementPage = {
    init: function() {
        /* 针对app登录 */
        this.appLogin();
        // this.userInfoInit();
        // this.creditMobileInit();
        // this.domListener();
    },
    domListener: function() {/* 点击手机号运营商授权 */
        $('#creditMobile').on('click', function() {
            var $authorizeStatus = $(this).find('.authorize-status');
            if ($authorizeStatus.hasClass('has-authorize')) {
                $.confirm('已进行过授权<br>是否重新授权？', function() {
                    router.linkTo('credit_mobile.html');
                })
            }
            else if ($authorizeStatus.hasClass('being-authorize')) {
                $.confirm('授权结果获取中<br>是否重新授权？', function() {
                    router.linkTo('credit_mobile.html');
                })
            }
            else {
                router.linkTo('credit_mobile.html');
            }
        });
    },
    userInfoInit: function() {
        /* 实名认证返回结果的func，详见modules */
        var realResult = $.realCheck($.getCookie('loginUserReal'), ['tongdunMobile', 'tongdunHeadPic']);
        
        $('#realResult').text(realResult);
    },
    creditMobileInit: function() {
        var jsonData = {
                obtainUserId: $.getCookie('loginUserId')
            },
            successFunc = function(data) {
                if (data.status == 'success') {
                    if (data.object) {
                        if (data.object.reportUrl) {
                            /* 已经产生运营商数据报告 */
                            $('#creditMobile').find('.authorize-status').removeClass('not-authorize').addClass('has-authorize');
                        }
                        else {
                            /* 已经提交，还未生成对应的运营商数据报告 */
                            $('#creditMobile').find('.authorize-status').removeClass('not-authorize').addClass('being-authorize');
                        }
                    }
                    /* 用户还未进行授权（默认） */
                }
                else {
                    $.alert('获取运营商授权结果出错<br>请稍后重试');
                }
            },
            failFunc = function(err) {
                $.alert('网络连接出错，请稍后重试');
                console.info(err);
            };
            
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/moxie/carrier/getReportDetail.htm', jsonData, successFunc, failFunc);
    },
    appLogin: function() {
        var self = this;
        if ($.getParameter('platform') == 'app') {
			var jsonData = {
					'mobile'   : $.getParameter('mobile'), 
					'password' : $.getParameter('pwd'),
					'role'     : $.getParameter('role')
				},
				successCallback = function(data) {
					if (data.status == 'success') {
						$.saveUserInfo(data.object);
						self.userInfoInit();
                        self.creditMobileInit();
					}
					else {
						$.hideIndicator();
						$.alert('用户名或者密码错误<br>请重试');						
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('网络连接错误<br>请稍后重试');
				};
				
            self.domListener();
			$.showIndicator();
            $('#userInfoTitleContainer').addClass('hidden');
            $('#userInfoTitleLink').addClass('hidden');
            $('#backLinkContainer').addClass('hidden');
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
		}
		else {
            $('#userInfoTitleContainer').removeClass('hidden');
            $('#userInfoTitleLink').removeClass('hidden');
            $('#backLinkContainer').removeClass('hidden');
			self.userInfoInit();
            self.creditMobileInit();
            self.domListener();
		}
    }
};

/* 实名信息 */
var realInfoPage = {
    init: function() {
        // this.realInfoInit();
        // this.domListener();
        /* 针对webapp端自动登录 */
        this.appLogin();
    },
    domListener: function() { },
    realInfoInit: function() {
        var realCheckStr = $.getCookie('loginUserReal');
        /* 从cookie中获取用户的真实姓名、身份证号，以及实名认证结果 */
        $('#realName').text($.getCookie('loginUserName'));
        $('#idCard').text($.getCookie('loginUserIdCard'));
        /* 三项认证结果 */
        var mobileResult = $.realCheck(realCheckStr, ['tongdunMobile']) == '已实名' ? '已认证' : '未认证';
        $('#mobileResult').text(mobileResult);
        var idimgResult = $.realCheck(realCheckStr, ['tongdunHeadPic']) == '已实名' ? '已认证' : '未认证';
        $('#idimgResult').text(idimgResult);
        var bankcardResult = $.realCheck(realCheckStr, ['tongdunBankCard']) == '已实名' ? '已认证' : '未认证';
        $('#bankcardResult').text(bankcardResult);
    },
    appLogin: function() {
        var self = this;
        if ($.getParameter('mobile')) {
			var jsonData = {
					'mobile'   : $.getParameter('mobile'), 
					'password' : $.getParameter('pwd'),
					'role'     : $.getParameter('role'),
                    'longitude': 0, 
                    'latitude' : 0, 
                    'iMei'     : ''
				},
				successCallback = function(data) {
					if (data.status == 'success') {
						$.saveUserInfo(data.object);
						self.realInfoInit();
                        self.domListener();
					}
					else {
						$.hideIndicator();
						$.alert('用户名或者密码错误<br>请重试');						
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('网络连接错误<br>请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
			$.showIndicator();
		}
		else {
            $('#backLinkContainer').removeClass('hidden');
			self.realInfoInit();
		}
    }
};

/* 手机号认证 */
var realMobilePage = {
    init: function() {
        this.realInfoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;

        /* 提交手机号认证 */
        $('#saveInfoBtn').on('click', function() {
            self.submitRealMobile();
        });
    },
    realInfoInit: function() {
        var mobileResult = $.realCheck($.getCookie('loginUserReal'), ['tongdunMobile']);
        /* 从cookie中获取用户的真实姓名、身份证号、手机号 */
        $('#realName').val($.getCookie('loginUserName'));
        $('#idCard').val($.getCookie('loginUserIdCard'));
        $('#mobile').val($.getCookie('loginUserMobile'));
        /* 如果手机已实名：提交按钮移除 */
        if (mobileResult == '已实名') {
            $('.save-btn-container').remove();
        }
        else {
            $('.save-btn-container').removeClass('hidden');
        }
    },
    submitRealMobile: function() {
        var self = this,
            ajaxFunc = function() {
                var jsonData = {
                        type    : 'tongdunMobile',
                        mobile  : $('#mobile').val(),
                        idCard  : $('#idCard').val(),
                        realName: $('#realName').val() 
                    },
                    successFunc = function(data) {
                        if (data.status == 'fail') {
                            $.hideIndicator();
                            $.alert('实名认证未通过');
                            console.info(data.message);
                        }
                        else {
                            $.alert('实名认证通过', function() {
                                $.hideIndicator();
                                $.setCookie('loginUserReal', data.object, 3600);
                                $('.save-btn-container').remove();
                                $.router.back();
                            });
                        }
                        $.hideIndicator();
                    },
                    failFunc = function(err) {
                        $.hideIndicator();
                        console.info(err);
                    };
                
                $.showIndicator();
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/verifyObtainUser.htm', jsonData, successFunc, failFunc);
            };
        
        self.submitValidation(ajaxFunc);
    },
    submitValidation: function(validationCallbackFunc) {
        var realName = $.trim($('#realName').val()),    
            idCard   = $.trim($('#idCard').val());
        
        if (realName == '') {
			$.toast('请先在个人资料中完善“真实姓名”！', 750);
			return false;
		}
        else if (idCard == '') {
			$.toast('请先在个人资料中完善“身份证号”！', 750);
			return false;
		}

        $.confirm('确认提交？', 
            function() {
                validationCallbackFunc();
            }
        );
    }
};

/* 人相对比认证 */
var realIdimgPage = {
    init: function() {
        var self = this,
            loginCallback = function() {
                self.realInfoInit();
                self.domListener();
            };
        
        this.loginCheck(loginCallback);
    },
    domListener: function() {
        var self = this;
        /*照片上传示例popup弹出框  */
        $('#idCardImgSamplesPopupLink').on('click', function() {
            $.popup('#idCardImgSamplesPopup');
        });
        $('#idCardImgSamplesPopupCloseLink').on('click', function() {
            $.closeModal('#idCardImgSamplesPopup');
        });
        /* 弹出上传popup的初始化放在realInfoInit之后 */
        /* 提交“人像对比认证”的照片材料 */
        $('#saveInfoBtn').on('click', function() {
            self.submitRealIdimg();
        });

        /* 返回按钮 */
        $('#backBtn').on('click', function() {
            $.router.back();
        })
    },
    loginCheck: function(callbackFunc) {
        var self = this;
        /* 主要用于上传凭证的时候进行登录 */
        var loginTag = ($.getCookie('loginUserId') && $.getCookie('loginUserMobile') && $.getCookie('loginUserPassword') && $.getCookie('loginUserRole')) ? true : false;
        /* 登录回调，即登录后，关闭登录模态款，弹出凭证上传模态款 */
        var loginCallback = function() {
            $.closeModal('#loginPopup');
            callbackFunc();
        };

        if (loginTag) {
            /* 已登录，进行凭证上传 */
            callbackFunc();
        }
        else {
            $.alert('用户还未登录<br>请先登录', function() {
                $.popup('#loginPopup');
                self.loginOperate(loginCallback);
            });
        }
    },
    loginOperate: function(loginCallback) {
        /* 手机号、密码提交前验证 */
        var loginValidation = function() {
                var mobileNum = $.trim($('#mobileNumber').val()),
                    password = $.trim($('#password').val()),
                    mobileReg = /^1[34578]\d{9}$/;

                if (mobileNum == '') {
                    $.toast('手机号不能为空！', 750);
                    return false;
                }
                else if (!mobileReg.test(mobileNum)) {
                    $.toast('手机号填写有误！', 750);
                    return false;
                }
                else if (password == '') {
                    $.toast('密码不能为空！', 750);
                    return false;
                }
                return true;
            },
            /* 暂存登录信息，到cookie中 */
            saveUserInfo = function(tempObj) {
                $.saveUserInfo(tempObj);
            };

        /* 点击【登录】按钮 */
        $('#loginBtn').on('click', function() {
            var jsonData = {
                    'mobile'   : $.trim($('#mobileNumber').val()),
                    'password' : $.trim($('#password').val()),
                    'role'     : '1',
                    'longitude': 0, 
                    'latitude' : 0, 
                    'iMei'     : ''
                },
                successCallback = function(data) {
                    if (data.object) {
                        $.toast('登录成功');
                        saveUserInfo(data.object);
                        setTimeout(function() {
                            $.hideIndicator();
                            loginCallback();
                        }, 1000);
                    } else {
                        $.hideIndicator();
                        $.alert('用户名或者密码错误<br>请重新登录！');
                    }
                },
                failCallback = function(err) {
                    $.hideIndicator();
                    $.alert('网络连接错误<br>请稍后重试');
                };

            if (!loginValidation()) {
                return false;
            }

            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
            $.showIndicator();
        })
    },
    realInfoInit: function() {
        var self = this;
        /* 根据用户userId，获取对应的用户信息 */
        var jsonData = {
                mobile: $.getCookie('loginUserMobile'),
                password: $.getCookie('loginUserPassword'),
                userId: $.getCookie('loginUserId')
            },
            successFunc = function(data) {
                var obtainUser = data.object.obtainUser;
                /* 用户信息暂存到cookie中 */
                $.saveUserInfo(data.object.obtainUser);
                /* 自动填写真实姓名和身份证号 */
                $('#realName').val(obtainUser.realName);
                $('#idCard').val(obtainUser.idCard);
                /* 显示用户三张照片 */
                /* 身份证A面 */
                $('#idCardImgEmblemUploadPopupLink .img-icon').removeClass('img-camera').addClass('img-camera-active');
                $('#idCardImgEmblem').val(obtainUser.idCardImgEmblem);
                /* 添加img标签判断对应的图片链接是否为空 */
                $('#idCardImgEmblemPreview').append('<img src="' + obtainUser.idCardImgEmblem + '?' + Number(new Date()) + '" onerror="$(\'#idCardImgEmblem\').attr(\'data-uploaded\', \'0\');">');
                /* 身份证B面 */
                $('#idCardImgHeadUploadPopupLink .img-icon').removeClass('img-camera').addClass('img-camera-active');
                $('#idCardImgHead').val(obtainUser.idCardImgHead);
                /* 添加img标签判断对应的图片链接是否为空 */
                $('#idCardImgHeadPreview').append('<img src="' + obtainUser.idCardImgHead + '?' + Number(new Date()) + '" onerror="$(\'#idCardImgHead\').attr(\'data-uploaded\', \'0\');">');
                /* 手持身份证照片 */
                $('#idCardImgManUploadPopupLink .img-icon').removeClass('img-camera').addClass('img-camera-active');
                $('#idCardImgMan').val(obtainUser.idCardImgMan);
                /* 添加img标签判断对应的图片链接是否为空 */
                $('#idCardImgManPreview').append('<img src="' + obtainUser.idCardImgMan + '?' + Number(new Date()) + '" onerror="$(\'#idCardImgMan\').attr(\'data-uploaded\', \'0\');">');
                /* 添加图片上传事件监听 */
                $('.popup-link').on('click', function() {
                    var selector = $(this).attr('data-popup'),
                        imgType  = selector,
                        imgName  = selector + '_' + $.getCookie('loginUserId'),

                        realTag  = ($.realCheck($.getCookie('loginUserReal'), ['tongdunHeadPic']) == '已实名') ? 1 : 0,

                        targetFrameSrc  = '../upload_img.html?imgType=' + imgType + '&imgName=' + imgName + '&originUrl=' + obtainUser[selector] + '&realTag=' + realTag,
                        currentFrameSrc = parent.document.getElementById(selector + 'Frame').contentWindow.location.href;
                    
                    if (currentFrameSrc.indexOf('init=1') != -1) {
                        $('#' + selector + 'Frame').attr('src', targetFrameSrc);
                    }

                    $.popup('#' + selector + 'UploadPopup');
                    self.checkWXRuntime();
                });
                /* 关闭上传图片popup框 */
                $('.close-popup').on('click', function() {
                    var selector = $(this).attr('data-popup'),
                        frameUrl = parent.document.getElementById(selector + 'Frame').contentWindow.location.href;
                    
                    if (frameUrl.indexOf('viewUrl=') != -1) {
                        var viewUrl = (frameUrl.split('viewUrl=')[1]).split('&')[0];
                        $('#' + selector).attr('data-uploaded', '1');
                        $('#' + selector + 'UploadPopupLink .img-icon').removeClass('img-camera').addClass('img-camera-active');
                    }
                    $.closeModal('#' + selector + 'UploadPopup');
                });

                $.hideIndicator();
            },
            failFunc = function(err) {
                $.hideIndicator();
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/getObtainUser.htm', jsonData, successFunc, failFunc);
        var idimgResult = $.realCheck($.getCookie('loginUserReal'), ['tongdunHeadPic']);
        /* 如果手机已实名：提交按钮移除 */
        if (idimgResult == '已实名') {
            $('.save-btn-container').remove();
        }
        else {
            $('.save-btn-container').removeClass('hidden');
        }
    },
    submitRealIdimg: function() {
        var self = this,
            ajaxFunc = function() {
                var jsonData = {
                        type           : 'tongdunHeadPic',
                        realName       : $.trim($('#realName').val()),
                        idCard         : $.trim($('#idCard').val()),
                        idCardImgEmblem: $.trim($('#idCardImgEmblem').val()),
                        idCardImgHead  : $.trim($('#idCardImgHead').val()),
                        idCardImgMan   : $.trim($('#idCardImgMan').val())
                    },
                    successFunc = function(data) {
                        if (data.status == 'fail') {
                            $.hideIndicator();
                            $.alert('实名认证未通过');
                            console.info(data.message);
                        }
                        else {
                            $.hideIndicator();
                            $.alert('实名认证通过');
                            $.setCookie('loginUserReal', data.object, 3600);
                            $('.save-btn-container').remove();
                        }
                    },
                    failFunc = function(err) {
                        $.alert('网络连接出错<br>请稍后重试');
                        $.hideIndicator();
                        console.info(err);
                    };
                
                $.showIndicator();
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/verifyObtainUser.htm', jsonData, successFunc, failFunc);
            };       
        self.submitValidation(ajaxFunc);
    },
    submitValidation: function(validationCallbackFunc) {
        var realName        = $.trim($('#realName').val()),
            idCard          = $.trim($('#idCard').val()),
            idCardImgEmblem = $('#idCardImgEmblem').attr('data-uploaded'),
            idCardImgHead   = $('#idCardImgHead').attr('data-uploaded'),
            idCardImgMan    = $('#idCardImgMan').attr('data-uploaded');
        
        if (realName == '') {
			$.toast('请先在个人资料中完善“真实姓名”！', 750);
			return false;
		}
        else if (idCard == '') {
			$.toast('请先在个人资料中完善“身份证号”！', 750);
			return false;
		}
        // 如果某个图片的input为空，对应的popup里面的图片remove掉
        else if (idCardImgEmblem == '0') {
			$.toast('请上传身份证照A面！', 750);
			return false;
		}
        else if (idCardImgHead == '0') {
			$.toast('请上传身份证照B面！', 750);
			return false;
		}
        else if (idCardImgMan == '0') {
			$.toast('请上传手持身份证照片！', 750);
			return false;
		}

        $.confirm('证件照是否清晰将会影响实名认证结果<br>确认提交？', 
            function() {
                validationCallbackFunc();
            }
        );
    },
    checkWXRuntime: function() {
        /* 插件限制，当在微信浏览器中打开页面时，提示在浏览器中打开 */
        // TODO
        var ua = window.navigator.userAgent.toLowerCase();
        if(ua.match(/MicroMessenger/i) == 'micromessenger'){
            $.alert('<div style="font-size:0.85em;">图片上传功能在微信内置浏览器存在问题<br>请打开右上角菜单用其他浏览器打开</div>');
            return true;
        }
        return false;
    }
};

/* 银行卡号认证 */
var realBankcardPage = {
    init: function() {
        this.realInfoInit();
        this.bankListInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        $('#saveInfoBtn').on('click', function() {
            self.submitRealBankcard();
        });

        /* 弹出银行卡号所属银行选择 */
        $('#bankSelectPopupLink').on('click', function() {
            $.popup('#bankSelectPopup');
        });

        /* 点选某个银行进行选择时 */
        $('#bankSelectContainer').on('click', '.item-link', function() {
            var selectedBankId   = $(this).attr('data-bankid'),
                selectedBankName = $(this).find('.item-title').text(),
                selectedBankAbbr = $(this).attr('data-abbr');
            
            $('#bankId').val(selectedBankId);
            $('#bankName').val(selectedBankName);
            $('#bankAbbr').val(selectedBankAbbr);
            $.closeModal('#bankSelectPopup');
        });
    },
    realInfoInit: function() {
        /* 根据用户userId，获取对应的用户信息 */
        var jsonData = {
                mobile: $.getCookie('loginUserMobile'),
                password: $.getCookie('loginUserPassword'),
                userId: $.getCookie('loginUserId')
            },
            successFunc = function(data) {
                var obtainUser = data.object.obtainUser;
                /* 用户信息暂存到cookie中 */
                $.saveUserInfo(data.object.obtainUser);
                /* 用户表中已有的用户信息显示到页面上 */
                for (var key in obtainUser) {
                    if ($('#' + key) && obtainUser[key]) {
                        $('#' + key).val(obtainUser[key]);
                    }
                }

                var bankCardResult = $.realCheck(obtainUser.realCheck, ['tongdunBankCard']);
                /* 如果银行卡已实名：提交按钮移除 */
                if (bankCardResult == '已实名') {
                    $('.save-btn-container').remove();
                }
                else {
                    $.alert('输入的银行卡将作为还款代扣卡<br>请确认');
                    $('.save-btn-container').removeClass('hidden');
                }

                $.hideIndicator();
            },
            failFunc = function(err) {
                $.hideIndicator();
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/getObtainUser.htm', jsonData, successFunc, failFunc);
    },
    submitRealBankcard: function() {
        var self = this,
            ajaxFunc = function() {
                var jsonData = {
                        type       : 'tongdunBankCard', 
                        realName   : $.trim($('#realName').val()),
                        idCard     : $.trim($('#idCard').val()),
                        bankId     : $.trim($('#bankId').val()),
                        bankName   : $.trim($('#bankName').val()),
                        bankCardNum: $.trim($('#bankCardNum').val())
                    },
                    successFunc = function(data) {
                        if (data.status == 'fail') {
                            $.hideIndicator();
                            $.alert('实名认证未通过');
                            console.info(data.message);
                        }
                        else {
                            $.hideIndicator();
                            $.alert('实名认证通过', function() {
                                $.setCookie('loginUserReal', data.object, 3600);
                                $('.save-btn-container').remove();
                                $.router.back();
                            });
                        }
                        $.hideIndicator();
                    },
                    failFunc = function(err) {
                        $.hideIndicator();
                        console.info(err);
                    };
                
                $.showIndicator();
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/verifyObtainUser.htm', jsonData, successFunc, failFunc);
            };
        self.submitValidation(ajaxFunc);
    },
    submitValidation: function(validationCallbackFunc) {
        var bankCardNum    = $.trim($('#bankCardNum').val()),
            realName       = $.trim($('#realName').val()),
            idCard         = $.trim($('#idCard').val()),
            bankId         = $.trim($('#bankId').val()),
            bankAbbr       = $.trim($('#bankAbbr').val()),
            bankCardNumReg = /^(\d{16}|\d{17}|\d{18}|\d{19})$/;
        
        if (realName == '') {
			$.toast('请先在个人资料中完善“真实姓名”！', 750);
			return false;
		}
        else if (idCard == '') {
			$.toast('请先在个人资料中完善“身份证号”！', 750);
			return false;
		}
        else if (!bankId) {
			$.toast('请选择银行卡号所属银行！', 750);
			return false;
		}
        else if (!bankCardNumReg.test(bankCardNum)) {
			$.toast('银行卡号填写有误！', 750);
			return false;
		}
        else if (!bankCardNum) {
			$.toast('请填写银行卡号！', 750);
			return false;
		}
        /* 核验银行卡号和所选的银行是否匹配 */
        var ajaxUrl = defaultConfig.domain + defaultConfig.project + '/creditUser/validateAndCacheCardInfo.htm',
            jsonData   = {
                'cardNo': bankCardNum
            },
            successFunc = function(data) {
                $.hideIndicator();

                if (data.status == 'fail') {
                    $.alert('银行卡核验时出错<br>请稍后重试');
                    console.info(data.message);
                }
                else {
                    eval('var result = ' + data.object);

                    if (result.bank == bankAbbr) {
                        $.confirm('银行卡号是否填写正确将会影响实名认证结果<br>确认提交？', 
                            function() {
                                validationCallbackFunc();
                            }
                        );
                    }
                    else {
                        $.alert('输入的银行卡号和选择的所属银行不匹配<br>请核对后再提交');
                    }
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('银行卡核验时出错<br>请稍后重试');
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(ajaxUrl, jsonData, successFunc, failFunc);
    },
    bankListInit: function() {
        var successFunc = function(data) {
                if (data.status == 'fail') {
                    $.alert(data.message);
                    console.info(data);
                }
                else {
                    var bankArr     = data.object,
                        bankListStr = '<ul>';
                    
                    for (var i = 0, len = bankArr.length; i < len; i ++) {
                        var tempBank     = bankArr[i],
                            baofuSupport = tempBank.baopay ? JSON.parse(tempBank.baopay) : false;
                        
                        if (baofuSupport && baofuSupport.baoPay == 1) {
                            
                            bankListStr += ('' +
                                '<li class="item-content item-link" data-abbr="' + tempBank.abbreviation + '" data-bankid="' + tempBank.bankId + '">' +
                                    '<div class="item-inner">' +
                                        '<div class="item-title">' + tempBank.bankName + '</div>' +
                                    '</div>' +
                                '</li>'
                            );
                        }
                    }

                    bankListStr += '</ul>';

                    $('#bankSelectContainer').empty().append(bankListStr);
                }
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
                console.info(err);
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/getCommonBankInfo.htm', {}, successFunc, failFunc);
    }
};

/* 手机号运营商授权 */
var creditMobilePage = {
    init: function() {
        this.creditMobileInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;

        /* 点击授权按钮 */
        $('#authorizeBtn').on('click', function() {
            if ($(this).hasClass('init')) {
                $.toast('验证码发送中，请等待...', 750);
            }
            else {
                if ($(this).hasClass('second-authorize')) {
                    $.prompt('部分城市（或手机号）需要进行二次验证<br>请输入第二次收到的验证码', function (code) {
                        if (code) {
                            self.secondAuthorizeMobile(jsonData.taskId, code);
                        }
                        else {
                            $.toast('请输入第二次收到的验证码！');
                        }
                    });
                }
                else {
                    self.authorizeMobile();
                }
            }
        });

        /* 点击取消授权按钮 */
        $('#unauthorizeBtn').on('click', function() {
            self.unauthorizeMobile();
        });

        /* 点击获取验证码按钮 */
        $('#requestCodeBtn').on('click', function() {
            self.countFunc('#requestCodeBtn');
            self.getMobileCode();
        });

        /* 查看tips内容 */
        $('#tipsPopupLink').on('click', function() {
            self.viewTips();
        })
    },
    creditMobileInit: function() {
        /* 检查用户是否填写过真实姓名、身份证号，如果没有，提示还未填写，不让用户进行授权 */
        var realNameTag = $.getCookie('loginUserName') ? true : false,
            idCardTag   = $.getCookie('loginUserIdCard') ? true : false;
        
        if (!(realNameTag && idCardTag)) {
            $.alert('实名信息未完善，无法进行运营商授权！', function() {
                $.router.back();
            });
            return false;
        }

        $('#mobile').val($.getCookie('loginUserMobile'));
    },
    getMobileCode: function() {
        var self = this;        

        if (!self.submitValidation()) {
            return false;
        }
        /* 提交手机号、密码，返回taskId，同时运营商发送验证码给用户 */
        var jsonData = {
                mobile  : $.trim($('#mobile').val()), 
                password: $.trim($('#password').val())
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    if (data.message == '任务已存在，创建失败！') {
                        $.alert('已进行授权<br>请耐心等待后台审核结果');
                    }
                    else {
                        $.alert(data.message);
                        console.info(data.message);
                    }
                }
                else {
                    var taskId = data.object.task_id;

                    $.toast('服务商验证码已发送，请查收');
                    $('#taskId').val(taskId);
                    
                    self.getTaskStatus(taskId);
                }
            },
            failFunc = function(err) {
                $.alert('网络连接出错，请稍后重试');
                console.info(err)
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/moxie/carrier/createTask.htm', jsonData, successFunc, failFunc);
    },
    getTaskStatus: function(taskId) {
        var jsonData = {
                taskId: taskId
            },
            successFunc = function(data) {
                if (data.object.input) {
                    clearInterval(checkStatus);
                    if (data.object.input.type == 'sms') {
                        $('#authorizeBtn').removeClass('init');
                    }
                    else {
                        $.toast('图片验证码正在努力中');
                    }
                }
                else {
                    if (data.object.finished) {
                        clearInterval(checkStatus);
                        $.alert('已进行授权<br>请耐心等待授权结果', function() {
                            $.router.back();
                        });
                    }
                }
            },
            failFunc = function(err) {
                $.alert('网络连接出错，请稍后重试');
                console.info(err)
            };
        
        var ajaxAction = function() {
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/moxie/carrier/getTaskStatus.htm', jsonData, successFunc, failFunc);
        };
        
        var checkStatus = setInterval(function() {
            ajaxAction();
        }, 1000);
    },
    authorizeMobile: function() {
        var self = this;
        if (!self.submitValidation()) {
            return false;
        }
        if (!$.trim($('#verifyCode').val())) {
            $.toast('请填写手机获取到的验证码', 750);
            return false;
        }
        /* 用户进行授权操作 */
        var jsonData = {
                taskId: $('#taskId').val(),
                code  : $('#verifyCode').val()
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.alert('授权失败<br>' + data.message);
                    console.info(data);
                }
                else {
                    $.showIndicator();
                    self.secondGetTaskStatus();
                }
            },
            failFunc = function(err) {
                $.alert('网络连接错误，请稍后重试');
                console.info(err);
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project +'/moxie/carrier/input.htm', jsonData, successFunc, failFunc);
    },
    secondGetTaskStatus: function(onceAuthorizeFunc) {
        /* 轮询检查任务状态，主要针对魔蝎针对部分地区需要提交两次验证码的情况 */
        var self = this,
            jsonData = {
                taskId: $('#taskId').val()
            },
            successFunc = function(data) {
                if (data.object.can_leave) {
                    clearInterval(checkStatus);

                    $.hideIndicator();
                    $.alert('已进行授权<br>请耐心等待授权结果', function() {
                        $.router.back();
                    });
                }
                else {
                    if (data.object.description.indexOf('二次') != -1) {
                        if (data.object.input) {
                            clearInterval(checkStatus);

                            $.hideIndicator();
                            if (data.object.input.type == 'sms') {
                                $('#authorizeBtn').addClass('second-authorize');
                                $.prompt('部分城市（或手机号）需要进行二次验证<br>请输入第二次收到的验证码', function (code) {
                                    if (code) {
                                        self.secondAuthorizeMobile(jsonData.taskId, code);
                                    }
                                    else {
                                        $.toast('请输入第二次收到的验证码！');
                                    }
                                });
                            }
                            else {
                                $.toast('图片验证码正在努力中');
                            }
                        }
                    }
                }
            },
            failFunc = function(err) {
                $.alert('网络连接出错，请稍后重试');
                console.info(err)
            };
        
        var ajaxAction = function() {
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/moxie/carrier/getTaskStatus.htm', jsonData, successFunc, failFunc);
        };
        
        var checkStatus = setInterval(function() {
            ajaxAction();
        }, 1000);
    },
    secondAuthorizeMobile: function(taskId, code) {
        var jsonData = {
                taskId: taskId,
                code  : code
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.alert('授权失败<br>' + data.message);
                    console.info(data);
                }
                else {
                    $.alert('已进行授权<br>请耐心等待授权结果', function() {
                        $.router.back();
                    });
                }
            },
            failFunc = function(err) {
                $.alert('网络连接错误，请稍后重试');
                console.info(err);
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project +'/moxie/carrier/input.htm', jsonData, successFunc, failFunc);
    },
    unauthorizeMobile: function() {
        var self = this;
        if (!self.submitValidation()) {
            return false;
        }
        /* 用户进行取消授权操作 */
        $.toast('取消授权功能完善中...', 750);
    },
    submitValidation: function() {
        var mobileNum  = $.trim($('#mobile').val()), 
			password   = $.trim($('#password').val()),
			mobileReg  = /^1[34578]\d{9}$/;
		
		if (mobileNum == '') {
			$.toast('手机号不能为空！', 750);
			return false;
		}
		else if (!mobileReg.test(mobileNum)) {
			$.toast('手机号填写有误！', 750);
			return false;
		}
		else if (password == '') {
			$.toast('密码不能为空！', 750);
			return false;
		}
        else if (password.length != 6) {
            $.toast('运营商密码长度为6位！', 750);
            return false;
        }

		return true;
    },
    /* 发送短信倒计时 */
    countFunc: function(selector) {
        var $sendBtn = $(selector),
            TIME = 59,
            countInter = setInterval(function() {
                $sendBtn.text('(' + TIME + 's)');
                if (TIME-- <= 0) {
                    clearInterval(countInter);
                    $sendBtn.text('重新发送').removeClass('click-ban');
                }
            }, 1000);
        $sendBtn.addClass('click-ban');
        $sendBtn.text('(60s)');
    },
    viewTips: function() {
        $.popup('#tipsPopup');
    }
};

/* 减少全局变量名 */
var customer = {
    indexPage           : indexPage,
    loanFormPage        : loanFormPage,
    repayBillPerPage    : repayBillPerPage,
    repayRecordPage     : repayRecordPage,
    repayDetailPage     : repayDetailPage,
    repayBillAllPage    : repayBillAllPage,
    userInfoPage        : userInfoPage,
    editUserPage        : editUserPage,
    loanPage            : loanPage,
    orderPage           : orderPage,
    orderDetailPage     : orderDetailPage,
    creditManagementPage: creditManagementPage,
    realInfoPage        : realInfoPage,
    realMobilePage      : realMobilePage, 
    realIdimgPage       : realIdimgPage, 
    realBankcardPage    : realBankcardPage, 
    creditMobilePage    : creditMobilePage
};
/* exports */
window.customer = customer;

/* 页面初始化（用于网页版刷新页面后） */
$(document).on('pageInit', function() {
    router.setPage();
})
$.init();

/* 进入登录页面，输入手机号、验证码登录 */
var loginPage = {
    init: function() {
        this.domListener();
    },
    domListener: function() {
        var self = this;

        $('#loginBtn').on('click', function() {
            self.loginFunc();
        });

        /* 新用户注册链接点击事件 */
		$('#registerLink').on('click', function() {
			var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/register.html';
			window.location.href = target;
		});
    },
    loginFunc: function() {
        var self = this,
            jsonData = {
                mobile  : $('#mobile').val().trim(),
                password: $('#password').val().trim(),
                role    : 1
            },
            successFunc = function(data) {
                $.hideIndicator();
                if (data.status == 'fail') {
                    $.alert(data.message);
                } else {
                    $.setCookie('pwd', $('#password').val().trim(), 3600);
                    self.linkTo(data.object);
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接错误<br>请稍后重试');
            };
        if (self.submitValidation()) {
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/login.json', jsonData, successFunc, failFunc);
            $.showIndicator();
        }
    },
    submitValidation: function() {
        var mobile   = $('#mobile').val().trim(),
            password = $('#password').val().trim(),
            mobileReg = /^1[34578]\d{9}$/;

        if (!mobile) {
            $.toast('手机号不能为空！', 750);
			return false;
        } else if (!mobileReg.test(mobile)) {
            $.toast('手机号填写有误！', 750);
			return false;
        } else if (!password) {
            $.toast('密码不能为空！', 750);
			return false;
        }

        return true;
    },
    linkTo: function(tempObj) {
        $.hideIndicator();
        $.toast('登录成功，即将跳转');
        $.setCookie('userMobile', tempObj.carOwnerInfoBak.mobile, 3600);
        $.setCookie('userData', JSON.stringify(tempObj.carOwnerInfoBak), 3600);
        $.setCookie('orderData', JSON.stringify(tempObj.vehicleOrderInfo), 3600);

        setTimeout(function() {
            var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/';
            if (tempObj.vehicleOrderInfo) {
                switch (parseInt(tempObj.vehicleOrderInfo.payStatus)) {
                    case 0:
                        target += 'wait_page.html';
                        break;
                    case 1:
                        target += 'new_insurance_price.html';
                        break;
                    case 2:
                        target += 'policy_no_wait.html';
                        break;
                    case 3:
                        target += 'success_page.html';
                        break;
                    case 4:
                        target += 'instalment_success.html';
                        break;
                    default:
                        target += 'new_insurance_info.html';
                }
            }
            else {
                target += 'new_insurance_info.html';
            }

            window.location.href = target;
        }, 1000);
    }
};

/* 针对微信的获取openid */
var loginWechatPage = {
    init: function() {
        this.wechatInfoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 点击获取验证码 */
        $('#getVerifyCodeBtn:not(.click-ban)').on('click', function() {
            self.getVerifyCode();
        });
        /* 点击注册 */
        $('#registerWechatBtn').on('click', function() {
            self.register();
        });
        /* 已注册用户进行微信openid绑定 */
		$('#bindWechatLink').on('click', function() {
			$.alert('请在公众号菜单栏【医美】中进行微信绑定');
		});
    },
    submitValidation: function() {
        /* 提交注册信息前验证 */
		var mobileNum  = $.trim($('#mobile').val()), 
			password   = $.trim($('#password').val()),
			pwdConfirm = $.trim($('#verifyPassword').val()),
			verifyCode = $.trim($('#verifyCode').val()),
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
		else if (pwdConfirm == '') {
			$.toast('请填写确认密码！', 750);
			return false;
		}
		else if (password != pwdConfirm) {
			$.toast('两次输入的密码不一致！', 750);
			return false;
		}
		else if (verifyCode == '') {
			$.toast('请填写验证码！', 750);
			return false;
		}
		else if (!$.getCookie('mobileVerifyCode')) {
			$.toast('验证码已过期，请重新获取！', 750);
			return false;
		}
		else if (verifyCode != $.getCookie('mobileVerifyCode')) {
			$.toast('验证码错误！', 750);
			return false;
		}
		return true;
    },
    getVerifyCode: function() {
        var $sendBtn  = $('#getVerifyCodeBtn'),
            mobileNum = $.trim($('#mobile').val()), 
			mobileReg = /^1[34578]\d{9}$/;
		
		if (mobileNum == '') {
			$.toast('手机号不能为空！', 750);
			return false;
		}
		else if (!mobileReg.test(mobileNum)) {
			$.toast('手机号填写有误！', 750);
			return false;
		}
		/* 发送短信倒计时 */
		var countFunc = function() {
			var TIME       = 59,
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
					mobile: $.trim($('#mobile').val())
				},
				successFunc = function(data) {
					$.setCookie('mobileVerifyCode', data.object, 60);
				},
				failFunc = function(err) {
					$.toast('短信发送失败，请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/getCode.json', jsonData, successFunc, failFunc);
		};
					
		$sendBtn.addClass('click-ban');
		if (!$.getCookie('mobileVerifyCode')) {
			requestCode();
		}
		countFunc();
    },
    register: function() {
        var self = this,
            jsonData  = {
                'mobile'      : $.trim($('#mobile').val()), 
                'password'    : $.trim($('#password').val()),
                'wechatOpenId': $.trim($('#openId').val()),
                'role'        : 1,
                'realName'    : '',
                'realCheck'   : 0,
                'idCard'      : '',
                'bankName'    : '',
                'bankCardNum' : ''
            },
            successCallback = function(data) {
                if (data.status == 'success') {
                    self.loginFunc(jsonData);
                }
                else {
                    $.alert(data.message);
                    $.hideIndicator();
                }
            },
            failCallback = function(err) {
                $.hideIndicator();
                $.alert('注册失败<br>请稍后重试');
                console.info(err);
            };
        
        if (self.submitValidation()) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/regist.json', jsonData, successCallback, failCallback);
        }
    },
    loginFunc: function(jsonData) {
        var self = this,
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.alert(data.message);
                } else {
                    $.hideIndicator();
                    $.setCookie('userMobile', jsonData.mobile, 3600);
                    $.setCookie('pwd', jsonData.password, 3600);
                    $.setCookie('userData', JSON.stringify(data.object.carOwnerInfoBak), 3600);
                    $.setCookie('orderData', JSON.stringify(data.object.vehicleOrderInfo), 3600);
                    setTimeout(function() {
                        var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/new_insurance_info.html';
                        window.location.href = target;
                    }, 1000);
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接错误<br>请稍后重试');
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/login.json', jsonData, successFunc, failFunc);
    },
    wechatInfoInit: function() {
        /* 根据用户的openId，请求后台，判断是否和已有用户绑定 */
		/* 根据url中的code参数，传给后台，获取对应的openId */
		var self = this,
			jsonData1 = {
				code: $.getParameter('wxcode')
			},
			successFunc1 = function(data) {
				/* 暂存openId到cookie中，用于后续跳转绑定已有账号 */
				$.setCookie('wechatOpenId', data.object.openid, 3600);
				/* 根据openId，后台判断是否绑定，并自动登录 */
				var jsonData2 = {
						openId: data.object.openid
					},
					successFunc2 = function(data) {
						if (data.status == 'success') {
							var jsonObj = {
									'mobile'   : data.object.mobile, 
									'password' : data.object.password,
									'role'     : 1
								};
							
							/* 用户登录 */
							self.loginFunc(jsonObj);
						}
						else {
							$.hideIndicator();
							$('.page').removeClass('invisible');
						}
					},
					failFunc2 = function(err) {
						$.alert('网络连接错误<br>请稍后重试');
					};
				
				$.showIndicator();
				$('#openId').val(data.object.openid);
				/* 根据后台返回的openId，向后台请求；
				 * 若该openId已经绑定过（注册过，后台有记录），该用户自动登录；
				 * 若该openid还未绑定过（即对应的微信用户还未注册过），显示注册页面，让用户进行注册，并绑定openId
				 */
				$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/judgeRegist.json', jsonData2, successFunc2, failFunc2);
			},
			failFunc1 = function(err) {
				$.alert('网络连接错误<br>请稍后重试');
			};
		
        if (jsonData1.code) {
            $.showIndicator();
            /* 根据url中的code参数，向后台请求，获取对应用户的额openId */
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/getwechatOpenId.json', jsonData1, successFunc1, failFunc1);
        } else {
            $.alert('请通过公众号打开此链接！');
        }
    }
};

/* 用户注册 */
var registerPage = {
    init: function() {
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 点击获取验证码 */
        $('#getVerifyCodeBtn:not(.click-ban)').on('click', function() {
            self.getVerifyCode();
        });
        /* 点击注册 */
        $('#registerBtn').on('click', function() {
            self.register();
        });
        /* 已注册用户链接点击事件 */
		$('#loginLink').on('click', function() {
			var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/login.html';
			window.location.href = target;
		});
    },
    submitValidation: function() {
        /* 提交注册信息前验证 */
		var mobileNum  = $.trim($('#mobile').val()), 
			password   = $.trim($('#password').val()),
			pwdConfirm = $.trim($('#verifyPassword').val()),
			verifyCode = $.trim($('#verifyCode').val()),
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
		else if (pwdConfirm == '') {
			$.toast('请填写确认密码！', 750);
			return false;
		}
		else if (password != pwdConfirm) {
			$.toast('两次输入的密码不一致！', 750);
			return false;
		}
		else if (verifyCode == '') {
			$.toast('请填写验证码！', 750);
			return false;
		}
		else if (!$.getCookie('mobileVerifyCode')) {
			$.toast('验证码已过期，请重新获取！', 750);
			return false;
		}
		else if (verifyCode != $.getCookie('mobileVerifyCode')) {
			$.toast('验证码错误！', 750);
			return false;
		}
		return true;
    },
    getVerifyCode: function() {
        var $sendBtn  = $('#getVerifyCodeBtn'),
            mobileNum = $.trim($('#mobile').val()), 
			mobileReg = /^1[34578]\d{9}$/;
		
		if (mobileNum == '') {
			$.toast('手机号不能为空！', 750);
			return false;
		}
		else if (!mobileReg.test(mobileNum)) {
			$.toast('手机号填写有误！', 750);
			return false;
		}
		/* 发送短信倒计时 */
		var countFunc = function() {
			var TIME       = 59,
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
					mobile: $.trim($('#mobile').val())
				},
				successFunc = function(data) {
					$.setCookie('mobileVerifyCode', data.object, 60);
				},
				failFunc = function(err) {
					$.toast('短信发送失败，请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/getCode.json', jsonData, successFunc, failFunc);
		};
					
		$sendBtn.addClass('click-ban');
		if (!$.getCookie('mobileVerifyCode')) {
			requestCode();
		}
		countFunc();
    },
    register: function() {
        var self = this,
            jsonData  = {
                'mobile'  : $.trim($('#mobile').val()), 
                'password': $.trim($('#password').val()),
                'role'    : 1
            },
            successCallback = function(data) {
                if (data.status == 'success') {
                    self.loginFunc(jsonData);
                }
                else {
                    $.alert(data.message);
                    $.hideIndicator();
                }
            },
            failCallback = function(err) {
                $.hideIndicator();
                $.alert('注册失败<br>请稍后重试');
                console.info(err);
            };
        
        if (self.submitValidation()) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/regist.json', jsonData, successCallback, failCallback);
        }
    },
    loginFunc: function(jsonData) {
        var self = this,
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.alert(data.message);
                } else {
                    $.hideIndicator();
                    $.toast('注册成功，即将跳转');
                    $.setCookie('userMobile', jsonData.mobile, 3600);
                    $.setCookie('pwd', jsonData.password, 3600);
                    $.setCookie('userData', JSON.stringify(data.object.carOwnerInfoBak), 3600);
                    $.setCookie('orderData', JSON.stringify(data.object.vehicleOrderInfo), 3600);
                    setTimeout(function() {
                        var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/new_insurance_info.html';
                        window.location.href = target;
                    }, 1000);
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接错误<br>请稍后重试');
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/login.json', jsonData, successFunc, failFunc);
    }
};

/* 车辆基本信息录入 */
var newInsuranceInfoPage = {
    init: function() {
        this.provinceListInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;

        /* 单行单选框初始化 */
        $.singleRadio();

        /* 统一的popup弹出框 */
        $('.popup-link').on('click', function() {
            $.popup($(this).attr('data-popup'));
        });

        /* 点击某个省份后 */
        $('#citySelectPopup #cityListContainer').on('click', '.province-item', function() {
            self.cityItemInit($(this));
        })
        /* 点选某个城市后 */
        .on('click', '.city-item', function() {
            self.cityFill($(this));
        });

        /* 跳转到下一步，并进行内容保存 */
        $('#newInsuranceInfoPage .step-link-container .button').on('click', function() {
            self.linkToNext();
        });
    },
    provinceListInit: function() {
        var jsonData = {},
            successFunc = function(data) {
                var provinceList  = data.object,
                    provinceCount = provinceList.length,
                    provinceStr   = '';
                
                for (var i = 0; i < provinceCount; i ++) {
                    var provinceItem = provinceList[i];

                    provinceStr += ('<li class="list-group-title province-item init" data-code="' + provinceItem.placeCode + '">' + provinceItem.placeFullName + '<i class="icon icon-right pull-right"></i></li>');
                    provinceStr += '<div id="province' + provinceItem.placeCode + '" class="city-list-content"></div>';
                }

                $('#cityListContainer').empty().append(provinceStr);
            },
            failFunc = function(err) {
                $.alert('获取省市列表失败<br>请检查网络');
                console.info(err);
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findAllProvince.json', jsonData, successFunc, failFunc);
    },
    cityItemInit: function($provinceItem) {
        var placeCode = $provinceItem.attr('data-code'),
            $cityListContent = $('#cityListContainer').find('#province' + placeCode)
            jsonData = {
                placeCode: placeCode
            },
            successFunc = function(data) {
                var cityListArr = data.object,
                    cityCount   = cityListArr.length,
                    cityListStr = '';

                for (var i = 0; i < cityCount; i ++) {
                    var cityItem = cityListArr[i];

                    cityListStr +=  '<li class="inline-block">' +
                                        '<div class="item-content">' +
                                            '<div class="item-inner">' +
                                                '<a class="button theme-btn-hollow city-item" ' +
                                                    'data-province="' + placeCode + '" ' +
                                                    'data-code="' + cityItem.placeCode + '" ' +
                                                    'data-carNo="' + cityItem.licenseCode + '" ' +
                                                    'data-fullName="' + cityItem.placeFullName + '" ' + 
                                                    'data-postNo="' + cityItem.postCode + '">' + 
                                                        cityItem.placeName + 
                                                '</a>' +
                                            '</div>' +
                                        '</div>' +
                                    '</li>';
                }
                
                $cityListContent.empty().append(cityListStr).addClass('expanded');
                $provinceItem.removeClass('init');
                $provinceItem.find('.icon').removeClass('icon-right').addClass('icon-down');
                $.hideIndicator();
            },
            failFunc = function(err) {
                $.alert('获取城市列表失败！');
                console.info(err);
                $.hideIndicator();
            };
        
        if ($provinceItem.hasClass('init')) {
            /* 首次获取城市列表 */
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findAllCity.json', jsonData, successFunc, failFunc);
        }
        else {
            /* 已获取过城市列表 */
            if ($cityListContent.hasClass('expanded')) {
                $provinceItem.find('.icon').removeClass('icon-down').addClass('icon-right');
                $cityListContent.removeClass('expanded');
            }
            else {
                $provinceItem.find('.icon').removeClass('icon-right').addClass('icon-down');
                $cityListContent.addClass('expanded');
            }
        }
    },
    cityFill: function($cityItem) {
        var province  = $cityItem.attr('data-province'),
            placeName = $cityItem.attr('data-fullName'),
            placeCode = $cityItem.attr('data-code'),
            preCarNo  = $cityItem.attr('data-carNo');
        
        $('#provinceCode').val(province);
        $('#placeName').val(placeName);
        $('#placeCode').val(placeCode);
        $('#licenseNo').val(preCarNo);
        $.closeModal('#citySelectPopup');
    },
    linkToNext: function() {
        if (!$.getCookie('userData')) {
            $.alert('登录信息过期啦，请重新登录！');
            router.linkTo('./login.html');
        } else {
            var userData = JSON.parse($.getCookie('userData'));
        }
        
        var self = this,
            newCarTag = parseInt($('#newCarTag').val()),
            jsonData  = {
                mobile        : $.getCookie('userMobile'),
                carOwnerInfoId: userData.carOwnerInfoId,

                placeName     : $('#placeName').val(),
                placeCode     : $('#placeCode').val(),
                carOwner      : $('#carOwner').val(),
                identifyNumber: $('#identifyNumber').val(),
                licenseNo     : !newCarTag ? $('#licenseNo').val() : '',
                brandName     : $('#brandName').val(),
                frameNo       : $('#frameNo').val(),
                engineNo      : $('#engineNo').val(),
                enrollDate    : $('#enrollDate').val(),
                transferFlag  : $('#transferFlag').val(),
                newCarTag     : newCarTag
            },
            successFunc = function(data) {
                if (data.status == 'success') {
                    $.setCookie('licenseNo', $('#licenseNo').val(), 3600);
                    $.setCookie('carOwner', $('#carOwner').val(), 3600);
                    router.linkTo('./new_insurance_type.html');
                } else {
                    $.alert(data.message);
                }
                $.hideIndicator();
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('录入信息错误，请稍微重试')
                console.info(err);
            };
            
        if (self.linkToNextValidation()) {
            /* 跳转到下一步，并进行内容保存 */
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/insertCarOwnerAndVehicleInfo.json', jsonData, successFunc, failFunc);
        }
    },
    linkToNextValidation: function() {
        var licenseNo      = $('#licenseNo').val().trim(),
            brandName      = $('#brandName').val().trim(),
            frameNo        = $('#frameNo').val().trim(),
            engineNo       = $('#engineNo').val().trim(),
            enrollDate     = $('#enrollDate').val().trim(),
            carOwner       = $('#carOwner').val().trim(),
            identifyNumber = $('#identifyNumber').val().trim(),
            newCarTag      = Boolean(parseInt($('#newCarTag').val())),
            idCardReg      = /^(\d{15}$|^\d{18}$|^\d{17}(\d|X|x))$/,
            nameReg        = /^[\u4E00-\u9FA5]+$/,
            frameNoReg     = /^[A-Z0-9]{17}$/g,
            engineNoReg    = /^[A-Z0-9]*$/g;

        if (!newCarTag && !licenseNo) {
            $.toast('请先填写车牌号码！', 750);
            return false;
        } else if (!newCarTag && !$.checkCarNo(licenseNo)) {
            $.toast('请填写正确的车牌号码！', 750);
            return false;
        } else if (!brandName) {
            $.toast('请先填写品牌型号！', 750);
            return false;
        } else if (!frameNo) {
            $.toast('请先填写车辆识别代号！', 750);
            return false;
        } else if (!frameNoReg.test(frameNo)) {
            $.toast('车辆识别代号填写有误！', 750);
            return false;
        } else if (!engineNo) {
            $.toast('请先填写发动机号！', 750);
            return false;
        } else if (!engineNoReg.test(engineNo)) {
            $.toast('请先填写发动机号！', 750);
            return false;
        } else if (!enrollDate) {
            $.toast('请先选择注册日期！', 750);
            return false;
        } else if (!carOwner) {
            $.toast('请先填写车主姓名！', 750);
            return false;
        } else if (!nameReg.test(carOwner)) {
            $.toast('车主姓名填写有误！', 750);
            return false;
        } else if (!identifyNumber) {
            $.toast('请先填写身份证号！', 750);
            return false;
        } else if (!idCardReg.test(identifyNumber)) {
            $.toast('身份证号填写有误！', 750);
            return false;
        }

        return true;
    }
};

/* 选择特定的险种 */
var newInsuranceTypePage = {
    init: function() {
        this.domListener();
    },
    domListener: function() {
        var self = this;

        /* 保险项目（单项：投保、不投保） */
        $('#newInsuranceTypePage .list-block').on('click', '.single-option-item .item-after', function() {
            var $optionItem = $(this).closest('.single-option-item');
            self.switchSingleOption($optionItem);
        })
        /* 保险项目（多项：金额选择、不投保） */
        .on('click', '.complex-option-item .item-after', function() {
            var $optionItem = $(this).closest('.complex-option-item');
            self.switchComplexOption($optionItem);
        })
        /* 不计免赔切换选择 */
        .on('click', '.item-content:not(.not-selected) .sub-title', function() {
            self.switchFranchise($(this));
        });

        /* 确认投保方案，跳转到下一步，并进行内容保存 */
        $('#newInsuranceTypePage .step-link-container .button').on('click', function() {
            self.linkToNext();
        });
    },
    formatData: function() {
        /* 用于获取车型的座位数 */
        var tmp     = $.submitObj(),
            tmpData = {},
            newData = [],
            
            insuranceList = {
                // 'kindCode999': '交强险',
                'kindCode34' : '玻璃险',
                'kindCode36' : '自燃损失险',
                'kindCode63' : '机动车损失险',
                'kindCode68' : '第三者责任险',
                'kindCode73' : '司机责任险',
                'kindCode74' : '盗抢险',
                'kindCode75' : '划痕险',
                'kindCode89' : '乘客座位险'
            };

        for (var key in tmp) {
            if (tmp[key].indexOf('万') != -1) {
                tmpData[key] = parseInt(tmp[key].replace('万', '')) * 10000;
            }
            else if (tmp[key].indexOf('千') != -1) {
                tmpData[key] = parseInt(tmp[key].replace('千', '')) * 1000;
            }
            else if (tmp[key] == '不投保') {
                tmpData[key] = 0;
            }
            else if (key == 'kindCode34') {
                /* 如果是玻璃险 */
                if (tmp[key].indexOf('国产') != -1) {
                    tmpData[key] = 1;
                }
                else if (tmp[key].indexOf('进口') != -1) {
                    tmpData[key] = 2;
                }
            }
            else {
                if (isNaN(parseInt(tmp[key]))) {
                    tmpData[key] = tmp[key];
                }
                else {
                    tmpData[key] = parseInt(tmp[key]);
                }
            }
        }
        
        if (tmpData['kindCode999']) {
            newData.push({
                amount        : '',
                kindCode      : '999',
                kindName      : '交强险'
            });
        }

        for (var key in insuranceList) {
            var item = {};

            /* 若某个险种投保了，重新组织数据，用于传回后台进行报价计算 */
            if (tmpData[key]) {
                /* 对应险种 */
                item.kindCode       = key.replace('kindCode', '');
                item.kindName       = insuranceList[key];
                item.amount         = String(tmpData[key]);
                
                /* 如果勾选了不计免赔，则需多传一个kindCode带A的对象 */
                if (tmpData[key + '_CDW']) {
                    var item_temp = {
                        kindCode: 'A' + key.replace('kindCode', ''),
                        kindName: insuranceList[key] + '不计免赔',
                        amount  : '0'
                    }
                    newData.push(item_temp);
                }

                newData.push(item);
            }
        }

        return newData;
    },
    switchSingleOption: function($itemObj) {
        var vals       = $itemObj.attr('data-valArr') ? $itemObj.attr('data-valArr').split(',') : [0, 1],
            $thisInput = $itemObj.find('.item-after input'),
            $thisInfo  = $itemObj.find('.select-info');
        
        if ($itemObj.hasClass('not-selected')) {
            $itemObj.removeClass('not-selected').addClass('active');
            $thisInput.val(vals[1]);
            $thisInfo.text('投保');
        }
        else {
            $itemObj.removeClass('active').addClass('not-selected');
            $thisInput.val(vals[0]);
            $thisInfo.text('不投保');
            /* 若不选择投保，将【不计免赔】重置，默认选中（不计免赔） */
            $itemObj.find('.img-checkbox').removeClass('img-checkbox').addClass('img-checkbox-active');
            $itemObj.find('.sub-title input').val('1');
        }
    },
    switchComplexOption: function($itemObj) {
        var selectedVal = $itemObj.find('.radio-val').attr('data-val'),
            options = {
                textArr: $itemObj.attr('data-textArr').split(','),
                valArr : $itemObj.attr('data-valArr').split(',')
            },
            selectCallbackFunc = function() {
                if ($itemObj.find('.select-info').text() == '不投保') {
                    $itemObj.addClass('not-selected');
                    /* 若不选择投保，将【不计免赔】重置，默认选中（不计免赔） */
                    $itemObj.find('.img-checkbox').removeClass('img-checkbox').addClass('img-checkbox-active');
                    $itemObj.find('.sub-title input').val('1');
                }
                else {
                    $itemObj.removeClass('not-selected');
                }
            };
        
        options.selectedIndex = options.valArr.indexOf(selectedVal);
        $.radioModal($itemObj, options, selectCallbackFunc);
    },
    switchFranchise: function($itemObj) {
        var $iconObj   = $itemObj.find('.img-icon'),
            $thisInput = $itemObj.find('input');

        if ($iconObj.hasClass('img-checkbox-active')) {
            $iconObj.removeClass('img-checkbox-active').addClass('img-checkbox');
            $thisInput.val('0');
        }
        else {
            $iconObj.removeAttr('img-checkbox').addClass('img-checkbox-active');
            $thisInput.val('1');
        }
    },
    linkToNext: function() {
        var subInsInfoList = this.formatData();
            
        if (!$.getCookie('userData')) {
            $.alert('登录信息过期啦，请重新登录！');
            router.linkTo('./login.html');
        } else {
            var userData = JSON.parse($.getCookie('userData'));
        }
        
        var self = this,
            jsonData = {
                carOwnerInfoId: userData.carOwnerInfoId,
                subInsInfoList: subInsInfoList
            },
            successFunc = function(data) {
                if (data.status == 'success') {
                    router.linkTo('./wait_page.html');
                } else {
                    $.alert(data.message, 750);
                }
                $.hideIndicator();
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('录入险种错误，请稍微重试')
                console.info(err);
            };
            
        if (self.linkToNextValidation(subInsInfoList)) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/insertProduct.json', $.transferJsonData(jsonData), successFunc, failFunc);
        }
    },
    linkToNextValidation: function(subInsInfoList) {
        if (subInsInfoList.length == 0) {
            $.toast('未选择任何险种！', 750);
            return false;
        }
        return true;
    }
};

/* 获取各个保险公司报价信息 */
var newInsurancePricePage = {
    init: function() {
        this.priceInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 选择某个保险公司 */
        $('#newInsurancePricePage').on('click', '.list-container', function() {
            var simpleNameEn = $(this).attr('data-name'),
                sumPremVal   = $(this).attr('data-sumprem');

            if ($(this).hasClass('available')) {
                self.linkToNext(simpleNameEn, sumPremVal);
            }
            else {
                $.alert('由于未知原因，无法选择天安保险公司！');
            }
        });

        /* 重新返回页面报价 */
        $('.service-tel-container').on('click', '#selectInsuranceType', function() {
            $.confirm('确认重新报价？', function() {
                router.linkTo('./new_insurance_info.html');
            });
        })
    },
    priceInit: function() {
        var userData  = JSON.parse($.getCookie('userData')),
            orderData = JSON.parse($.getCookie('orderData')),
            jsonData  = {
                orderId: orderData.orderId
            },
            successFunc = function(data) {
                if (data.status == 'success') {
                    var dataObj = data.object,
                        insurancePriceStr = '',
                        companyName = {
                            'REN_BAO'      : '人保',
                            'PING_AN'      : '平安',
                            'TAI_PING_YANG': '太平洋'
                        },
                        companyIcon = {
                            'REN_BAO'      : 'img-logo-CPIC',
                            'PING_AN'      : 'img-logo-PINGAN',
                            'TAI_PING_YANG': 'img-logo-PICC'
                        };
                    $('#licenseNo').text(userData.licenseNo ? userData.licenseNo : '--');
                    if (dataObj.length == 0) {
                        insurancePriceStr += '<ul class="list-container available" >' +
                                                '<li class="item-content no-company">' +
                                                    '没有公司报价' +
                                                '</li>' +
                                            '</ul>';
                    }else {
                        for (var i = 0; i < dataObj.length; i ++) {
                            var tempObj = dataObj[i];
                            
                            insurancePriceStr +=   '<ul class="list-container available" data-name=' + tempObj.simpleNameEn + ' data-sumprem="' + tempObj.sumPrem + '">' +
                                                        '<li class="item-content">' +
                                                            '<div class="item-media"><i class="img-icon ' + companyIcon[tempObj.simpleNameEn] + '"></i></div>' +
                                                            '<div class="item-inner">' +
                                                                '<div class="item-title">' + companyName[tempObj.simpleNameEn] + '</div>' +
                                                                '<div class="item-after">' +
                                                                    '<span class="old-price" id="oldPrice">' + (tempObj.amount ? tempObj.amount : '') +
                                                                        '</span>&nbsp;' +
                                                                    '<span class="new-price" id="newPrice">' + tempObj.sumPrem + '</span>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</li>' +
                                                    '</ul>';
                        }
                    }
                    

                    $('#insuranceCompany').empty().append(insurancePriceStr);
                } else {
                    $.alert(data.message);
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('无法获取保险公司报价，请稍微重试')
                console.info(err);
            };

        if ($.getCookie('userData')) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findInsuranceQuotation.json', jsonData, successFunc, failFunc);
        } else {
            $.alert('登录信息过期');
            router.linkTo('./login.html');
        }
    },
    linkToNext: function(simpleNameEn, sumPremVal) {
        var userData  = JSON.parse($.getCookie('userData')),
            orderData = JSON.parse($.getCookie('orderData')),
            jsonData  = {
                orderId     : orderData.orderId,
                simpleNameEn: simpleNameEn
            },
            successFunc = function(data) {
                if (data.status == 'success') {
                    $.setCookie('sumPremVal', sumPremVal);
                    $.setCookie('newInsurancePrice', JSON.stringify(data.object[0]), 3600);
                    router.linkTo('./new_insurance_submit.html');
                } else {
                    $.alert(data.message);
                }
                $.hideIndicator();
            }, 
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('选择保险公司错误，请稍微重试')
                console.info(err);
            };
            
        if ($.getCookie('userData')) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/findInsuranceQuotationDetail.json', jsonData, successFunc, failFunc);
        } else {
            $.alert('登录信息过期');
            router.linkTo('./login.html');
        }
    }
};

/* 查看报价详情进行投保 */
var newInsuranceSubmitPage = {
    init: function() {
        this.infoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        
        /* 确认投保 */
        $('.new-insurance-submit-page').on('click', '#confirmInsuranceBtn', function() {
            $.confirm('确认投保？', function() {
                self.linkToNext();
            });
        });
    },
    infoInit: function() {
        var self = this,
            newInsurancePrice = JSON.parse($.getCookie('newInsurancePrice')),
            dataObj = self.productFilterPrem(newInsurancePrice.subInsInfoList),
            priceDetailStr = '';
            
        $.autoFill(newInsurancePrice);
        // 无优惠时，实付和总额价格一致
        $('#truePayPrice').text(dataObj[0].sumPrem);
        /* 选择险种报价详情 */
        for (var i = 1; i < dataObj.length; i ++) {
            var tempObj = dataObj[i];

            if (tempObj.kindCode != '999') {
                priceDetailStr += '<li>' +
                                    '<div class="item-content added-info-content">' +
                                        '<div class="row no-gutter">' +
                                            '<div class="col-25 text-left text-bold">' +
                                                '<div class="pay-item-name">' + tempObj.kindName + '</div>' +
                                            '</div>' +
                                            '<div class="col-75">' +
                                                '<div class="flex-box pay-item-info">' +
                                                    '<div class="flex-item-1 text-center">' +
                                                        '<span class="cdw-span">' + (tempObj.indemnityTag ? '不计免赔' : '') + '</span>' +
                                                    '</div>' +
                                                    '<div class="flex-item-1 text-right">' +
                                                        ((tempObj.amount && tempObj.amount != '1') ? tempObj.amount : '') +
                                                    '</div>' +
                                                    '<div class="flex-item-1 text-right">' +
                                                        tempObj.prem +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</li>';
                
            }
        }
        
        $('#productKind').empty().append(priceDetailStr);
    },
    productFilterPrem: function(array) {
        var count     = array.length,
            resultArr = [],
            indexList = {};

        for (var i = 0; i < count; i ++) {
            var item   = array[i],
                code   = item.kindCode,
                name   = item.kindName,
                amount = item.amount,
                prem   = item.prem,
                obj;

            if (code[0] != 'A') {
                indexList[code] = resultArr.length;

                obj = {
                    kindCode    : code,
                    kindName    : name,
                    amount      : amount,
                    prem        : prem,
                    indemnityTag: false
                }

                resultArr.push(obj);
            }
            else {
                var tmpIndex = indexList[code.slice(1)];

                resultArr[tmpIndex].indemnityTag = true;
                resultArr[tmpIndex].prem = (parseFloat(resultArr[tmpIndex].prem) + parseFloat(prem)).toFixed(2);
            }
        }

        return resultArr;
    },
    linkToNext: function() {
        var userData          = JSON.parse($.getCookie('userData')),
            orderData         = JSON.parse($.getCookie('orderData')),
            newInsurancePrice = JSON.parse($.getCookie('newInsurancePrice')),
            jsonData = newInsurancePrice,
            successFunc = function(data) {
                if (data.status == 'success') {
                    $.setCookie('newInsuranceSubmit', JSON.stringify(data.object[0]), 3600);
                    router.linkTo('./new_insurance_pay.html');
                } else {
                    $.alert(data.message);
                }
                $.hideIndicator();
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络错误，请稍微重试')
                console.info(err);
            };
        
        jsonData['resultId']       = newInsurancePrice.subInsInfoList[0].resultId;
        jsonData['orderId']        = orderData.orderId;
        jsonData['carOwnerInfoId'] = userData.carOwnerInfoId;
        
        if (userData) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/updateOrderInfo.json', $.transferJsonData(jsonData), successFunc, failFunc);
        } else {
            $.alert('登录信息过期');
            router.linkTo('./login.html');
        }
    }
};

/* 进行支付页面 */
var newInsurancePayPage = {
    init: function() {
        this.infoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 保险条款弹出框 */
        $('#insuranceTermsPopupLink').on('click', function() {
            $.popup('#insuranceTerms');
        });
        /* 保险条款关闭框 */
        $('#insuranceTermsClosePopup').on('click', function() {
            $.closeModal('#insuranceTerms');
        });

        /* 进行图片上传 */
        $('.popup-link.upload-popup-link').on('click', function() {
            var imgType  = $(this).attr('data-popup'),
                userData = JSON.parse($.getCookie('userData')),
                imgName  = imgType + '_' + userData.carOwnerInfoId,

                uploadedTag = $(this).hasClass('has-uploaded'),

                targetFrameSrc  = './upload_img.html?imgType=' + imgType + '&imgName=' + imgName + '&originUrl=' + 'null',
                currentFrameSrc = parent.document.getElementById(imgType + 'Frame').contentWindow.location.href;
            
            if (currentFrameSrc.indexOf('init=1') != -1) {
                if (uploadedTag) {
                    var prefix  = defaultConfig.ossPre,
                        imgLink = prefix + '/' +  imgType + '/' + imgName + '.jpg';
                    targetFrameSrc = './upload_img.html?imgType=' + imgType + '&imgName=' + imgName + '&originUrl=' + imgLink + '&viewUrl=' + imgLink + '&uploaded=1' + '&init=0';
                }
                
                $('#' + imgType + 'Frame').attr('src', targetFrameSrc);
            }

            $.popup('#' + imgType + 'UploadPopup');
        });

        /* 关闭上传图片popup框 */
        $('.close-popup.upload-close-popup').on('click', function() {
            var selector = $(this).attr('data-popup'),
                frameUrl = parent.document.getElementById(selector + 'Frame').contentWindow.location.href;
            
            if (frameUrl.indexOf('viewUrl=') != -1) {
                $('#' + selector + 'UploadPopupLink').removeClass('not-uploaded').addClass('has-uploaded');
                $('#' + selector + 'UploadPopupLink .img-icon').removeClass('img-camera').addClass('img-camera-active');
            }
            $.closeModal('#' + selector + 'UploadPopup');
        });

        // 是否已阅读保险条款
        $('.new-insurance-pay-page').on('change', '.agreement-operate input[type="checkbox"]', function() {
            self.toggleAgree($(this));
        });

        /* 跳出选择支付方式弹出框 */
        $('#payMethodPopupLink').on('click', function() {
            if (self.submitValidation()) {
                $.popup('#payMethodPopup');
            }
        });

        /* 选择京东支付 */
        $('#jdPay').on('click', function() {
            self.payOff();
        });

        /* 选择分期支付 */
        $('#bfPay').on('click', function() {
            $.confirm('请确保投保人（当前用户）与被投保车辆的车主保持一致<br>否则将无法进行分期投保', function() {
                self.instalPayOff();
            });
        });
    },
    toggleAgree: function(checkboxDom) {
        var payBtn = $('.new-insurance-pay-page .bar .pay-btn');
        
        if (checkboxDom.prop('checked')) {
            payBtn.removeClass('click-ban');
        } else {
            payBtn.addClass('click-ban');
        }
    },
    infoInit: function() {
        var self = this,
            userData = JSON.parse($.getCookie('userData')),
            newInsurancePrice = JSON.parse($.getCookie('newInsurancePrice')),
            newInsuranceSubmit = JSON.parse($.getCookie('newInsuranceSubmit')),
            dataObj = self.productFilterPrem(newInsurancePrice.subInsInfoList),
            priceDetailStr = '',
            companyList = {
                'TAI_PING_YANG': '【太平洋保险】',
                'PING_AN'      : '【中国平安】',
                'REN_BAO'      : '【中国人民保险】'
            };
        
        $.autoFill(userData);
        $.autoFill(newInsurancePrice);
        $.autoFill(newInsuranceSubmit);
        /* 用户选择的保险公司 */
        $('#company').text(companyList[userData.simpleNameEn]);
        $('#mobile').text($.getCookie('userMobile'));
        /* 初始化该用户上传的附件资料 */
        self.uploadedImgInit(userData.carOwnerInfoId);
        // 无优惠时，实付和总额价格一致
        $('#truePayPrice').text(newInsurancePrice.sumPrem);
        // 支付选择模态框中价格显示
        $('#amout').text(newInsurancePrice.sumPrem);
        /* 选择险种报价详情 */
        for (var i = 1; i < dataObj.length; i ++) {
            var tempObj = dataObj[i];

            if (tempObj.kindCode != '999') {
                priceDetailStr += '<li>' +
                                    '<div class="item-content added-info-content">' +
                                        '<div class="row no-gutter">' +
                                            '<div class="col-25 text-left text-bold">' +
                                                '<div class="pay-item-name">' + tempObj.kindName + '</div>' +
                                            '</div>' +
                                            '<div class="col-75">' +
                                                '<div class="flex-box pay-item-info">' +
                                                    '<div class="flex-item-1 text-center">' +
                                                        '<span class="cdw-span">' + (tempObj.indemnityTag ? '不计免赔' : '') + '</span>' +
                                                    '</div>' +
                                                    '<div class="flex-item-1 text-right">' +
                                                        ((tempObj.amount && tempObj.amount != '1') ? tempObj.amount : '') +
                                                    '</div>' +
                                                    '<div class="flex-item-1 text-right">' +
                                                        tempObj.prem +
                                                    '</div>' +
                                                '</div>' +
                                            '</div>' +
                                        '</div>' +
                                    '</div>' +
                                '</li>';
                
            }
        }
        
        $('#productKind').empty().append(priceDetailStr);
    },
    productFilterPrem: function(array) {
        var count     = array.length,
            resultArr = [],
            indexList = {};

        for (var i = 0; i < count; i ++) {
            var item   = array[i],
                code   = item.kindCode,
                name   = item.kindName,
                amount = item.amount,
                prem   = item.prem,
                obj;

            if (code[0] != 'A') {
                indexList[code] = resultArr.length;

                obj = {
                    kindCode    : code,
                    kindName    : name,
                    amount      : amount,
                    prem        : prem,
                    indemnityTag: false
                }

                resultArr.push(obj);
            }
            else {
                var tmpIndex = indexList[code.slice(1)];

                resultArr[tmpIndex].indemnityTag = true;
                resultArr[tmpIndex].prem = (parseFloat(resultArr[tmpIndex].prem) + parseFloat(prem)).toFixed(2);
            }
        }

        return resultArr;
    },
    payOff: function() {
        var self = this,
            userData  = JSON.parse($.getCookie('userData')),
            orderData = JSON.parse($.getCookie('orderData')),
            jsonData  = {
                contactAddressDetails: $('#contactAddressDetails').val().trim(),
                carOwnerInfoId       : userData.carOwnerInfoId
            },
            successFunc = function(data) {
                var jsonData1 = {
                        userId       : userData.carOwnerInfoId,
                        tradeNum     : orderData.orderId,
                        tradeName    : '临时车险支付订单',
                        amount       : $.getCookie('sumPremVal'),
                        simpleNameEn : userData.simpleNameEn
                    },
                    successFunc1 = function(data) {
                        if (data.status == 'fail') {
                            $.alert(data.message);
                        }
                        else {
                            setTimeout(function() {
                                for (var key in data.object) {
                                    $('#submitForm').find('#form_' + key).val(data.object[key]);
                                }
                                $('#submitForm').submit();
                            }, 1000);
                        }
                        $.hideIndicator();
                    },
                    failFunc1 = function(err) {
                        $.alert('支付失败<br>请稍后重试');
                        $.hideIndicator();
                        console.info(err);
                    };
                
                if ($.getCookie('userData')) {
                    $.showIndicator();
                    $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/jdpay/submit.json', jsonData1, successFunc1, failFunc1);        
                } else {
                    $.alert('登录信息过期');
                    router.linkTo('./login.html');
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络错误，请稍微重试')
                console.info(err);
            };
        
        if ($.getCookie('userData')) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/updateCarOwnerInfo.json', jsonData, successFunc, failFunc);
        } else {
            $.alert('登录信息过期');
            router.linkTo('./login.html');
        }
        
    },
    instalPayOff: function() {
        var self = this,
            userData = JSON.parse($.getCookie('userData')),
            jsonData = {
                contactAddressDetails: $('#contactAddressDetails').val().trim(),
                carOwnerInfoId       : userData.carOwnerInfoId
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                } else {
                    $.hideIndicator();
                    router.linkTo('./new_insurance_instalment.html');
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络错误，请稍微重试')
                console.info(err);
            };
        
        if ($.getCookie('userData')) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/updateCarOwnerInfo.json', jsonData, successFunc, failFunc);
        } else {
            $.alert('登录信息过期');
            router.linkTo('./login.html');
        }
        
    },
    uploadedImgInit: function(carOwnerInfoId) {
        /* 初始化图片，查看该用户是否已经上传过图片了 */
        var prefix     = defaultConfig.ossPre,
            imgList    = [ 'idCardImgEmblem', 'idCardImgHead', 'drivingLicenseFirst', 'drivingLicenseSecond' ],
            getErrFunc = function(imgType) {
                return '$(\'#' + imgType + 'UploadPopupLink\').removeClass(\'has-uploaded\').addClass(\'not-uploaded\');$(\'#' + imgType + 'UploadPopupLink .img-icon\').removeClass(\'img-camera-active\').addClass(\'img-camera\');';
            };

        for (var i = 0; i < imgList.length; i ++) {
            var imgSrc  = prefix + '/' + imgList[i] + '/' + imgList[i] + '_' + carOwnerInfoId + '.jpg',
                errFunc = getErrFunc(imgList[i]);
            
            $('#' + imgList[i] + 'Preview').append('<img src="' + imgSrc + '" onerror="' + errFunc + '">');
        }
    },
    submitValidation: function() {
        var contactAddressDetails         = $('#contactAddressDetails').val().trim(),
            idCardImgEmblemUploadTag      = $('#idCardImgEmblemUploadPopupLink').hasClass('has-uploaded'),
            idCardImgHeadUploadTag        = $('#idCardImgHeadUploadPopupLink').hasClass('has-uploaded'),
            drivingLicenseFirstUploadTag  = $('#drivingLicenseFirstUploadPopupLink').hasClass('has-uploaded'),
            drivingLicenseSecondUploadTag = $('#drivingLicenseSecondUploadPopupLink').hasClass('has-uploaded');

        if (!contactAddressDetails) {
            $.alert('保单邮寄地址不能为空！')
            return false;
        } 
        else if (!(idCardImgEmblemUploadTag && idCardImgHeadUploadTag && drivingLicenseFirstUploadTag && drivingLicenseSecondUploadTag)) {
            $.alert('请上传资料附件！')
            return false;
        }
        
        return true;
    }
};

/* 分期支付，下载App */
var newInsuranceInstalmentPage = {
    init: function() {
        this.infoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 提交分期申请 */
        $('#submitInstalmentOrderBtn').on('click', function() {
            self.submitInstalmentOrder();
        });
    },
    infoInit: function() {
        var INTEREST_RATE = 0.07;
        var PERIOD        = 10;
        var sumPremVal  = parseFloat($.getCookie('sumPremVal')),
            userData    = JSON.parse($.getCookie('userData')),
            orderData   = JSON.parse($.getCookie('orderData')),
            /* 总利息 */
            interestAll = sumPremVal * (1 + INTEREST_RATE),
            /* 每月利息 */
            interestPer = interestAll / PERIOD,
            /* 当前时间 */
            currentTime = new Date(),
            /* 当前时间 */
            currentTimeCopy = new Date();
        
        currentTime.setMonth(currentTime.getMonth() + 1);
        $('#carOwner').text(userData.carOwner);
        $('#licenseNo').text(userData.licenseNo);
        $('#sumPremVal').text(sumPremVal);
        $('#refundDate').text(currentTime.getDate());
        $('#refundAmountPer').text(parseFloat(interestPer).toFixed(2));
        $('#refundDateFirst').text($.formatTime(Date.parse(currentTime)));
        
        /* 填坑，东八区的时间，相差8个小时，后台存日期没存时区的信息 */
        var tempDate = new Date(Date.parse(currentTimeCopy) + 8 * 60 * 60 * 1000);
        /* 组织用于生成分期订单的数据 */
        var instalmentJsonData = {
                /* 订单编号，用于后续第二（或者更多）次做覆盖新建操作时进行update */
                orderNo         : orderData.orderId,
                obtainUserId    : userData.carOwnerInfoId,
                obtainUserMobile: userData.mobile,
                obtainUserName  : userData.carOwner,
                /* 申请金额 */
                applyCapital    : sumPremVal,
                /* 终贷金额 */
                verifyCapital   : sumPremVal,
                /* 
                    还款方式
                    0-等额本息
                    1-等额本金
                 */
                refundType      : 0,
                /* 还款日(/日) */
                refundDate      : currentTime.getDate(),
                /* 贷款类型：固定为 4（车险） */
                loanType        : 4,
                /* 此处 status 同医美，这一步固定为 2 */
                status          : 0,
                createDate      : tempDate.toISOString(),
                /* 生效日期，当前日期（年-月-日T时：分：秒，为了填坑，时间多加 8 个小时） */
                effectiveDate   : tempDate.toISOString(),
                /* 截止时间，effectiveDate 加上借期（ 10 个月） */
                deadDate        : new Date(tempDate.setMonth(tempDate.getMonth() + 10)).toISOString()
            };
        $.setCookie('instalmentJsonData', JSON.stringify(instalmentJsonData), 3000);
    },
    submitInstalmentOrder: function() {
        /* 生成总的分期订单 */
        var jsonData = JSON.parse($.getCookie('instalmentJsonData')),
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                } else {
                    $.hideIndicator();
                    $.alert('保险分期申请已提交<br>即将跳转到app下载页面', function() {
                        location.href = './app_download.html';
                    });
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错<br>请稍后重试');
                console.info(err);
            };
        
        if ($.getCookie('instalmentJsonData')) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/addCreditOrder.json', jsonData, successFunc, failFunc);
        }
        else {
            $.alert('用户登录信息过期<br>请重新登录', function() {
                var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/login.html';

			    window.location.href = target;
            });
        }
    },
    /* ISO 8601国际日期格式转换 */
    transISOTimeStr: function(originDateStr) {
        var tempDateStr = originDateStr.replace(' ', 'T'),
            resultDate  = new Date(Number(new Date(tempDateStr)));
        
        return resultDate.toISOString();
    }
}

/* 报价等待页面 */
var waitPage = {
    init: function() {
        this.updateInfo();
    },
    domListener: function() {},
    infoInit: function() {
        if ($.getCookie('userData')) {
            var userData  = JSON.parse($.getCookie('userData')),
                orderData = JSON.parse($.getCookie('orderData')),
                carOwner  = userData.carOwner ? userData.carOwner : '--',
                licenseNo = userData.licenseNo ? userData.licenseNo : '--';
            
            $('#carOwner').text(carOwner ? carOwner : '--');
            $('#licenseNo').text(licenseNo ? licenseNo : '--');
            switch (parseInt(orderData.payStatus)) {
                case 1:
                    router.linkTo('./new_insurance_price.html');
                    break;
                case 2:
                    router.linkTo('./policy_no_wait.html');
                    break;
                case 3:
                    router.linkTo('./success_page.html');
                    break;
                case 4:
                    router.linkTo('./instalment_success.html');
                    break;
                default:
                    break;
            }
        } else {
            $.alert('登录信息过期');
            router.linkTo('./login.html');
        }
    },
    updateInfo: function() {
        var self = this,
            jsonData = {
                mobile  : $.getCookie('userMobile'),
                password: $.getCookie('pwd'),
                role    : 1
            },
            successFunc = function(data) {
                var tempObj = data.object;
                
                if (data.status == 'fail') {
                    $.alert(data.message);
                }
                else {
                    $.setCookie('userMobile', tempObj.carOwnerInfoBak.mobile, 3600);
                    $.setCookie('userData', JSON.stringify(tempObj.carOwnerInfoBak), 3600);
                    $.setCookie('orderData', JSON.stringify(tempObj.vehicleOrderInfo), 3600);
                    self.infoInit();
                }
            },
            failFunc = function(err) {
                $.alert('自动登录失败<br>请稍微重试');
                console.info(err);
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/login.json', jsonData, successFunc, failFunc);
    }
};

/* 显示“已生成分期订单”字样，不允许再选择报价 */
var instalmentSuccessPage = {
    init: function() {
        this.domListener();
    },
    domListener: function() {
        /* 点击【app下载】链接 */
        $('#appDownloadLink').on('click', function() {
            location.href = './app_download.html';
        });
        /* 点击【重新投保】链接 */
        $('#newInsuranceLink').on('click', function() {
            location.href = './new_insurance_info.html';
        });
    }
};

/* 保单号等待页面 */
//TODO
var policyNoWaitPage = {
    init: function() {
        this.infoInit();
        this.domListener();
    },
    domListener: function() {

    },
    infoInit: function() {
        
    }
}

/* 成功页面：①支付成功；②投保成功 */
//TODO，调试
var successPage = {
    init: function() {
        this.infoInit();
        this.domListener();
    },
    domListener: function() {},
    infoInit: function() {
        var userData  = JSON.parse($.getCookie('userData')),
            orderData = JSON.parse($.getCookie('orderData')),
            jsonData  = {
                carOwnerInfoId: userData.carOwnerInfoId
            },
            successFunc = function(data) {
                var dataObj = data.object[0];
                $.autoFill(dataObj);
                $.autoFill(userData);
                $.autoFill(orderData);
                $('#createTime').text($.formatTime(dataObj.createTime));
                /* 如果没有车牌号，车牌号的位置部分显示-- */
                if (!$('#licenseNo').text()) {
                    $('#licenseNo').text('--');
                }
            },
            failFunc = function(err) {
                $.alert('获取保单号失败，请稍微重试')
                console.info(err);
            };

        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleInsurance/buyInsuranceSuccess.json', jsonData, successFunc, failFunc);        
    }
};

/* 个人资料页 */
//废弃
var userInfoPage = {
    init: function() {
        this.appLogin();
        this.domListener();
    },
    domListener: function() {},
    appLogin: function() {
        if ($.getParameter('mobile') && $.getParameter('pwd') && $.getParameter('role')) {
            var self = this,
                jsonData = {
                    mobile  : $.getParameter('mobile'),
                    password: $.getParameter('pwd'),
                    role    : 1
                },
                successFunc = function(data) {
                    if (data.status == 'fail') {
                        $.hideIndicator();
                        $.alert(data.message);
                    } else {
                        $.setCookie('userId', data.object.carOwnerInfoBak.carOwnerInfoId, 3000);
                        /* 获取用户个人资料并初始化 */
                        self.userInfoInit(data.object.carOwnerInfoBak.carOwnerInfoId);
                    }
                },
                failFunc = function(err) {
                    $.hideIndicator();
                    $.alert('网络连接错误<br>请稍后重试');
                };
            
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/login.json', jsonData, successFunc, failFunc);
        }
        else {
            $.toast('请先登录');
        }
    },
    userInfoInit: function(userId) {
        /* 获取用户个人资料并初始化 */
        var jsonData = {
                userId: userId
            },
            successFunc = function(data) {
                var userData = data.object;
                /* 用户资料自动填入页面上 */
                $.autoFill(userData);
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
                $.hideIndicator();
                console.info(err);
            };
        
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/findCreditUserInformation.json', jsonData, successFunc, failFunc);
    }
};

/* 个人资料修改页 */
//废弃
var userInfoEditPage = {
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

        /* 保存个人资料 */
        $('#saveInfoBtn').on('click', function() {
            self.saveUserInfo();
        });
    },
    userInfoInit: function() {
        /* 获取用户个人资料并初始化 */
        var jsonData = {
                userId: $.getCookie('userId')
            },
            successFunc = function(data) {
                var userData = data.object;
                /* 用户资料自动填入页面上 */
                $.autoFill(userData);
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
                $.hideIndicator();
                console.info(err);
            };
        
        if (jsonData.userId) {
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/findCreditUserInformation.json', jsonData, successFunc, failFunc);
        }
        else {
            $.toast('请先登录！');
        }
    },
    saveUserInfo: function() {
        var self = this,
            jsonData = self.submitObj(),
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
            };
        
        if (self.submitValidation()) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/updateObtainUser.json', jsonData, successFunc, failFunc);
        }
    },
    submitObj: function() {
        //返回用户个人资料项中，每个需要输入的input的键名和值
        var submitObj = {};
        $('#userInfoEditPage .submit-input').each(function() {
            var id = $(this).attr('id'),
                val = $(this).val();
            submitObj[id] = val;
        });

        return submitObj;
    },
    submitValidation: function() {
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

        return true;
    }
};

/* 运营商授权状态 */
//废弃
var creditMobileStatusPage = {
    init: function() {
        this.infoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;

        /* 点击手机号授权链接 */
        $('#creditMobile').on('click', function() {
            self.authorizeLinkTo();
        });
    },
    infoInit: function() {
        console.info('【运营商授权状态】', 'interface', '运营商授权状态', 'TODO');
    },
    authorizeLinkTo: function() {
        router.linkTo('credit_mobile.html');
        console.info('【运营商授权】', '点击授权链接，根据授权状态判断是否需要弹出提示');
    }
};

/* 运营商授权 */
//废弃
var creditMobilePage = {
    init: function() {
        this.infoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;

        /* 查看tips内容 */
        $('#tipsPopupLink').on('click', function() {
            $.popup('#tipsPopup');
        })

        /* 点击获取验证码按钮 */
        $('#requestCodeBtn').on('click', function() {
            self.countFunc('#requestCodeBtn');
            self.getMobileCode();
        });

        /* 点击授权按钮 */
        $('#authorizeBtn').on('click', function() {
            self.authorizeMobile();
        });

        /* 点击取消授权按钮 */
        $('#unauthorizeBtn').on('click', function() {
            self.unauthorizeMobile();
        });
    },
    infoInit: function() {
        console.info('【运营商授权】', 'interface', '填写基础信息：手机号，另外判断用户是否已经填写身份证号和真实姓名，否则不允许进行授权', 'TODO');
    },
    getMobileCode: function() {
        console.info('【运营商授权】', 'interface', '将用户填写的密码提交，开始获取对应的验证码', 'TODO');
    },
    getTaskStatus: function(taskId) {
        console.info('【运营商授权】', 'interface', '根据对应的taskId，查询该任务的进度', 'TODO');
    },
    authorizeMobile: function() {
        console.info('【运营商授权】', 'interface', '提交获取到的验证码，开始授权', 'TODO');
    },
    secondGetTaskStatus: function(onceAuthorizeFunc) {
        console.info('【运营商授权】', 'interface', '第二次查询任务状态，判断是否需要二次验证', 'TODO');
    },
    secondAuthorizeMobile: function() {
        console.info('【运营商授权】', 'interface', '第二次提交获取到的验证码，开始授权', 'TODO');
    },
    unauthorizeMobile: function() {
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
    countFunc: function(selector) {
        /* 发送短信倒计时 */
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
    }
};

/* 订单列表页 */
var orderListPage = {
    init: function() {
        this.appLogin();
        this.domListener();
    },
    domListener: function() {},
    orderListInit: function(obtainUserId) {
        var self = this,
            jsonData = {
                obtainUserId: obtainUserId
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                } else {
                    var orderArr     = data.object
                        orderListStr = self.getOrderListStr(orderArr);

                    setTimeout(function() {
                        if (orderArr.length == 0) {
                            /* 订单数为0，添加class，显示“没有订单”的提示 */
                            $('#orderListContainer').addClass('no-orders');
                            $.hideIndicator();
                        }
                        else {
                            $('#orderListMenu').removeClass('init').empty().append(orderListStr);
                            $.hideIndicator();
                        }
                    }, 1000);
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错<br>请稍后重试');
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findVehicleCreditOrderForCheck.json', jsonData, successFunc, failFunc);
    },
    getOrderListStr: function(orderDataList) {
        var orderDataStr = '';
        
        for (var i = 0, len = orderDataList.length; i < len; i ++) {
            var tmpOrder    = orderDataList[i],
                tmpOrderStr = '',
                statusText  = $.orderStatusTrans(tmpOrder.status),
                companyList = {
                    'TAI_PING_YANG': '太平洋保险',
                    'PING_AN'      : '中国平安保险',
                    'REN_BAO'      : '中国人民保险'
                },
                onclickTarget = '';
            
            switch(tmpOrder.status) {
                case 7:
                    onclickTarget = 'onclick="router.linkTo(\'order_detail_confirm.html?orderNo=' + tmpOrder.orderNo + '\')";';
                    break;
                case 8:
                case 9:
                case 10:
                    onclickTarget = '';
                    break;
                default:
                    onclickTarget = 'onclick="router.linkTo(\'order_detail.html?orderNo=' + tmpOrder.orderNo + '\')";';
            }

            tmpOrderStr += '<li class="card">' +
                        '<div class="card-header row no-gutter" ' + onclickTarget + '>' +
                            '<div class="col-50 text-left loan-amount text-yellow text-lg text-bold">' + (tmpOrder.verifyCapital).toFixed(2) + '</div>' +
                            '<div class="col-50 text-right loan-status">' +
                                statusText + '<i class="icon icon-right"></i>' +
                            '</div>' +
                        '</div>' +
                        '<div class="card-content">' +
                            '<div class="card-content-inner">' +
                                '<p class="business-info">' + companyList[tmpOrder.simpleNameEn] + '</p>' +
                                '<p class="added-info">' +
                                    '<span class="loan-project">车险</span>' +
                                    '<span class="loan-date">' + tmpOrder.effectiveDate + '&nbsp;借</span>' +
                                '</p>' +
                            '</div>' +
                        '</div>' +
                    '</li>';
            
            orderDataStr += tmpOrderStr;
        }

        return orderDataStr;
    },
    appLogin: function() {
        var self = this;

        if ($.getParameter('mobile') && $.getParameter('pwd') && $.getParameter('role')) {
            var jsonData = {
                    mobile  : $.getParameter('mobile'),
                    password: $.getParameter('pwd'),
                    role    : 1
                },
                successFunc = function(data) {
                    if (data.status == 'fail') {
                        $.alert(data.message);
                    } else {
                        var carOwnerInfoId = data.object.carOwnerInfoBak.carOwnerInfoId;

                        $.setCookie('carOwnerInfoId', carOwnerInfoId, 3600)
                        /* 登录成功，获取借款用户id后，获取对应的订单列表 */
                        self.orderListInit(carOwnerInfoId);
                    }
                },
                failFunc = function(err) {
                    $.hideIndicator();
                    $.alert('网络连接出错<br>请稍后重试');
                    console.info(err);
                };
            
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleCreditUser/login.json', jsonData, successFunc, failFunc);
        }
        else {
            $.toast('请先登录！');
        }
    }
};

/* 订单详情页（未放款之前的） */
var orderDetailPage = {
    init: function() {
        this.orderInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 用户确认订单操作 */
        $('#applyRemit').on('click', function() {
            self.applyRemit();
        });

        /* 查看分期详情 */
        $('#repayDetailPopupLink').on('click', function() {
            self.viewRepayDetail();
        })
    },
    orderInit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo')
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                } else {
                    var order = data.object[0],
                        $orderDetailPage   = $('#orderDetailPage'),
                        $applyBtnContainer = $('#applyBtnContainer'),
                        orderStatusTipStr  = '';

                    $orderDetailPage.removeClass('invisible');

                    /* 信息填写 */
                    $('#orderDetailPage .submit-input').each(function() {
                        var id = $(this).attr('id');                

                        $(this).text(order[id]);
                    });

                    /* 借款金额、服务费显示两位小数 */
                    $('#applyCapital').text(parseFloat(order.verifyCapital).toFixed(2));
                    $('#loanInterestObtainFinal').text(parseFloat(order.loanInterestObtainFinal).toFixed(2));

                    /* 订单状态提示,按钮处理 */
                    $('#repayDetailPopupLink').addClass('hidden');
                    if (order.status == 0) {
                        orderStatusTipStr = '<p class="text-lg text-bold apply-result">很可惜</p><p>您的订单还未提交</p>';                        
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
                        $('#applyCapital').text(parseFloat(order.verifyCapital).toFixed(2));
                        // 显示“分期详情”链接
                        $('#repayDetailPopupLink').removeClass('hidden');
                    }
                    else if (order.status == 6) {
                        orderStatusTipStr = '<p class="text-lg text-bold apply-result">恭喜您</p><p>您的借款申请正等待财务放款</p>';
                        // 终贷金额填写替换
                        $('#applyCapital').text(parseFloat(order.verifyCapital).toFixed(2));
                        // 显示“分期详情”链接
                        $('#repayDetailPopupLink').removeClass('hidden');
                    }

                    $('#orderStatusTip').empty().append(orderStatusTipStr);
                    $('#refundType').text((order.refundType == 0) ? '等额本息' : '等额本金');

                    $.hideIndicator();
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错<br>请稍后重试！');
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findCreditOrderDetail.json', jsonData, successFunc, failFunc);
    },
    applyRemit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo')
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                } else {
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
        
        $.confirm('请核对借款金额及借款期数<br>确定提交？', 
            function() {
                $.showIndicator();
                $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/finalConfirmVehicleOrder.json', jsonData, successFunc, failFunc);
            }
        );
    },
    viewRepayDetail: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'all'
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                } else {
                    var repayArr   = data.object.orderList,
                        repayCount = repayArr.length,
                        repayStr   = '<ul>';
                    
                    for (var i = 0; i < repayCount; i ++) {
                        var tmpObj      = repayArr[i],
                            payTag      = (tmpObj.payStatus == '0') ? ' not-repayed' : ' has-repayed',
                            payText     = (tmpObj.payStatus == '0') ? '未还' : '已还',
                            repayDate   = (tmpObj.payStatus == '0') ? tmpObj.instalmentRefundDate : tmpObj.payTime,
                            repayStatus = (i + 1) + '/' + repayCount + '&nbsp;|&nbsp;' + $.formatTime(repayDate) + payText;
                        
                        repayStr += '<li class="card bottom-border top-border' + payTag + '">' +
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
                    repayStr += '</ul>';
                    
                    popupHTML = '<div id="repayDetailPopup" class="popup repay-detail-popup repay-detail-page">' +
                                    '<header class="bar bar-nav">' +
                                        '<a class="icon icon-down pull-right close-popup text-grey"></a>' +
                                        '<h1 class="title">分期详情概览</h1>' +
                                    '</header>' +
                                    '<div class="content">' +
                                        '<div id="repayBillContainer" class="list-block cards-list">' +
                                            repayStr +
                                        '</div>' +
                                    '</div>' +
                                '</div>';
                    
                    setTimeout(function() {
                        $.hideIndicator();
                        $.popup(popupHTML);
                    }, 1000);
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错<br>请稍后重试！');
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findAllVehicleCreditSubOrder.json', jsonData, successFunc, failFunc);
    }
};

/* 订单详情页（放款之后的） */
var orderDetailConfirmPage = {
    init: function() {
        this.orderInfoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 借款合同 */
        $('#contractPopupLink').on('click', function() {
            self.contractInfoInit();
        });
        /* 跳转查看还款记录 */
        $('#repayRecordLink').on('click', function() {
            router.linkTo('repay_record.html?orderNo=' + $.getParameter('orderNo'));
        });
        /* 跳转查看还款账单（进行还款） */
        $('#repayBillLink').on('click', function() {
            router.linkTo('repay_bill_per.html?orderNo=' + $.getParameter('orderNo'));
        });
        /* 跳转查看还款详情 */
        $('#repayDetailLink').on('click', function() {
            router.linkTo('repay_detail.html?orderNo=' + $.getParameter('orderNo'));
        });
    },
    orderInfoInit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo')
            },
            successFunc = function(data) {
                var orderDetail = data.object;

                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                } else {
                    $.hideIndicator();
                    /* 自动填写部分内容 */
                    $.autoFill(orderDetail);
                    /* 剩余期数 */
                    $('#usingPeriod').text(parseInt(orderDetail.period) - parseInt(orderDetail.donePeriod));
                    /* 合同期限 */
                    $('#contractExpire').text(orderDetail.effectiveDate + ' ~ ' + orderDetail.deadDate);
                    /* 还款方式 */
                    $('#refundType').text(orderDetail.refundType == 0 ? '等额本息' : '等额本金');
                    /* 使用中的金额借款金额、手续费、已还本金、已还利息、手续费两位小数 */
                    $('#usingMoney').text(parseFloat($('#usingMoney').text()).toFixed(2));
                    $('#verifyCapital').text(parseFloat($('#verifyCapital').text()).toFixed(2));
                    $('#refundedInstalmentCapital').text(parseFloat($('#refundedInstalmentCapital').text()).toFixed(2));
                    $('#refundedInstalmentInterest').text(parseFloat($('#refundedInstalmentInterest').text()).toFixed(2));
                    $('#loanInterestObtainFinal').text(parseFloat($('#loanInterestObtainFinal').text()).toFixed(2));
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错<br>请稍后重试！');
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findvehicleCreditOrderDetailByApproved.json', jsonData, successFunc, failFunc);
    },
    contractInfoInit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo')
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                }
                else {
                    var contractObj = data.object,
                        vehicleInfo = data.object.userBankList[0],
                        userInfo    = data.object.vehicleInfo[0];

                    for (var key in contractObj) {
                        $('#contract_' + key).text(contractObj[key]);
                    }
                    for (var key in vehicleInfo) {
                        $('#contract_' + key).text(vehicleInfo[key]);
                    }
                    for (var key in userInfo) {
                        $('#contract_' + key).text(userInfo[key]);
                    }
                    /* 两次填充身份证号、借款期数 */
                    $('#contract_idCardCopy').text($('#contract_idCard').text());
                    $('#contract_periodCopy').text($('#contract_period').text());
                    /* 每月还款日处的日期改为日期 */
                    $('#contract_effectiveDate').text($('#contract_effectiveDate').text().slice(-2));
                    /* 是否一年内过户，0、1修改为是、否 */
                    $('#contract_transferFlag').text(parseInt($('#contract_transferFlag').text()) ? '是' : '否');
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
                $.alert('网络连接出错<br>请稍后重试');
                console.info(err);
            };
        
        if ($('#contractPopupLink').hasClass('init')) {
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findVehicleCreditContractInfo.json', jsonData, successFunc, failFunc);
        }
        else {
            $.popup('#contractPopup');
        }
    }
};

/* 还款记录 */
var repayRecordPage = {
    init: function() {
        this.repayRecordsInfoInit();
        this.domListener();
    },
    domListener: function() {},
    repayRecordsInfoInit: function() {
        var jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'hasRepay'
            },
            successFunc = function(data) {
                if (data.status == 'fail') {
                    $.hideIndicator();
                    $.alert(data.message);
                }
                else {
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
                }
            },
            failFunc = function(err) {
                $.hideIndicator();
                $.alert('网络连接出错<br>请稍后重试！');
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findAllVehicleCreditSubOrder.json', jsonData, successFunc, failFunc);
    }
};

/* 还款账单 */
var repayBillPerPage = {
    init: function() {
        this.repayBillPerInfoInit();
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
    repayBillPerInfoInit: function() {
        var self     = this,
            jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'toRepay'
            },
            successFunc = function(data) {
                var repayBillArr   = data.object.orderList,
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
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findAllVehicleCreditSubOrder.json', jsonData, successFunc, failFunc);
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
                userId   : $.getCookie('carOwnerInfoId'),
                tradeNum : '',
                tradeName: '还款订单',
                amount   : 0
            },
            successFunc = function(data) {
                setTimeout(function() {
                    var $batchForm = $('#batchForm');

                    for (var key in data.object) {
                        $batchForm.find('#' + key).val(data.object[key]);
                    }

                    $batchForm.attr('action', defaultConfig.jdUrl).submit();
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
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/jdpay/submit.json', jsonData, successFunc, failFunc);
    }
};

/* 还款详情 */
var repayDetailPage = {
    init: function() {
        this.repayDetailInfoInit();
        this.domListener();
    },
    domListener: function() {},
    repayDetailInfoInit: function() {
        var self     = this,
            jsonData = {
                orderNo: $.getParameter('orderNo'),
                // all、toRepay、hasRepay
                filter : 'all'
            },
            successFunc = function(data) {
                var repayArr   = data.object.orderList,
                    repayCount = repayArr.length,
                    repayStr   = '<ul>';
                
                for (var i = 0; i < repayCount; i ++) {
                    var tmpObj      = repayArr[i],
                        payTag      = (tmpObj.payStatus == '0') ? ' not-repayed' : ' has-repayed',
                        payText     = (tmpObj.payStatus == '0') ? '未还' : '已还',
                        repayDate   = (tmpObj.payStatus == '0') ? tmpObj.instalmentRefundDate : tmpObj.payTime,
                        repayStatus = (i + 1) + '/' + repayCount + '&nbsp;|&nbsp;' + $.formatTime(repayDate) + payText;
                    
                    repayStr += '<li class="card bottom-border top-border' + payTag + '">' +
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
                repayStr += '</ul>';
                
                setTimeout(function() {
                    $('#repayBillContainer').empty().append(repayStr);
                    $.hideIndicator();
                }, 1000);
            },
            failFunc = function(err) {
                $.alert('网络连接出错<br>请稍后重试');
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/vehicleLoanOrder/findAllVehicleCreditSubOrder.json', jsonData, successFunc, failFunc);
    }
};

/* 减少全局变量名 */
var insurance = {
    loginPage                 : loginPage,
    loginWechatPage           : loginWechatPage,
    registerPage              : registerPage,
    newInsuranceInfoPage      : newInsuranceInfoPage,
    newInsuranceTypePage      : newInsuranceTypePage,
    newInsurancePricePage     : newInsurancePricePage,
    newInsuranceSubmitPage    : newInsuranceSubmitPage,
    newInsuranceInstalmentPage: newInsuranceInstalmentPage,
    newInsurancePayPage       : newInsurancePayPage,
    
    userInfoPage          : userInfoPage,
    userInfoEditPage      : userInfoEditPage,
    creditMobileStatusPage: creditMobileStatusPage,
    creditMobilePage      : creditMobilePage,
    orderListPage         : orderListPage,
    orderDetailPage       : orderDetailPage,
    orderDetailConfirmPage: orderDetailConfirmPage,

    repayRecordPage : repayRecordPage,
    repayBillPerPage: repayBillPerPage,
    repayDetailPage : repayDetailPage,

    instalmentSuccessPage: instalmentSuccessPage,

    waitPage        : waitPage,
    policyNoWaitPage: policyNoWaitPage,
    successPage     : successPage
};
/* exports */
window.insurance = insurance;

/* 页面初始化（用于网页版刷新页面后） */
$(document).on('pageInit', function() {
    router.setPage();
})
$.init();
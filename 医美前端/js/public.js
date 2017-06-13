var wechatRegisterPage = {
	/* 针对微信端的借款用户登录（如果是新用户，需要注册，并绑定openId） */
	init: function() {
		this.checkRegister();
		this.domListener();
	},
	domListener: function() {
		var self = this;
		/* 前往绑定微信号页面 */
		$('#bindLink').on('click', function() {
			window.location.href = defaultConfig.domain + defaultConfig.project + '/html/bind_wechat.html';
		});

		/* 注册动作，成功后，自动登录，并跳转用户的index页面，失败后提示 */
		$('.register-btn-container .button').on('click', function() {
			var jsonData  = {
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
						$.hideIndicator();
						$.toast('注册成功，即将跳转');
						$.saveUserInfo(data.object);
						setTimeout(function() {
							var target = defaultConfig.domain + defaultConfig.project + '/html/customer/index.html';

							 window.location.href = target;
						}, 1000);
					}
					else {
						$.alert(data.message);
						$.hideIndicator();
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('注册失败<br>请稍后重试');
				};
			
			if (!self.registerValidation()) {
				return false; 
			}

			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/insertCreditObtainUser.htm', jsonData, successCallback, failCallback);
			$.showIndicator();
		});

		$('#requestCodeBtn').on('click', function() {
			var mobileNum  = $.trim($('#mobile').val()),
				mobileReg  = /^1[34578]\d{9}$/;
			if (mobileNum == '') {
				$.toast('未填写手机号,无法发送验证码！', 750);
				return false;
			}
			else if (!mobileReg.test(mobileNum)) {
				$.toast('手机号填写有误！', 750);
				return false;
			}
			self.requestCode();
		});
	},
	registerValidation: function() {
		/* 提交注册信息前验证 */
		var mobileNum  = $.trim($('#mobile').val()), 
			password   = $.trim($('#password').val()),
			pwdConfirm = $.trim($('#pwdConfirm').val()),
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
	requestCode: function() {
		var $sendBtn   = $('#requestCodeBtn');
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
					$.setCookie('mobileVerifyCode', data.object.code, 60);
				},
				failFunc = function(err) {
					$.toast('短信发送失败，请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/smsUtil/getCode.htm', jsonData, successFunc, failFunc);
		};
					
		$sendBtn.addClass('click-ban');
		if (!$.getCookie('mobileVerifyCode')) {
			requestCode();
		}
		countFunc();
	},
	checkRegister: function() {
		/* 根据用户的openId，请求后台，判断是否和已有用户绑定 */
		/* 根据url中的code参数，传给后台，获取对应的openId */
		var self = this,
			jsonData1 = {
				code: $.getParameter('code')
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
							
							/* 用户登录，解决登录状态未存入缓存的bug */
							self.userLogin(jsonObj);
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
				$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/judgeRegist.htm', jsonData2, successFunc2, failFunc2);
			},
			failFunc1 = function(err) {
				$.alert('网络连接错误<br>请稍后重试');
			};
		
		/* 根据url中的code参数，向后台请求，获取对应用户的额openId */
		$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/share/getwechatOpenId.htm', jsonData1, successFunc1, failFunc1);
	},
	userLogin: function(jsonData) {
		var successFunc = function(data) {
				if (data.status == 'success') {
					$.saveUserInfo(data.object);
					/* 只有针对借款用户，静态写死 */
					setTimeout(function() {
						$.hideIndicator();
						var target = defaultConfig.domain + defaultConfig.project + '/html/customer/index.html';

						window.location.href = target;
					}, 1000);
				}
				else {
					$.alert(data.message);
				}
			},
			failFunc = function(err) {
				$.alert('网络连接出错<br>请稍后重试!');
				console.info(err);
			};
		
		$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successFunc, failFunc);
	}
};

var wechatBindPage = {
	/* 针对已有账户的微信用户进行绑定微信openId */
	init: function() {
		this.domListener();
	},
	domListener: function() {
		var self = this;
		/* 点击绑定微信openId */
		$('#bindBtn').on('click', function() {
			self.bindWechatOpenId();
		});
	},
	bindWechatOpenId: function() {
		var self = this,
			jsonData  = {
				'mobile'      : $.trim($('#mobileNumber').val()), 
				'password'    : $.trim($('#password').val()),
				'wechatOpenId': $.getCookie('wechatOpenId')
			},
			successCallback = function(data) {
				if (data.status == 'success') {
					/* 绑定成功后，存储用户信息 */
					$.saveUserInfo(data.object);
					$.hideIndicator();
					$.alert('绑定成功', function() {
						window.location.href = defaultConfig.domain + defaultConfig.project + '/html/customer/index.html';
					});
				}
				else {
					$.hideIndicator();
					$.alert(data.message);
				}
			},
			failCallback = function(err) {
				$.hideIndicator();
				$.alert('网络连接错误<br>请稍后重试');
			};
		
		if (!self.loginValidation()) {
			return false; 
		}
		
		$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/bindCreditUserOpenId.htm', jsonData, successCallback, failCallback);
		$.showIndicator();
	},
	loginValidation: function() {
		var mobileNum = $.trim($('#mobileNumber').val()), 
			password  = $.trim($('#password').val()),
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
	}
};

var loginPage = {
	/* 针对web版的用户登录（咨询师和用户都可以进行登录）（即通过域名，而非微信中的公众号菜单链接） */
	init: function() {
		this.pageEffectsInit();
		this.domListener();
	},
	domListener: function() {
		var self = this;
		$('#loginBtn').on('click', function() {
			var roleList  = {
					'用户'  : 1,
					'咨询师': 2	
				},
				jsonData  = {
					'mobile'   : $.trim($('#mobileNumber').val()), 
					'password' : $.trim($('#password').val()),
					'role'     : roleList[$.trim($('#userType').val())]
				},
				successCallback = function(data) {
					if (data.status == 'success') {
						$.hideIndicator();
                    	$.toast('登录成功');
						$.saveUserInfo(data.object);
						setTimeout(function() {
							var baseUrl = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html',
								target  = (data.object.role == '1' ? '/customer' : '/business') + '/index.html';
							window.location.href = (baseUrl + target);
						}, 1000);
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
			
			if (!self.loginValidation()) {
				return false; 
			}
			
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/userLogin/userLogin.htm', jsonData, successCallback, failCallback);
			$.showIndicator();
		});

		/* 新用户注册链接点击事件 */
		$('#registerLink').on('click', function() {
			var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/register.html';

			window.location.href = target;
		});
	},
	pageEffectsInit: function() {
		/* 用户类型滑动选择框初始化 */
		var toolbar =	'<header class="bar bar-nav">' +
							'<button class="button button-link pull-right close-picker">确定</button>' +
							'<h1 class="title">请选择用户类型</h1>' +
						'</header>';
		$("#userType").picker({
			toolbarTemplate: toolbar,
			cols: [{
				textAlign: 'center',
				values: ['用户', '咨询师']
			}]
		});
	},
	loginValidation: function() {
		var mobileNum = $.trim($('#mobileNumber').val()), 
			password  = $.trim($('#password').val()),
			userType  = $.trim($('#userType').val()),
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
		else if (userType == '') {
			$.toast('请选择用户类型！', 750);
			return false;
		}
		return true;
	}
};

var registerPage = {
	/* 针对web版的用户注册（即通过域名，而非微信中的公众号菜单链接） */
	init: function() {
		this.domListener();
	},
	domListener: function() {
		var self = this;
		/* 注册动作，成功后，自动登录，并跳转用户的index页面，失败后提示 */
		$('.register-btn-container .button').on('click', function() {
			var jsonData  = {
					'mobile'      : $.trim($('#mobile').val()), 
					'password'    : $.trim($('#password').val()),
					'wechatOpenId': '',
					'role'        : 1,
					'realName'    : '',
					'realCheck'   : 0,
					'idCard'      : '',
					'bankName'    : '',
					'bankCardNum' : ''
				},
				successCallback = function(data) {
                    if (data.status == 'success') {
						$.hideIndicator();
						$.toast('注册成功，即将跳转');
						$.saveUserInfo(data.object);
						setTimeout(function() {
							var target = 'http://' + document.URL.split('/')[2] + defaultConfig.project + '/html/customer/index.html';

							 window.location.href = target;
						}, 1000);
					}
					else {
						$.alert(data.message);
						$.hideIndicator();
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('注册失败<br>请稍后重试');
				};
			
			if (!self.registerValidation()) {
				return false; 
			}

			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/creditUser/insertCreditObtainUser.htm', jsonData, successCallback, failCallback);
			$.showIndicator();
		});

		$('#requestCodeBtn').on('click', function() {
			var mobileNum  = $.trim($('#mobile').val()),
				mobileReg  = /^1[34578]\d{9}$/;
			if (mobileNum == '') {
				$.toast('未填写手机号,无法发送验证码！', 750);
				return false;
			}
			else if (!mobileReg.test(mobileNum)) {
				$.toast('手机号填写有误！', 750);
				return false;
			}
			self.requestCode();
		});
	},
	registerValidation: function() {
		/* 提交注册信息前验证 */
		var mobileNum  = $.trim($('#mobile').val()), 
			password   = $.trim($('#password').val()),
			pwdConfirm = $.trim($('#pwdConfirm').val()),
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
	requestCode: function() {
		var $sendBtn   = $('#requestCodeBtn');
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
					$.setCookie('mobileVerifyCode', data.object.code, 60);
				},
				failFunc = function(err) {
					$.toast('短信发送失败，请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/smsUtil/getCode.htm', jsonData, successFunc, failFunc);
		};
					
		$sendBtn.addClass('click-ban');
		if (!$.getCookie('mobileVerifyCode')) {
			requestCode();
		}
		countFunc();
	}
};

var merchantRegisterPage = {
	/* 咨询师用户注册（主要针对web端，并非只考虑微信） */
	init: function() {
		this.domListener();
	},
	domListener: function() {
		var self = this;
		/* 注册动作，成功后，自动登录，并跳转用户的index页面，失败后提示 */
		$('.register-btn-container .button').on('click', function() {
			var merchantNo   = $.getParameter('merchantNo'),
				role         = $.getParameter('role'),
				jsonData     = {
					'mobile'      : $.trim($('#mobile').val()), 
					'password'    : $.trim($('#password').val()),
					'merchantNo'  : merchantNo,
					'role'        : role
				},
				successCallback = function(data) {
                    if (data.status == 'success') {
						$.hideIndicator();
						$.toast('注册成功，即将跳转');
						$.saveUserInfo(data.object);
						setTimeout(function() {
							var target = defaultConfig.domain + defaultConfig.project + '/html/business/index.html';

							window.location.href = target;
						}, 1000);
					}
					else {
						$.alert(data.message);
						$.hideIndicator();
					}
				},
				failCallback = function(err) {
					$.hideIndicator();
					$.alert('注册失败<br>请稍后重试');
				};
			
			if (!self.registerValidation()) {
				return false; 
			}
			
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/insertMerchantUser.htm', jsonData, successCallback, failCallback);
			$.showIndicator();
		});

		$('#requestCodeBtn').on('click', function() {
			var mobileNum  = $.trim($('#mobile').val());
			if (mobileNum == '') {
				$.toast('未填写手机号,无法发送验证码！', 750);
				return false;
			}
			self.requestCode();
		});
	},
	registerValidation: function() {
		/* 提交注册信息前验证 */
		var mobileNum    = $.trim($('#mobile').val()), 
			password     = $.trim($('#password').val()),
			pwdConfirm   = $.trim($('#pwdConfirm').val()),
			verifyCode   = $.trim($('#verifyCode').val()),
			mobileReg    = /^1[34578]\d{9}$/;
		
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
		else if (verifyCode != $.getCookie('mobileVerifyCode')) {
			$.toast('验证码错误！', 750);
			return false;
		}
		return true;
	},
	requestCode: function() {
		var $sendBtn   = $('#requestCodeBtn');
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
					$.setCookie('mobileVerifyCode', data.object.code, 60);
				},
				failFunc = function(err) {
					$.toast('短信发送失败，请稍后重试');
				};
				
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/smsUtil/getCode.htm', jsonData, successFunc, failFunc);
		};
					
		$sendBtn.addClass('click-ban');
		if (!$.getCookie('mobileVerifyCode')) {
			requestCode();
		}
		countFunc();
	}
};

/* 页面初始化（用于网页版刷新页面后） */
$(document).on('pageInit', function() {
	var tempObj  = $('.page').attr('id'),
		pageList = {
			'loginPage'           : loginPage,
			'registerPage'        : registerPage,
			'wechatRegisterPage'  : wechatRegisterPage,
			'wechatBindPage'      : wechatBindPage,
			'merchantRegisterPage': merchantRegisterPage
		};
	
	pageList[tempObj].init();
});
$.init();
var indexPage = {
	init: function() {
		/* 针对webapp需要获取url中的信息进行自动登录 */
		this.appLogin();
		// this.userInfoInit();
		// this.obtainUserListInit();
		// this.domListener();
	},
	domListener: function() {
		var self = this;
		/* 登录的咨询师相关的借款用户列表无限滚动加载 */
        var loading = false;
        $(document).on('infinite', '.infinite-scroll', function() {
            var jsonData = {
                    begin: parseInt($('#obtainUserList ul').attr('data-begin')),
                    rows : 10
                };
            /* 如果滚动已经finished（即数据已经全部加载完了），注销事件，并退出 */
            if ($('#obtainUserList ul').hasClass('finished')) {
                $.detachInfiniteScroll($('.infinite-scroll'));
            }
            /* 正在滚动（加载），退出 */
            if (loading) return false;
            /* 设置标识 */
            loading = true;
            /* 刷新获取数据 */
            /* 添加加载提示符 */
            $('#loaderContainer').empty().append('<div class="infinite-scroll-preloader"><div class="preloader"></div></div>');
            self.getObtainUserList(jsonData);
            /* 重置滚动标识 */
            setTimeout(function() {
                loading = false;
            }, 1500);
        });
		/* 查看某个用户订单流水概览  */
		$('.page').on('click', '.panel-link', function() {
			var name      = $(this).attr('data-obtainname'),
				mobile    = $(this).attr('data-obtainmobile'),
				realCheck = $(this).attr('data-real');

			self.viewObtainUser(name, mobile, realCheck);
		});
		/* 点击某个用户的某笔未提交的订单，进行二维码分享 */
		$('#customerManagePanel').on('click', '.item-link', function() {
			var orderNo    = $(this).attr('data-orderNo'),
				currentUrl = document.URL,
				resultLink = currentUrl.slice(0, currentUrl.indexOf('/business')) + '/customer/loan_form.html?orderNo=' + orderNo,
				qrCallback = function() {
					$.hideIndicator();
					$.popup('#qrcodePopup');
				};
			
			/* qrGenrate方法详见modules.js */
			$.showIndicator();
			setTimeout(function() {
				$.qrGenerate(document.getElementById('qrcodeContainer'), resultLink, 150, qrCallback);
			}, 500);
		});
	},
	userInfoInit: function() {
		if ($.getCookie('loginUserId')) {
			if ($.getCookie('loginUserName')) {
				$('#businessName').text($.getCookie('loginUserName'));
			}
			if ($.getCookie('loginMerchantName')) {
				$('#merchantName').text($.getCookie('loginMerchantName'));
			}
    	}
    	else {
    		$.toast('请先登录！');
    		setTimeout(function() {
    			window.location.href = '../login.html';
    		}, 1500);
    	}
	},
	viewObtainUser: function(name, mobile, realCheck) {
		var thisObtainName   = name,
			thisObtainMobile = mobile;
		
		$('#customerManagePanel #theObtainUserName').text(thisObtainName);
		$('#customerManagePanel #theObtainRealCheck').text(realCheck);
		
		/* 根据当前咨询师id和对应的借款用户id，获取该用户的订单列表 */
		var jsonData = {
				merchantUserId  : $.getCookie('loginUserId'),
				obtainUserMobile: thisObtainMobile
			},
			successFunc = function(data) {
				var orderList  = data.content,
					orderCount = orderList.length,
					orderStr   = '<ul>';
				
				for (var i = 0; i < orderCount; i ++) {
					var orderStatus  = $.orderStatusTrans(orderList[i].status),
						orderLinkTag = orderList[i].status == 0 ? 'item-link' : '';

					orderStr += '<li class="item-content loan-project ' + orderLinkTag + '" data-orderNo="' + orderList[i].orderNo + '">' +
									'<div class="item-inner">' +
										'<div class="item-title">' + orderList[i].purpose + '</div>' +
											'<div class="item-after loan-status">' + orderStatus + '</div>' +
										'</div>' +
									'</div>' +
								'</li>';
				}
				orderStr += '</ul>';
				$('#customerManagePanel #theObtainOrderList').empty().append(orderStr);
				$.hideIndicator();
				$.openPanel('#customerManagePanel');
			},
			failFunc = function(err) {
				$.alert('网络连接出错<br>请稍候重试');
				console.info(err);
			};
		
		$.showIndicator();
		$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/findOrderList.htm', jsonData, successFunc, failFunc);		
	},
    obtainUserListInit: function() {
		var self = this,
			jsonData = {
				begin: 0,
				rows : 10
			};
		
		$('#obtainUserList ul').removeClass('finished').addClass('init').empty().attr('data-begin', '0');
		/* 登录的咨询师相关的借款用户列表 */
		self.getObtainUserList(jsonData);
    },
	getObtainUserList: function(jsonObj) {
		/* 根据咨询师userId，获取对应的借款用户列表 */
        var self     = this,
            successFunc = function(data) {
				self.renderObtainUserList(data);
            },
            failFunc = function(err) {
                $.hideIndicator();
                console.info(err);
            };
        
		jsonObj.merchantUserId = $.getCookie('loginUserId');
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/getObtainUserList.htm', jsonObj, successFunc, failFunc);
	},
	renderObtainUserList: function(data) {
		var obtainStr   = this.getObtainUserListStr(data),
            obtainBegin = parseInt($('#obtainUserList ul').attr('data-begin')) + 10;
        
        setTimeout(function() {
			$.hideIndicator();
            $('.infinite-scroll-preloader').remove();
            /* 判断是否是初始状态 */
            if ($('#obtainUserList ul').hasClass('init')) {
                if (data.count == 0) {
                    /* 订单数为0，添加class，显示“没有借款客户”的提示 */
                    $('#obtainUserList').addClass('no-obtain');
                    $('#obtainUserList ul').removeClass('init').addClass('finished');
                }
                else {
                    $('#obtainUserList ul').removeClass('init').append(obtainStr).attr('data-begin', obtainBegin);
                }
            }
            else {
                if (data.content.length == 0) {
                    /* 借款用户数为0，即表示已经没有更多借款用户了 */
                    $('#obtainUserList').addClass('no-more-obtain');
                    $('#obtainUserList ul').addClass('finished');
                }
                else {
                    $('#obtainUserList ul').append(obtainStr).attr('data-begin', obtainBegin);
                }
            }
        }, 1000);
	},
	getObtainUserListStr: function(data) {
		var obtainArr   = data.content,
			obtainCount = obtainArr.length,
			obtainStr   = '';

		for (var i = 0; i < obtainCount; i ++) {
			/* 后台传回的数据有部分是空数据 */
			if (!obtainArr[i]) { continue; }
			var realText  = $.realCheck(obtainArr[i].realCheck, ['tongdunMobile', 'tongdunHeadPic']),
				realCheck = (realText == '已实名') ? '-active' : '',
				realName  = obtainArr[i].realName ? obtainArr[i].realName : '--';
			
			obtainStr += '<li data-obtainname="' + realName + '" data-real="' + realText + '" data-obtainmobile="' + obtainArr[i].mobile + '" class="item-content item-link customer-item panel-link">' +
							'<div class="item-inner">' +
							'<div class="item-title">' + realName + '</div>' +
							'<div class="item-after">' + 
								'<i class="img-icon img-user-info' + realCheck + '"></i>' +
							'</div>' +
							'</div>' +
						 '</li>';
		}

		return obtainStr;
	},
	appLogin: function() {
		var self = this;
		if ($.getParameter('mobile')) {
			var jsonData = {
					'mobile'  : $.getParameter('mobile'), 
					'password': $.getParameter('pwd'),
					'role'    : $.getParameter('role')
				},
				successCallback = function(data) {
					if (data.status == 'success') {
						$.saveUserInfo(data.object);
						self.userInfoInit();
						self.obtainUserListInit();
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
			self.userInfoInit();
			self.obtainUserListInit();
			self.domListener();
		}
	}
};

var loanFormPage = {
	init: function() {
		// this.wxConfigInit();
		this.loanFormInit();
		this.domListener();
	},
	domListener: function() {
		var self = this;

		/* 单选模态框 */
		$('#peroidRadioModalLink').on('click', function() {
			var selectedVal = $(this).find('.radio-val').attr('data-val'),
				options = {
					textArr: ['6个月', '12个月'],
					valArr : ['val1', 'val2']
				};
			options.selectedIndex = options.valArr.indexOf(selectedVal);
			/* radioModal方法详见page_effects.js */
			$.radioModal($(this), options);
		});
		$('#refundRadioModalLink').on('click', function() {
			var selectedVal = $(this).find('.radio-val').attr('data-val'),
				options = {
					textArr: ['等额本息', '等额本金'],
					valArr : ['val1', 'val2']
				};
			options.selectedIndex = options.valArr.indexOf(selectedVal);
			/* radioModal方法详见page_effects.js */
			$.radioModal($(this), options);
		});

		/* 生成订单 */
		$('#generateOrderBtn').on('click', function() {
			if (self.submitValidation()) {
				$.showIndicator();
				self.generateOrder();
			}
		});

		/* 分享给微信朋友 */
		// $('#shareWechatBtn').on('click', function() {
		// 	if (self.submitValidation()) {
		// 		$.showIndicator();
		// 		self.shareByWechat();
		// 	}
		// });

		/* 生成二维码模态框 */
		// $('#qrcodeGenerateBtn').on('click', function() {
		// 	if (self.submitValidation()) {
		// 		$.showIndicator();
		// 		self.shareByQrcode();
		// 	}
		// });
	},
	loanFormInit: function() {
		/* 借款信息表初始化 */
		if ($.getCookie('loginUserId') && $.getCookie('loginUserMobile') && $.getCookie('loginUserRole') == '2') {
			$('#merchantName').text($.getCookie('loginMerchantName'));
			$('#merchantUserName').text($.getCookie('loginUserName'));
			$('#merchantNo').val($.getCookie('loginMerchantNo'));
			$('#merchantUserId').val($.getCookie('loginUserId'));
			$('#merchantUserMobile').val($.getCookie('loginUserMobile'));
			// TODO，用户登录后的loanType是字符串，新增订单需要的是int类型的，暂时写死
			// $('#loanType').val($.getCookie('loginLoanType'));
		}
		else {
			$.toast('用户请先登录！');
			setTimeout(function() {
				window.location.href = '../login.html';
			}, 1500);
		}
	},
	submitObj: function() {
		//返回申请列表中，每个需要输入的input的键名和值
		var submitObj   = {},
			currentTime = Date.parse(new Date()),
			tempDate    = new Date(currentTime + 8 * 60 * 60 * 1000);
		$('#loanFormPage .submit-input').each(function() {
			var id  = $(this).attr('id'),
				val = $(this).val();
			submitObj[id] = val;
		});
		submitObj['loanType']       = parseInt($.getCookie('loginUserRole'));
		submitObj['applyCapital']   = parseInt($('#applyCapital').val());
		submitObj['period']         = parseInt($('#period').val().replace('个月', ''));
		submitObj['refundType']     = ($('#refundType').val() == '等额本息') ? 0 : 1;
		/* 以下字段默认为空或者从cookie获取 */
		submitObj['applyLogId']       = '';
		submitObj['obtainUserId']     = '';
		submitObj['effectiveDate']    = this.transISOTimeStr($.formatTime(currentTime, 'full'));
		submitObj['deadDate']         = new Date(tempDate.setMonth(tempDate.getMonth() + submitObj['period'])).toISOString();
		submitObj['createDate']       = this.transISOTimeStr($.formatTime(currentTime, 'full'));
		submitObj['proofImg']         = '';
		submitObj['latestRefundDate'] = this.transISOTimeStr($.formatTime(currentTime, 'full'));
		submitObj['donePeroid']       = 0;
		submitObj['refundDate']   	  = (new Date()).getDate();
		return submitObj;
	},
	generateOrder: function() {
		/* 生成订单，去掉生成订单后生成二维码的功能步骤 */
		$.showIndicator();
		/* 提交给后台，生成订单，返回订单号（带订单号的链接地址） */
		var jsonData = this.submitObj(),
			successFunc = function(data) {
				if (data.status == 'success') {
					$.hideIndicator();
					$.alert('订单创建成功<br>请提醒借款用户在个人中心查看对应订单并提交', function() {
						$.router.back();
					});
				}
				else {
					$.hideIndicator();
					$.alert(data.message);
				}
			},
			failFunc = function(err) {
				$.hideIndicator();
				console.info(err);
				$.alert('创建订单失败<br>请稍后重试');
			};
		
		$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/add.htm', jsonData, successFunc, failFunc);
	},
	shareByWechat: function() {
		/* 提交给后台，生成订单，返回订单号（带订单号的链接地址） */
		var jsonData = this.submitObj(),
			successFunc = function(data) {
				if (data.status == 'success') {
					var currentUrl = document.URL,
						resultLink = currentUrl.slice(0, currentUrl.indexOf('/business')) + '/customer/loan_form.html?orderNo=' + data.object.orderNo;
					
					$.setCookie('shareResultLink', resultLink, 300);
					business.loanFormPage.invokeWechatShare(resultLink);
					/* 第一次提交后，添加一个submitted标识 */
					$('.page').addClass('submitted');
					wx.showOptionMenu();
					setTimeout(function() {
						$.hideIndicator();
						$.alert('提交订单成功<br>请在右上角菜单中分享给朋友');
					}, 2000);
				}
				else {
					wx.showOptionMenu();
					$.hideIndicator();
					$.alert(data.message);
				}
			},
			failFunc = function(err) {
				console.info(err)
				$.hideIndicator();
				$.toast('生成订单失败，请稍后重试');
			};
		
		if ($('.page').hasClass('submitted')) {
			wx.showOptionMenu();
			$.hideIndicator();
			$.alert('您已提交过本订单<br>请在右上角进行微信分享');
		}
		else {
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/add.htm', jsonData, successFunc, failFunc);
		}
	},
	wxConfigInit: function() {
        /* 微信配置初始化 */
        var jsonData = {
                url: document.URL
            },
            successFunc = function(data) {
                if (data.status == 'success') {
					wx.config({
						debug: false,
						appId: data.object.appId,
						timestamp: data.object.timestamp,
						nonceStr: data.object.nonceStr,
						signature: data.object.signature,
						jsApiList: ['checkJsApi', 'openLocation', 'getLocation', 'onMenuShareTimeline', 'onMenuShareAppMessage']
					})
					wx.hideOptionMenu();
				}
				else {
					$.alert('微信分享暂不可用<br>请使用二维码分享功能');
				}  
            },
            failFunc = function(err) {
                $.alert('微信接口初始化失败<br>请检查微信版本是否是最新版');
            };
		
		$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/share/wechatShareSign.htm', jsonData, successFunc, failFunc);
    },
	invokeWechatShare: function(link) {
		wx.ready(function() {
			wx.onMenuShareAppMessage({
				title: '《先用着》借款申请表',
				desc : '来自咨询师的借款申请分享，请完善信息，并进行申请操作',
				link : link,
				imgUrl: '',
				success: function (res) {
					$.toast('分享成功');
				},
				cancel: function (res) { }
			});
		});
	},
	shareByQrcode: function() {
		$.showIndicator();
		/* 提交给后台，生成订单，返回订单号（带订单号的链接地址） */
		var jsonData = this.submitObj(),
			successFunc = function(data) {
				if (data.status == 'success') {
					var currentUrl = document.URL,
						resultLink = currentUrl.slice(0, currentUrl.indexOf('/business')) + '/customer/loan_form.html?orderNo=' + data.object.orderNo,
						qrCallback = function() {
							$.hideIndicator();
							$.popup('#qrcodePopup');
						};
					
					$.setCookie('shareResultLink', resultLink, 300);
					/* 第一次提交后，添加一个submitted标识，同时将生成的链接绑定触发事件到微信分享中 */
					$('.page').addClass('submitted');
					business.loanFormPage.invokeWechatShare(resultLink);
					/* qrGenrate方法详见modules.js */
					$.qrGenerate(document.getElementById('qrcodeContainer'), resultLink, 150, qrCallback);
				}
				else {
					$.hideIndicator();
					$.alert(data.message);
				}
			},
			failFunc = function(err) {
				$.hideIndicator();
				console.info(err);
				$.alert('生成二维码失败<br>请稍后重试');
			};
		
		if ($('.page').hasClass('submitted')) {
			var qrCallback = function() {
					$.hideIndicator();
					$.popup('#qrcodePopup');
				};
			$.hideIndicator();
			$.qrGenerate(document.getElementById('qrcodeContainer'), $.getCookie('shareResultLink'), 150, qrCallback);
		}
		else {
			$.ajaxAction(defaultConfig.domain + defaultConfig.project + '/loanOrder/add.htm', jsonData, successFunc, failFunc);
		}	
	},
	submitValidation: function() {
		/* 申请表单必填字段非空验证，作为咨询师，只考虑用户名、手机号，以及借款信息是否完整 */
		var name         = $.trim($('#obtainUserName').val()), 
			mobile       = $.trim($('#obtainUserMobile').val()),
			applyCapital = $.trim($('#applyCapital').val()),
			mobileReg    = /^1[34578]\d{9}$/;
		
		if (name == '') {
			$.toast('客户姓名不能为空！', 750);
			return false;
		}
		else if (mobile == '') {
			$.toast('客户手机号不能为空！', 750);
			return false;
		}
		else if (!mobileReg.test(mobile)) {
			$.toast('客户手机号填写有误！', 750);
			return false;
		}
		else if (applyCapital == '') {
			$.toast('请填写借款金额！', 750);
			return false;
		}
		else if (parseFloat(applyCapital) < 3000) {
			$.toast('借款金额不得低于3000！', 750);
			return false;
		}
		return true;
	},
	transISOTimeStr: function(originDateStr) {
        var tempDateStr = originDateStr.replace(' ', 'T'),
            resultDate  = new Date(Number(new Date(tempDateStr)));
        
        return resultDate.toISOString();
    }
};

var userInfoPage = {
    init: function() {
        this.userInfoInit();
        this.domListener();
    },
    domListener: function() { },
    userInfoInit: function() {
        /* 根据用户userId，获取对应的用户信息 */
        var jsonData = {
                mobile: $.getCookie('loginUserMobile'),
                password: $.getCookie('loginUserPassword'),
                userId: $.getCookie('loginUserId')
            },
            successFunc = function(data) {
        		if (data.status == 'success') {
        			var merchantUser = data.object.merchantUser;
        			
        			/* 用户信息暂存到cookie中 */
                    $.saveUserInfo(merchantUser);
                    /* 用户表中已有的用户信息显示到页面上 */
                    for (var key in merchantUser) {
                        if ($('#' + key) && merchantUser[key]) {
                            $('#' + key).text(merchantUser[key]);
                        }
                    }

                    $.hideIndicator();
        		}
        		else {
        			$.alert('获取用户信息失败<br>请稍候重试');
        		}
            },
            failFunc = function(err) {
                $.hideIndicator();
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantUser.htm', jsonData, successFunc, failFunc);
    }
};

var editUserPage = {
    init: function() {
        this.userInfoInit();
        this.domListener();
    },
    domListener: function() {
        var self = this;
        /* 保存资料 */
        $('#saveInfoBtn').on('click', function() {
            if (!self.submitValidation) {
                return false;
            }
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
                    $.hideIndicator();
                    $.alert('网络连接出错<br>请稍后重试！');
                };
            
            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/updateMerchantUser.htm', jsonData, successFunc, failFunc);
        })
    },
    userInfoInit: function() {
        /* 根据用户userId，获取对应的用户信息 */
        var jsonData = {
                mobile: $.getCookie('loginUserMobile'),
                password: $.getCookie('loginUserPassword'),
                userId: $.getCookie('loginUserId')
            },
            successFunc = function(data) {
	        	if (data.status == 'success') {
	    			var merchantUser = data.object.merchantUser;
	    			
	    			/* 用户信息暂存到cookie中 */
	                $.saveUserInfo(merchantUser);
	                /* 用户表中已有的用户信息显示到页面上 */
	                for (var key in merchantUser) {
	                    if ($('#' + key) && merchantUser[key]) {
	                        $('#' + key).val(merchantUser[key]);
	                    }
	                }

	                $('#password').val($.getCookie('loginUserPassword'));
	                $('#userId').val($.getCookie('loginUserId'));
	                $.hideIndicator();
	    		}
	    		else {
	    			$.alert('获取用户信息失败<br>请稍候重试');
	    		}
            },
            failFunc = function(err) {
                $.hideIndicator();
                console.info(err);
            };
        
        $.showIndicator();
        $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/merchantUser/getMerchantUser.htm', jsonData, successFunc, failFunc);
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
    submitValidation: function() {
        //TODO，提交之前的验证
        return true;
    }
};

var customerInfoPage = {
	init: function() {
		this.userInfoInit();
		this.domListener();
	},
	domListener: function() {
		/* 统一pupup弹出事件 */
		$('.popup-link').on('click', function() {
			var selector = $(this).attr('data-popup');
			$.popup(selector);
		});
	},
	userInfoInit: function() {
		//TODO，用户信息页面初始化
	}
};

var editCustomerPage = {
	init: function() {
		this.userInfoInit();
		this.domListener();
	},
	domListener: function() {
		var self = this;
		/* 统一pupup弹出事件 */
		$('.popup-link').on('click', function() {
			var selector = $(this).attr('data-popup');
			$.popup(selector);
		});

		/* 图片上传popup */
		$('.upload-popup .img-input').on('click', function() {
			$.showIndicator();
			setTimeout(function() {
				$.hideIndicator();
			}, 250);
		})
		// 图片选择预览
		.on('change', function(e) {
			var popupSelector = '#' + $(this).closest('.popup').attr('id'),
				fileIndex = $(this).attr('name'),
				files = e.target.files;
			self.imgPreview(files, popupSelector);
			$(this).closest('.popup').find('.upload-status').removeClass('init has-uploaded').addClass('not-uploaded');
			$('.upload-popup .save-btn').removeClass('click-ban');
		});
		/* 图片上传ajax */
		$('.upload-popup .save-btn').on('click', function() {
			var thisPopup   = $(this).closest('.popup').attr('id'),
				uploadType  = $(this).attr('data-type') + 'Form',
				successFunc = function(data) {
					$.hideIndicator();
					$.toast('上传成功');
					$('#' + thisPopup).find('.upload-status').removeClass('not-uploaded').addClass('has-uploaded');
					$('#' + thisPopup + 'Link').find('.img-icon').removeClass('img-camera').addClass('img-camera-active');
					$('#' + thisPopup + 'Link').closest('.item-content').find('.submit-input').val(data.object);
					/* 将图片路径暂存到cookie中 */
					$.setCookie($('#' + thisPopup + 'Link').closest('.item-content').find('.submit-input').attr('id'), data.object, 600);
				},
				failFunc = function(err) {
					$.hideIndicator();
					$.toast('上传失败');
				},
				fileData = new FormData(document.getElementById(uploadType));
			$.showIndicator();
			$.ajaxFileAction(defaultConfig.domain + defaultConfig.project + '/ossUtil/uploadFile.htm', fileData, successFunc, failFunc);
		});

		/* 保存资料 */
		$('#saveInfoBtn').on('click', function() {
			if (!self.submitValidation) {
				return false;
			}
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
		//TODO，用户信息页面初始化，自动填写内容到input中
		return true;
	},
	submitObj: function() {
		//返回申请列表中，每个需要输入的input的键名和值
		var submitObj = {};
		$('#editUserPage .submit-input').each(function() {
			var id  = $(this).attr('id'),
				val = $(this).val();
			submitObj[id] = val;
		});

		return submitObj;
	},
	submitValidation: function() {
		//TODO，提交之前的验证
	}
};

var business = {
	indexPage   : indexPage,
	loanFormPage: loanFormPage,
	userInfoPage: userInfoPage,
	editUserPage: editUserPage,
	customerInfoPage: customerInfoPage,
	editCustomerPage: editCustomerPage
};
/* exports */
window.bussiness = business;

/* 页面初始化（用于网页版刷新页面后） */
$(document).on('pageInit', function() {
    router.setPage();
})
$.init();
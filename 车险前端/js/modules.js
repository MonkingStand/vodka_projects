var defaultConfig = {
    domain : 'http://' + document.URL.split('/')[2],
	project: '',
    jdUrl  : 'https://h5pay.jd.com/jdpay/saveOrder',
    ossPre : 'http://znzzc-vodka-insurance-online.oss-cn-shanghai.aliyuncs.com'
    // ossPre : 'http://znzzc-vodka-insurance-develop.oss-cn-shanghai.aliyuncs.com'
};

/*
 * 本文件主要针对任意项目的通用方法
 * 1-通用的js方法（不针对业务、自定义的插件）
 * 2-通用的js插件（自定义）方法事件绑定初始化
 * 3-针对业务的公共js方法
 */
(function($) {
    /****************************
     * 通用的公共js方法
     *****************************/
    /* 通用ajax调用模块 */
    $.ajaxAction = function(requestUrl, jsonData, successCallback, failCallback) {
        $.ajax({
            url     : requestUrl,
            type    : 'post',
            dataType: 'json',
            data    : jsonData,
            success : function(data) {
                successCallback(data);
            },
            error   : function(error) {
                failCallback(error);
            }
        })
    };
    /* 通用jsonData数据转换 */
    $.transferJsonData = function(jsonData) {
        var jsonDataStr = JSON.stringify(jsonData);

        return ({
            data: jsonDataStr
        });
    };
    /*
        根据用户订单的payStatus 的值来判断定订单处于什么状态
        0：新建订单，还未获取保险公司报价
        1：已保存保险公司报价，用户还未投保支付
        2：用户已投保支付，还未录入保单号
        3：操作员录入保单号
     */
    
    /* 通用的从url获取参数 */
    $.getParameter = function(parameterName) {
        var reg = new RegExp('(^|&)'+ parameterName + '=([^&]*)(&|$)'),
            url = window.location.search.substr(1).match(reg);
        
        if (url != null)
            return decodeURI(url[2]);
        return null;
    };
    /* 通用设置cookie */
    $.setCookie = function(name, value, seconds) {
        var expires  = '',
            lastTime = seconds ? (seconds * 1000) : 0;

        if (lastTime != 0 ) { 
            var date = new Date();  
            date.setTime(date.getTime() + lastTime);  
            expires = "; expires=" + date.toGMTString();  
        }

        document.cookie = name + '=' + escape(value) + expires + '; path=/';  
    };
    /* 通用获取cookie */
    $.getCookie = function(name) {  
        var nameEQ    = name + '=',  
            cookieArr = document.cookie.split(';');
        
        for (var i = 0; i < cookieArr.length; i++) {  
            var cookie = cookieArr[i];
            while (cookie.charAt(0) == ' ') {
                cookie = cookie.substring(1,cookie.length);
            }  
            if (cookie.indexOf(nameEQ) == 0) {
                return unescape(cookie.substring(nameEQ.length,cookie.length));
            }  
        }  
        return false;  
    };
    /* 通用清除cookie */
    $.clearCookie = function(name) {  
        $.setCookie(name, '', -1);  
    };
    /* 时间格式转换，现阶段只使用两种格式：带时分秒和不带，默认返回不带时分秒的 */
    $.formatTime = function(dateStr, formatType) {
        var dateVal    = (String(dateStr).indexOf('-') == -1 && String(dateStr).indexOf('.') == -1) ? parseInt(dateStr) : dateStr,
            date       = new Date(dateVal),

            timeMonth  = (String((parseInt(date.getMonth()) + 1)).length == 1) ? ('0' + (parseInt(date.getMonth()) + 1)) : (parseInt(date.getMonth()) + 1),
            timeDay    = (String(parseInt(date.getDate())).length == 1) ? ('0' + (parseInt(date.getDate()))) : (parseInt(date.getDate())),
            timeLeft   = date.getFullYear() + '-' + timeMonth + '-' + timeDay,
            
            timeHour   = (String(date.getHours()).length == 1) ? ('0' + date.getHours()) : date.getHours(),
            timeMinute = (String(date.getMinutes()).length == 1) ? ('0' + date.getMinutes()) : date.getMinutes(),
            timeSecond = (String(date.getSeconds()).length == 1) ? ('0' + date.getSeconds()) : date.getSeconds(),
            timeRight  = timeHour + ':' + timeMinute + ':' + timeSecond;
        
        if (formatType && formatType == 'full') {
            /* yyyy-mm-dd hh:mm:ss */
            return (timeLeft + ' ' + timeRight);
        }
        else {
            /* yyyy-mm-dd */
            return timeLeft;
        }
    };
    /* 根据传入的selector，遍历input，获取要提交的obj对象，对应的key为input的id值 */
    $.submitObj = function(selector) {
        var tmp = selector ? selector : '.submit-input',
            obj = {};

        $(tmp).each(function() {
            var key = $(this).attr('id') ?　$(this).attr('id') : '';
                val = $(this).val();
            
            if (key) { obj[key] = val; }
        });

        return obj;
    };
    /* 根据传入的data，遍历页面，自动填写到input中；第二个参数选填，添加前缀，避免冲突 */
    $.autoFill = function(data, addedPrefix) {
        var prefix = (arguments.length == 1) ? '' : addedPrefix;
        if (data) {
            for (var key in data) {
                $('#' + prefix + key).val(data[key]);
                $('#' + prefix + key).text(data[key]);
            }
        }
    };

    /****************************
     * 通用的js插件
     *****************************/
    
    /* 单行单选框插件：默认状态由html中的class和input决定，传入的valArr表示【选中】、【未选中】的值，默认为0、1（数值类型） */
    $.singleRadio = function(valArr) {
        var vals = valArr ? valArr : [0, 1];
        $('.item-single-radio').on('click', function() {
            var $thisItem  = $(this),
                $thisInput = $(this).find('input');
            
            if ($thisItem.hasClass('active')) {
                $thisItem.removeClass('active');
                $thisInput.val(vals[0]);
            }
            else {
                $thisItem.addClass('active');
                $thisInput.val(vals[1]);
            }
        });
    };

    /* 通用单选弹出模态框 */
    $.radioModal = function(domObj, options, selectCallbackFunc) {
        var self       = domObj,
            options    = options,
            radioCount = options.textArr.length,
            checkedTag = '',
            radioHtml  = '<ul class="radio-list">';

        for (var i = 0; i < radioCount; i ++) {
            checkedTag = (options.selectedIndex == i) ? 'checked' : '';
            radioHtml +=	'<li><label class="label-checkbox">' +
                                '<div class="item-inner">' +
                                    '<div class="item-title-row">' +
                                        '<div class="item-title">' + options.textArr[i] + '</div>' +
                                    '</div>' +
                                    '<input type="radio" name="test" value="' + options.valArr[i] + '" ' + checkedTag + '>' +
                                    '<div class="item-media">' +
                                        '<i class="selected-icon"></i>' +
                                    '</div>' +
                                '</div>' +
                            '</label></li>'
        }

        radioHtml += '</ul>';

        $.modal({
            'extraClass': 'radio-modal',
            'text': radioHtml
        });

        $('.radio-modal label').on('click', function() {
            var clickedVal  = $(this).find('input').val(),
                clickedText = $(this).find('.item-title').text();

            self.find('span.radio-val').attr('data-val', clickedVal).text(clickedText);
            self.find('input.radio-val').attr('data-val', clickedVal).val(clickedText);
            if (selectCallbackFunc) { selectCallbackFunc(); }
            $.closeModal();
        });

        $('.modal-overlay-visible').on('click',function() {
            $.closeModal();
        });
    };

    /* 图片上传 */
    $.uploadImg = {
        init: function() {
            this.checkUploadStatus();
            this.domListener();
        },
        domListener: function() {
            var self = this;
            /* 进行图片选择 */
            $('.upload-img-page').on('click', '.img-input', function() {
                $.showIndicator();
                setTimeout(function() {
                    $.hideIndicator();
                }, 250);
            })
            /* 选择图片后预览显示 */
            .on('change', '.img-input', function(e) {
                var file   = e.target.files[0],
                    size   = parseInt(file.size / 1024);    //kb
                
                $.showIndicator();
                self.imgPreview(file, size);
                /* 修改预览图片container的status */
                $(this).closest('.upload-img-page').find('.upload-status').removeClass('init has-uploaded').addClass('not-uploaded');
            });
            /* 点击【上传图片】按钮进行上传 */
            $('.upload-img-page .save-btn').on('click', function() {
                var imgType = $.getParameter('imgType'),
                    imgName = $.getParameter('imgName');
                
                self.uploadImg(imgType, imgName);
            });
        },
        checkUploadStatus: function() {
            /* 根据url中参数判断图片上传状态，并选择图片显示 */
            var uploaded   = Boolean(parseInt($.getParameter('uploaded'))),
                viewUrl    = $.getParameter('viewUrl'),
                originUrl  = $.getParameter('originUrl');
            
            if (uploaded) {
                $('.upload-img-page .img-container').removeClass('not-uploaded').append('<img class="tmp-upload" src="' + viewUrl + '?' + Number(new Date()) + '">');
                $('.upload-img-page .upload-status').removeClass('init not-uploaded').addClass('has-uploaded');
            }
            else {
                $('.upload-img-page .img-container').removeClass('not-uploaded').append('<img class="tmp-upload" src="' + originUrl + '?' + Number(new Date()) + '" onerror="$(\'.upload-img-page .img-container\').addClass(\'not-uploaded\');$(\'.tmp-upload\').remove()">');
            }
        },
        imgPreview: function(file, size) {
            var self = this;
            /* 图片预览 */
            var previewImg = document.createElement('img');
            previewImg.classList.add('tmp-upload');
            previewImg.setAttribute('id', 'tmpUploadImg');
            previewImg.file = file;

            var previewReader = new FileReader();
            previewReader.onload = (function(aImg) {
                return function(e) {
                    aImg.src = e.target.result;
                    imgSrc = aImg.src;
                };
            })(previewImg);
            previewReader.readAsDataURL(file);

            $('.upload-img-page .img-container .tmp-upload').remove();
            $('.upload-img-page .img-container').removeClass('not-uploaded');
            $('.upload-img-page .img-container').append(previewImg);

            setTimeout(function() {
                /* 隐藏加载图标 */
                $.hideIndicator();
                /* 启用【上传图片】按钮 */
                $('.upload-img-page .save-btn').removeClass('click-ban');
            }, 1000);
        },
        uploadImg: function(imgType, imgName) {
            /* 后台获取签名 */
            var jsonData = {
                    ossPath: imgType
                },
                successFunc = function(data) {
                    var options  = data.object,
                        redirect = document.URL;

                    /* 设置回调链接 */
                    if (redirect.indexOf('init=1') != -1) {
                        /* 若是初始状态，修改初始状态标识 */
                        redirect = redirect.replace('init=1', 'init=0');
                    }
                    if (redirect.indexOf('uploaded') == -1) {
                        /* 检查是否是已上传状态，添加上传标识 */
                        redirect += '&uploaded=1';
                    }
                    if (redirect.indexOf('viewUrl') == -1) {
                        redirect += ('&viewUrl=' + options.ossReadDomain + '/' + imgType + '/' + imgName + '.jpg');
                    }

                    if (data.status == 'fail') {
                        $.hideIndicator();
                        $.alert('上传功能初始化失败<br>请稍后重试');
                    }
                    else {
                        $('input[name="OSSAccessKeyId"]').val(options.accessid);
                        $('input[name="policy"]').val(options.policy);
                        $('input[name="Signature"]').val(options.signature);
                        $('input[name="key"]').val(options.dir + imgName + '.jpg');
                        $('input[name="success_action_redirect"]').val(redirect);
                        setTimeout(function() {
                            $('#uploadForm').attr('action', options.host).submit();
                        }, 500);
                    }
                },
                failFunc = function(err) {
                    $.alert('上传功能暂不可用<br>请稍后重试');
                };

            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/oss/signBeforePutObject.json', jsonData, successFunc, failFunc);
        }
    };

    /****************************
     * 业务相关的通用方法
     *****************************/

    /* 保存用户的相关信息到cookie */
    $.saveUserInfo = function(tempObj) {
		/* 暂存用户信息到cookie中 */
		$.setCookie('loginUserId', tempObj.userId, 3600);
		$.setCookie('loginUserName', (tempObj.realName ? tempObj.realName : '--'), 3600);
		$.setCookie('loginUserMobile', tempObj.mobile, 3600);
		$.setCookie('loginUserPassword', tempObj.password, 3600);
		$.setCookie('loginUserReal', tempObj.realCheck, 3600);
		$.setCookie('loginUserRole', tempObj.role, 3600);
		$.setCookie('loginUserSex', tempObj.sex, 3600);
        $.setCookie('loginUserIdCard', tempObj.idCard, 3600);
	};

     /* 车牌号判断是否正确 */
    $.checkCarNo = function(carNo) {
        var carNoReg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/;
        
        if (!carNoReg.test(carNo)) {
            return false;
        }
        return true;
    };

    /* 身份证判断是否正确 */
    $.checkIdCardNo = function(idCardNo) {
        var idCardNoReg = /^(\d{15}$|^\d{18}$|^\d{17}(\d|X|x))$/;

        if (!idCardNoReg.test(idCardNo)) {
            return false;
        }
        return true;
    };

    /* 订单状态转换 */
    $.orderStatusTrans = function(status) {
        var statusText = '';

        switch(parseInt(status)) {
            case 0:
                statusText = '未提交';
                break;
            case 2:
                statusText = '待审核';
                break;
            case 3:
                statusText = '审核未通过';
                break;
            case 4:
                statusText = '待审批';
                break;
            case 5:
                statusText = '借款审批未通过';
                break;
            case 1:
                statusText = '借款详情待确认';
                break;
            case 6:
                statusText = '财务未放款';
                break;
            case 7:
                statusText = '财务已放款';
                break;
            case 8:
                statusText = '已退单';
                break;
            case 9:
                statusText = '已退单';
                break;
            case 10:
                statusText = '已退单';
                break;
        }

        return statusText;
    };
})(Zepto)

/* export */
window.defaultConfig = defaultConfig;
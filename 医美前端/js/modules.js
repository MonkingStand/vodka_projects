var defaultConfig = {
    domain : 'http://' + document.URL.split('/')[2],
	project: ''
	// project: '/com-znzzc-credit-web'
};

/*
 * 本文件主要针对任意项目的通用方法
 * 1-通用的js方法（不针对业务）
 * 2-针对业务的公共js方法
 */
(function($) {
    /****************************
     * 通用的公共js方法
     *****************************/
    /* 解决缓存问题，动态加载js文件 */
    $.loadJsFiles = function(srcArr) {
        for (var i = 0, len = srcArr.length; i < len; i ++) {
            var timeStamp = Date.parse(new Date());
            var script    = document.createElement("script");

            script.src = srcArr[i] + '?' + timeStamp;
            
            document.body.appendChild(script);
        }
    };
    /* 通用模态单选框 */
    $.radioModal = function(domObj, options) {
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
            $.closeModal();
        });

        $('.modal-overlay-visible').on('click',function() {
            $.closeModal();
        });
    };

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

    /* ajax上传图片（需要手动初始化）  */
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
            var realTag    = Boolean(parseInt($.getParameter('realTag'))),
                uploaded   = Boolean(parseInt($.getParameter('uploaded'))),
                viewUrl    = $.getParameter('viewUrl'),
                originUrl  = $.getParameter('originUrl');
            
            if (uploaded) {
                $('.upload-img-page .img-container').removeClass('not-uploaded').append('<img class="tmp-upload" src="' + viewUrl + '?' + Number(new Date()) + '">');
                $('.upload-img-page .upload-status').removeClass('init not-uploaded').addClass('has-uploaded');
            }
            else {
                $('.upload-img-page .img-container').removeClass('not-uploaded').append('<img class="tmp-upload" src="' + originUrl + '?' + Number(new Date()) + '" onerror="$(\'.upload-img-page .img-container\').addClass(\'not-uploaded\');$(\'.tmp-upload\').remove()">');
            }
            /* 如果已实名过，不允许用户再上传图片进行覆盖 */
            if (realTag) {
                $('.operate-container').remove();
            }
        },
        imgPreview: function(file, size) {
            var self = this;
            /* 获取图片的orientation值，用于后续图片旋转（针对ios上拍照发生旋转） */
            EXIF.getData(file, function() {
                var exif = EXIF.pretty(this),
                    orientationReg = /(Orientation\s*:\s*\d)/,
                    orientation    = 0;
                
                if (Boolean($.trim(exif)) && Boolean((exif.match(orientationReg)))) {
                    orientation = $.trim((exif.match(orientationReg)[1]).split(':')[1])
                }
                /* 将获取到的orientation值暂存至uploadForm上 */
                $('#uploadForm').attr('data-orientation', orientation);
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
                        /* 图片压缩 */
                        self.resizeImg(size, e);
                    };
                })(previewImg);
                previewReader.readAsDataURL(file);

                $('.upload-img-page .img-container .tmp-upload').remove();
                $('.upload-img-page .img-container').removeClass('not-uploaded');
                $('.upload-img-page .img-container').append(previewImg);
            });
        },
        resizeImg: function(size, event) {
            var self = this;
            /* 图片尺寸大于1024kb，即1mb，进行压缩 */
            if (size > 1024) {
                /* 添加标识；添加尺寸信息，单位MB */
                $('#uploadForm').addClass('to-resize').attr('data-size', size / 1024);
                /* 绘制图像到canvas */
                var resizeCanvas = document.getElementById('resizeCanvas'),
                    ctx = resizeCanvas.getContext('2d'),
                    img = new Image();
                
                img.src = event.target.result;

                img.onload = function() {
                    /* 获取原始宽高尺寸 */
                    var originWidth  = img.width,
                        originHeight = img.height,
                        /* 计算比例，宽高取值较大的那个 */
                        scale = (originWidth > originHeight) ? (originWidth / 1000) : (originHeight / 1000);
                    
                    /* 开始进行压缩操作 */
                    /* 查看orientation值，若为3、6、8,，进行对应角度旋转 */
                    var orientation = parseInt($('#uploadForm').attr('data-orientation'));
                    if (orientation == 3 || orientation == 4 || orientation == 6 || orientation == 8) {
                        var rotateDeg;
                        /* 根据orientation的值，计算对应的旋转角度 */
                        if (orientation == 3 || orientation == 4) {
                            /* 3 对应的需要顺时针 180 度，即 π */
                            /* 4 对应的需要进行垂直翻转，效果等同于进行 180 度旋转 */
                            rotateDeg = Math.PI;
                        }
                        else if (orientation == 6) {
                            /* 顺时针 90 度，即 π/2 */
                            rotateDeg = Math.PI / 2;
                        }
                        else if (orientation == 8) {
                            /* 顺时针 270 度，即 (3/2)*π ，等价于逆时针 90 度 */
                            rotateDeg = Math.PI * (3 / 2);
                        }
                        resizeCanvas.setAttribute('width', originHeight / scale);
                        resizeCanvas.setAttribute('height', originWidth / scale);
                        ctx.save();
                        ctx.translate(500, 500);
                        ctx.rotate(rotateDeg);
                        /* 判断原图的宽高哪个值大，决定新绘制的图像往水平/垂直方向偏移一定距离 */
                        if (originWidth > originHeight) {
                            ctx.drawImage(img, -500, -500 + 1000 - (originHeight / scale), originWidth / scale, originHeight / scale);
                        }
                        else {
                            ctx.drawImage(img, -500 + 1000 - (originWidth / scale), -500, originWidth / scale, originHeight / scale);
                        }
                        ctx.restore();
                    }
                    else {
                        resizeCanvas.setAttribute('width', originWidth / scale);
                        resizeCanvas.setAttribute('height', originHeight / scale);
                        ctx.drawImage(img, 0, 0, originWidth / scale, originHeight / scale);
                    }
                    /* 将canvas图像导出 */
                    var base64Data = resizeCanvas.toDataURL("image/jpg", 0.75);
                    /* 封装blob对象 */
                    window.blob = self.dataURItoBlob(base64Data);
                    /* 清除定时器 */
                    setTimeout(function() {
                        /* 隐藏加载图标 */
                        $.hideIndicator();
                        /* 启用【上传图片】按钮 */
                        $('.upload-img-page .save-btn').removeClass('click-ban');
                    }, 1000);
                };
            }
            else {
                delete blob;
                /* 移除标识 */
                $('#uploadForm').removeClass('to-resize');
                setTimeout(function() {
                    /* 隐藏加载图标 */
                    $.hideIndicator();
                    /* 启用【上传图片】按钮 */
                    $('.upload-img-page .save-btn').removeClass('click-ban');
                }, 1000);
                return false;
            }
        },
        dataURItoBlob: function(base64Data) {
            var byteString;

            if (base64Data.split(',')[0].indexOf('base64') >= 0) {
                byteString = atob(base64Data.split(',')[1]);
            }
            else {
                byteString = unescape(base64Data.split(',')[1]);
            }

            var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0];

            var ia = new Uint8Array(byteString.length);

            for (var i = 0; i < byteString.length; i++) {  
                ia[i] = byteString.charCodeAt(i);  
            }  
            return new Blob([ia], {type: mimeString});  
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
                        /* 设置需要back的次数 */
                        var backTime = 1;
                        if ($.getCookie('uploadBackTime') && $.getCookie('uploadBackTime') != '0') {
                            backTime = parseInt($.getCookie('uploadBackTime')) + 1;
                        }
                        $.setCookie('uploadBackTime', backTime, 3600);
                        if ($('#uploadForm').hasClass('to-resize')) {
                            /* 
                                采用异步提交，虽然会产生跨域问题，但是只要等待一定的时间，图片还是可以上传成功；
                                延迟的时间根据图片的尺寸（单位MB）来决定
                            */
                            var delayTime = parseFloat($('#uploadForm').attr('data-size')) / 2;
                            /* 是否勾选了慢速稳定 */
                            if ($('#stableTag').prop('checked')) {
                                delayTime = delayTime * 10;
                            }
                            /* 新建formData对象用于提交表单 */
                            var uploadForm = new FormData();

                            uploadForm.append('OSSAccessKeyId', options.accessid);
                            uploadForm.append('policy', options.policy);
                            uploadForm.append('Signature', options.signature);
                            uploadForm.append('key', options.dir + imgName + '.jpg');
                            uploadForm.append('success_action_redirect', redirect);
                            uploadForm.append('file', blob);
                            setTimeout(function() {
                                var xmlHttp = new XMLHttpRequest();
                                /* 设置回调，不管成功失败，页面跳转 */
                                xmlHttp.onreadystatechange = function() {
                                    setTimeout(function() {
                                        window.location.href = redirect;
                                    }, Math.ceil(delayTime) * 1000);
                                };

                                xmlHttp.open('POST', options.host, true);
                                xmlHttp.send(uploadForm);
                            }, 1000);
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
                    }
                },
                failFunc = function(err) {
                    $.alert('上传功能暂不可用<br>请稍后重试');
                };

            $.showIndicator();
            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/oss/signBeforePutObject.htm', jsonData, successFunc, failFunc);
        }
    };

    /* 通用二维码生成模块 */
    // 注：第一个参数，必须要用原生js的dom选择
    $.qrGenerate = function($container, data, size, qrCallback) {
        var qrImg = $container.querySelector('img'),
            qrcode;
        
        if (qrImg) {
            $container.removeChild(qrImg);
        }

        qrcode = new QRCode($container, {
            width : size,
            height: size
        });
        qrcode.makeCode(data);

        var qrInter = setInterval(function() {
                var tempImg  = $container.querySelector('img');
                if (tempImg) {
                    clearInterval(qrInter);
                    qrCallback();
                }
            }, 750);
    }

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
    
    /* 通用暂存用户信息 */
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
		/* 如果登录用户不是借款用户，商户信息完善 */
		if (tempObj.role != '1') {
			$.setCookie('loginMerchantNo', (tempObj.merchantNo ? tempObj.merchantNo : '--'), 3600);
			$.setCookie('loginMerchantName', (tempObj.merchantName ? tempObj.merchantName : '--'), 3600);
			$.setCookie('loginLoanType', (tempObj.creditType ? tempObj.creditType : ''), 3600);
		}
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

    /****************************
     * 业务相关的通用方法
     *****************************/
    /* 实名认证结果 */
    /* 实名认证结果 */
    $.realCheck = function(realCheckStr, resultType) {
        /* 第二个参数选填，可选类型为tongdunMobile、tongdunBankCard、tongdunHeadPic，类型为数组，如果不填，表示返回全部综合的结果 */
        if (Boolean(realCheckStr)) {
            if (realCheckStr.indexOf('{') == '-1') {
                realCheckStr = '{' + realCheckStr +'}';
            }
            eval('var realObj = ' + realCheckStr);
            if (Boolean(resultType)) {
                var result = '已实名';
                for (var i = 0; i < resultType.length; i ++) {
                    if (!Boolean(parseInt(realObj[resultType[i]]))) {
                        result = '未实名';
                        break;
                    }
                }
                return result;
            }
            else {
                var result = '已实名';
                for (var key in realObj) {
                    if (!Boolean(parseInt(realObj[key]))) {
                        result = '未实名';
                        break;
                    }
                }
                return result;
            }
        }
        else {
            return '未实名';
        }
    }

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
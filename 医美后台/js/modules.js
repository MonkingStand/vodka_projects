/*
 * 本文件主要针对任意项目的通用方法
 * 1-通用的js方法（不针对业务）
 * 2-针对业务的公共js方法
 */

(function($) {
    /* 全局配置 */
    var defaultConfig = {
            domain : 'http://' + document.URL.split('/')[2], 
            project: ''
            // project: '/com-znzzc-credit-manage-web'
        };
    window.defaultConfig = defaultConfig;

    /* 权限列表 */
    var permissionList = {
            menuList: [
                'riskManage',
                'financeManage',
                'merchantManage',
                'interestManage',
                'adminManage'
            ],
            subMenuList: [
                'evaluate:select', 'passOrder:see',
                'financeOrder:see', 'overdueOrder:see',
                'merchant:see','merchantUser:codeCreate',
                'interestList:see',
                'adminUser:select', 'adminRole:select', 'adminPermission:select'
            ]
        };
    window.permissionList = permissionList;
    
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
    /* ajax传输 */
    $.ajaxAction = function(requestUrl, jsonData, successFunc, failFunc, options) {
        var defaultOption = {
                url: requestUrl,
                type: 'post',
                data: jsonData,
                success: function(data) {
                    successFunc(data);
                },
                error: function(err) {
                    failFunc(err);
                }
            };
        
        if (options) {
            for (var key in options) {
                defaultOption[key] = options[key]
            }
        }

        $.ajax(defaultOption);
    };

    /* ajax上传文件，修改默认配置项  */
    $.ajaxFileAction = function(requestUrl, jsonData, successCallback, failCallback) {
        $.ajax({
            url     : requestUrl,
            type    : 'post',
            processData: false,  // 告诉jQuery不要去处理发送的数据
            contentType: false,   // 告诉jQuery不要去设置Content-Type请求头
            data    : jsonData,
            success : function(data) {
                successCallback(data);
            },
            error   : function(error) {
                failCallback(error);
            }
        })
    }

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

    /* 公共获取input的val并暂存为object */
    /* 例：<input class="submit-input" id="test1"> <input class="submit-input" id="test2"> <input class="submit-input" id="test3">
     * 用法：var submitObj = $.submitObj('.submit-input');
     * 结果：submitObj = {
     *          test1: '',
     *          test2: '',
     *          test3: ''
     *      }
     */
    $.submitObj = function(selector) {
        var tempObj = {};
        $(selector).each(function() {
            var key = $(this).attr('id'),
                val = $(this).val();
            tempObj[key] = val;
        });
        return tempObj;
    };

    /* 公共获取Object的键值对并暂存到页面上（input或者span或者div等） */
    /* 例：data = {
     *          test1: 'val1',
     *          test2: 'val2',
     *          test3: 'val3'
     *      }
     * 用法：$.autoFillData(data);
     * 结果：<input class="auto-filled" id="test1"> <input class="auto-filled" id="test2"> <input class="auto-filled" id="test3">
     */
    $.autoFillData = function(data, prefix) {
        var prefix = prefix ? prefix : '';

        if (!data) return false;
        for (var key in data) {
            if ($('#' + prefix + key)) {
                $('#' + prefix + key).val(data[key]);
                $('#' + prefix + key).text(data[key]);
            }            
        }
    };

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
    };

    /* 通用的提示框 */
    /*
     * labelClass：提示框的标签种类（success、danger、warning、info）
     * infoText  ：要提示的文字信息
     * infoTitle ：要提示小标题（可选）
     */
    $.alert = function(labelClass, infoText, infoTitle) {
        var alertClass = 'alert-' + labelClass,
            title      = infoTitle ? ('<strong>' + infoTitle + '</strong>') : '',
            alertStr   = '<div class="alert ' + alertClass + ' alert-dismissible" role="alert">' +
                            '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>' +
                            title + infoText +
                         '</div>';

        $('.page').append(alertStr);
        setTimeout(function() {
            $('.alert').remove();
        }, 2000);
    };

    /*
     * 通用的模态确认框,根据返回值来判断
     * true-确认  false-取消 
     */
    $.confirm = function(text, callbackFunc) {
        var confirmStr = '<div class="modal fade bs-example-modal-sm confirm-modal" tabindex="-1" role="dialog" aria-labelledby="mySmallModalLabel" aria-hidden="true">' +
                            '<div class="modal-dialog modal-sm">' +
                                '<div class="modal-content">' +
                                    '<h4 class="modal-title" id="myModalLabel">' + tipsArr + '</h4>' +
                                    '<div class="modal-footer">' +
                                        '<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>' +
                                        '<button type="button" class="btn btn-primary" onclick=' + clickFunc + '>确认</button>' +
                                    '</div>' +
                                '</div>' +
                            '</div>' +
                         '</div>',
             clickFunc = function() {
                 callbackFunc();
                 $('.confirm-modal').modal('hide');
             }
    };

    /*
     * 非空校验
     * true-为空  false-不为空
     */
    $.isEmpty = function(selector, alertInfo) {
        if ($(selector).val() == '') {
            $.alert('danger', alertInfo + '不能为空！');
            return true;
        }
        return false;
    };

    /*
     * 通用的页面打印方法
     * 传入参数：①类选择器selector可选，②options可选
     */
    $.print = function(selector, options, processFunc) {
        var argumentsCount = arguments.length,
            defaultOption  = {
                selector: '',
                title   : '--',
                cssLink : [
                    /*
                    {
                        url: 'http://...'
                    }
                    */
                ],
                cssStr: ''
            };
        /* 修改默认参数 */
        if (argumentsCount >= 1) {
            /* 传入了参数，表明打印的页面中的一部分 */
            defaultOption.selector = selector;
            if (argumentsCount >= 2) {
                defaultOption.title   = options.title ? options.title : defaultOption.title;
                defaultOption.cssLink = options.cssLink ? options.cssLink: defaultOption.cssLink;
                defaultOption.cssStr  = options.cssStr ? options.cssStr : defaultOption.cssStr;
            }
            /* 重新组织传入的参数 */
            var bodyHtmlStr  = $(defaultOption.selector).prop('outerHTML'),
                cssLinkCount = defaultOption.cssLink.length,
                cssLinkStr   = '';
            /* 判断是否有处理函数 */
            if (argumentsCount == 3) {
                bodyHtmlStr = processFunc(bodyHtmlStr);
            }
            /* 将css的链接转换为 link 标签 */
            for (var i = 0; i < cssLinkCount; i ++) {
                cssLinkStr += '<link rel="stylesheet" href="' + defaultOption.cssLink[i].url + '">';
            }
            /* 组织要打印页面的内容 */
            var htmlDocStr = '<!DOCTYPE html>' +
                            '<html>' +
                                '<head>' +
                                    '<meta charset="utf-8">' +
                                    '<title>' + defaultOption.title + '</title>' +
                                    cssLinkStr +
                                '</head>' +
                                '<body style="min-width: 1000px;">' +
                                    '<style>' +
                                        defaultOption.cssStr +
                                    '</style>' +
                                    bodyHtmlStr +
                                    '<script>' +
                                        'window.print();' +
                                    '</script>' +
                                '</body>' +
                            '</html>';
            /* 新建临时 iframe ，将要打印的页面内容，通过 srcdoc 传入 */
            var printIframe = '<iframe id="printIframe" style="display:none;" width="1000" height="1000"></iframe>';
            /* 新建之前先检查是否已存在 */
            if ($('body').find('#printIframe')) {
                $('body').find('#printIframe').remove();
            }
            $('body').append(printIframe);
            $('body').find('#printIframe').attr('srcdoc', htmlDocStr);
        }
        else {
            /* 不传参，直接打印当前页面 */
            window.print();
        }
    };

    /****************************
     * 业务相关的通用方法
     *****************************/
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
    /* 暂存权限对象 */
    $.savePermission = function(permissionStr) {
        var permissionArr   = permissionStr.split(','),
            permissionCount = permissionArr.length,
            permissionObj   = {};
        
        for (var i = 0; i < permissionCount; i ++) {
            if (!permissionArr[i]) { continue; }

            var item = permissionArr[i].split(':'),
                key  = item[0],
                val  = item[1];

            if (permissionObj[key]) {
                permissionObj[key].push(val);
            }
            else {
                permissionObj[key] = [val];
            }
        }

        $.setCookie('permissionObj', JSON.stringify(permissionObj), 3600);
    };
    /* 检查某个菜单或者操作是否有权限 */
    $.checkPermission = function(menuName, operateName) {
        var permission = false;
        eval('var permissionObj = ' + $.getCookie('permissionObj'));
        if (arguments.length == 1) {
            /* 菜单级权限判断 */
            permission = Boolean(permissionObj[menuName]) ? true : false;
        }
        else {
            /* 按钮级权限判断 */
            if (permissionObj[menuName] && (permissionObj[menuName].indexOf(operateName) != -1)) {
                permission = true;
            }
            
        }
        return permission;
    };
    /* 检查菜单内某个操作的按钮级权限 */
    $.checkMenuItemPermission = function(permission) {
        var item = permission.split(':');

        if ($.checkPermission(item[0], item[1])) {
            return true;
        } else {
            $.alert('danger', '无权限，请联系管理人员');
            return false;
        }
    }
    /* 订单状态转换 */
    $.orderStatusTrans = function(status) {
        var statusObj = {};

        switch(parseInt(status)) {
            case 0:
                statusObj.textColor = ' text-grey ';
                statusObj.textIcon  = ' fa-question-circle ';
                statusObj.text      = '用户未提交申请';
                break;
            case 2:
                statusObj.textColor = ' text-yellow ';
                statusObj.textIcon  = ' fa-question-circle ';
                statusObj.text      = '待审核';
                break;
            case 3:
                statusObj.textColor = ' text-red ';
                statusObj.textIcon  = ' fa-exclamation-circle ';
                statusObj.text      = '审核不通过';
                break;
            case 4:
                statusObj.textColor = ' text-yellow ';
                statusObj.textIcon  = ' fa-question-circle ';
                statusObj.text      = '审核通过，待审批';
                break;
            case 1:
                statusObj.textColor = ' text-green ';
                statusObj.textIcon  = ' fa-check-circle ';
                statusObj.text      = '审批通过，用户未确认';
                break;
            case 5:
                statusObj.textColor = ' text-red ';
                statusObj.textIcon  = ' fa-exclamation-circle ';
                statusObj.text      = '审批不通过';
                break;
            case 6:
                statusObj.textColor = ' text-yellow ';
                statusObj.textIcon  = ' fa-question-circle ';
                statusObj.text      = '用户已确认，财务未放款';
                break;
            case 7:
                statusObj.textColor = ' text-green ';
                statusObj.textIcon  = ' fa-check-circle ';
                statusObj.text      = '财务已放款';
                break;
            case 8:
                statusObj.textColor = ' text-red ';
                statusObj.textIcon  = ' fa-exclamation-circle ';
                statusObj.text      = '已退单';
                break;
            case 9:
                statusObj.textColor = ' text-red ';
                statusObj.textIcon  = ' fa-exclamation-circle ';
                statusObj.text      = '已退单';
                break;
            case 10:
                statusObj.textColor = ' text-red ';
                statusObj.textIcon  = ' fa-exclamation-circle ';
                statusObj.text      = '已退单';
                break;
        }

        return statusObj;
    };
})(jQuery)
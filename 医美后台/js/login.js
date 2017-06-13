/*
 *  用户登录
 *  login.html
 */
(function($) {
    var pageObj = {
        init: function() {
            this.domListener();
        },
        domListener: function() {
            var self = this;

            $('#login').on('click', function(e) {
                if (!$.isEmpty('[name="username"]', '用户名') && !$.isEmpty('[name="password"]', '密码')) {
                    self.login();
                }
            });
        },
        login: function() {
            var userObj = {
                    username: $('[name="username"]').val(),
                    password: $('[name="password"]').val()
                },
                successFunc = function(data) {
                    var dataObj = data.object;

                    if (data.status == 'success') {
                        $.setCookie('username', dataObj.username, 3600);
                        window.location.href = defaultConfig.domain + defaultConfig.project + '/html/manage_system.html';
                    } else {
                        alert(data.message);
                    }
                },
                failFunc = function(err) {
                    $.alert('danger', '网络连接出错，请稍后重试！');
                    console.error(err);
                };

            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/login/login.htm', userObj, successFunc, failFunc);
        }
    };
    
    pageObj.init();
})(jQuery);
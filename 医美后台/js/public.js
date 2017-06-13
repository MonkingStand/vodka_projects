(function($) {
    /* 
     *  主页面公共部分（包括侧边栏和顶部tab标签页）
     *  页面公共模块
     */
    $.learuntab = {
        requestFullScreen: function() {
            var de = document.documentElement;
            if (de.requestFullscreen) {
                de.requestFullscreen();
            } else if (de.mozRequestFullScreen) {
                de.mozRequestFullScreen();
            } else if (de.webkitRequestFullScreen) {
                de.webkitRequestFullScreen();
            }
        },
        exitFullscreen: function() {
            var de = document;
            if (de.exitFullscreen) {
                de.exitFullscreen();
            } else if (de.mozCancelFullScreen) {
                de.mozCancelFullScreen();
            } else if (de.webkitCancelFullScreen) {
                de.webkitCancelFullScreen();
            }
        },
        //-----refreshTab-----
        //点击刷新当前active页面
        refreshTab: function() {
            var currentId = $('.page-tabs-content').find('.active').attr('data-id');
            var target = $('.LRADMS_iframe[data-id="' + currentId + '"]');
            var url = target.attr('src');
            //$.loading(true);
            target.attr('src', url).load(function() {
                //$.loading(false);
            });
        },
        //-----activeTab-----
        // 点击标签切换当前active标签页
        activeTab: function() {
            var currentId = $(this).data('id');
            if (!$(this).hasClass('active')) {
                $('.mainContent .LRADMS_iframe').each(function() {
                    if ($(this).data('id') == currentId) {
                        $(this).show().siblings('.LRADMS_iframe').hide();
                        return false;
                    }
                });
                $(this).addClass('active').siblings('.menuTab').removeClass('active');
                $.learuntab.scrollToTab(this);
            }
        },
        //-----closeOtherTabs-----
        //关闭除了当前active标签页以外的所有标签
        closeOtherTabs: function() {
            $('.page-tabs-content').children("[data-id]").find('.fa-remove').parents('a').not(".active").each(function() {
                $('.LRADMS_iframe[data-id="' + $(this).data('id') + '"]').remove();
                $(this).remove();
            });
            $('.page-tabs-content').css("margin-left", "0");
        },
        //-----closeTab-----
        // 点击关闭标签，并关闭相应的ifream页面
        closeTab: function() {
            var $menuTab = $(this).parents('.menuTab'),
                closeTabId = $menuTab.data('id'),
                currentWidth = $menuTab.width();
            if ($menuTab.hasClass('active')) {
                if ($menuTab.next('.menuTab').size()) {
                    var activeId = $menuTab.next('.menuTab:eq(0)').data('id');
                    $menuTab.next('.menuTab:eq(0)').addClass('active');

                    $('.mainContent .LRADMS_iframe').each(function() {
                        if ($(this).data('id') == activeId) {
                            $(this).show().siblings('.LRADMS_iframe').hide();
                            return false;
                        }
                    });
                    var marginLeftVal = parseInt($('.page-tabs-content').css('margin-left'));
                    if (marginLeftVal < 0) {
                        $('.page-tabs-content').animate({
                            marginLeft: (marginLeftVal + currentWidth) + 'px'
                        }, "fast");
                    }
                    $menuTab.remove();
                    $('.mainContent .LRADMS_iframe').each(function() {
                        if ($(this).data('id') == closeTabId) {
                            $(this).remove();
                            return false;
                        }
                    });
                }
                if ($menuTab.prev('.menuTab').size()) {
                    var activeId = $menuTab.prev('.menuTab:last').data('id');
                    $menuTab.prev('.menuTab:last').addClass('active');
                    $('.mainContent .LRADMS_iframe').each(function() {
                        if ($(this).data('id') == activeId) {
                            $(this).show().siblings('.LRADMS_iframe').hide();
                            return false;
                        }
                    });
                    $menuTab.remove();
                    $('.mainContent .LRADMS_iframe').each(function() {
                        if ($(this).data('id') == closeTabId) {
                            $(this).remove();
                            return false;
                        }
                    });
                }
            } else {
                $menuTab.remove();
                $('.mainContent .LRADMS_iframe').each(function() {
                    if ($(this).data('id') == closeTabId) {
                        $(this).remove();
                        return false;
                    }
                });
                $.learuntab.scrollToTab($('.menuTab.active'));
            }
            return false;
        },
        // -----addTab-----
        // 点击左侧边栏并在标签页打开iframe页面
        addTab: function() {
            $(".navbar-custom-menu>ul>li.open").removeClass("open");
            var dataId = $(this).attr('data-id');
            if (dataId != "") {
                //top.$.cookie('nfine_currentmoduleid', dataId, { path: "/" });
            }
            var dataUrl = $(this).attr('href');
            var menuName = $.trim($(this).text());
            var flag = true;
            if (dataUrl == undefined || $.trim(dataUrl).length == 0) {
                return false;
            }
            $('.menuTab').each(function() {
                if ($(this).data('id') == dataUrl) {
                    if (!$(this).hasClass('active')) {
                        $(this).addClass('active').siblings('.menuTab').removeClass('active');
                        $.learuntab.scrollToTab(this);
                        $('.mainContent .LRADMS_iframe').each(function() {
                            if ($(this).data('id') == dataUrl) {
                                $(this).show().siblings('.LRADMS_iframe').hide();
                                flag = false;
                                return false;
                            }
                        });
                    }
                    flag = false;
                    return false;
                }
            });
            // 渲染新打开的标签页
            if (flag) {
                var str = '<a href="javascript:;" class="active menuTab" data-id="' + dataUrl + '">' + menuName + ' <i class="fa fa-remove"></i></a>';
                $('.menuTab').removeClass('active');
                var str1 = '<iframe class="LRADMS_iframe" id="iframe' + dataId + '" name="iframe' + dataId + '"  width="100%" height="100%" src="' +
                    dataUrl + '" frameborder="0" data-id="' + dataUrl + '" seamless></iframe>';
                $('.mainContent').find('iframe.LRADMS_iframe').hide();
                $('.mainContent').append(str1);
                //$.loading(true);
                $('.mainContent iframe:visible').load(function() {
                    //$.loading(false);
                });
                $('.menuTabs .page-tabs-content').append(str);
                $.learuntab.scrollToTab($('.menuTab.active'));
            }
            return false;
        },
        //-----scrollTabRight-----
        // 点击右滑，标签页滑动
        scrollTabRight: function() {
            var marginLeftVal = Math.abs(parseInt($('.page-tabs-content').css('margin-left')));
            var tabOuterWidth = $.learuntab.calSumWidth($(".content-tabs").children().not(".menuTabs"));
            var visibleWidth = $(".content-tabs").outerWidth(true) - tabOuterWidth;
            var scrollVal = 0;
            if ($(".page-tabs-content").width() < visibleWidth) {
                return false;
            } else {
                var tabElement = $(".menuTab:first");
                var offsetVal = 0;
                while ((offsetVal + $(tabElement).outerWidth(true)) <= marginLeftVal) {
                    offsetVal += $(tabElement).outerWidth(true);
                    tabElement = $(tabElement).next();
                }
                offsetVal = 0;
                while ((offsetVal + $(tabElement).outerWidth(true)) < (visibleWidth) && tabElement.length > 0) {
                    offsetVal += $(tabElement).outerWidth(true);
                    tabElement = $(tabElement).next();
                }
                scrollVal = $.learuntab.calSumWidth($(tabElement).prevAll());
                if (scrollVal > 0) {
                    $('.page-tabs-content').animate({
                        marginLeft: 0 - scrollVal + 'px'
                    }, "fast");
                }
            }
        },
        //-----scrollTabLeft-----
        // 点击左滑，标签页滑动
        scrollTabLeft: function() {
            var marginLeftVal = Math.abs(parseInt($('.page-tabs-content').css('margin-left')));
            var tabOuterWidth = $.learuntab.calSumWidth($(".content-tabs").children().not(".menuTabs"));
            var visibleWidth = $(".content-tabs").outerWidth(true) - tabOuterWidth;
            var scrollVal = 0;
            if ($(".page-tabs-content").width() < visibleWidth) {
                return false;
            } else {
                var tabElement = $(".menuTab:first");
                var offsetVal = 0;
                while ((offsetVal + $(tabElement).outerWidth(true)) <= marginLeftVal) {
                    offsetVal += $(tabElement).outerWidth(true);
                    tabElement = $(tabElement).next();
                }
                offsetVal = 0;
                if ($.learuntab.calSumWidth($(tabElement).prevAll()) > visibleWidth) {
                    while ((offsetVal + $(tabElement).outerWidth(true)) < (visibleWidth) && tabElement.length > 0) {
                        offsetVal += $(tabElement).outerWidth(true);
                        tabElement = $(tabElement).prev();
                    }
                    scrollVal = $.learuntab.calSumWidth($(tabElement).prevAll());
                }
            }
            $('.page-tabs-content').animate({
                marginLeft: 0 - scrollVal + 'px'
            }, "fast");
        },
        scrollToTab: function(element) {
            var marginLeftVal = $.learuntab.calSumWidth($(element).prevAll()),
                marginRightVal = $.learuntab.calSumWidth($(element).nextAll()),
                tabOuterWidth = $.learuntab.calSumWidth($(".content-tabs").children().not(".menuTabs"));
            var visibleWidth = $(".content-tabs").outerWidth(true) - tabOuterWidth,
                scrollVal = 0;
            if ($(".page-tabs-content").outerWidth() < visibleWidth) {
                scrollVal = 0;
            } else if (marginRightVal <= (visibleWidth - $(element).outerWidth(true) - $(element).next().outerWidth(true))) {
                if ((visibleWidth - $(element).next().outerWidth(true)) > marginRightVal) {
                    scrollVal = marginLeftVal;
                    var tabElement = element;
                    while ((scrollVal - $(tabElement).outerWidth()) > ($(".page-tabs-content").outerWidth() - visibleWidth)) {
                        scrollVal -= $(tabElement).prev().outerWidth();
                        tabElement = $(tabElement).prev();
                    }
                }
            } else if (marginLeftVal > (visibleWidth - $(element).outerWidth(true) - $(element).prev().outerWidth(true))) {
                scrollVal = marginLeftVal - $(element).prev().outerWidth(true);
            }
            $('.page-tabs-content').animate({
                marginLeft: 0 - scrollVal + 'px'
            }, "fast");
        },
        calSumWidth: function(element) {
            var width = 0;
            $(element).each(function() {
                width += $(this).outerWidth(true);
            });
            return width;
        },
        //页面初始化
        //事件绑定
        init: function() {
            $('.menuItem').on('click', $.learuntab.addTab);
            $('.menuTabs').on('click', '.menuTab i', $.learuntab.closeTab);
            $('.menuTabs').on('click', '.menuTab', $.learuntab.activeTab);
            $('.tabLeft').on('click', $.learuntab.scrollTabLeft);
            $('.tabRight').on('click', $.learuntab.scrollTabRight);
            $('.tabReload').on('click', $.learuntab.refreshTab);
            $('.tabCloseCurrent').on('click', function() {
                $('.page-tabs-content').find('.active i').trigger('click');
            });
            $('.tabCloseAll').on('click', function() {
                $('.page-tabs-content').children("[data-id]").find('.fa-remove').each(function() {
                    $('.LRADMS_iframe[data-id="' + $(this).data('id') + '"]').remove();
                    $(this).parents('a').remove();
                });
                $('.page-tabs-content').children("[data-id]:first").each(function() {
                    $('.LRADMS_iframe[data-id="' + $(this).data('id') + '"]').show();
                    $(this).addClass("active");
                });
                $('.page-tabs-content').css("margin-left", "0");
            });
            $('.tabCloseOther').on('click', $.learuntab.closeOtherTabs);
            $('.fullscreen').on('click', function() {
                if (!$(this).attr('fullscreen')) {
                    $(this).attr('fullscreen', 'true');
                    $.learuntab.requestFullScreen();
                } else {
                    $(this).removeAttr('fullscreen')
                    $.learuntab.exitFullscreen();
                }
            });

            //登出账号事件绑定
            $('#loginOut').on('click', $.learunindex.loginOut);
        }
    };
    $.learunindex = {
        load: function() {
            $("body").removeClass("hold-transition");
            $("#content-wrapper").find('.mainContent').height($(window).height() - 100);
            $(window).resize(function(e) {
                $("#content-wrapper").find('.mainContent').height($(window).height() - 100);
            });
            $(".sidebar-toggle").click(function() {
                if (!$("body").hasClass("sidebar-collapse")) {
                    $("body").addClass("sidebar-collapse");
                } else {
                    $("body").removeClass("sidebar-collapse");
                }
            })
            $(window).load(function() {
                window.setTimeout(function() {
                    $('#ajax-loader').fadeOut();
                }, 300);
            });
        },
        jsonWhere: function(data, action) {
            if (action == null) return;
            var reval = new Array();
            $(data).each(function(i, v) {
                if (action(v)) {
                    reval.push(v);
                }
            });
            return reval;
        },
        //----loginOut-----
        //登录和权限控制
        //清除用户登录缓存
        loginOut: function() {
            var successFunc = function(data) {
                    if (data.status == 'success') {
                        // setTimeout(function() {
                            // TODO $.alert()未起作用
                            $.alert('success', '退出成功，正在跳转至登录页面...');
                            alert('安全退出！');
                            window.location.href = 'login.html';
                        // }, 2000);
                    }
                },
                failFunc = function(err) {
                    alert('网络繁忙！');
                };

            $.ajaxAction(defaultConfig.domain + defaultConfig.project + '/login/logout.htm', '', successFunc, failFunc);
        },
        //----authorityControl-----
        //对登录的人进行权限控制，自动调用
        authorityControl: function() {
            var self = this,
                successFunc = function(data) {
                if (data.status != 'success') {
                    alert(data.message);
                    window.location.href = 'login.html';
                }
                else {
                    $.savePermission(data.object);
                    self.renderMenu();
                    $('.username').text($.getCookie('username'));
                }
            },
                failFunc = function(err) {
                    alert('网络繁忙！');
            };

            $.ajaxAction('/login/autho.htm', '', successFunc, failFunc);
        },
        renderMenu: function() {
            /* 根据权限，渲染对应的菜单、子菜单 */
            var menuList  = permissionList.menuList,
                menuCount = menuList.length,

                subMenuList  = permissionList.subMenuList,
                subMenuCount = subMenuList.length;
            /* 菜单级 */
            for (var i = 0; i < menuCount; i ++) {
                if ($.checkPermission(menuList[i])) {
                    $('[data-menuName="' + menuList[i] + '"]').removeClass('hidden');
                }
                else {
                    $('[data-menuName="' + menuList[i] + '"]').remove();
                }
            }
            /* 子菜单级 */
            for (var j = 0; j < subMenuCount; j ++) {
                var item = subMenuList[j].split(':');
                if (!$.checkPermission(item[0], item[1])) {
                     $('[data-subMenuName="' + subMenuList[j] + '"]').remove();
                }
            }
        },
        //-----animateMenu-----
        //点击菜单动画效果
        animateMenu: function() {
            $("#sidebar-menu li a").click(function() {
                var d = $(this),
                    e = d.next();
                if (e.is(".treeview-menu") && e.is(":visible")) {
                    e.slideUp(500, function() {
                            e.removeClass("menu-open")
                        }),
                        e.parent("li").removeClass("active")
                } else if (e.is(".treeview-menu") && !e.is(":visible")) {
                    var f = d.parents("ul").first(),
                        g = f.find("ul:visible").slideUp(500);
                    g.removeClass("menu-open");
                    var h = d.parent("li");
                    e.slideDown(500, function() {
                        e.addClass("menu-open"),
                            f.find("li.active").removeClass("active"),
                            h.addClass("active");

                        var _height1 = $(window).height() - $("#sidebar-menu >li.active").position().top - 41;
                        var _height2 = $("#sidebar-menu li > ul.menu-open").height() + 10
                        if (_height2 > _height1) {
                            $("#sidebar-menu >li > ul.menu-open").css({
                                overflow: "auto",
                                height: _height1
                            });
                        }
                    });
                }
                e.is(".treeview-menu");
            });
        }
    };
    $(function() {
        $.learunindex.load();
        $.learunindex.authorityControl();
        $.learunindex.animateMenu();
        $.learuntab.init();
    });
})(jQuery);


/* 路由方法，用于页面跳转 */
var router = {
    /* load方法的后一个参数设置为true，表示忽略缓存，强制重新页面 */
    linkTo: function(target) {
        $.router.load(target + '?' + Date.parse(new Date()), true); 
        $(document).on('pageRemoved', function() {
            this.setPage();
        })
    },
    /* setPage方法，用于页面跳转（路由方法跳转）后，对新的页面进行初始化；或者直接引用，初始化当前页面 */
    setPage: function(parameter) {
        var tempObj = $('.page').attr('id'),
            pageList = {
                'indexPage': business.indexPage,
                'loanFormPage': business.loanFormPage,
                'userInfoPage': business.userInfoPage,
                'editUserPage': business.editUserPage,

                'customerInfoPage': business.customerInfoPage,
                'editCustomerPage': business.editCustomerPage
            };
        
        $('.popup-overlay').remove();
        // if (!$.getCookie('VODKA_MERCHANT_USER_SESSION_ID')) {
        //     $.toast('登录状态已过期，请重新登陆', 1000);
        //     return false;
        // }
        pageList[tempObj].init();
    }
}

/* export，使路由方法全局可用 */
window.router = router;
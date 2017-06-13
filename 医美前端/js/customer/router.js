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
        var tempObj  = $('.page').attr('id'),
            pageList = {
                'indexPage'           : customer.indexPage,
                'loanFormPage'        : customer.loanFormPage,
                'orderDetailPage'     : customer.orderDetailPage,
                'repayBillPerPage'    : customer.repayBillPerPage,
                'repayRecordPage'     : customer.repayRecordPage,
                'repayDetailPage'     : customer.repayDetailPage,
                'repayBillAllPage'    : customer.repayBillAllPage,
                'userInfoPage'        : customer.userInfoPage,
                'editUserPage'        : customer.editUserPage,
                'loanPage'            : customer.loanPage,
                'orderPage'           : customer.orderPage,
                'orderDetailPage'     : customer.orderDetailPage,
                'creditManagementPage': customer.creditManagementPage,
                'realInfoPage'        : customer.realInfoPage,
                'realMobilePage'      : realMobilePage, 
                'realIdimgPage'       : realIdimgPage, 
                'realBankcardPage'    : realBankcardPage, 
                'creditMobilePage'    : customer.creditMobilePage
            };
        
        $('.popup-overlay').remove();
        // if (!$.getCookie('VODKA_OBTAIN_USER_SESSION_ID')) {
        //     $.toast('登录状态已过期，请重新登陆', 1000);
        //     return false;
        // }
        pageList[tempObj].init();
    }
}

/* export，使路由方法全局可用 */
window.router = router;
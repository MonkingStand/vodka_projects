/* 路由方法，用于页面跳转 */
var router = {
    /* load方法的后一个参数设置为true，表示忽略缓存，强制重新页面 */
    linkTo: function(target) {
        $.router.load(target, false);
        $(document).on('pageRemoved', function() {
            this.setPage();
        })
    },
    /* setPage方法，用于页面跳转（路由方法跳转）后，对新的页面进行初始化；或者直接引用，初始化当前页面 */
    setPage: function(parameter) {
        var tempObj  = $('.page').attr('id'),
            pageList = {
                'loginPage'                 : insurance.loginPage,
                'loginWechatPage'           : insurance.loginWechatPage,
                'registerPage'              : insurance.registerPage,
                'newInsuranceInfoPage'      : insurance.newInsuranceInfoPage,
                'newInsuranceTypePage'      : insurance.newInsuranceTypePage,
                'newInsurancePricePage'     : insurance.newInsurancePricePage,
                'newInsuranceSubmitPage'    : insurance.newInsuranceSubmitPage,
                'newInsuranceInstalmentPage': insurance.newInsuranceInstalmentPage,
                'newInsurancePayPage'       : insurance.newInsurancePayPage,

                'userInfoPage'          : insurance.userInfoPage,
                'userInfoEditPage'      : insurance.userInfoEditPage,
                'creditMobileStatusPage': insurance.creditMobileStatusPage,
                'creditMobilePage'      : insurance.creditMobilePage,
                'orderListPage'         : insurance.orderListPage,
                'orderDetailPage'       : insurance.orderDetailPage,
                'orderDetailConfirmPage': insurance.orderDetailConfirmPage,

                'repayRecordPage' : repayRecordPage,
                'repayBillPerPage': repayBillPerPage,
                'repayDetailPage' : repayDetailPage,

                'instalmentSuccessPage': instalmentSuccessPage,

                'waitPage'        : insurance.waitPage,
                'policyNoWaitPage': insurance.policyNoWaitPage,
                'successPage'     : insurance.successPage
            };
        
        $('.popup-overlay').remove();
        pageList[tempObj].init();
    }
}

/* export，使路由方法全局可用 */
window.router = router;
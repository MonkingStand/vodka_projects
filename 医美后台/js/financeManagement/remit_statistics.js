/*
 *  财务管理模块——头寸状态
 *  remit_statistics.html
 */
(function($) {
    var pageObj = {
        init: function() {
            this.domListener();
            this.pluginInit();
        },
        domListener: function() {
            var self = this; 

            /* 头寸信息概览、应收情况、实收情况、头寸统计图表box隐藏、显示 */
            $('.toggle-link').on('click', function() {
                var targetSelector = $(this).attr('data-target'),
                    $thisIcon      = $(this).find('.fa'),
                    $target        = $(targetSelector);
                
                if ($(this).hasClass('expanded')) {
                    $(this).removeClass('expanded');
                    $thisIcon.removeClass('fa-caret-down').addClass('fa-caret-right');
                }
                else {
                    $(this).addClass('expanded');
                    $thisIcon.removeClass('fa-caret-right').addClass('fa-caret-down');
                }
                $target.stop().slideToggle();
            });

            /* 筛选按钮切换 */
            $('.filter-item .filter-options .btn:not(.customer-btn)').on('click', function() {
                var $thisItem = $(this).closest('.filter-item');
                if (!$(this).hasClass('active')) {
                    $thisItem.find('.active.btn').removeClass('active');
                    $(this).addClass('active');
                }
                $thisItem.find('.customer-btn').text('自定义时段');
            });

            /* 隐藏、显示筛选条件 */
            $('.toggle-btn').on('click',function() {
                var $thisIcon  = $(this).find('.fa'),
                    $thisText  = $(this).find('.toggle-text'),
                    $filterBox = $(this).closest('.filter-container').find('.filter-box');
                
                if ($thisIcon.hasClass('fa-angle-up')) {
                    $filterBox.stop().slideToggle();
                    $thisIcon.removeClass('fa-angle-up').addClass('fa-angle-down');
                    $thisText.text('展开筛选条件');
                }
                else {
                    $filterBox.stop().slideToggle();
                    $thisIcon.removeClass('fa-angle-down').addClass('fa-angle-up');
                    $thisText.text('收起筛选条件');
                }
            });

            /* 自定义时段 */
            $('.picker-modal .confirm-btn').on('click', function() {
                var $pickerModal  = $(this).closest('.picker-modal'),
                    targetModalId = $pickerModal.attr('id'),
                    $targetBtn    = $('.btn[data-target="#' + targetModalId + '"]'),
                    $targetFilter = $targetBtn.closest('.filter-item'),
                    startTime     = $pickerModal.find('.start-time').val(),
                    endTime       = $pickerModal.find('.end-time').val();
                
                if (startTime == endTime) {
                    $.alert('danger', '起止时间不能相同！');
                }
                else if (startTime > endTime) {
                    $.alert('danger', '开始时间不能大于结束时间！');
                }
                else {
                    $targetFilter.find('.btn.active').removeClass('active');
                    $targetBtn.attr({
                        'data-start': startTime,
                        'data-end'  : endTime
                    }).addClass('active').text(startTime + ' ~ ' + endTime);
                    $pickerModal.modal('hide');
                }
            });
        },
        pluginInit: function() {
            /* 时间选择插件初始化 */
            $(".form_datetime").datetimepicker({
                format   : 'yyyy-mm-dd',
                language : 'zh-CN',
                autoclose: true,
                minView  : 'month'
            });
        }
    };

    pageObj.init();
})(jQuery)
/*
 *  APP管理模块--banner图管理
 *  app_banner.html
 */
(function($) {
    var pageObj = {
        init: function() {
            this.domListener();
        },
        domListener: function() {
            var self = this;

            $('.upload-container .img-input').on('change', function(e) {
                var files = e.target.files;
                self.imgPreview(files);
                $('.operate-container .btn-save').removeClass('click-ban');
            });

            $('.operate-container .btn-save').on('click', function() {
                self.postImg();
            });
        },
        imgPreview: function(files) {
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

                $('.img-container .tmp-upload').remove();
                $('.img-container').removeClass('not-uploaded');
                $('.img-container').append(img);
            }
        },
        postImg: function() {
            var successFunc = function(data) {
                    console.log(data);
                },
                failFunc = function(err) {
                    $.alert('danger', '网络繁忙，请稍后重试！');
                },
				fileData = new FormData(document.getElementById('bannerImg'));
                console.log(fileData);
            $.ajaxFileAction(defaultConfig.domain + defaultConfig.project + '/ossUtil/uploadFile.htm', fileData, successFunc, failFunc);
        }
    };

    pageObj.init();
})(jQuery);
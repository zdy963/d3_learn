// 保存svg到图片
d3.select('#save').on('click', function () {
    var svgString = getSVGString(svg.node());
    svgString2Image(svgString, width, height, 'jpg', save); // passes Blob and filesize String to the callback

    function save(dataBlob, filesize) {
        saveAs(dataBlob, '企业关联关系图.jpg'); // FileSaver.js function
    }
});


// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
function getSVGString(svgNode) {
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
    var cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);

    var serializer = new XMLSerializer();
    var svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

    return svgString;

    function getCSSStyles(parentElement) {
        var selectorTextArr = [];

        // Add Parent element Id and Classes to the list
        selectorTextArr.push('#' + parentElement.id);
        for (var c = 0; c < parentElement.classList.length; c++)
            if (!contains('.' + parentElement.classList[c], selectorTextArr))
                selectorTextArr.push('.' + parentElement.classList[c]);

        // Add Children element Ids and Classes to the list
        var nodes = parentElement.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].id;
            if (!contains('#' + id, selectorTextArr))
                selectorTextArr.push('#' + id);

            var classes = nodes[i].classList;
            for (var c = 0; c < classes.length; c++)
                if (!contains('.' + classes[c], selectorTextArr))
                    selectorTextArr.push('.' + classes[c]);
        }

        // Extract CSS Rules
        var extractedCSSText = "";
        for (var i = 0; i < document.styleSheets.length; i++) {
            var s = document.styleSheets[i];

            try {
                if (!s.cssRules) continue;
            } catch (e) {
                if (e.name !== 'SecurityError') throw e; // for Firefox
                continue;
            }

            var cssRules = s.cssRules;
            for (var r = 0; r < cssRules.length; r++) {
                if (contains(cssRules[r].selectorText, selectorTextArr))
                    extractedCSSText += cssRules[r].cssText;
            }
        }


        return extractedCSSText;

        function contains(str, arr) {
            return arr.indexOf(str) === -1 ? false : true;
        }

    }

    function appendCSS(cssText, element) {
        var styleElement = document.createElement("style");
        styleElement.setAttribute("type", "text/css");
        styleElement.innerHTML = cssText;
        var refNode = element.hasChildNodes() ? element.children[0] : null;
        element.insertBefore(styleElement, refNode);
    }
}

function svgString2Image(svgString, width, height, format, callback) {
    var format = format ? format : 'jpg';

    var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL

    var canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    var image = new Image();
    image.onload = function () {
        context.clearRect ( 0, 0, width, height );
        context.drawImage(image, 0, 0, width, height);

        // 对图片进行裁切，切除多余的空白部分
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height).data;
        var lOffset = canvas.width,
            rOffset = 0,
            tOffset = canvas.height,
            bOffset = 0;

        for (let i = 0; i < canvas.width; i+=20) {
            for (let j = 0; j < canvas.height; j+=20) {
                var pos = (i + canvas.width * j) * 4;
                if (imgData[pos] == 255 || imgData[pos + 1] == 255 || imgData[pos + 2] == 255 || imgData[pos + 3] == 255) {
                    bOffset = Math.max(j, bOffset); // 找到有色彩的最下端
                    rOffset = Math.max(i, rOffset); // 找到有色彩的最右端
                    tOffset = Math.min(j, tOffset); // 找到有色彩的最上端
                    lOffset = Math.min(i, lOffset); // 找到有色彩的最左端
                }
            }
        }
        lOffset++;
        rOffset++;
        tOffset++;
        bOffset++;

        let canvas2 = document.createElement("canvas"),
            context2 = canvas2.getContext("2d");
        canvas2.width = rOffset-lOffset+160;
        canvas2.height = bOffset-tOffset+160;
        context2.fillStyle = '#FFFFFF';
        context2.fillRect(0, 0, canvas2.width, canvas2.height);
        context2.drawImage(image, lOffset-80, tOffset-80, canvas2.width, canvas2.height,
            0, 0, canvas2.width, canvas2.height);

        // 到处图片到Blob（我也不知道是什么其实
        canvas2.toBlob(function (blob) {
            var filesize = Math.round(blob.length / 1024) + ' KB';
            if (callback) callback(blob, filesize);
        });
    };

    image.src = imgsrc;
}
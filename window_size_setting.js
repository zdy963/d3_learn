// 设定窗口大小
function settingwh() {
    let height = $(window).height();
    let width = $(window).width();
    $(".chart").width(width * 0.8 - 20)
        .height(height-26);
    $(".input_blank").width(width * 0.19)
        .height(height-20);
    console.log()
}

function getRange() {
    let range = $("#range").val() / 100;
    cor_rescale = range * Math.abs(range) * 100 + 3;
    console.log(cor_rescale);
    update()
}

// 窗口大小自适应
window.onload = function () {
    settingwh()
};
$(window).resize(function () {
    settingwh()
});

// 单击空白处取消高亮选中结点
$(document).on("click", function (d) {
    if (d.target.nodeName === "svg") {
        $(".node, .link, .node_text, .link_text, g")
            .attr("opacity", 1)
    }
});
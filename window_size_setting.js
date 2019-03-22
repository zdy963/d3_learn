// 设定窗口大小
function settingwh() {
    let height = $(window).height();
    let width = $(window).width();
    $(".chart").width(width * 0.8 - 20)
        .height(height);
    $(".input_blank").width(width * 0.19)
        .height(height);
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

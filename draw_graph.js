var width = 10000,
    height = 10000,
    radius = 35,
    parallelDistance = 12,
    font_size = 12,
    cor_rescale = 3,
    origin_scale = 3,
    node_stoke = 10,
    link_stoke = 3,
    root;

var force = d3.layout.force()
    .size([width, height])
    .linkDistance(function (d) {
        let node_degree = Math.max(d.target.degree, d.source.degree);
        let base_dis = 1 / node_degree;
        let base_var = Math.sqrt(node_degree*1.8) * (Math.random());
        // console.log("degree",node_degree);
        if(d.source.type === d.target.type){
            return radius * 5 * base_dis
        } else {
            // console.log("diff");
            return radius * (3 + base_var + 3 * base_dis)
        }
    })
    .chargeDistance(1500)
    .charge(-200)
    .gravity(0.02)
    .on("tick", tick)
    .on("end", tick);    // tick一下完成所有结点的初始化

// update();

$("#zoom").on("click", function () {
    cor_rescale = cor_rescale + 1;
    update()
});
$("#zoomout").on("click", function () {
    cor_rescale = cor_rescale - 1;
    update();
});
$("#start_force").on("click", function () {
    force.resume();
    console.log("Starting force layout");
    // force.stop()
});


// 提交json文本
// 注意，此处可能出现因浏览器不同而产生的无法工作的情况
// 建议使用Chrome进行作业
function submit_json() {
    var text = $("textarea").val();
    root = JSON.parse(text);

    // window.location.reload();
    d3.select('.chart svg').remove();

    svg = d3.select(".chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);
    container = svg.append('g');
    element = container.append('g');

    link = element.selectAll(".link");
    node = element.selectAll(".node");
    node_text = element.selectAll(".node_text");
    link_text = element.selectAll(".link_text");

    cor_rescale = origin_scale;
    // 更新结点信息
    update();

    // svg居中展示
    let svg1 = $("svg")[0];
    $(".chart").scrollLeft(svg1.clientWidth / 2 - 500)
        .scrollTop(svg1.clientHeight / 2 - 500)
}

// 更新svg信息
function update() {

    // 初始化结点及边
    var nodes = root.nodes,
        links = root.links;

    // 设定结点位置
    nodes = initNodes(nodes);

    // 对边进行归类标注，连接同二结点的多条边
    let data = linkCount(links,nodes);
    links = data[0];
    nodes = data[1];


    // 启动force layout
    force
        .nodes(nodes)
        .links(links)
        .start();

    // 自定义拖拽函数
    var node_drag = d3.behavior.drag()
        .origin(function (d) { return d })
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    // 自定义缩放
    var zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scaleExtent([0.1, 10])    // 缩放比例范围
        .scale(1)                // 缩放比例大小，默认值1
        .on("zoom", zoomed);    // 缩放事件发生时执行zoomed();

    // 调用zoom
    svg.call(zoom);

    // 重置缩放
    d3.select('#reset').on('click', function () {
        svg.call(zoom.translate([0, 0]).scale(1).event);
    });

    // 绘制边
    link = link.data(links);
    link.exit().remove();
    link.enter()
        .append("path")
        .attr("class", "link")
        .attr("stroke-width",link_stoke)
        .attr("stroke",function (d) { return d.color ? d.color : "#9ecae1"; })
        .attr("marker-end", function (d, i) {
            var arrowMarker = svg.append("marker")
                .attr("id", "arrow" + i)
                .attr("markerUnits", "userSpaceOnUse")
                .attr("markerWidth", "16")
                .attr("markerHeight", "15")
                .attr("viewBox", "0 0 10 10")
                .attr("refX", radius*0.9)
                .attr("refY", 6)
                .attr("orient", "auto")
                .append("svg:path")
                .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2")
                .attr("fill", function () { return d.color ? d.color : "#9ecae1"; });

            return "url(#arrow" + i + ")";
        });


    // 在链上写结点间的关系
    link_text = link_text.data(links);
    link_text.exit().remove();
    link_text.enter()
        .append("svg:g")
        .attr("fill-opacity", 1);
    // 增加文本
    link_text.append("svg:text")
        .attr("class", "link_text")
        .attr("font-size", font_size)
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none")
        .attr("dominant-baseline", "middle")
        .text(function (d) { return d.relation });
    // 增加背景白块
    link_text.insert('rect', 'text')
        .attr('width', function (d) { return d.relation.length * font_size })
        .attr('height', function (d) { return font_size })
        .attr("y", "-.5em")
        .attr('x', function (d) { return -d.relation.length * font_size / 2 })
        .style('fill', '#FFFFFF');


    // 绘制结点
    node = node.data(nodes, function (d) { return d.id });
    node.exit().remove();
    node.enter()
        .append("circle")
        .attr("class", "node")
        .attr("stroke-width", node_stoke)
        .attr("stroke", color)
        .attr("stroke-opacity", 0.6)
        .attr("cx", function (d) { return d.x })    // cx define the x-axis of a center point
        .attr("cy", function (d) { return d.y })    // cy define the y-axis ..
        .attr("r", radius + "px")   // define the radius
        .style("fill", color)
        .on("click", click)
        .call(node_drag);


    // 在结点上写名字
    node_text = node_text.data(nodes);
    node_text.exit().remove();
    node_text.enter()
        .append("text")
        .attr("class", "node_text")
        .attr("font-size", font_size)
        // .attr("text-anchor", "middle")  // 使文本水平居中而非左对齐
        .attr("dominant-baseline", "middle")
        .attr("pointer-events", "none")
        .attr("x", function (d) { return d.x })
        .attr("y", function (d) { return d.y })
        .attr("x", function (d) {
            if (d.name.length <= 5) {
                d3.select(this).append('tspan')
                    .attr("dx", -d.name.length * font_size / 2)
                    .text(d.name);
            } else if (d.name.length > 5 && d.name.length < 10) {
                d3.select(this).append('tspan')
                    .attr("dx", -font_size * 2.5)
                    .attr("dy", -font_size * 0.5)
                    .text(d.name.substring(0, 5));

                d3.select(this).append('tspan')
                    .attr("dx", -d.name.length * font_size / 2)
                    .attr("dy", font_size + 4)
                    .text(d.name.substring(5, d.name.length));
            } else {
                let name;
                if (d.name.length > 13) {
                    name = d.name.substring(0, 11) + "...";
                } else name = d.name;

                d3.select(this).append('tspan')
                    .attr("dx", -font_size * 2)
                    .attr("dy", -font_size)
                    .text(name.substring(0, 4));

                d3.select(this).append('tspan')
                    .attr("dx", -font_size * 4.5)
                    .attr("dy", font_size - 2 + 4)
                    .text(name.substring(4, 9));

                d3.select(this).append('tspan')
                    .attr("dx", -font_size * (2.5 + (name.length - 9) / 2))
                    .attr("dy", font_size - 2 + 4)
                    .text(name.substring(9, name.length));
            }
        });


    // 完成绘制自动停止force layout以保证结点位置与设定位置相同
    force.stop()
}

// 使结点位置可动的关键代码
function tick() {
    // 允许两点间多条连线
    link.attr("d", function (d) {
        return multiLinks(d)
    });
    node.attr("cx", function (d) {
        return d.x;
    })
        .attr("cy", function (d) {
            return d.y;
        });

    link_text
        .attr("transform", function (d) {   // 方向转至与连线相同
            return "translate(" + (d.x_start + d.x_end) / 2 + "," + (d.y_start + d.y_end) / 2 + ")" // 移动文字至连线中间
                + " rotate(" + Math.atan((d.y_end - d.y_start) / (d.x_end - d.x_start)) * 180 / Math.PI + ")";  // 旋转文字与连线方向一致
        });

    node_text.attr("x", function (d) {
        return d.x
    })
        .attr("y", function (d) {
            return d.y
        })
}

// 结点上色
function color(d) {
    // colors: 3182bd: dark blue, c6dbef: light blue, fd8d3c: orange
    let fill_color;
    if (d.hasOwnProperty("color")){
        fill_color = d.color;
    } else {
        switch (d.type) {
            case 0:     // central node
                fill_color = "#C6DBEF";
                break;
            case 2:     // person
                fill_color = "#FD8D3C";
                break;
            case 1:     // company
                fill_color = "#3182DB";
                break;
        }
    }

    d.color = fill_color;
    return fill_color;
}

// 边上色
function links_color(d) {
    // colors: 3182bd: dark blue, c6dbef: light blue, fd8d3c: orange
    let fill_color;
    console.log(d);
    if (d.hasOwnProperty("color")){
        fill_color = d.color;
    } else {
        switch (d.source.type) {
            case 0:     // central node
                fill_color = "#C6DBEF";
                break;
            case 2:     // person
                fill_color = "#FD8D3C";
                break;
            case 1:     // company
                fill_color = "#3182DB";
                break;
        }
    }

    d.color = fill_color;
    return fill_color;
}

// 点击结点时淡化不相邻的点及边
function click(d) {
    var thisNode = d.id;
    var connected = root.links.filter(function (e) {
        return e.source.id === thisNode || e.target.id === thisNode
    });

    node.attr("opacity", function (d) {
        return (connected.map(d => d.source.id).indexOf(d.id) > -1 ||
            connected.map(d => d.target.id).indexOf(d.id) > -1) ? 1 : 0.1
    });

    node_text
        .attr("cx", function (d) {
            return d.x;
        })
        .attr("cy", function (d) {
            return d.y;
        })
        .attr("opacity", function (d) {
            return (connected.map(d => d.source.id).indexOf(d.id) > -1 ||
                connected.map(d => d.target.id).indexOf(d.id) > -1) ? 1 : 0.3
        });

    link.attr("opacity", function (d) {
        return (d.source.id == thisNode || d.target.id == thisNode) ? 1 : 0.1
    });

    link_text.attr("opacity", function (d) {
        return (d.source.id == thisNode || d.target.id == thisNode) ? 1 : 0.08
    })
}

// 给link排序，先按source 再按target
function sortLinks(links) {
    if(links[0].source.hasOwnProperty("id")) {
        links.sort(function (a, b) {
            if (a.source.id > b.source.id) {
                return 1;
            } else if (a.source.id < b.source.id) {
                return -1;
            } else {
                if (a.target.id > b.target.id) {
                    return 1;
                }
                if (a.target.id < b.target.id) {
                    return -1;
                } else {
                    return 0;
                }
            }
        });
    } else {
        links.sort(function (a, b) {
            if (a.source > b.source) {
                return 1;
            } else if (a.source < b.source) {
                return -1;
            } else {
                if (a.target > b.target) {
                    return 1;
                }
                if (a.target < b.target) {
                    return -1;
                } else {
                    return 0;
                }
            }
        });
    }
    return links;
}

// 标注边的数量
function linkCount(links,nodes) {
    links = sortLinks(links);
    if(links[0].source.hasOwnProperty("id")){
        for (let i = 0; i < links.length; i++) {
            // 连接计数
            if (i != 0 && links[i].source.id == links[i - 1].source.id &&
                links[i].target.id == links[i - 1].target.id) {
                links[i].linknum = links[i - 1].linknum + 1;
            } else {
                // 统计结点的度 对于同源同根只计作一个
                nodes[links[i].target.id].degree += 1;
                nodes[links[i].source.id].degree += 1;
                links[i].linknum = 0;
                if (i > 1 && links[i - 1].linknum > 0) {
                    // 更新上群结点信息
                    let mid_num = (links[i - 1].linknum) / 2;
                    let ir = links[i - 1].linknum + 1;
                    for (let j = 0; j < ir; j++) {
                        links[i - 1 - j].linknum = mid_num - j
                    }
                }
            }
        }
    }
    else {
        for (let i = 0; i < links.length; i++) {
            // 连接计数
            if (i != 0 && links[i].source == links[i - 1].source &&
                links[i].target == links[i - 1].target) {
                links[i].linknum = links[i - 1].linknum + 1;
            } else {
                // 统计结点的度 对于同源同根只计作一个
                nodes[links[i].target].degree += 1;
                nodes[links[i].source].degree += 1;
                links[i].linknum = 0;
                if (i > 1 && links[i - 1].linknum > 0) {
                    // 更新上群结点信息
                    let mid_num = (links[i - 1].linknum) / 2;
                    let ir = links[i - 1].linknum + 1;
                    for (let j = 0; j < ir; j++) {
                        links[i - 1 - j].linknum = mid_num - j
                    }
                }
            }
        }
    }

    if (links[links.length - 1].linknum > 0) {
        let mid_num = (links[links.length - 1].linknum) / 2;
        let ir = links[links.length - 1].linknum + 1;
        for (let j = 0; j <= ir; j++) {
            links[links.length - 1 - j].linknum = mid_num - j;
        }
    }
    return [links,nodes]
}

// 多条links --采用线段间距离
function multiLinks(d) {
    if (d.linknum === 0) {
        d.minRadius = radius;
        // 保存起止坐标，用于改变文字方向
        d.x_start = d.source.x;
        d.y_start = d.source.y;
        d.x_end = d.target.x;
        d.y_end = d.target.y;
        return 'M' + d.source.x + ' ' + d.source.y
            + ' L ' + d.target.x + ' ' + d.target.y;
    } else {
        // x0,y0为起点坐标，x1,y1为终点坐标，x2,y2为所求点坐标
        let x0 = d.source.x,
            y0 = d.source.y,
            x1 = d.target.x,
            y1 = d.target.y,
            x1_x0 = x1 - x0,
            y1_y0 = y1 - y0,
            x2_x0, y2_y0;

        // 更新收尾坐标，减去半径
        d.minRadius = Math.sqrt(radius * radius - parallelDistance * parallelDistance);

        if (y1_y0 === 0) {
            x2_x0 = 0;
            y2_y0 = parallelDistance;
        } else {
            let angle = Math.atan((x1_x0) / (y1_y0));
            x2_x0 = -parallelDistance * Math.cos(angle);
            y2_y0 = parallelDistance * Math.sin(angle);
        }
        // 计算平行线起止点坐标
        let xs = x2_x0 * d.linknum + x0,
            ys = y2_y0 * d.linknum + y0,
            xt = x2_x0 * d.linknum + x1,
            yt = y2_y0 * d.linknum + y1;

        // 保存起止坐标，用于改变文字方向
        d.x_start = xs;
        d.y_start = ys;
        d.x_end = xt;
        d.y_end = yt;

        return 'M' + xs + ' ' + ys + ' L ' + xt + ' ' + yt;
    }
}

// 初始化结点位置
function initNodes(nodes) {
    nodes.forEach(function (d, i) {
        d.x = d.nodey * cor_rescale + width /2;
        d.y = d.nodex * cor_rescale + height / 2;
        // 初始化结点的度
        d.degree = 0;
    });
    return nodes
}

// 自定义拖拽函数
function dragstart(d, i) {
    event.stopPropagation();
}

function dragmove(d, i) {
    d.px += d3.event.dx;
    d.py += d3.event.dy;
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    tick(); // this is the key to make it work together with updating both px,py,x,y on d !
}

function dragend(d, i) {
    d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
    tick();
}

// 自定义缩放函数
function zoomed() {
    event.stopPropagation();
    container.attr(
        "transform",
        "translate(" + d3.event.translate + ") " +
        "scale(" + d3.event.scale + ")"
    );
}
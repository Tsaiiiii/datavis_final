let abFilter = 25

let scatterLeft = 0, scatterTop = 0;
let scatterMargin = {top: 10, right: 30, bottom: 30, left: 60},
    scatterWidth = 500 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 500 - scatterMargin.top - scatterMargin.bottom;

let distrLeft = 500, distrTop = 0;
let distrMargin = {top: 10, right: 30, bottom: 30, left: 60},
    distrWidth = 500 - distrMargin.left - distrMargin.right,
    distrHeight = 500 - distrMargin.top - distrMargin.bottom;

let teamLeft = 0, teamTop = 520;
let teamMargin = {top: 10, right: 30, bottom: 30, left: 60},
    teamWidth = 1000 - teamMargin.left - teamMargin.right,
    teamHeight = 200 - teamMargin.top - teamMargin.bottom;

var svg = d3.select("svg");

// 散點圖區域
var scatterGroup = svg.append("g")
    .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

// 柱狀圖區域
var barGroup = svg.append("g")
    .attr("transform", `translate(${teamMargin.left},${teamMargin.top+scatterHeight+50})`);

// 分佈圖區域
var distributionGroup = svg.append("g")
    .attr("transform", `translate(${scatterWidth+distrMargin.left+70},${distrMargin.top})`);

let playerData;

d3.csv("players.csv").then(rawData =>{
    rawData.forEach(d => {
        d.AB = Number(d.AB);
        d.H = Number(d.H);
        d.SO = Number(d.SO);
        d.salary = Number(d.salary);
    });

    console.log("rawData", rawData);

    let filteredData = rawData.filter(d => d.AB > abFilter);

    console.log("filteredData", filteredData);

    playerData = filteredData.map(d => ({
        name: d.nameFirst+ ' ' +d.nameLast,
        H_AB: d.H / d.AB,
        SO_AB: d.SO / d.AB,
        salary: d.salary,
        teamID: d.teamID
    }));

    drawScatterPlot(playerData);
    drawDistributionPlot(playerData);
    drawBarChart(playerData);
    
}).catch(function(error){
    console.log(error);
});

let selectedData;

// 畫散點圖
function drawScatterPlot(data) {
    var x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.H_AB)])
        .rangeRound([0, scatterWidth]);
    var y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.SO_AB)])
        .rangeRound([scatterHeight, 0]);

    scatterGroup.append("g")
        .attr("transform", `translate(0,${scatterHeight})`)
        .call(d3.axisBottom(x));
    scatterGroup.append("g")
        .call(d3.axisLeft(y));

    scatterGroup.append("text")
        .attr("x", scatterWidth/2)
        .attr("y", 500)
        .attr("class", "axis-label")
        .text("H/AB");
    scatterGroup.append("text")
        .attr("x", -scatterHeight/2)
        .attr("y", -40)
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .text("SO/AB");

    // 定義 Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "5px")
        .style("border-radius", "4px")
        .style("opacity", 0)
        .style("pointer-events", "none");

    // 定義 Brush
    const brush = d3.brush()
        .extent([[0, 0], [scatterWidth, scatterHeight]])
        .on("brush", brushed)
        .on("end", endBrushed);

    scatterGroup.append("g")
        .attr("class", "brush")
        .call(brush);

    // 繪製散點 (放置在更高層級以避免被 Brush 覆蓋)
    // const pointsGroup = scatterGroup.append("g")
    //     .attr("class", "points");

    scatterGroup.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.H_AB))
        .attr("cy", d => y(d.SO_AB))
        .attr("r", 3)
        // .style("fill", "#B399FF")
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`
                    ${d.teamID}<br>
                    ${d.name}<br>
                    <strong>Salary:</strong> ${d.salary}
                `);
        })
        .on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            tooltip.style("opacity", 0);
            // d3.select(this).style("fill", "#B399FF");
        });

    // Brush 交互行為
    function brushed(event) {
        const extent = event.selection;

        // 如果用戶未選擇範圍，清除選中
        if (!extent) {
            scatterGroup.selectAll("circle").classed("selected_scatter", false);
            return;
        }

        // 根據範圍篩選選中點
        selectedData = data.filter(d =>
            x(d.H_AB) >= extent[0][0] &&
            x(d.H_AB) <= extent[1][0] &&
            y(d.SO_AB) >= extent[0][1] &&
            y(d.SO_AB) <= extent[1][1]
        );

        scatterGroup.selectAll("circle")
        .classed("selected_scatter", d =>
            selectedData.includes(d)
        );

        // 更新分布圖
        drawDistributionPlot(selectedData);
        drawBarChart(selectedData);
    }

    function endBrushed(event) {
        if (!event.selection) {
            scatterGroup.selectAll("circle").classed("selected_scatter", false);
        }
    }
}

let isFirstRender = true; // 用來標記是否是第一次渲染

function drawBarChart(selectedData) {
    let teamCounts = d3.rollup(playerData, v => v.length, d => d.teamID);
    let selectedTeamCounts = d3.rollup(selectedData, v => v.length, d => d.teamID);

    // Convert teamCounts and selectedTeamCounts to arrays
    let teamData = Array.from(teamCounts, ([teamID, count]) => ({ teamID, count }));
    let selectedTeamData = Array.from(selectedTeamCounts, ([teamID, count]) => ({ teamID, count }));

    // Create a combined array with default count of 0 for missing teams in selectedTeamData
    teamData.forEach(d => {
        d.selectedCount = selectedTeamCounts.get(d.teamID) || 0; // Add selectedCount property
    });

    // First render: Sort alphabetically by teamID
    if (isFirstRender) {
        teamData.sort((a, b) => d3.ascending(a.teamID, b.teamID));
        isFirstRender = false; // Set flag to false after the first render
    } else {
        // Subsequent render: Sort by selectedCount (descending) and then by total count (descending)
        teamData.sort((a, b) => b.selectedCount - a.selectedCount || b.count - a.count);
    }

    // Create scales
    let x = d3.scaleBand()
        .domain(teamData.map(d => d.teamID)) // Team IDs for the x-axis
        .range([0, teamWidth])
        .padding(0.1); // Add padding between bars

    let y = d3.scaleLinear()
        .domain([0, d3.max(teamData, d => d.count)]) // Max number of players
        .range([teamHeight, 0]);

    // Clear previous content
    barGroup.selectAll("*").remove();

    // Add x-axis
    barGroup.append("g")
        .attr("transform", `translate(0, ${teamHeight})`)
        .call(d3.axisBottom(x));

    // Add y-axis
    barGroup.append("g")
        .call(d3.axisLeft(y));

    // Add axis labels
    barGroup.append("text")
        .attr("x", teamWidth / 2)
        .attr("y", teamHeight + 40)
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .text("Team");

    barGroup.append("text")
        .attr("x", -teamHeight / 2)
        .attr("y", -40)
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Number of Players");

    // Draw bars for all data (background layer)
    barGroup.selectAll(".bar-all")
        .data(teamData)
        .enter()
        .append("rect")
        .attr("class", "bar-all")
        .attr("x", d => x(d.teamID))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => teamHeight - y(d.count))
        .attr("fill", "lightblue")
        .attr("opacity", 0.5)
        .attr("stroke", "black")  // 添加邊框顏色
        .attr("stroke-width", 2); // 設定邊框寬度

    // Draw bars for selected data (highlight layer)
    barGroup.selectAll(".bar-selected")
        .data(teamData.filter(d => d.selectedCount > 0)) // Only include teams with selected data
        .enter()
        .append("rect")
        .attr("class", "bar-selected")
        .attr("x", d => x(d.teamID))
        .attr("y", d => y(d.selectedCount))
        .attr("width", x.bandwidth())
        .attr("height", d => teamHeight - y(d.selectedCount))
        .attr("fill", "steelblue")
        .attr("opacity", 0.8)
        .attr("stroke", "black")  // 添加邊框顏色
        .attr("stroke-width", 2); // 設定邊框寬度
}

function drawDistributionPlot(selectedData) {
    // 清除舊的內容
    distributionGroup.selectAll("*").remove();

    let x = d3.scaleLinear()
        .domain([d3.min(playerData, d => d.salary), d3.max(playerData, d => d.salary)]) // 強制從 0 開始
        .range([0, distrWidth]);

    let histogram = d3.histogram()
        .value(d => d.salary)
        .domain(x.domain())
        .thresholds(x.ticks(20));

    // 計算所有數據的分布
    let allBins = histogram(playerData);
    let selectedBins = histogram(selectedData);

    // 縱軸的比例尺，確保包含所有數據和選中數據
    let y = d3.scaleLinear()
        .domain([0, d3.max(allBins, d => d.length)]) // 最大值來自所有數據
        .range([distrHeight, 0]);

    // 添加坐標軸
    distributionGroup.append("g")
        .attr("transform", `translate(0,${distrHeight})`)
        // .call(d3.axisBottom(x));
        .call(d3.axisBottom(x).ticks(6)); // 指定 x 軸有 10 個刻度
    distributionGroup.append("g")
        .call(d3.axisLeft(y));

    // 繪製所有數據的分布（背景分布）
    distributionGroup.append("path")
        .datum(allBins)
        .attr("fill", "lightblue")
        .attr("opacity", 0.5)
        .attr("d", d3.area()
            .x(d => x((d.x0 + d.x1) / 2))
            .y0(distrHeight)
            .y1(d => y(d.length))
            .curve(d3.curveMonotoneX))
        .attr("stroke", "grey")  // 添加邊框顏色
        .attr("stroke-width", 2); // 設定邊框寬度

    // 繪製選中數據的分布（前景分布）
    distributionGroup.append("path")
        .datum(selectedBins)
        .attr("fill", "#F08080")
        .attr("opacity", 0.8)
        .attr("d", d3.area()
            .x(d => x((d.x0 + d.x1) / 2))
            .y0(distrHeight)
            .y1(d => y(d.length))
            .curve(d3.curveMonotoneX))
        .attr("stroke", "#CD5C5C")  // 添加邊框顏色
        .attr("stroke-width", 2); // 設定邊框寬度

    // 初始化分布圖 brush
    let brush = d3.brushX()
        .extent([[0, 0], [distrWidth, distrHeight]]) // 限制在分布圖範圍內
        .on("brush", brushedOnDistribution)
        .on("end", endBrushedOnDistribution);

    distributionGroup.append("g")
        .attr("class", "brush")
        .call(brush);

    // 分布圖 brush 回調函數
    function brushedOnDistribution(event) {
        const extent = event.selection;

        if (!extent) return; // 沒有範圍時不執行任何操作

        // 根據選中範圍過濾數據
        const selectedData = playerData.filter(d => {
            const salary = d.salary; // 假設數據包含薪水字段
            return salary >= x.invert(extent[0]) && salary <= x.invert(extent[1]);
        });

        // 高亮散佈圖中選中的點
        scatterGroup.selectAll("circle")
            .classed("selected_distr", d => selectedData.includes(d));
    }

    function endBrushedOnDistribution(event) {
        if (!event.selection) {
            // 清除選中
            scatterGroup.selectAll("circle").classed("selected_distr", false);
        }
    }
}


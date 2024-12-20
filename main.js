let causeLeft = 10, causeTop = 5;
let causeMargin = {top: 15, right: 30, bottom: 30, left: 60},
    causeWidth = 830 - causeMargin.left - causeMargin.right,
    causeHeight = 270 - causeMargin.top - causeMargin.bottom;

let mapLeft = 1050, mapTop = 0;
let mapMargin = {top: 10, right: 30, bottom: 30, left: 60},
    mapWidth = 550 - mapMargin.left - mapMargin.right,
    mapHeight = 480 - mapMargin.top - mapMargin.bottom;

let mortaLeft = 380, mortaTop = 260;
let mortaMargin = {top: 10, right: 30, bottom: 30, left: 60},
    mortaWidth = 680 - mortaMargin.left - mortaMargin.right,
    mortaHeight = 260 - mortaMargin.top - mortaMargin.bottom;

let caLeft = 0, caTop = 480;
let caMargin = {top: 10, right: 30, bottom: 30, left: 60},
    caWidth = 600 - caMargin.left - caMargin.right,
    caHeight = 310 - caMargin.top - caMargin.bottom;

let demorLeft = 820, demorTop = 520;
let demorMargin = {top: 10, right: 30, bottom: 30, left: 60},
    demorWidth = 810 - demorMargin.left - demorMargin.right,
    demorHeight = 260 - demorMargin.top - demorMargin.bottom;

Promise.all([
    d3.csv("mortality.csv"),
    d3.csv("demogr.csv"),
    d3.csv("cancer.csv"),
    d3.csv("cause.csv"),
    d3.csv("city.csv")
    ]).then(function([mortalityData, demogrData, cancerData, causeData, cityData]) {
        console.log(mortalityData);
        console.log(demogrData);
        console.log(cancerData);
        console.log(causeData);
        console.log(cityData);
    

        //==============mortality chart=============
        //mortality.csv char to int
        let mortaData = mortalityData.map(year => {
            year.ND = Number(year.ND);
            year.RDpHT = Number(year.RDpHT);
            return year;
        });

        console.log("mortaData", mortaData);

       // create mortality bar chart
       let mortasvg = d3.select("body")
       .append("svg")
       .attr("width", mortaWidth + mortaMargin.left + mortaMargin.right)
       .attr("height", mortaHeight + mortaMargin.top + mortaMargin.bottom)
       .style("position", "absolute")
       .style("left", `${mortaLeft}px`)
       .style("top", `${mortaTop}px`);

       //morta x 
        let mortaxScale = d3.scaleBand()
            .domain(mortaData.map(d => d.year.toString())) 
            .range([0, mortaWidth])
            .padding(0.4); // 柱子間距控制柱子寬度

        mortasvg.append("g")
            .attr("transform", `translate(${mortaMargin.left},${mortaHeight + mortaMargin.top/2})`)
            .call(d3.axisBottom(mortaxScale));

        mortasvg.append("text")
            .attr("transform", `translate(${mortaWidth / 2 + mortaMargin.left},${mortaHeight + mortaMargin.top +25})`)
            .style("text-anchor", "middle")
            .text("Year");

        //morta y
        let mortayScale = d3.scaleLinear()
            .domain([0, d3.max(mortaData, d => d.ND)])
            .range([mortaHeight, 0]);

        mortasvg.append("g")
            .attr("transform", `translate(${mortaMargin.left},${mortaMargin.top/2})`)
            .call(d3.axisLeft(mortayScale));

        mortasvg.append("text")
            .attr("transform", `rotate(-90)`)
            .attr("y", mortaMargin.left -49)
            .attr("x", -(mortaHeight/2+ mortaMargin.top))
            .style("text-anchor", "middle")
            .style("font-size", "15px")
            .text("Number of Deaths");

        //morta bar
        mortasvg.selectAll(".bar")
            .data(mortaData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => mortaxScale(d.year)+60)
            .attr("y", d => mortayScale(d.ND)+4)
            .attr("width", mortaxScale.bandwidth())
            .attr("height", d => mortaHeight - mortayScale(d.ND))
            .attr("fill", "#f5d176");
        
        //morta line - y scale
        let mortay2Scale = d3.scaleLinear()
        .domain([0, d3.max(mortaData, d => d.RDpHT)])
        .range([mortaHeight, 0]);

        mortasvg.append("g")
        .attr("transform", `translate(${mortaWidth + mortaMargin.left},${mortaMargin.top/2})`) 
        .call(d3.axisRight(mortay2Scale));

        mortasvg.append("text")
        .attr("transform", `translate(${mortaWidth / 2+30}, ${demorHeight / 2 -90})`)       
        .style("text-anchor", "middle")
        .style("fill", "#278f73")
        .text("Mortality Rate per Ten Thousand Population");

        // morta line - draw line
        let line = d3.line()
        .x(d => mortaxScale(d.year) + 60 + mortaxScale.bandwidth() / 2) 
        .y(d => mortay2Scale(d.RDpHT) +3); 

        mortasvg.append("path")
        .datum(mortaData)
        .attr("fill", "none")
        .attr("stroke", "#278f73") // line color
        .attr("stroke-width", 2)
        .attr("d", line);

        mortasvg.selectAll(".dot")
        .data(mortaData)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("cx", d => mortaxScale(d.year) + 60 + mortaxScale.bandwidth() / 2)
        .attr("cy", d => mortay2Scale(d.RDpHT) +3)
        .attr("r", 3)
        .attr("fill", "#278f73"); //point color

        //morta brush funciton
        let brush = d3.brushX()
            .extent([[mortaMargin.left, mortaMargin.top / 2], [mortaWidth + mortaMargin.left, mortaHeight + mortaMargin.top / 2]])
            .on("brush end", brushed);

        let brushGroup = mortasvg.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed(event) {
            if (!event.selection) return;

            const [x0, x1] = event.selection;

            const selectedYears = mortaData.filter(d => {
                const x = mortaxScale(d.year) + mortaMargin.left + mortaxScale.bandwidth() / 2;
                return x >= x0 && x <= x1;
            }).map(d => d.year)

            console.log("Selected Years:", selectedYears)
            
            updatePieChart(selectedYears);//update donut pie chart
            updatePopulationPyramid(selectedYears); // update demogr bar chart
            updateBarChart(selectedYears);
            updateMap(selectedYears);
        }

        // ========donut pie chart=================
        let casvg = d3.select("body")
        .append("svg")
        .attr("width", caWidth + caMargin.left + caMargin.right)
        .attr("height", caHeight + caMargin.top + caMargin.bottom)
        .style("position", "absolute")
        .style("left", `${caLeft}px`)
        .style("top", `${caTop}px`);

        let pie = d3.pie().value(d => d.ND); 
        let colorScale = d3.scaleOrdinal(d3.schemeCategory10); // 顏色比例尺

        function updatePieChart(selectedYears) {
            let filteredData = cancerData.filter(d => selectedYears.includes(d.year)); 
            
            // total number of deaths from cancer
            let totalDeaths = d3.sum(filteredData, d => d.ND);
                    
            // ratio of each cancer type
            let cancerAgg = d3.rollups(
                filteredData,
                v => d3.sum(v, d => d.ND / d.pop), 
                d => d.ca 
            );
        
            // top ten cancer type
            cancerAgg.sort((a, b) => b[1] - a[1]);
            let topTenCancer = cancerAgg.slice(0, 10);
        
            let total = d3.sum(topTenCancer, d => d[1]);
            let pieData = topTenCancer.map(d => ({ ca: d[0], ND: d[1] / total * 100 }));
        
            casvg.selectAll("*").remove();//clean pie chart
        
            // conut chart - arc
            let arc = d3.arc()
                .innerRadius(Math.min(caWidth, caHeight) / 1.9) 
                .outerRadius(Math.min(caWidth, caHeight) / 3.8); 

            const cancerColorMap = {
                "lc": "#4e79a7",       // Lung Cancer 藍
                "liverc": "#f28e2b",   // Liver Cancer 橘
                "crc": "#e15759",      // Colon Cancer 紅
                "brc": "#76b7b2",      // Breast Cancer 藍綠
                "prc": "#59a14f",      // Prostate Cancer 綠
                "orc": "#edc948",      // Oral Cancer 黃
                "panc": "#b07aa1",     // Pancreatic Cancer 紫
                "gasc": "#ff9da7",     // Gastric Cancer 粉
                "esoc": "#9c755f",     // Esophageal Cancer 棕
                "ovac": "#bab0ac"      // Ovarian Cancer 灰
                };
        
            // draw pie
            let g = casvg.append("g")
                .attr("transform", `translate(${caWidth / 2 + caMargin.left  - 75},${caHeight / 2 + caMargin.top})`);
        
            g.selectAll("path")
                .data(pie(pieData))
                .enter()
                .append("path")
                .attr("d", arc) 
                .attr("fill", d =>  cancerColorMap[d.data.ca] || "#cccccc") // color map with cancer type
                .attr("stroke", "#fff")  
                .style("stroke-width", "1px");

            // percent text
            g.selectAll("text.percent")
                .data(pie(pieData))
                .enter()
                .append("text")
                .attr("class", "percent")
                .attr("transform", d => `translate(${arc.centroid(d)})`)
                .style("text-anchor", "middle")
                .style("font-size", "14px")
                .style("fill", "#fff") // 白色
                .text(d => `${d3.format(".1f")(d.data.ND)}%`);
        
            const cancerNameMap = {
                "lc": "Lung cancer",
                "liverc": "Liver, bile duct cancer",
                "crc": "Colon, rectum, anus cancer",
                "brc": "Breast cancer",
                "prc": "Prostate cancer",
                "orc": "Oral cancer",
                "panc": "Pancreatic cancer",
                "gasc": "Gastric cancer",
                "esoc": "Esophageal cancer",
                "ovac": "Ovarian cancer",
                "uterc": "Cervical, uterine cancer"
            };

            // labels beside donut chart
            let legend = casvg.append("g")
            .attr("transform", `translate(${caWidth + caMargin.left - 160},${caMargin.top+40})`);

            legend.selectAll("rect")
                .data(pieData)
                .enter()
                .append("rect")
                .attr("x", 0)
                .attr("y", (d, i) => i * 20) // space between each label
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", d => cancerColorMap[d.ca] || "#cccccc");

            legend.selectAll("text")
                .data(pieData)
                .enter()
                .append("text")
                .attr("x", 20)
                .attr("y", (d, i) => i * 20 + 10) // align with rect
                .style("font-size", "14px")
                .style("fill", "#333")
                .text(d => cancerNameMap[d.ca] || d.ca); // convert abbreviation to full name
            

            // Central text of donut chart
            g.append("text")
            .attr("class", "center-text")
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#db3b3e")
            .attr("y", -20)
            .text("Deaths ");

            g.append("text")
            .attr("class", "center-text")
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("fill", "#db3b3e")
            .attr("y", -6)
            .text("from Cancer:");

            g.append("text")
            .attr("class", "center-value")
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "#e15759")
            .attr("y", 20)
            .text(d3.format(",")(totalDeaths));
        }

        //==========demogr bar chart=================
        let demorsvg = d3.select("body")
            .append("svg")
            .attr("width", demorWidth + demorMargin.left + demorMargin.right)
            .attr("height", demorHeight + demorMargin.top + demorMargin.bottom)
            .style("position", "absolute")
            .style("left", `${demorLeft}px`)
            .style("top", `${demorTop}px`);
        
        function updatePopulationPyramid(selectedYears) {
        let filteredData = demogrData.filter(d => selectedYears.includes(d.year));
        
        console.log("filteredData for demor",filteredData);

        let above80Data = filteredData.filter(d => d.age === "above80");

        // 計算選取年份區間各年齡區間男性與女性的總人口數與死亡率
        let ageData = d3.rollups(
            filteredData,
            v => ({
                popM: d3.sum(v, d => d.popM),
                popF: d3.sum(v, d => d.popF),
                rateM: d3.sum(v, d => d.NDM) / d3.sum(v, d => d.popM) * 100000,
                rateF: d3.sum(v, d => d.NDF) / d3.sum(v, d => d.popF) * 100000
            }),
            d => d.age
        ).map(([age, values]) => ({ age, ...values }));

        console.log("Aggregated Age Data:", ageData);

        demorsvg.selectAll("*").remove();

        // demogr x, y scale
        // y scale
        let yScale = d3.scaleBand()
        .domain(ageData.map(d => d.age).reverse())
        .range([0, demorHeight])
        .padding(0.1);

        // x scale
        let xScaleM = d3.scaleLinear()
            .domain([0, 6000]) 
            .range([demorWidth / 2, demorMargin.left]);

        let xScaleF = d3.scaleLinear()
            .domain([0, 6000]) 
            .range([demorWidth / 2, demorWidth - demorMargin.right]);

        // Male x-axis
        demorsvg.append("g")
            .attr("transform", `translate(0, ${demorHeight})`)
            .call(d3.axisBottom(xScaleM)
                .tickValues([0, 1000, 2000, 3000, 4000])
                .tickFormat(d => d)); 

        // Female x-axis
        demorsvg.append("g")
            .attr("transform", `translate(0, ${demorHeight})`)
            .call(d3.axisBottom(xScaleF)
                .tickValues([0, 1000, 2000, 3000])
                .tickFormat(d => d)); 

        demorsvg.append("g")
        .attr("transform", `translate(${demorMargin.left-1.5}, ${demorMargin.top/2-5})`)
        .call(d3.axisLeft(yScale))

        //demo - male bar chart
        demorsvg.selectAll(".barM")
            .data(ageData)
            .enter()    
            .append("rect")
            .attr("class", "barM")
            .attr("x", d=> {
                if(d.age === "above80"){
                    return xScaleM(0) - Math.abs(xScaleM(0) - xScaleM(d.rateM)) * 0.45; // 中心向左
                }else{
                    return Math.min(xScaleM(0), xScaleM(d.rateM))
                }
            })
            .attr("y", d => yScale(d.age))
            .attr("width", d => {
                if (d.age === "above80") {
                    return Math.abs(xScaleM(0) - xScaleM(d.rateM))*0.45
                } else {
                    return Math.abs(xScaleM(0) - xScaleM(d.rateM))
                }
            }) 
            .attr("height", yScale.bandwidth())
            .attr("fill", "#5a7546");
        
        // Broken bar on "above80" Male
        demorsvg.selectAll(".whitebarM")
        .data(ageData.filter(d => d.age === "above80")) 
        .enter()
        .append("polygon")
        .attr("class", "whitebarM")
        .attr("points", d => {
            const y = yScale(d.age)
            const height = yScale.bandwidth()
            const xStart = xScaleM(4200)
            const xEnd = xScaleM(4300)
            const offset = -10 // Offset for the slanted edges

            // Define the points of the whitebar
            return [
                [xStart - offset, y],               // Top-left
                [xEnd - offset, y],                 // Top-right
                [xEnd + offset, y + height],        // Bottom-right
                [xStart + offset, y + height]       // Bottom-left
            ].map(point => point.join(",")).join(" "); // Convert to SVG point format
        })
        .attr("fill", "white");

        // demo - female bar chart
        demorsvg.selectAll(".barF")
            .data(ageData)
            .enter()
            .append("rect")
            .attr("class", "barF")
            .attr("x", d => Math.min(xScaleF(0), xScaleF(d.rateF))) 
            .attr("y", d => yScale(d.age))
            //.attr("width", d => Math.abs(xScaleF(0) - xScaleF(d.rateF)))
            .attr("width", d => {
                if (d.age === "above80") {
                    return Math.abs(xScaleF(0) - xScaleF(d.rateF))*0.45
                } else {
                    return Math.abs(xScaleF(0) - xScaleF(d.rateF))
                }
            }) 
            .attr("height", yScale.bandwidth())
            .attr("fill", "#e37575");

        //Broken bar on "above80" Female
        demorsvg.selectAll(".whitebarF")
        .data(ageData.filter(d => d.age === "above80"))
        .enter()
        .append("polygon")
        .attr("class", "whitebarF")
        .attr("points", d => {
            const y = yScale(d.age);
            const height = yScale.bandwidth() 
            const xStart = xScaleF(3200) 
            const xEnd = xScaleF(3300) 
            const offset = 10 

            // Define the points of the whitebar
            return [
                [xStart + offset, y],               // Top-left
                [xEnd + offset, y],                 // Top-right
                [xEnd - offset, y + height],        // Bottom-right
                [xStart - offset, y + height]       // Bottom-left
            ].map(point => point.join(",")).join(" "); // Convert to SVG point format
        })
        .attr("fill", "white");

        //bar lable Male
        const maxDomain = xScaleM.domain()[1]

        demorsvg.selectAll(".labelM")
            .data(ageData)
            .enter()
            .append("text")
            .attr("class", "labelM")
            .attr("x", d => {
                return d.rateM > maxDomain ? xScaleM(maxDomain) +2 : xScaleM(d.rateM) - 8;
            })
            .attr("y", d => yScale(d.age) + yScale.bandwidth() / 2) 
            .attr("dy", ".35em") 
            .style("text-anchor", d => (d.rateM > maxDomain ? "start" : "end")) 
            .style("fill", "black") 
            .style("font-size", "10px")
            .text(d => d.rateM.toFixed(2))

        //bar lable Female
        const maxDomainF = xScaleF.domain()[1]

        demorsvg.selectAll(".labelF")
            .data(ageData)
            .enter()
            .append("text")
            .attr("class", "labelF")
            .attr("x", d => {
                return d.rateF > maxDomainF ? xScaleF(maxDomainF) -100 : xScaleF(d.rateF) + 5;
            })
            .attr("y", d => yScale(d.age) + yScale.bandwidth() / 2) 
            .attr("dy", ".35em") 
            .style("text-anchor", d => (d.rateF > maxDomainF ? "start" : "start")) 
            .style("fill","black")
            .style("font-size", "10px")
            .text(d => d.rateF.toFixed(2))
                
        //lable
        demorsvg.append("text")
            .attr("transform", `translate(${demorWidth / 2}, ${demorHeight + 30})`)
            .style("text-anchor", "middle")
            .text("Death Rate per Ten Thousand Population");

        demorsvg.append("text")
            .attr("transform", `rotate(-90)`)
            .attr("y", demorMargin.left -49)
            .attr("x", -(demorHeight/2+ demorMargin.top))
            .style("text-anchor", "middle")
            .text("Age layer");

        demorsvg.append("text")
            .attr("transform", `translate(${(demorWidth) / 4}, ${demorHeight - 30})`)
            .style("text-anchor", "middle")
            .text("Male");

        demorsvg.append("text")
            .attr("transform", `translate(${3* (demorWidth) / 4}, ${demorHeight - 30})`)
            .style("text-anchor", "middle")
            .text("Female");
        }

        //==========causes bar chart=================

        let cau_svg = d3.select("body")
        .append("svg")
        .attr("width", causeWidth + causeMargin.left + causeMargin.right)
        .attr("height", causeHeight + causeMargin.top + causeMargin.bottom+90)
        .style("position", "absolute")
        .style("left", `${causeLeft}px`)
        .style("top", `${causeTop}px`);

        function updateBarChart(selectedYears) {
            let filteredData = causeData.filter(d => selectedYears.includes(d.year)); 
                    
            // calculate mortality (per 100,000 people)
            let causeAgg = d3.rollups(
                filteredData,
                v => d3.sum(v, d => d.death_count) / d3.sum(v, d => d.population) * 100000,
                d => d.cause 
            );
        
            // top ten causes 
            causeAgg.sort((a, b) => b[1] - a[1]);
            let topTenCause = causeAgg.slice(0, 10);

            let maxRate = d3.max(topTenCause, d => d[1]);

            cau_svg.selectAll("*").remove(); 

            const causeNameMap = {
                "mn": "Malignant neoplasm",
                "hd": "Heart disease (except Hypertension)",
                "pn": "Pneumonia",
                "cd": "Cerebrovascular diseases",
                "dm": "Diabetes mellitus",
                "co": "COVID-19",
                "hy": "Hypertension",
                "ai": "Accident injuries",
                "clrd": "Chronic lower respiratory diseases",
                "nnsn": "Nephritis, Nephrotic syndrome and Nephropathy",
                "cldc": "Chronic liver disease and cirrhosis"
            };
        
            // 設定比例尺
            let xScale = d3.scaleBand()
                .domain(topTenCause.map(d => d[0]))
                .range([causeMargin.left, causeWidth - causeMargin.right])
                .padding(0.2);

            let yScale = d3.scaleLinear()
                .domain([0, maxRate])
                .nice()
                .range([causeHeight - causeMargin.bottom, causeMargin.top]);

            // 畫柱狀圖
            cau_svg.append("g")
                .attr("transform", `translate(0,${causeHeight - causeMargin.bottom})`)
                .call(d3.axisBottom(xScale).tickFormat(d => causeNameMap[d] || d))
                .selectAll("text")
                .each(function(d) {
                    const text = d3.select(this);
                    const lines = (causeNameMap[d] || d).split(" "); // 使用空格分隔成多行
                    text.text(null); // 清空原文字
                    lines.forEach((line, i) => {
                        text.append("tspan")
                            .attr("x", 0)
                            .attr("dy", i === 0 ? "0.5em" : "0.9em") // 第一行保持原位，後續行相對偏移
                            .text(line);
                    });
                });

            // X軸標籤
            cau_svg.append("text")
                .attr("x", causeWidth / 2) // X 軸中央
                .attr("y", causeHeight + causeMargin.bottom-5) // 稍微向下偏移
                .attr("text-anchor", "middle") // 置中對齊
                .style("fill", "#333")
                .text("Top Ten Causes of Death");

            // X軸標籤
            cau_svg.append("text")
                .attr("x", causeWidth-110) // X 軸中央
                .attr("y", causeMargin.top) // 稍微向下偏移
                .attr("text-anchor", "middle") // 置中對齊
                .style("font-size", "12px")
                .style("fill", "#333")
                .text("(per Ten Thousand Population)");

            cau_svg.append("g")
                .attr("transform", `translate(${causeMargin.left},0)`)
                .call(d3.axisLeft(yScale).tickFormat(d3.format(".2f")));

            // Y軸標籤
            cau_svg.append("text")
                .attr("transform", `rotate(-90)`) // 文字旋轉90度
                .attr("x", 0 - (causeHeight / 2)) // Y 軸居中
                .attr("y", causeMargin.left-45) // 向左偏移，增加與Y軸的距離
                .attr("text-anchor", "middle") // 文字置中
                .style("fill", "#333")
                .text("Mortality Rates");

            cau_svg.selectAll(".bar")
                .data(topTenCause)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", d => xScale(d[0]))
                .attr("y", d => yScale(d[1]))
                .attr("width", xScale.bandwidth())
                .attr("height", d => causeHeight - causeMargin.bottom - yScale(d[1]))
                .attr("fill", "#5a7546");

            // 加入標籤
            cau_svg.selectAll(".label")
                .data(topTenCause)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("x", d => xScale(d[0]) + xScale.bandwidth() / 2)
                .attr("y", d => yScale(d[1]) - 5)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "#333")
                .text(d => d3.format(".2f")(d[1]));
        }

        //==========morality map=================

        const map_svg = d3.select("#map-container").append("svg")
            .attr("width", mapWidth + mapMargin.left + mapMargin.right)
            .attr("height", mapHeight + mapMargin.top + mapMargin.bottom)
            .style("position", "absolute")
            .style("left", `${mapLeft}px`)
            .style("top", `${mapTop-30}px`);

        const projection = d3.geoMercator()
            .center([121, 24.5]) // 台灣中心點
            .scale(5000) // 縮放比例
            .translate([(mapWidth + mapMargin.left) / 2, (mapHeight + mapMargin.top) / 2]);

        const path = d3.geoPath().projection(projection);

        // 提供顏色比例尺
        let colorMap = d3.scaleQuantize()
            .range(d3.schemeBlues[5]);

        // Function to update the map based on the selected year
        function updateMap(selectedYears) {
            let filteredData = cityData.filter(d => selectedYears.includes(d.year));

            // Calculate standardized mortality rates
            let morAgg = d3.rollups(
                filteredData,
                v => {
                    // 計算總死亡率
                    const totalMortality = d3.sum(v, d => d.death_count_total) / d3.sum(v, d => d.population_total) * 100000;

                    // 計算男性死亡率
                    const maleMortality = d3.sum(v, d => d.death_count_male) / d3.sum(v, d => d.population_male) * 100000;

                    // 計算女性死亡率
                    const femaleMortality = d3.sum(v, d => d.death_count_female) / d3.sum(v, d => d.population_female) * 100000;

                    return {
                        total: totalMortality,
                        male: maleMortality,
                        female: femaleMortality
                    };
                },
                d => d.cityeng
            );
            
            // Convert data to a lookup map for easier access
            let mortalityMap = new Map(morAgg);

            // 計算總死亡率的範圍，並更新 colorMap 的 domain
            const mortalityRates = Array.from(mortalityMap.values()).map(d => d.total);
            const maxMortality = d3.max(mortalityRates);
            const minMortality = d3.min(mortalityRates);

            colorMap.domain([minMortality, maxMortality]);

            const tooltip = d3.select(".tooltip");

            // Load Taiwan GeoJSON data
            d3.json("COUNTY_MOI_1130718.json").then(data => {
                // 使用 TopoJSON 轉換為 GeoJSON
                const geoData = topojson.feature(data, data.objects["COUNTY_MOI_1130718"]);

                map_svg.selectAll("path").remove(); // 清空原有地圖

                const paths = map_svg.selectAll("path").data(geoData.features);

                paths.enter()
                    .append("path")
                    .attr("d", path)
                    .attr("fill", d => {
                        const city = d.properties.COUNTYENG;
                        const mortality = mortalityMap.get(city);
                        return mortality ? colorMap(mortality.total) : "#ccc"; // 使用總死亡率進行著色
                    })
                    .attr("stroke", "#333")
                    .on("mouseover", function (event, d) {
                        const city = d.properties.COUNTYENG;
                        const mortality = mortalityMap.get(city);

                        // 檢查 mortality 是否存在，避免未找到資料時出錯
                        if (mortality) {
                            tooltip
                                .style("opacity", 1)
                                .html(`
                                    <strong>${city}</strong><br>
                                    Total mortality rate: ${mortality.total.toFixed(2)}<br>
                                    Male mortality rate: ${mortality.male.toFixed(2)}<br>
                                    Female mortality rate: ${mortality.female.toFixed(2)}
                                `)
                                .style("left", `${event.pageX + 10}px`)
                                .style("top", `${event.pageY + 10}px`);
                        } else {
                            tooltip
                                .style("opacity", 1)
                                .html(`<strong>${city}</strong><br>No data available`)
                                .style("left", `${event.pageX + 10}px`)
                                .style("top", `${event.pageY + 10}px`);
                        }
                    })
                    .on("mousemove", function (event) {
                        tooltip
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY + 10}px`);
                    })
                    .on("mouseout", function () {
                        tooltip.style("opacity", 0);
                    });
                // 添加顏色比例尺 (Legend)
                addColorLegend(minMortality, maxMortality);
            });
        }

        // Function to add color legend
        function addColorLegend(min, max) {
            const legendWidth = 150, legendHeight = 20;

            // 移除舊的 Legend 和 defs，避免重複
            map_svg.select(".legend").remove();
            map_svg.select("#legend-gradient").remove();

            // 定義漸層填充
            const defs = map_svg.append("defs");
            const gradient = defs.append("linearGradient")
                .attr("id", "legend-gradient")
                .attr("x1", "0%").attr("y1", "0%")
                .attr("x2", "100%").attr("y2", "0%");

            gradient.selectAll("stop")
                .data(colorMap.range().map((color, i, arr) => {
                    return { offset: `${(i / (arr.length - 1)) * 100}%`, color: color };
                }))
                .enter()
                .append("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d => d.color);

            // 添加 Legend 群組並定位到左下角
            const legendGroup = map_svg.append("g")
                .attr("class", "legend")
                .attr("transform", `translate(${mapWidth-425}, ${mapHeight})`); // 調整位置

            // 繪製漸變色矩形
            legendGroup.append("rect")
                .attr("width", legendWidth)
                .attr("height", legendHeight)
                .style("fill", "url(#legend-gradient)")
                .attr("stroke", "#ccc");

            // 添加刻度標示
            const legendScale = d3.scaleLinear()
                .domain([min, max])
                .range([0, legendWidth]);

            legendGroup.append("g")
                .attr("transform", `translate(0, ${legendHeight})`)
                .call(d3.axisBottom(legendScale)
                    .ticks(5)
                    .tickFormat(d3.format(".0f"))
                )
                .select(".domain").remove(); // 移除刻度線的邊框
        }
  
    }).catch(function(error) {
        console.log(error);
    });
    
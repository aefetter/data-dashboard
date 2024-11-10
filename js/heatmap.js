// Dimensions
const margin = { top: 20, right: 30, bottom: 30, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const gridSize = Math.floor(width / 24); // Adjust grid size

// SVG Canvas
const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Axes Labels
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const hours = d3.range(24);

// Scales
const dayScale = d3.scaleBand().domain(days).range([0, height]).padding(0.01);
const hourScale = d3.scaleBand().domain(hours).range([0, width]).padding(0.01);

svg.append("g")
    .call(d3.axisLeft(dayScale))
    .selectAll(".tick text")
    .attr("class", "axis-label");

svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(hourScale))
    .selectAll(".tick text")
    .attr("class", "axis-label");

// Color Scale
const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, d3.max(heatmapData.values(), d => d3.max(d.values()))]);

// Flatten the heatmap data for rendering
const heatmapArray = [];
heatmapData.forEach((hourMap, day) => {
    hourMap.forEach((count, hour) => {
        heatmapArray.push({ day, hour, count });
    });
});

svg.selectAll(".heatmap-rect")
    .data(heatmapArray)
    .enter()
    .append("rect")
    .attr("x", d => hourScale(d.hour))
    .attr("y", d => dayScale(days[d.day]))
    .attr("width", hourScale.bandwidth())
    .attr("height", dayScale.bandwidth())
    .attr("class", "heatmap-rect")
    .style("fill", d => colorScale(d.count || 0));

    const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "3px");

svg.selectAll(".heatmap-rect")
    .on("mouseover", (event, d) => {
        tooltip.html(`Day: ${days[d.day]}<br>Hour: ${d.hour}<br>Count: ${d.count}`)
            .style("left", `${event.pageX + 5}px`)
            .style("top", `${event.pageY - 28}px`)
            .style("visibility", "visible");
    })
    .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
    });

    // Use D3 to load your JSON data
d3.json("data/loud-noise-chapel-hill.json").then(data => {
    // Process and draw the heatmap
});

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
const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, d3.max(noiseData.values(), d => d3.max(d.values()))]);

// Flatten the heatmap data for rendering
const heatmapArray = [];
noiseData.forEach((hourMap, day) => {
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

// Load and process the data
d3.json('data/loud-noise-chapel-hill.json').then(function(data) {
    console.log("Raw data loaded:", data);
    
    var parseDate = d3.timeParse("%Y/%m/%d %H:%M:%S+00"); // Update date format
    var noiseData = {};

    data.forEach(function(d) {
        console.log("Processing date:", d.Date_of_Occurrence);
        var date = parseDate(d.Date_of_Occurrence);
        if (!date) {
            console.warn("Failed to parse date:", d.Date_of_Occurrence);
            return;
        }
        var day = d3.timeFormat("%Y-%m-%d")(date);
        noiseData[day] = (noiseData[day] || 0) + 1;
    });

    console.log("Processed data:", noiseData);

    var years = Array.from(new Set(Object.keys(noiseData).map(function(d) {
        return new Date(d).getFullYear();
    })));

    // Populate the year selection dropdown
    d3.select("#year-select")
        .selectAll("option.year-option")
        .data(years)
        .enter()
        .append("option")
        .attr("class", "year-option")
        .attr("value", function(d) { return d; })
        .text(function(d) { return d; });

    // Draw the initial heatmap with all years
    drawCalendarHeatmap(noiseData, years);

    // Update heatmap on year selection
    d3.select("#year-select").on("change", function() {
        var selectedYear = this.value;
        if (selectedYear === "all") {
            drawCalendarHeatmap(noiseData, years);
        } else {
            var filteredData = {};
            Object.keys(noiseData).forEach(function(date) {
                if (new Date(date).getFullYear() == selectedYear) {
                    filteredData[date] = noiseData[date];
                }
            });
            drawCalendarHeatmap(filteredData, [selectedYear]);
        }
    });
});

// Heatmap drawing function
function drawCalendarHeatmap(data, years) {
    // Clear previous heatmap
    d3.select("#heatmap").selectAll("*").remove();

    var cellSize = 20;
    var width = 960;
    var height = (cellSize * 7 + 20) * years.length;

    var svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var color = d3.scaleLinear()
        .domain([0, d3.max(Object.values(data))])
        .range(["#eee", "#d73027"]);

    years.forEach(function(year, i) {
        var yearData = {};
        Object.keys(data).forEach(function(date) {
            if (new Date(date).getFullYear() == year) {
                yearData[date] = data[date];
            }
        });

        var yearGroup = svg.append("g")
            .attr("transform", "translate(40," + ((cellSize * 7 + 20) * i) + ")");

        yearGroup.append("text")
            .attr("transform", "translate(-40," + cellSize * 3.5 + ")rotate(-90)")
            .attr("text-anchor", "middle")
            .text(year);

        var days = d3.timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1));

        var rect = yearGroup.selectAll(".day")
            .data(days)
            .enter().append("rect")
            .attr("class", "day")
            .attr("width", cellSize)
            .attr("height", cellSize)
            .attr("x", function(d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
            .attr("y", function(d) { return d.getDay() * cellSize; })
            .datum(function(d) { return d3.timeFormat("%Y-%m-%d")(d); })
            .attr("fill", function(d) { return data[d] ? color(data[d]) : "#fff"; });

        rect.append("title")
            .text(function(d) { return d + ": " + (data[d] || 0) + " complaints"; });
    });

    // Add legend
    var legend = svg.append("g")
        .attr("transform", "translate(40," + (height - 50) + ")");

    var legendData = [0, 1, 2, 3, 4, 5];

    legend.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", function(d, i) { return i * 30; })
        .attr("width", 30)
        .attr("height", 10)
        .attr("fill", function(d) { return color(d); });

    legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", function(d, i) { return i * 30 + 15; })
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .text(function(d) { return d; });
}

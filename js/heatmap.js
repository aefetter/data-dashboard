const width = 960;
const height = 500;
const margin = { top: 50, right: 30, bottom: 30, left: 60 };
const cellSize = 20;

// Update color scale to Carolina blue palette
const color = d3.scaleQuantize()
    .range([
        '#ffffff',  // White
        '#edf3f7',  // Lightest Carolina blue
        '#c3d5e6',  // Light Carolina blue
        '#99b7d5',  // Medium light Carolina blue
        '#6f99c4',  // Medium Carolina blue
        '#4479B3',  // Carolina blue
        '#13294B',  // Navy blue
        '#001141'   // Darkest navy
    ]);

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute");

function initializeHeatmap(data) {
    // Parse dates correctly
    const parseDate = d3.timeParse("%Y/%m/%d %H:%M:%S+00");
    
    // Group data by date
    const dateGroups = d3.group(data, d => {
        const date = parseDate(d.Date_of_Occurrence);
        return d3.timeFormat("%Y-%m-%d")(date);
    });

    // Create full date range with zeros
    const dateExtent = d3.extent(data, d => parseDate(d.Date_of_Occurrence));
    const allDates = d3.timeDays(dateExtent[0], dateExtent[1]);
    
    // Create year groups
    const yearGroups = d3.group(allDates, d => d.getFullYear());
    
    // Setup year selector
    const yearSelect = d3.select("#year-select");
    yearSelect.selectAll("option").remove();
    
    yearSelect
        .append("option")
        .attr("value", "all")
        .text("All Years");
        
    Array.from(yearGroups.keys()).sort().forEach(year => {
        yearSelect
            .append("option")
            .attr("value", year)
            .text(year);
    });

    function updateHeatmap(selectedYear) {
        const svg = d3.select("#heatmap")
            .selectAll("svg")
            .data([null])
            .join("svg")
            .attr("width", width)
            .attr("height", height);

        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Filter data for selected year
        const filteredDates = selectedYear === "all" 
            ? allDates 
            : allDates.filter(d => d.getFullYear() === +selectedYear);

        // Create month x day matrix, so that it properly sums the count of all noise complaints
        let monthDayMatrix;
        if (selectedYear === "all") {
            // Initialize matrix
            monthDayMatrix = Array(12).fill().map(() => Array(31).fill(0));
            
            // Sum across all years for each month/day combination
            data.forEach(d => {
                const date = parseDate(d.Date_of_Occurrence);
                const month = date.getMonth();
                const day = date.getDate() - 1;
                monthDayMatrix[month][day]++;
            });
        } else {
            monthDayMatrix = Array(12).fill().map(() => Array(31).fill(0));
            
            filteredDates.forEach(date => {
                const dateStr = d3.timeFormat("%Y-%m-%d")(date);
                const count = dateGroups.get(dateStr)?.length || 0;
                monthDayMatrix[date.getMonth()][date.getDate() - 1] = count;
            });
        }

        // Update color scale
        const maxCount = d3.max(monthDayMatrix.flat());
        color.domain([0, maxCount]);

        // Create cells
        const months = d3.range(12);
        const days = d3.range(31);

        const cellWidth = (width - margin.left - margin.right) / 31;
        const cellHeight = (height - margin.top - margin.bottom) / 12;

        // Add month labels
        g.selectAll(".month-label")
            .data(months)
            .join("text")
            .attr("class", "month-label")
            .attr("x", -10)
            .attr("y", d => (d + 0.5) * cellHeight)
            .attr("text-anchor", "end")
            .attr("alignment-baseline", "middle")
            .text(d => d3.timeFormat("%b")(new Date(2000, d, 1)));

        // Add day labels
        g.selectAll(".day-label")
            .data(days)
            .join("text")
            .attr("class", "day-label")
            .attr("x", d => (d + 0.5) * cellWidth)
            .attr("y", -5)
            .attr("text-anchor", "middle")
            .text(d => d + 1);

        // Add heatmap cells
        monthDayMatrix.forEach((month, i) => {
            month.forEach((value, j) => {
                g.append("rect")
                    .attr("x", j * cellWidth)
                    .attr("y", i * cellHeight)
                    .attr("width", cellWidth - 1)
                    .attr("height", cellHeight - 1)
                    .attr("fill", color(value))
                    .on("click", function(event) {
                        // Hide any existing visible tooltip
                        tooltip.style("opacity", 0);
                        
                        tooltip
                            .style("opacity", 1)
                            .html(`${d3.timeFormat("%B")(new Date(2000, i, 1))} ${j + 1}<br/>${value} complaints`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                        
                        event.stopPropagation();
                    });
            });
        });
    }

    // Initial render and update on selection
    yearSelect.on("change", function() {
        updateHeatmap(this.value);
    });
    updateHeatmap("all");
}

// Data processing function
function processHeatmapData(data) {
    // Group complaints by date
    const dateFormat = d3.timeFormat("%Y-%m-%d");
    const counts = d3.rollup(
        data,
        v => v.length,
        d => dateFormat(new Date(d.Date_of_Occurrence))
    );
    
    return counts;
}

// Heatmap creation function
function createHeatmap(data) {
    const width = 960;
    const height = 136;
    const cellSize = 10;
    const padding = 40;

    // GitHub-style colors
    const color = d3.scaleQuantize()
        .domain([0, d3.max(Array.from(data.values()))])
        .range(['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']);

    // Create SVG
    const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${padding}, ${padding})`);
    // Create cells
    const now = new Date();
    const year = d3.timeYear(now);
    const dates = d3.timeDays(year, d3.timeYear.ceil(now));

    g.selectAll(".cell")
        .data(dates)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", d => d3.timeWeek.count(year, d) * cellSize)
        .attr("y", d => d.getDay() * cellSize)
        .attr("fill", d => {
            const key = d3.timeFormat("%Y-%m-%d")(d);
            return color(data.get(key) || 0);
        })
        .append("title")
        .text(d => {
            const key = d3.timeFormat("%Y-%m-%d")(d);
            return `${d3.timeFormat("%B %d, %Y")(d)}: ${data.get(key) || 0} complaints`;
        });

    // Add months
    const months = d3.timeMonths(year, d3.timeYear.ceil(now));
    g.selectAll(".month")
        .data(months)
        .enter()
        .append("text")
        .attr("class", "month-label")
        .attr("x", d => d3.timeWeek.count(year, d) * cellSize)
        .attr("y", -5)
        .text(d => d3.timeFormat("%b")(d));
}

// Update the data loading section
    // Create map markers
    data.forEach(function(d) {
        if (d.Latitude && d.Longitude) {
            var marker = L.marker([d.Latitude, d.Longitude])
                .bindPopup(`Date: ${d.Date_of_Occurrence}<br>Location: ${d.Street}`);
            markers.addLayer(marker);
        }
    });
    map.addLayer(markers);

    // Create heatmap
    const heatmapData = processHeatmapData(data);
    createHeatmap(heatmapData);

d3.select("body").on("click", () => {
    tooltip.style("opacity", 0);
});

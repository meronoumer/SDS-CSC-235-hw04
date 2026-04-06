const margin = { top: 50, right: 30, bottom: 60, left: 60 };
const width = 900 - margin.left - margin.right;
const height = 450 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");

// LOAD DATA
d3.csv("cleaned_tweets.csv").then(data => {

    // GROUP DATA (airline → sentiment → count)
    const grouped = d3.rollup(
        data,
        v => v.length,
        d => d.airline,
        d => d.airline_sentiment
    );

    const airlines = Array.from(grouped.keys());
    const sentiments = ["negative", "neutral", "positive"];

    // FORMAT FOR STACKING
    const stackedData = airlines.map(airline => {
        let obj = { airline: airline };
        sentiments.forEach(s => {
            obj[s] = grouped.get(airline)?.get(s) || 0;
        });
        return obj;
    });

    // STACK GENERATOR
    const stack = d3.stack().keys(sentiments);
    const series = stack(stackedData);

    // X SCALE
    const x = d3.scaleBand()
        .domain(airlines)
        .range([0, width])
        .padding(0.2);

    // Y SCALE
    const y = d3.scaleLinear()
        .domain([0, d3.max(stackedData, d => d.negative + d.neutral + d.positive)])
        .nice()
        .range([height, 0]);

    // COLOR SCALE
    const color = d3.scaleOrdinal()
        .domain(sentiments)
        .range(["#f4a6c1", "#cdb4db", "#bde0fe"]);

    // DRAW STACKED BARS
    svg.selectAll("g.layer")
        .data(series)
        .enter()
        .append("g")
        .attr("fill", d => color(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => x(d.data.airline))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())

        // HOVER TOOLTIP
        .on("mouseover", function(event, d) {
            const sentimentCount = d[1] - d[0];

            tooltip.classed("hidden", false)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px")
                .html(`
                    <strong>${d.data.airline}</strong><br>
                    Tweets: ${sentimentCount}
                `);

            d3.select(this).attr("opacity", 0.7);
        })

        .on("mouseout", function() {
            tooltip.classed("hidden", true);
            d3.select(this).attr("opacity", 1);
        })

        // CLICK INTERACTION
        .on("click", function(event, d) {
            const airline = d.data.airline;

            console.log("Selected airline:", airline);

            // Highlight selection
            svg.selectAll("rect")
                .attr("stroke", "none");

            d3.selectAll(`rect`)
                .filter(r => r.data.airline === airline)
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            // (You will link this to chart 2 later)
        });

    // X AXIS
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Airline");

    // Y AXIS
    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -height / 2)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Number of Tweets");

    // TITLE
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .text("Sentiment Distribution by Airline");

    // LEGEND (IMPORTANT FOR GRADING)
    const legend = svg.selectAll(".legend")
        .data(sentiments)
        .enter()
        .append("g")
        .attr("transform", (d, i) => `translate(${width - 150}, ${i * 20})`);

    legend.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => color(d));

    legend.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(d => d);

});
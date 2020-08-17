var regions = {
    'all': 'Gesamt',
    'BE': 'Berlin',
    'BB': 'Brandenburg',
    'BW': 'Baden-Württemberg',
    'BY': 'Bayern',
    //'HB': 'Bremen',
    'HE': 'Hessen',
    'HH': 'Hamburg',
    'MV': 'Mecklenburg-Vorpommern',
    'NI': 'Niedersachsen',
    'NW': 'Nordrhein-Westfalen',
    'RP': 'Rheinland-Pfalz',
    'SH': 'Schleswig-Holstein',
    //'SL': 'Saarland',
    'SN': 'Sachsen',
    'ST': 'Sachsen-Anhalt',
    'TH': 'Thüringen',
};
var population = {
    'all': 83166711,
    'BB': 2521893,
    'BE': 3669491,
    'BW': 11100394,
    'BY': 13124737,
    'HB': 681202,
    'HE': 6288080,
    'HH': 1847253,
    'MV': 1608138,
    'NI': 7993608,
    'NW': 17947221,
    'RP': 4093903,
    'SH': 2903773,
    'SL': 986887,
    'SN': 4071971,
    'ST': 2194782,
    'TH': 2133378,
}
var FULL_DATASET = {};

function showRegion(region) {
    $('#regionModal').modal('show');
    $('#regionModalTitle').html(regions[region]);
    $('#regionModalImage').attr('src', `data/de_${region}.png`)
};

function indicatorColor(regionJson, indicator_scope) {
    var color = "green";
    if (regionJson[indicator_scope] > 0.25) {
        // grey for 25-50 % probability
        color = "grey";
    }
    if (regionJson[indicator_scope] > 0.5) {
        // orange for 50-75 % probability
        color = "orange";
    }
    if (regionJson[indicator_scope] > 0.75) {
        // grey for >75 % probability
        color = "red";
    }
    return color;
}

function createRegionCard(region, regionTitle, json) {
    // unpack JSON information into local variables (easier for formatting)
    var last_updated = moment(json['last_updated']).locale('de').fromNow();

    var r_t = json['r_t'].toFixed(2)
    var r_t_lower = json['r_t_lower'].toFixed(2);
    var r_t_upper = json['r_t_upper'].toFixed(2);
    var rtTooltip = `Rt liegt mit 90%iger Wahrscheinlichkeit zwischen ${r_t_lower} und ${r_t_upper}`;

    var indicator = 'success';
    var indicatorMessage = `R < 1 (zu ${((1-json['r_t_threshold_probability']) * 100).toFixed(0)} %)`;
    if (json['r_t_threshold_probability'] > 0.25) {
        // grey for 25-50 % probability
        indicator = 'secondary';
        indicatorMessage = 'R < 1';
    }
    if (json['r_t_threshold_probability'] > 0.5) {
        // orange for 50-75 % probability
        indicator = 'warning';
        indicatorMessage = 'R > 1';
    }
    if (json['r_t_threshold_probability'] > 0.75) {
        // grey for >75 % probability
        indicator = 'danger';
        indicatorMessage = `R > 1 (zu ${(json['r_t_threshold_probability'] * 100).toFixed(0)} %)`;
    }
    var indicatorTooltip = `R > 1 mit ${(json['r_t_threshold_probability'] * 100).toFixed(0)} % Wahrscheinlichkeit`;

    // var active = json['active'].toFixed(0);
    // var active_lower = json['active_lower'].toFixed(0);
    // var active_upper = json['active_upper'].toFixed(0);
    //         <p class="card-text">
    //         ${active}
    //         <span class="subsup">
    //             <sub>${active_lower}</sub>
    //             <sup>${active_upper}</sup>
    //         </span>&nbsp;infektiöse Fälle
    //         </p>

    // generate the HTML markup for the region-specific card with metadata
    var html = `
    <div class="col-md-4">
        <div class="card mb-4 shadow-sm">
        <img width="100%" style="cursor: pointer;" src="data/de_${region}_thumb.png" onclick="showRegion('${region}')"></img>
        <div class="detailsLink">
            <span>Details</span>
            &#10095;
        </div>
        
        <div class="card-body">
            <label class="font-weight-bold">${regionTitle} (${region.replace("all", "Ø")})</label>
            <p class="card-text">
                <span data-toggle="tooltip" data-placement="top" title="${rtTooltip}">
                    R = ${r_t}
                    <img src="assets/interval.png" class="interval">
                    <span class="subsup">
                        <sub>${r_t_lower}</sub>
                        <sup>${r_t_upper}</sup>
                    </span>
                </span>
                <span class="badge badge-pill badge-${indicator} float-right" data-toggle="tooltip" data-placement="top" title="${indicatorTooltip}" style="margin-top: 0.3em;">
                    ${indicatorMessage}
                </span>
            </p>

            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">zuletzt aktualisiert ${last_updated}</small>
            </div>
        </div>
    </div>
    `;
    // append the region to the list
    $(`#card${region}`).replaceWith(html);
};

function getSortedObjects(scope, sort_by, indicator_scope) {
    var dlist = [];
    $.each(FULL_DATASET, function (region, regionJson) {
        dlist.push({
            "name": region.replace("all", "Ø"),
            "json": regionJson,
            "color": indicatorColor(regionJson, indicator_scope)
        });
    });
    dlist.sort(function(a,b) 
    {
        if (sort_by == "region") {
            return a.name > b.name;
        }
        return a.json[scope] - b.json[scope];
    });
    return dlist;
};

function createRankingChart(scope, sort_by, indicator_scope) {
    // sort the data BEFORE creating the ordinal x-axis!
    var dlist = getSortedObjects(scope, sort_by, indicator_scope)
    var regKeys = dlist.map(function(entry){return entry.name;});

    // specify aspect ratio from screen pixels:
    var width = 500;
    var height = 200;

    // create the chart SVG
    margin = ({top: 0, right: 5, bottom: 0, left: 5})
    var svg = d3.select("div#rankingChart").append("svg")
        .attr("viewBox", [-25, -10, width+25, height+30])
        .classed("svg-content", true);

    // create an ordinal x dimension with entries for all the regions
    var xScale = d3.scaleBand().domain(regKeys).range([margin.left, width - margin.right]);
    // and a continuous y dimension for Rt
    var yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
    var yThreshold = null;
    if (scope == "r_t"){
        yScale.domain([0, 2]);
        yThreshold = 1;
    }
    else {
        yThreshold = dlist[0].json["infections_threshold_by_100k"];
        // autoscale to include maximum upper bound and threshold*1.1
        yScale.domain([
            0,
            d3.max([
                d3.max(dlist, function(d) {return d.json[`${scope}_upper`];}),
                yThreshold * 1.1
            ])
        ]);
    }

    // draw x-axis spine
    //svg.append("g")
    //    .attr("class", "axis")
    //    .attr("transform", `translate(0,${height})`)
    //    .call(d3.axisBottom(xScale));
    // draw y-axis spine
    svg.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale))
        .attr("transform", "translate(0, -0.5)");

    // draw horizontal grid lines
    svg.selectAll("line.horizontalGrid").data(yScale.ticks(10)).enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", margin.right)
        .attr("x2", width)
        .attr("y1", function(d){ return yScale(d);})
        .attr("y2", function(d){ return yScale(d);});
    // draw threshold line
    svg.append("line")
        .attr("class", "horizontalGrid gridlineDark")
        .attr("x1", margin.right)
        .attr("x2", width)
        .attr("y1", yScale(yThreshold))
        .attr("y2", yScale(yThreshold));

    // draw uncertainty bars
    var bandwidth = xScale.bandwidth();
    var barWidth = 10;
    var bubbleWidth = 30;
    var bubbleHeight = 20;
    svg.selectAll("div")
        .data(dlist)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(entry){
            // convert the ordinal x-category to an x-coordinate
            return bandwidth/2 + xScale(entry.name) - barWidth/2;
        })
        .attr("y", function (entry) {
            return yScale(entry.json[`${scope}_upper`]);
        })
        .attr("width", barWidth)
        .attr("height", function (entry) {
            return height - yScale(entry.json[`${scope}_upper`] - entry.json[`${scope}_lower`]);
        })
        .attr("style", function (entry) {return `fill: ${entry.color}`;})
        .attr("rx", 5);

    // and add region bubbles
    svg.selectAll("div")
        .data(dlist)
        .enter().append("rect")
        .attr("class", "barBubble")
        .attr("x", function(entry){
            // convert the ordinal x-category to an x-coordinate
            return bandwidth/2 + xScale(entry.name) - bubbleWidth/2;
        })
        .attr("y", function (entry) {
            return yScale(entry.json[scope]) - bubbleHeight/2;
        })
        .attr("width", bubbleWidth)
        .attr("height", bubbleHeight)
        .attr("style", function (entry) {return `stroke: ${entry.color}`;})
        .attr("rx", 10);

    // and add region labels
    svg.selectAll("div")
        .data(dlist)
        .enter().append("text")
        .text(function(entry) {return entry.name.replace("all", "Ø");})
        .attr("class", "barLabel")
        .attr("x", function(entry){
            // convert the ordinal x-category to an x-coordinate
            return bandwidth/2 + xScale(entry.name);
        })
        .attr("y", function (entry) {
            return yScale(entry.json[scope]);
        })
        .attr("style", function (entry) {return `fill: ${entry.color}`;})
        .attr("dy", "0.35em");

};

$(document).ready(function() {
    // the region JSONs are loaded independently!
    var regionPromises = [];
    $.each(regions, function(region, regionTitle) {
        // first put in placeholders so the order is maintained!
        $("#regionCards").append(`<div id="card${region}"></div>`);
        // then fetch content to replace the placeholders (unordered callbacks!)
        regionPromises.push($.getJSON(`data/de_${region}_summary.json`, function(json) {
            FULL_DATASET[region] = json;
            createRegionCard(region, regionTitle, json);
        }));
    });

    // wait until data for all regions was loaded before creating the ranking
    $.when.apply($, regionPromises).then(function() {
        // now create the ranking chart
        createRankingChart(scope="r_t", sort_by="r_t_threshold_probability", indicator_scope="r_t_threshold_probability");
        createRankingChart(scope="infections_by_100k", sort_by="infections_by_100k", indicator_scope="r_t_threshold_probability");
    });

    // end of document-ready
});
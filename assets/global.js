var INDEX = {};
var FULL_DATASET = {};
var CURRENT_FILTER = null;
var CURRENT_SCOPE = null;


function getSortedDataObjects(filterSetting, scope, indicator_scope="r_t_threshold_probability") {
    var sort_by = scope;
    if (scope == "r_t") {
        sort_by = "r_t_threshold_probability";
    }
    var dobjects = [];
    // build list of objects according to filter settings
    $.each(INDEX, function(ca2, country) {
        $.each(country["regions"], function(r, reg){
            var region_code = reg[0];
            var region_name = reg[1];
            var region_short_name = reg[2];
            var regionJson = FULL_DATASET[`${ca2}_${region_code}`];
            if (!regionJson) return; //Skip regions for which data is not available
            // pre-compute some properties that are used in various places downstream
            var color = indicatorColor(regionJson, indicator_scope)
            if (filterSetting == "all" && region_code == "all") {
                dobjects.push({
                    "uid": `${ca2}_${region_code}`,
                    "name": flagEmoji(ca2),
                    "short_name": flagEmoji(ca2),
                    "json": regionJson,
                    "color": color
                });
            } else if (ca2 == filterSetting) {
                dobjects.push({
                    "uid": `${ca2}_${region_code}`,
                    "name": region_name.replace("all", "Ø"),
                    "short_name": region_short_name.replace("all", "Ø"),
                    "json": regionJson,
                    "color": color
                });
            }
        });
    });
    dobjects.sort(function(a,b) 
    {
        if (sort_by == "region") {
            return a.name > b.name;
        }
        return a.json[scope] - b.json[scope];
    });
    return dobjects;
};

function showRegion(country_alpha2, countryName, region, regionName, date) {
    $('#regionModal').modal('show');
    if (countryName == regionName){
        $('#regionModalTitle').html(unescape(countryName));
    }
    else {
        $('#regionModalTitle').html(`${unescape(countryName)} / ${unescape(regionName)}`);
    }
    $('#regionModalImage').attr('src', `${window.location.origin}/data/${country_alpha2}/${date}/${region}/details.png`)
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

function flagEmoji(country_alpha2) {
   return country_alpha2.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0)+127397) );
}

function createRegionCard(country_alpha2, countryName, region, regionName, regionShortName, date, json) {
    // unpack JSON information into local variables (easier for formatting)
    var last_updated = moment(json['last_updated']).locale('en').fromNow();

    var r_t = json['r_t'].toFixed(2)
    var r_t_lower = json['r_t_lower'].toFixed(2);
    var r_t_upper = json['r_t_upper'].toFixed(2);
    var rtTooltip = `Rt is between ${r_t_lower} and ${r_t_upper} with 90&nbsp;%probability`;

    var indicator = 'success';
    var indicatorMessage = `R < 1 (with ${((1-json['r_t_threshold_probability']) * 100).toFixed(0)} %)`;
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
        indicatorMessage = `R > 1 (with ${(json['r_t_threshold_probability'] * 100).toFixed(0)} %)`;
    }
    var indicatorTooltip = `R > 1 with ${(json['r_t_threshold_probability'] * 100).toFixed(0)} % probability`;

    // generate the HTML markup for the region-specific card with metadata
    var html = `
    <div id="card_${country_alpha2}_${region}" class="col-md-4">
        <div class="card mb-4 shadow-sm">
        <img width="100%" style="cursor: pointer;" src="${window.location.origin}/data/${country_alpha2}/${date}/${region}/thumb.png" onclick="showRegion('${country_alpha2}', '${escape(countryName)}', '${region}', '${escape(regionName)}', '${date}')"></img>
        <div class="detailsLink">
            <span>Details</span>
            &#10095;
        </div>
        
        <div class="card-body">
            <label class="font-weight-bold">${regionName} (${regionShortName.replace("all", "Ø")})</label>
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
                <small class="text-muted">last updated ${last_updated}</small>
            </div>
        </div>
    </div>
    `;
    // append the region to the list
    $(`#card_${country_alpha2}_${region}`).replaceWith(html);
};

function createRankingChart(filterSetting, scope, sort_by, indicator_scope) {
    // sort the data BEFORE creating the ordinal x-axis!
    var dobjects = getSortedDataObjects(filterSetting, scope, sort_by, indicator_scope)
    var regKeys = dobjects.map(function(entry){return entry.name;});

    // specify aspect ratio from screen pixels:
    var width = 500;
    var height = 200;

    // create the chart SVG
    margin = ({top: 0, right: 5, bottom: 0, left: 5})
    $('#rankingChart').html('');
    var svg = d3.select("div#rankingChart").append("svg")
        .attr("viewBox", [-50, -10, width+50, height+30])
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
        // autoscale to include maximum upper bound and threshold*1.1
        yScale.domain([
            0,
            d3.max(dobjects, function(d) {return d.json[`${scope}_upper`];})
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

    // draw axis label
    var axisLabelX = -30;
    var axisLabelY = height / 2;
    switch (scope){
        case "r_t":
            svg.append('g')
                .attr('transform', `translate(${axisLabelX}, ${axisLabelY})`)
                .append('text')
                .attr('font-size', 'smaller')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .text("R")
                ;
            svg.append('g')
                .attr('transform', `translate(${axisLabelX+3}, ${axisLabelY-7})`)
                .append('text')
                .attr('font-size', 'smaller')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .text("t")
                ;
            break;
        case "7d_infections_by_100k":
        case "infections_by_100k":
            svg.append('g')
                .attr('transform', `translate(${axisLabelX - 10}, ${axisLabelY})`)
                .append('text')
                .attr('font-size', 'x-small')
                .attr('text-anchor', 'middle')
                .attr('transform', 'rotate(-90)')
                .text(scope == "infections_by_100k" ? "daily new infections per 100,000 population" : "infections in 7 days per 100,000 population")
            ;
            // svg.append('g')
            //     .attr('transform', `translate(${axisLabelX}, ${axisLabelY})`)
            //     .append('text')
            //     .attr('font-size', 'x-small')
            //     .attr('text-anchor', 'middle')
            //     .attr('transform', 'rotate(-90)')
            //     .text("per 100,000 population")
            // ;
            break;
    }

    // draw horizontal grid lines
    svg.selectAll("line.horizontalGrid").data(yScale.ticks(10)).enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", margin.right)
        .attr("x2", width)
        .attr("y1", function(d){ return yScale(d);})
        .attr("y2", function(d){ return yScale(d);});
    // draw threshold line
    if (yThreshold != null){
        svg.append("line")
        .attr("class", "horizontalGrid gridlineDark")
        .attr("x1", margin.right)
        .attr("x2", width)
        .attr("y1", yScale(yThreshold))
        .attr("y2", yScale(yThreshold));
    }

    // draw uncertainty bars
    var bandwidth = xScale.bandwidth();
    var bubbleWidth = 30;
    var scaleFactor = Math.min(bandwidth / bubbleWidth, 1);
    bubbleWidth *= scaleFactor;
    var barWidth = 10 * scaleFactor;
    var bubbleHeight = 20 * scaleFactor;
    var fontSize = 9 * scaleFactor;

    svg.selectAll("div")
        .data(dobjects)
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

    // then overlay trend arrows
    if (scope == "infections_by_100k" || scope == "7d_infections_by_100k") {
        // first define one arrowhead for each region (because arrowheads can't inherit the colors from the line)
        svg.selectAll("div")
            .data(dobjects).enter()
            .append("svg:marker")
            .attr("id", function(entry){return `triangle-${entry.uid}`;})
            .attr("refX", 3)
            .attr("refY", 3)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 6 3 0 6")
            .style("fill", function (entry) {return entry.color;});
        // then add lines (with custom arrowheads) for each region
        svg.selectAll("div")
            .data(dobjects)
            .enter().append("line")
            .attr("x1", function(entry){
                // convert the ordinal x-category to an x-coordinate
                return bandwidth/2 + xScale(entry.name);
            })
            .attr("x2", function(entry){
                // convert the ordinal x-category to an x-coordinate
                return bandwidth/2 + xScale(entry.name);
            })
            .attr("y1", function (entry) {
                var shift = (entry.json['r_t'] > 1) ? -bubbleHeight/2 : bubbleHeight/2;
                return shift + yScale(entry.json[scope]);
            })
            .attr("y2", function (entry) {
                var shift = (entry.json['r_t'] > 1) ? -bubbleHeight/2 : bubbleHeight/2;
                // scale the arrows by R_t
                return shift + yScale(entry.json[scope] * entry.json["r_t"]);
            })
            .attr("stroke-width", 1)
            .attr("stroke", function (entry) {return entry.color;})
            .attr("marker-end", function(entry){return `url(#triangle-${entry.uid})`;});
    }

    // region bubbles go on top of trend arrows!
    svg.selectAll("div")
        .data(dobjects)
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
        .attr("style", function (entry) {return `stroke: ${entry.color};stroke-width:${1.5*scaleFactor}px`;})
        .attr("rx", 10 * scaleFactor);

    // and region labels to the top
    svg.selectAll("div")
        .data(dobjects)
        .enter().append("text")
        .text(function(entry) {return entry.short_name.replace("all", "Ø");})
        .attr("class", "barLabel")
        .attr("x", function(entry){
            // convert the ordinal x-category to an x-coordinate
            return bandwidth/2 + xScale(entry.name);
        })
        .attr("y", function (entry) {
            return yScale(entry.json[scope]);
        })
        .attr("style", function (entry) {return `fill: ${entry.color};font-size:${fontSize}pt`;})
        .attr("dy", "0.35em");

};

function setFilter(selected, scope) {
    CURRENT_FILTER = selected;
    CURRENT_SCOPE = scope;
    // select the corresponding button
    $(`#btnRank_${scope}`).button('toggle');
    $(`#btnFilter_${selected}`).button('toggle');

    createRankingChart(
        filterSetting=(selected != "all" && INDEX[selected]["regions"].length <= 1) ? "all" : CURRENT_FILTER,
        scope=CURRENT_SCOPE
    );
    if (selected == "all") {
        // show all nation thumbs, but no headers
        $.each(INDEX, function(country_alpha2, country) {
            $(`#country_header_${country_alpha2}`).hide();
            // show "all" region but hide others
            $.each(country["regions"], function(r, rm) {
                var region = rm[0];
                if (region == "all") {
                    $(`#card_${country_alpha2}_${region}`).show();
                }
                else {
                    $(`#card_${country_alpha2}_${region}`).hide();
                }
            });
        });
    }
    else {
        // show all regions of only one country (with header)
        $.each(INDEX, function(country_alpha2, country) {
            if (country_alpha2 == selected) {
                $(`#country_header_${country_alpha2}`).show();
                $.each(country["regions"], function(r, rm) {
                    $(`#card_${country_alpha2}_${rm[0]}`).show();
                });
            } else {
                $(`#country_header_${country_alpha2}`).hide();
                $.each(country["regions"], function(r, rm) {
                    $(`#card_${country_alpha2}_${rm[0]}`).hide();
                });
            }
        });
    }
};

$(document).ready(function() {
    // first, we must download the index file that tells us which countries & regions there are
    $.getJSON(`${window.location.origin}/data/index.json`, function(json) {
        INDEX = json;
        // collect promies that download region-wise JSONs
        var regionPromises = [];
        // now insert placeholders for the thumbnail cards of all countries
        $.each(json, function(country_alpha2, country) {
            var countryName = country["name"];
            var lastDate = country["dates"].slice(-1);
            // add to flag selector
            $("#flagBar").append(`
            <label id="btnFilter_${country_alpha2}" class="btn btn-light" style="font-size:x-large" onclick="setFilter('${country_alpha2}', CURRENT_SCOPE)">
                <input type="radio" name="options" id="flag_${country_alpha2}">${flagEmoji(country_alpha2)}
            </label>
            `);
            // create country header with full width
            $("#thumbnailGallery").append(`
            <h3 id="country_header_${country_alpha2}" class="col-md-12">${flagEmoji(country_alpha2)} ${countryName}</h3>
            `);
            // iterate the regions to download their data and create thumbnails
            $.each(country["regions"], function(r, rm) {
                var region = rm[0];
                var regionName = rm[1];
                var regionShortName = rm[2];
                // first insert region card placeholders in the correct order!
                $(`#thumbnailGallery`).append(`<div id="card_${country_alpha2}_${region}"></div>`);
                // then fetch content (unordered callbacks!)
                regionPromises.push($.getJSON(`${window.location.origin}/data/${country_alpha2}/${lastDate}/${region}/summary.json`, function(regionJson) {
                    FULL_DATASET[`${country_alpha2}_${region}`] = regionJson;
                    createRegionCard(country_alpha2, countryName, region, regionName, regionShortName, lastDate, regionJson);
                }));
            });
        });

        // wait until data for all regions was loaded before creating the ranking
        $.when.apply($, regionPromises).then(function() {
            // now create the ranking chart
            setFilter("all", "infections_by_100k");
        });
    });
    // end of document-ready
});
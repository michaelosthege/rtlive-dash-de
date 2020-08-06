regions = {
    'all': 'Gesamt',
    'BW': 'Baden-Württemberg',
    'BY': 'Bayern',
    'BE': 'Berlin',
    'BB': 'Brandenburg',
    //'HB': 'Bremen',
    'HH': 'Hamburg',
    'HE': 'Hessen',
    'MV': 'Mecklenburg-Vorpommern',
    'NI': 'Niedersachsen',
    'NW': 'Nordrhein-Westfalen',
    'RP': 'Rheinland-Pfalz',
    //'SL': 'Saarland',
    'SN': 'Sachsen',
    'ST': 'Sachsen-Anhalt',
    'SH': 'Schleswig-Holstein',
    'TH': 'Thüringen',
};
population = {
    'all': 83019000,
    'BB': 2512000,
    'BE': 3645000,
    'BW': 11070000,
    'BY': 13077000,
    'HB': 683000,
    'HE': 6266000,
    'HH': 1841000,
    'MV': 1610000,
    'NI': 7982000,
    'NW': 179333000,
    'RP': 4085000,
    'SH': 2897000,
    'SL': 991000,
    'SN': 4078000,
    'ST': 2208000,
    'TH': 2143000,
}

function showRegion(region) {
    $('#regionModal').modal('show');
    $('#regionModalTitle').html(regions[region]);
    $('#regionModalImage').attr('src', `data/de_${region}.png`)
}
$(document).ready(function() {
    // iterate over all regions to create small cards
    $.each(regions, function(region, regionTitle) {
        $.getJSON(`data/de_${region}_summary.json`, function(json) {

            // unpack JSON information into local variables (easier for formatting)
            var last_updated = moment(json['last_updated']).locale('de').fromNow();

            var r_t = json['r_t'].toFixed(2)
            var r_t_lower = json['r_t_lower'].toFixed(2);
            var r_t_upper = json['r_t_upper'].toFixed(2);
            var rtTooltip = `Rt liegt mit 90&nbsp%iger Wahrscheinlichkeit zwischen ${r_t_lower} und ${r_t_upper}`;

            var indicator = 'success';
            var indicatorMessage = `R < 1 (zu ${((1-json['p_r_t_gt_1']) * 100).toFixed(0)} %)`;
            if (json['p_r_t_gt_1'] > 0.25) {
                // grey for 25-50 % probability
                indicator = 'secondary';
                indicatorMessage = 'R < 1';
            }
            if (json['p_r_t_gt_1'] > 0.5) {
                // orange for 50-75 % probability
                indicator = 'warning';
                indicatorMessage = 'R > 1';
            }
            if (json['p_r_t_gt_1'] > 0.75) {
                // grey for >75 % probability
                indicator = 'danger';
                indicatorMessage = `R > 1 (zu ${(json['p_r_t_gt_1'] * 100).toFixed(0)} %)`;
            }
            var indicatorTooltip = `R > 1 mit ${(json['p_r_t_gt_1'] * 100).toFixed(0)} % Wahrscheinlichkeit`;

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
                
                <div class="card-body">
                    <label class="font-weight-bold">${regionTitle}</label>
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
            $('#regionCards').append(html);
            // end of json-load callback
        });
        // end of iterator
    });
    // end of document-ready
});
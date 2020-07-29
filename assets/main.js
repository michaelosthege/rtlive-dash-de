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
    'BW': 11070000,
    'BY': 13077000,
    'BE': 3645000,
    'BB': 2512000,
    'HB': 683000,
    'HH': 1841000,
    'HE': 6266000,
    'MV': 1610000,
    'NI': 7982000,
    'NW': 179333000,
    'RP': 4085000,
    'SL': 991000,
    'SN': 4078000,
    'ST': 2208000,
    'SH': 2897000,
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
            var indicator = 'success';
            var indicatorMessage = 'R < 1';
            if (json['p_r_t_gt_1'] > 0.5) {
                indicator = 'warning';
                indicatorMessage = 'R > 1';
            }
            if (json['p_r_t_gt_1'] > 0.8) {
                indicator = 'danger';
                indicatorMessage = `R > 1 mit ${(json['p_r_t_gt_1'] * 100).toFixed(0)} % Wahrscheinlichkeit`;
            }
            var active = json['active'];
            var active_lower = json['active_lower'];
            var active_upper = json['active_upper'];

            // generate the HTML markup for the region-specific card with metadata
            var html = `
            <div class="col-md-4">
                <div class="card mb-4 shadow-sm">
                <img width="100%" src="data/de_${region}_thumb.png" onclick="showRegion('${region}')"></img>
                
                <div class="card-body">
                    <label class="font-weight-bold">${regionTitle}</label>
                    <p class="card-text">
                    R = ${json['r_t'].toFixed(2)}
                    <span class="subsup">
                        <sub>${json['r_t_lower'].toFixed(2)}</sub>
                        <sup>${json['r_t_upper'].toFixed(2)}</sup>
                    </span>
                    <span class="badge badge-pill badge-${indicator} float-right">${indicatorMessage}</span>
                    </p>

                    <p class="card-text">
                    ${active.toFixed(0)}
                    <span class="subsup">
                        <sub>${active_lower.toFixed(0)}</sub>
                        <sup>${active_upper.toFixed(0)}</sup>
                    </span>&nbsp;infektiöse Fälle
                    </p>

                    <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">zuletzt aktualisiert ${last_updated}</small>
                    </div>
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
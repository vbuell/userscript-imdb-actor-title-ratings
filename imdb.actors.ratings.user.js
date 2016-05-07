// ==UserScript==
// @name           IMDB Actor title Ratings
// @version        0.1
// @description    Adds ratings & vote counts with sorting ability to an actor's movie/TV show lists
// @match          http://www.imdb.com/name/*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @require        https://datejs.googlecode.com/files/date.js
// @copyright      2014+, You
// ==/UserScript==

// add css
var css = '<style type="text/css"> \
             .votes_column, .rating_column, .year_column{padding-left: 15px;} \
             .votes_column, .rating_column{float: right;width:65px} \
             .header .votes_column a, .header .rating_column a, .header .year_column a{cursor:pointer} \
             .votes_column a:hover, .rating_column a:hover, .year_column a:hover{text-decoration:none !important;color:inherit} \
             .year_column{width:40px;text-align:inherit} \
             .header .sorted{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAYAAADN5B7xAAAAQUlEQVR4AWOQTNtkAMT/icQGDCAAZDQQobiBAQpgmi7gUXyBAQ0QcpoBunp8TmtAV4fhNHxOIeA0TKfgdBoupwAAVdttkcoQnXIAAAAASUVORK5CYII=) left no-repeat} \
          </style>'
$(css).appendTo('head');

// add headers
$('.filmo-category-section').each(function() {
	if ($(this).find('div.filmo-row').length > 1) {
		$(this).prepend('<div class="filmo-row header"><div class="year_column sorted"><a>Year</a></div><div class="votes_column mellow"><a>Votes</a></div><div class="rating_column"><a>Rating</a></div><br></div>');
	}
});

//$('.filmo-category-section').prepend('<div class="filmo-row header"><div class="year_column">Year</div><div class="votes_column mellow">Votes</div><div class="rating_column">Rating</div><br></div>');

//  add the rating & votes to the movie/TV show
function addData(yearSpan, rating, votes, released) {
    $(yearSpan).attr('title', released);
	$(yearSpan).after('<span class="votes_column mellow"><small>' + votes + '</small></span><span class="rating_column">' + rating + '</span>');
}

// iterate the movies/TV shows and lookup the rating & vote count via omdbApi.com
$('.filmo-row:not(.header)').each(function() {
	var imdbId = $(this).attr('id').split('-')[1];
	var omdbUrl = 'http://www.omdbapi.com/?i=' + imdbId;
	var yearSpan = $(this).find('span.year_column');
	$.getJSON(omdbUrl, function( data ) {
		if (data.Response == 'True') {
			addData(yearSpan, data.imdbRating, data.imdbVotes, data.Released);
		}
	});
});

// sorts the list of movies/TV Shows
function sortCategory(sectionDiv, sortBy) {
	var rows = $(sectionDiv).children('div').not('.header').remove();
	rows.sort(function(a,b){
		var opA, opB, selector
		switch (sortBy) {
			case 'Rating':
				selector = '.rating_column';
				break;
			case 'Votes':
				selector = '.votes_column';
				break;
			case 'Year':
                return Date.parse($(a).find('.year_column').attr('title')) < Date.parse($(b).find('.year_column').attr('title')) ? 1 : -1;
				//selector = '.year_column';
				break;
			default:
				break;
		}
		opA = Number($(a).find(selector).text().replace(',','').replace('N/A', '0'));
		opB = Number($(b).find(selector).text().replace(',','').replace('N/A', '0'));
		return opA < opB ? 1 : (opA > opB ? -1 : 0); 
	});
    // add class odd or even
	rows.each(function(index) {
		$(this).removeClass('odd even');
		if (index % 2 === 0) {$(this).addClass('odd')}
		else                 {$(this).addClass('even')}
	});
	$(sectionDiv).append(rows);
}

//add click event handlers to the headers (Rating, Votes, Year)
$('.header div a').click(function () {
	sortCategory($(this).parents('.filmo-category-section'), $(this).text());
    $(this).parent('div').addClass('sorted');
    $(this).parent('div').siblings('div').removeClass('sorted');
});

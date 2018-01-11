// ==UserScript==
// @name           IMDB Person's Title Ratings
// @version        1.0.3
// @license        GPL
// @description    Adds ratings & vote counts with sorting ability to a person's movie/TV show lists
// @namespace      http://userscripts.org/users/518906
// @icon           http://www.imdb.com/favicon.ico
// @author         Nonya Beesnes, Wardenclyffe Tower
// @match          http://www.imdb.com/name/*
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js
// @require        https://raw.githubusercontent.com/datejs/Datejs/master/build/date.js
// @require        https://raw.githubusercontent.com/evanplaice/jquery-csv/master/src/jquery.csv.min.js
// @grant   GM_getValue
// @grant   GM_setValue
// ==/UserScript==

// add css
var css = '<style type="text/css"> \
             .your_rating_column, .votes_column, .rating_column, .year_column{padding-left: 0px;} \
             .your_rating_column, .votes_column, .rating_column{float: right;width:65px} \
             .header .your_rating_column a, .header .votes_column a, .header .rating_column a, .header .year_column a{cursor:pointer} \
             .your_rating_column a:hover, .votes_column a:hover, .rating_column a:hover, .year_column a:hover{text-decoration:none !important;color:inherit} \
             .year_column{width:40px;text-align:inherit} \
             .header .sorted{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAYUlEQVQoz2NgQAKSaZs2APF/KN7AgAtQRyFQoB+qAISfIyl8jiTeC1JoCsQ/kRSgY5CcMczUHDwKc9CdsAaLovVAzIiukB+I7yIpug/Egrh8bQx10y8gNmPAB6DuLUAXBwDx5XOePVdilwAAAABJRU5ErkJggg==) left no-repeat} \
             .header .sortedDesc{background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAXElEQVQoz2NgQAOSaZtygLiAAR8AKjAG4p9A/AuITXAp4gfiu0D8H4pBbH5sCtcgKYLhNdjc9R8HzkF3Fy6FIDljkMJeIN4Axc+RFDxHEu9Fd8IGJIUb8AUP5QoBYK5yX24/ZOIAAAAASUVORK5CIIA=) left no-repeat} \
          </style>';
$(css).appendTo('head');

// add headers (Rating, Votes, Year)
$('.filmo-category-section').prepend('<div class="filmo-row header"><div class="year_column sorted"><a title="Sort">Year</a></div><div class="votes_column mellow"><a title="Sort">Votes</a></div><div class="your_rating_column"><a title="Sort">Your</a></div><div class="rating_column"><a title="Sort">Rating</a></div><br></div>');

$('#filmoform').prepend('<select id="filmoform-type-select" name="sort" class="fixed"><option value="">Show all</option><option value="?">Feature Film</option><option value="typeVideoGame">Video Games</option><option value="typeTvSeries">TV Series</option><option value="typeShort">Short</option></select>');

$('#filmoform-type-select').on('change', function() {
	var selectedType = $("#filmoform-type-select").val();
	if (selectedType == '') {
		$('.filmo-row:not(.header)').show();
	} else if (selectedType == '?') {
		$('.filmo-row:not(.header)').show();
		$('.filmo-row.typeVideoGame, .filmo-row.typeTvSeries, .filmo-row.typeShort').hide();
	} else {
		$('.filmo-row:not(.header)').hide();
		$('.filmo-row.'+selectedType).show();
	}
});

//  add the rating & votes to the movie/TV show
function addData(yearSpan, rating, myRating, votes, released) {
    'use strict';
    $(yearSpan).attr('title', released);
    $(yearSpan).after('<span class="votes_column mellow"><small>' + votes + '</small></span><span class="your_rating_column">' + myRating + '</span><span class="rating_column">' + rating + '</span>');
}

var userDataLoaded = false;

function loadUserRatingsAndStoreToGmStorage() {
	console.log('GM_getValue(imdbLastModified) = ' + GM_getValue('imdbLastModified'));
	console.log('Delta: ' + (Date.now() - GM_getValue('imdbLastModified')));
	
	if (GM_getValue('imdbLastModified') && (Date.now() - GM_getValue('imdbLastModified') < 3600000 * 1)) {
		return;
	}
	
	var userId = scrapUserId();

	var imdbUserRatingsCsvUrl = 'http://www.imdb.com/list/export?list_id=ratings&author_id=' + userId;
	$.ajax({
		dataType: "text",
		url: imdbUserRatingsCsvUrl,
		success: function( csv_text ) {
			console.log('Parsing CSV.');
			var arr = $.csv.toArrays(csv_text);
			console.log('Parsed. Entries: ' + arr.length);
			for (var i = 1; i < arr.length; i++) {
				key = arr[i][1];
				rating = arr[i][8];
				if (GM_getValue(key) != rating) {	// GM_getValue is much faster than setValue
					GM_setValue(key, rating);
				}
			}
			GM_setValue('imdbLastModified', Date.now());
		}
	});
}

function scrapUserId() {
	var userLink = $('#navUserMenu .navCategory a').attr('href');
	var re = /\/user\/([a-z0-9]+)\//;
	var match = re.exec(userLink);  
	if (!match)  
		window.alert("Can't find username. " + userLink);
	else
		return match[1];
}

function getUserRating(imdbId) {
	if (!userDataLoaded) {
		userDataLoaded = true;
		loadUserRatingsAndStoreToGmStorage();
	}

	return GM_getValue(imdbId, '-');
}

// iterate through the movies/TV shows in the passed section and lookup the rating & vote count via omdbApi.com
//   if the section doesn't already have ratings added and is visible.
function addRatingsToSection(filmoCategorySection) {
	'use strict';
	if (!$(filmoCategorySection).hasClass('hasRatings') && $(filmoCategorySection).is(':visible')) {
		$(filmoCategorySection).addClass('hasRatings');
		$(filmoCategorySection).find('.filmo-row:not(.header)').each(function() {
			var imdbId = $(this).attr('id').split('-')[1];
			var omdbUrl = 'http://www.omdbapi.com/?i=' + imdbId + '&apikey=PlsBanMe';
			var yearSpan = $(this).find('span.year_column');
			var myRating = getUserRating(imdbId);
			var itemText = $(this).text();
			if (itemText.indexOf("(TV Series)") > 0 || itemText.indexOf("(TV Mini-Series)") > 0) $(this).addClass("typeTvSeries");
			if (itemText.indexOf("(Video Game)") > 0) $(this).addClass("typeVideoGame");
			if (itemText.indexOf("(Short)") > 0 || itemText.indexOf("(Video short)") > 0) $(this).addClass("typeShort");
			$.getJSON(omdbUrl, function( data ) {
				if (data.Response === 'True') {
					addData(yearSpan, data.imdbRating, myRating, data.imdbVotes, data.Released);
				} else {
					addData(yearSpan, 'N/A', myRating, 'N/A', yearSpan.text().trim().slice(0,4));
				}
			});
		});
	}
}

// from https://github.com/Teun/thenBy.js
firstBy=(function(){function e(f){f.thenBy=t;return f}function t(y,x){x=this;return e(function(a,b){return x(a,b)||y(a,b)})}return e})();

// calculates sort order
function calcSort(a, b, sortProperty, direction) {
	'use strict';
	var opA, opB, selector;
	switch (sortProperty) {
		case 'Rating':
			selector = '.rating_column';
			break;
		case 'Votes':
			selector = '.votes_column';
			break;
		case 'Year':
			var aval = $(a).find('.year_column').attr('title');
			if (aval === 'N/A') {aval = $(a).find('.year_column').text().trim().slice(0,4);}
			var bval = $(b).find('.year_column').attr('title');
			if (bval === 'N/A') {bval = $(b).find('.year_column').text().trim().slice(0,4);}
			return Date.parse(aval) < Date.parse(bval) ? (1 * direction) : (-1 * direction);
			//selector = '.year_column';
			//break;
		default:
			break;
	}
	opA = Number($(a).find(selector).text().replace(',','').replace('N/A', '0'));
	opB = Number($(b).find(selector).text().replace(',','').replace('N/A', '0'));
	return opA < opB ? (1 * direction) : (opA > opB ? -1 * direction : 0); 
}

// sorts the list of movies/TV Shows
function sortCategory(sectionDiv, sortBy, direction) {
	'use strict';
	var rows = $(sectionDiv).children('div').not('.header').remove();
	var secondSortProperty, thirdSortProperty;
	switch (sortBy) {
		case 'Rating':
			secondSortProperty = 'Votes';
			thirdSortProperty = 'Year';
			break;
		case 'Votes':
			secondSortProperty = 'Rating';
			thirdSortProperty = 'Year';
			break;
		case 'Year':
			secondSortProperty = 'Rating';
			thirdSortProperty = 'Votes';
			break;
	}
	
	var s = firstBy(function (a, b) {return calcSort(a, b, sortBy, direction);})
		.thenBy(function (a, b) {return calcSort(a, b, secondSortProperty, direction);})
		.thenBy(function (a, b) {return calcSort(a, b, thirdSortProperty, direction);});
	rows.sort(s);
	
    // add class odd or even
	rows.each(function(index) {
		$(this).removeClass('odd even');
		if (index % 2 === 0) {$(this).addClass('odd');}
		else                 {$(this).addClass('even');}
	});
	$(sectionDiv).append(rows);
}

//add click event handlers to the headers (Rating, Votes, Year)
$('.filmo-row.header div a').click(function () {
	'use strict';
	var linkDiv = $(this).parent('div');
	var direction = 1;
	if (linkDiv.hasClass('sorted')) {
		direction = -1;
		linkDiv.addClass('sortedDesc');
		linkDiv.removeClass('sorted');
	}
	else {
		linkDiv.addClass('sorted');
		linkDiv.removeClass('sortedDesc');
	}
	sortCategory($(this).parents('.filmo-category-section'), $(this).text(), direction);
    linkDiv.siblings('div').removeClass('sorted sortedDesc');
});

// watch for changes to the category sections' style attribute, add ratings when made visible (cut down on hits to omdbApi.com)
var observer = new MutationObserver(function(mutations) {
	'use strict';
    addRatingsToSection(mutations[0].target);
});

$('.filmo-category-section').each(function () {
	'use strict';
	observer.observe(this, { 
		attributes: true, 
		attributeFilter: ["style"]
	});
});

// initially add ratings only to the sections that aren't collapsed (cut down on hits to omdbApi.com)
addRatingsToSection($('.filmo-category-section:visible'));

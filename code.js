var apikey = "h6p3tbv6f2u5savqzhgq5wts";
var baseUrl = "http://data.tmsapi.com/v1.1";
var theatersUrl = baseUrl + '/movies/showings';
var movies = [];
var theaters = {};

$('#location-form').on('submit', function(e) {
    $('#sk-circle').show();
    e.preventDefault();
    vm.movies([]);
    vm.theaters([]);
    var zip = e.target[0].value;
    var distance = e.target[1].value;
    var unit = e.target[2].value;
    var startDate = e.target[3].value;
    var endDate = e.target[4].value;

    var a = moment(startDate, 'YYYY-MM-DD');
    var b = moment(endDate, 'YYYY-MM-DD');
    var numDays = b.diff(a, 'days') + 1;

    $.ajax({
        url: theatersUrl,
        data: {
            startDate: startDate,
            numDays: numDays,
            zip: zip,
            radius: distance,
            units: unit,
            api_key: apikey,
            jsonp: "dataHandler",
        },
        dataType: "jsonp",
    });

    /*
    $.ajax({
        dataType: "json",
        url: "data.json",
        data: {},
        success: dataHandler,
    })
    */
});

function dataHandler(data) {
    vm.movies(data);
    vm.movies().forEach(function(m){
        m.theaters = [];
        if(!m.hasOwnProperty('directors')) m.directors = ['N/A'];
        if(!m.hasOwnProperty('releaseYear')) m.releaseYear = '';
        if(!m.hasOwnProperty('topCast')) m.topCast = ['N/A'];
        if(!m.hasOwnProperty('longDescription')) m.longDescription = 'N/A';
        if(!m.hasOwnProperty('genres')) m.genres = ['N/A'];
        m.scores = {
            rt: score_lookup.hasOwnProperty(m.title) ? parseInt(score_lookup[m.title]) : '',
            rt_audience: parseInt(Math.random() * 100),
            imdb: parseInt(Math.random() * 100)/10,
        }
    })

    data.forEach(function(m, movie_index) {
        m.showtimes.forEach(function(s) {
            var theater = s.theatre.id;
            if(!theaters.hasOwnProperty(theater)) {
                theaters[theater] = {'name': s.theatre.name};
                var theater_object = {
                    'name': s.theatre.name,
                    'id': theater,
                    'include': false,
                    'movies': [],
                };
                vm.theaters.push(theater_object);
            }
        });
    })
    // done
    $('#sk-circle').hide();
}

function AppViewModel() {
    var self = this;

    self.theaters = ko.observableArray([]);
    self.movies = ko.observableArray([]);
    self.hidden_movies = ko.observableArray([]);

    self.toggleInclusion = function() {
        var t_id = this.id;
        self.theaters().forEach(function(t) {
            if(t.id == t_id) {
                t.include = !t.include
                self.refreshTheaters(t, true);
            }
        })
    }

    self.refreshTheaters = function(t, r) {
        if(t.include) {
            self.movies().concat(self.hidden_movies()).forEach(function(m) {
                m.showtimes.forEach(function(s) {
                    if(s.theatre.id == t.id) {
                        if(m.theaters.indexOf(t)==-1)
                        m.theaters.push(t);
                    }
                });
            })
        } else {
            self.movies().concat(self.hidden_movies()).forEach(function(m){
                var index = m.theaters.indexOf(t);
                if (index > -1) {
                    m.theaters.splice(index, 1);
                }
            })
        }

        if (r) {
            self.theaters.refresh();

            self.movies().sort(sortFunction);
            self.movies.refresh();
        }
    }

    self.toggleMovie = function(movie) {
        if (self.hidden_movies().indexOf(movie) == -1) {
            self.hidden_movies.push(movie);
            self.movies().splice(self.movies().indexOf(movie), 1);
        } else {
            self.movies.push(movie);
            self.hidden_movies().splice(self.hidden_movies().indexOf(movie), 1);
        }
        self.movies().sort(sortFunction);
        self.movies.refresh();
        self.hidden_movies().sort(sortTitle);
        self.hidden_movies.refresh();
    }
}

function sortTitle(a, b) {
    var titleA = a.title.toLowerCase();
    var titleB = b.title.toLowerCase();

    if (titleA < titleB) return -1 * sortDirection;
    if (titleA > titleB) return 1 * sortDirection;
    return 0
}
function sortScore(a, b) {
    var scoreA = a.scores.rt;
    var scoreB = b.scores.rt;

    if (scoreA == '' && scoreB == '') return sortTitle(a, b);
    if (scoreA == '') return 1;
    if (scoreB == '') return -1;
    if (scoreA < scoreB) return 1 * sortDirection;
    if (scoreA > scoreB) return -1 * sortDirection;
    return 0;
}
var sortFunction = sortTitle;
var sortDirection = 1;

var vm = new AppViewModel();
ko.applyBindings(vm);


ko.observableArray.fn.refresh = function() {
    var data = this().slice(0);
    this([]);
    this(data);
}

function formatDateTime(dateTime) {
    var a = moment(dateTime, "YYYY-MM-DDTHH:mm");
    return a.format("dddd, MMMM Do YYYY, h:mm a");
}

function formatDirectors(directors) {
    if(!directors) return 'N/A';
    return directors.join(', ');
}

function formatRTScore(score) {
    if (score == '') return '-';
    return ''+score+'%';
}

function sortMovies(by) {
    $('.sortable').removeClass('sorted-up sorted-down');
    switch (by) {
        case 'title': 
            if (sortFunction == sortTitle)
                sortDirection *= -1;
            else {
                sortFunction = sortTitle;
                sortDirection = 1;
            }
            $('#title-header').addClass((sortDirection==1)?'sorted-up':'sorted-down');
            break;
        case 'score':
            if (sortFunction == sortScore)
                sortDirection *= -1;
            else {
                sortFunction = sortScore;
                sortDirection = 1;
            }
            $('#rt-header').addClass((sortDirection==1)?'sorted-up':'sorted-down');
            break;
    }
    vm.movies().sort(sortFunction);
    vm.movies.refresh();
}

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

var score_lookup = {};
$(document).ready( function() {
    $('#datefrom').val(new Date().toDateInputValue());
    $('#dateto').val(new Date().toDateInputValue());

    scores_url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTozIjxLh8iOcfkyE7rytN5Ajx1ZDpIsyZlyOIrPLYAqov-TFdm59vnCY70AAZhNyjMq_09jpPIY0vO/pub?gid=0&single=true&output=tsv';
    $.ajax({
        url: scores_url,
        type: 'get',
        dataType: 'text',
        success: function(data) {
            var allRows = data.split(/\r?\n|\r/);
            for (var singleRow = 0; singleRow < allRows.length; singleRow ++) {
                score_lookup[allRows[singleRow].split('\t')[0]] = allRows[singleRow].split('\t')[1];
            }
            for (var m_index = 0; m_index < vm.movies().length; m_index ++) {
                m.scores = {
                    rt: score_lookup.hasOwnProperty(m.title) ? parseInt(score_lookup[m.title]) : '',
                }
            }
            vm.movies.refresh();
        },
        error: function(data) {console.log(data);}
    });
});

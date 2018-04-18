var apikey = "7w4ns8ynp6wbmnwrq6cf52qt";
var baseUrl = "http://data.tmsapi.com/v1.1";
var theatersUrl = baseUrl + '/movies/showings';
var movies = [];
var theaters = {};

$('#location-form').on('submit', function(e) {
    $('#sk-circle').show();
    e.preventDefault();
    var zip = e.target[0].value;
    var distance = e.target[1].value;
    var unit = e.target[2].value;
    var startDate = e.target[3].value;
    var endDate = e.target[4].value;

    var a = moment(startDate, 'DD-MM-YYYY');
    var b = moment(endDate, 'DD-MM-YYYY');
    var numDays = b.diff(a, 'days');

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
            rt_critic: parseInt(Math.random() * 100),
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

            self.movies().sort(sortMovies);
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
        self.movies().sort(sortMovies);
        self.movies.refresh();
        self.hidden_movies().sort(sortMovies);
        self.hidden_movies.refresh();
    }
}

function sortMovies(a, b) {
    var titleA = a.title.toLowerCase();
    var titleB = b.title.toLowerCase();

    if (titleA < titleB) return -1;
    if (titleA > titleB) return 1;
    return 0
}

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

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

$(document).ready( function() {
    $('#datefrom').val(new Date().toDateInputValue());
    $('#dateto').val(new Date().toDateInputValue());
});

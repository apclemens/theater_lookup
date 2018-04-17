var apikey = "7w4ns8ynp6wbmnwrq6cf52qt";
var baseUrl = "http://data.tmsapi.com/v1.1";
var theatersUrl = baseUrl + '/movies/showings';
var movies = [];
var theaters = {};

$(document).ready(function() {
    // http://developer.tmsapi.com/Sample_Code
});

$('#location-form').on('submit', function(e) {
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
});

function dataHandler(data) {
    movies = data;

    movies.forEach(function(m) {
        m.showtimes.forEach(function(s) {
            var theater = s.theatre.id;
            if(!theaters.hasOwnProperty(theater)) {
                theaters[theater] = {'name': s.theatre.name};
                vm.theaters.push({
                    'name': s.theatre.name,
                    'id': theater,
                    'include': false,
                });
            }
        });
        vm.movies.push({
            'id': m.rootId,
            'title': m.title,
            'theaters': [],
            'scores': 10,
        })
    })
}

function AppViewModel() {
    var self = this;

    self.theaters = ko.observableArray([]);
    self.movies = ko.observableArray([]);
    
    self.toggleInclusion = function() {
        var t_id = this.id;
        self.theaters().forEach(function(t) {
            if(t.id == t_id) {
                t.include = !t.include
                self.refreshTheaters(t);
            }
        })
    }

    self.refreshTheaters = function(t) {
    }
}

var vm = new AppViewModel();
ko.applyBindings(vm);


ko.observableArray.fn.refresh = function() {
    var data = this().slice(0);
    this([]);
    this(data);
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var ionic_native_1 = require('ionic-native');
/*
  Generated class for the GoogleMap component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
var GoogleMapComponent = (function () {
    function GoogleMapComponent(events, myFunctions, navParams) {
        var _this = this;
        this.events = events;
        this.myFunctions = myFunctions;
        this.navParams = navParams;
        this.markers = navParams.get('markers');
        console.log(this.markers);
        this.events.subscribe('map:unclickable', function () {
            _this.map.setClickable(false);
        });
        this.events.subscribe('map:clickable', function () {
            _this.map.setClickable(true);
        });
        this.events.subscribe('map:clear', function () {
            _this.mapClear();
        });
        this.events.subscribe('map:setMapFocus', function (loc) {
            _this.setMapFocus(loc);
        });
        this.markers = [];
        this.marker = [];
        this.focus = [0, 0];
        this.clicky = true;
        this.accuracy = "Positioning...";
        this.accColor = "danger";
    }
    GoogleMapComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        this.myFunctions.enableLocation();
        this.events.subscribe('location:watching', function (position) {
            _this.accuracy = position.coords.accuracy.toFixed(2);
            _this.accColor = (_this.accuracy < 11) ? "green" : "yellow";
        });
        this.loadMap();
    };
    GoogleMapComponent.prototype.mapClear = function () {
        for (var x in this.marker) {
            this.marker[x].remove();
        }
        this.map.clear();
        this.marker = [];
        this.markers = [];
    };
    GoogleMapComponent.prototype.setMapFocus = function (pos) {
        this.map.animateCamera({
            'target': pos,
            'tilt': 0,
            'zoom': 17,
            'bearing': 0
        });
    };
    GoogleMapComponent.prototype.loadMap = function () {
        var _this = this;
        var location = new ionic_native_1.GoogleMapsLatLng(this.focus[0], this.focus[1]);
        this.map = new ionic_native_1.GoogleMap('map', {
            'backgroundColor': 'white',
            'controls': {
                'compass': true,
                'myLocationButton': true,
                'indoorPicker': true,
                'zoom': true
            },
            'gestures': {
                'scroll': true,
                'tilt': true,
                'rotate': true,
                'zoom': true
            },
            'camera': {
                'latLng': location,
                'tilt': 0,
                'zoom': 15,
                'bearing': 0
            }
        });
        this.map.getMyLocation().then(function (location) {
            var newLoc = new ionic_native_1.GoogleMapsLatLng(location.latLng.lat, location.latLng.lng);
            _this.map.animateCamera({
                'target': newLoc,
                'tilt': 0,
                'zoom': 15,
                'bearing': 0
            });
            _this.setMapFocus(newLoc);
        }, function (msg) {
            console.log(msg);
        });
        this.map.one(ionic_native_1.GoogleMapsEvent.MAP_READY).then(function () {
            for (var x in _this.marker) {
                _this.marker[x].remove();
            }
            _this.map.clear();
            _this.marker = [];
            for (var x in _this.markers) {
                var mPos = new ionic_native_1.GoogleMapsLatLng(_this.markers[x].lat, _this.markers[x].lng);
                var markerOptions = {
                    position: mPos,
                    title: _this.markers[x].title,
                    draggable: _this.markers[x].draggable
                };
                _this.map.addMarker(markerOptions)
                    .then(function (marker) {
                    _this.marker[x] = marker;
                    _this.marker[x].showInfoWindow();
                    if (_this.markers[x].draggable) {
                        _this.marker[x].addEventListener(ionic_native_1.GoogleMapsEvent.MARKER_DRAG_END).subscribe(function (data) {
                            marker.getPosition().then(function (LatLng) {
                                console.log(LatLng);
                                _this.events.publish('map:dragend', LatLng);
                            });
                        });
                    }
                });
            }
            if (!_this.clicky) {
                _this.map.setClickable(false);
            }
        });
    };
    __decorate([
        core_1.Input()
    ], GoogleMapComponent.prototype, "markers");
    __decorate([
        core_1.Input()
    ], GoogleMapComponent.prototype, "focus");
    __decorate([
        core_1.Input()
    ], GoogleMapComponent.prototype, "clicky");
    GoogleMapComponent = __decorate([
        core_1.Component({
            selector: 'google-map',
            templateUrl: 'google-map.html'
        })
    ], GoogleMapComponent);
    return GoogleMapComponent;
}());
exports.GoogleMapComponent = GoogleMapComponent;
//# sourceMappingURL=google-map.js.map
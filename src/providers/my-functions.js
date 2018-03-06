"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var ionic_native_1 = require('ionic-native');
require('rxjs/add/operator/map');
/*
  Generated class for the MyFunctions provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
var MyFunctions = (function () {
    function MyFunctions(http, toastCtrl, events) {
        this.http = http;
        this.toastCtrl = toastCtrl;
        this.events = events;
        this.disabledOptionBtn = false;
        console.log('Hello MyFunctions Provider');
    }
    MyFunctions.prototype.locationAccuracyRequest = function () {
        var _this = this;
        ionic_native_1.LocationAccuracy.canRequest().then(function (canRequest) {
            if (canRequest) {
                // the accuracy option will be ignored by iOS
                ionic_native_1.LocationAccuracy.request(ionic_native_1.LocationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(function () {
                    console.log("Location is now fully working");
                }, function (error) {
                    _this.toastCtrl.create({
                        message: error.message,
                        showCloseButton: true,
                        duration: 1000
                    }).present();
                    setTimeout(function () {
                        _this.checkGps();
                    }, 2000);
                });
            }
        });
    };
    MyFunctions.prototype.checkGps = function () {
        var _this = this;
        //GPS Check!
        var locationSuccessCallback = function (isAvailable) {
            if (isAvailable) {
                console.log("Yes GPS");
            }
            else {
                _this.locationAccuracyRequest();
            }
        };
        var locationErrorCallback = function (e) {
            _this.toastCtrl.create({
                message: 'Barista Choi App: Location Error',
                showCloseButton: true,
                duration: 1000
            }).present();
        };
        ionic_native_1.Diagnostic.isLocationAvailable().then(locationSuccessCallback, locationErrorCallback);
        //End of GPS Check
    };
    MyFunctions.prototype.disableLocation = function () {
        try {
            this.gpsSubscription.unsubscribe();
            console.log("GPS Watch disabled!");
        }
        catch (e) {
            console.log("GPS unable to disable... variable not ready");
        }
    };
    MyFunctions.prototype.enableLocation = function () {
        var _this = this;
        this.disableLocation();
        this.gpsSubscription = ionic_native_1.Geolocation.watchPosition({ enableHighAccuracy: true }).subscribe(function (position) {
            _this.events.publish('location:watching', position);
            console.log(position);
        });
    };
    MyFunctions.prototype.enableBackgroundLocation = function () {
        var config = {
            desiredAccuracy: 10,
            stationaryRadius: 20,
            distanceFilter: 30,
            debug: false,
            stopOnTerminate: true
        };
        ionic_native_1.BackgroundGeolocation.configure(function (location) {
            console.log('[js] BackgroundGeolocation callback:  ' + location.latitude + ',' + location.longitude);
            //this.events.publish('location:watching', location);
            console.log(location);
            // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
            // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
            // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
            //BackgroundGeolocation.finish(); // FOR IOS ONLY
        }, function (error) {
            console.log('BackgroundGeolocation error');
        }, config);
        // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
        ionic_native_1.BackgroundGeolocation.start();
    };
    MyFunctions.prototype.toastIt = function (msg) {
        this.toastCtrl.create({
            message: msg,
            showCloseButton: true,
            duration: 10000
        }).present();
    };
    MyFunctions.prototype.inside = function (point, vs) {
        // ray-casting algorithm based on
        // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
        var x = point[0], y = point[1];
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];
            var intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect)
                inside = !inside;
        }
        return inside;
    };
    MyFunctions.prototype.myGeoJson = function (loc) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.http.get('assets/geojson/cebu.geojson')
                .map(function (res) { return res.json(); })
                .subscribe(function (data) {
                // we've got back the raw data, now generate the core schedule data
                // and save the data for later reference
                console.log(data);
                //var location = "Unknown"
                var location;
                for (var x in data["features"]) {
                    var poly = data["features"][x];
                    for (var xy in data["features"][x]["geometry"]["coordinates"]) {
                        var myc = new Array();
                        var multi = data["features"][x]["geometry"]["coordinates"][xy];
                        if (multi.length == 1) {
                            for (var xyz in multi[0]) {
                                var loc0 = multi[0][xyz][0];
                                var loc1 = multi[0][xyz][1];
                                multi[0][xyz][0] = loc1;
                                multi[0][xyz][1] = loc0;
                                var coords = multi[0][xyz];
                                myc.push(coords);
                            }
                        }
                        else {
                            for (var xyz in multi) {
                                var loc0 = multi[xyz][0];
                                var loc1 = multi[xyz][1];
                                multi[xyz][0] = loc1;
                                multi[xyz][1] = loc0;
                                var coords = multi[xyz];
                                myc.push(coords);
                            }
                        }
                        var val = _this.inside(loc, myc);
                        if (val)
                            resolve(poly["properties"]);
                    }
                }
            });
        });
    };
    MyFunctions = __decorate([
        core_1.Injectable()
    ], MyFunctions);
    return MyFunctions;
}());
exports.MyFunctions = MyFunctions;
//# sourceMappingURL=my-functions.js.map
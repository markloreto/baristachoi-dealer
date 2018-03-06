"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var search_client_1 = require('../../pages/search-client/search-client');
var ionic_native_1 = require('ionic-native');
var map_1 = require('../../pages/map/map');
/*
  Generated class for the AddMachine page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
var AddMachinePage = (function () {
    function AddMachinePage(navCtrl, navParams, events, myFunctions, sanitizer, modalCtrl) {
        var _this = this;
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.events = events;
        this.myFunctions = myFunctions;
        this.sanitizer = sanitizer;
        this.modalCtrl = modalCtrl;
        this.address = "";
        this.pos = navParams.get('pos');
        this.days = navParams.get('days');
        this.delivery = navParams.get('delivery');
        this.lat = this.pos.coords.latitude;
        this.lng = this.pos.coords.longitude;
        this.machineType = "Unspecified";
        this.machines = [
            "Unspecified",
            "Sapoe 8703",
            "Kape Time",
            "Le Vending f303v",
            "Teatime dsk632",
            "Teatime dsk622ma",
            "Teatime dg700fm",
            "Teatime dg808fm",
            "Teatime 108f3m"
        ];
        this.photo = "";
        this.client = { id: "" };
        this.clientPhoto = "assets/images/machines/Unspecified.png";
        this.myFunctions.myGeoJson([this.lat, this.lng]).then(function (data) {
            console.log(data);
            _this.addressT = data;
            _this.address = _this.addressT.NAME_1 + ", " + _this.addressT.NAME_2 + ", " + _this.addressT.NAME_3;
        });
    }
    AddMachinePage.prototype.ionViewDidLoad = function () {
        console.log('ionViewDidLoad AddMachinePage');
    };
    AddMachinePage.prototype.updateMarker = function () {
        this.navCtrl.push(map_1.MapPage, {
            markers: [{ lat: this.lat, lng: this.lng, title: "Machine is here", draggable: true }]
        });
    };
    AddMachinePage.prototype.presentModal = function () {
        var _this = this;
        var modal = this.modalCtrl.create(search_client_1.SearchClientPage, { lat: this.lat, lng: this.lng });
        modal.onDidDismiss(function (data) {
            _this.myFunctions.disabledOptionBtn = false;
            console.log(data);
            _this.client.id = data.id;
            if (data.photo == "")
                _this.clientPhoto = "assets/images/machines/Unspecified.png";
            else
                _this.clientPhoto = _this.sanitizer.bypassSecurityTrustUrl(data.photo);
            _this.client.name = data.name;
        });
        this.myFunctions.disabledOptionBtn = true;
        modal.present();
    };
    AddMachinePage.prototype.capture = function () {
        var _this = this;
        ionic_native_1.Camera.getPicture({ quality: 80, targetWidth: 1024, targetHeight: 768, destinationType: 0 }).then(function (imageData) {
            // imageData is either a base64 encoded string or a file URI
            // If it's base64:
            var base64Image = 'data:image/jpeg;base64,' + imageData;
            console.log(base64Image);
            _this.photo = _this.sanitizer.bypassSecurityTrustUrl(base64Image);
        }, function (err) {
            // Handle error
        });
    };
    AddMachinePage = __decorate([
        core_1.Component({
            selector: 'page-add-machine',
            templateUrl: 'add-machine.html'
        })
    ], AddMachinePage);
    return AddMachinePage;
}());
exports.AddMachinePage = AddMachinePage;
//# sourceMappingURL=add-machine.js.map
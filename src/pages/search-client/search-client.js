"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var add_client_1 = require('../../pages/add-client/add-client');
var ionic_native_1 = require('ionic-native');
/*
  Generated class for the SearchClient page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
var SearchClientPage = (function () {
    function SearchClientPage(navCtrl, navParams, viewCtrl, modalCtrl) {
        var _this = this;
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.viewCtrl = viewCtrl;
        this.modalCtrl = modalCtrl;
        this.databaseLoaded = false;
        this.lat = navParams.get('lat');
        this.lng = navParams.get('lng');
        this.clientList = [];
        this.storage = new ionic_native_1.SQLite();
        this.storage.openDatabase({ name: "data.db", location: "default" }).then(function () {
            _this.databaseLoaded = true;
            _this.refreshClients();
        });
        this.data = [];
    }
    SearchClientPage.prototype.ionViewDidLoad = function () {
        console.log('ionViewDidLoad SearchClientPage');
    };
    SearchClientPage.prototype.dismiss = function () {
        this.viewCtrl.dismiss(this.data);
    };
    SearchClientPage.prototype.refreshClients = function () {
        var _this = this;
        this.clientList = [];
        this.storage.executeSql("SELECT * FROM clients", []).then(function (data) {
            var arr = [];
            for (var x = 0; x < data.rows.length; x++) {
                arr.push(data.rows.item(x));
            }
            _this.clientList = arr;
        });
    };
    SearchClientPage.prototype.addClient = function () {
        var _this = this;
        var modal = this.modalCtrl.create(add_client_1.AddClientPage, { lat: this.lat, lng: this.lng }, { showBackdrop: true, enableBackdropDismiss: true });
        modal.onDidDismiss(function (data) {
            //this.refreshClients()
            console.log(data);
            if (data.id) {
                _this.data = data;
                _this.dismiss();
            }
        });
        modal.present();
    };
    SearchClientPage = __decorate([
        core_1.Component({
            selector: 'page-search-client',
            templateUrl: 'search-client.html'
        })
    ], SearchClientPage);
    return SearchClientPage;
}());
exports.SearchClientPage = SearchClientPage;
//# sourceMappingURL=search-client.js.map
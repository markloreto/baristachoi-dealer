"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
/*
  Generated class for the Client page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
var PopoverPage = (function () {
    function PopoverPage(navParams) {
        this.navParams = navParams;
    }
    PopoverPage = __decorate([
        core_1.Component({
            template: "\n    <ion-list>\n      <ion-list-header>Ionic</ion-list-header>\n      <button ion-item >Learn Ionic</button>\n      <button ion-item >Documentation</button>\n      <button ion-item >Showcase</button>\n      <button ion-item >GitHub Repo</button>\n    </ion-list>\n  "
        })
    ], PopoverPage);
    return PopoverPage;
}());
exports.PopoverPage = PopoverPage;
var ClientPage = (function () {
    function ClientPage(navCtrl, navParams, myDatabase, popoverCtrl) {
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.myDatabase = myDatabase;
        this.popoverCtrl = popoverCtrl;
        this.itemList = [];
    }
    ClientPage.prototype.ionViewDidLoad = function () {
        console.log('ionViewDidLoad ClientPage');
    };
    ClientPage.prototype.presentPopover = function (myEvent) {
        var popover = this.popoverCtrl.create(PopoverPage);
        popover.present({
            ev: myEvent
        });
    };
    ClientPage = __decorate([
        core_1.Component({
            selector: 'page-client',
            templateUrl: 'client.html'
        })
    ], ClientPage);
    return ClientPage;
}());
exports.ClientPage = ClientPage;
//# sourceMappingURL=client.js.map
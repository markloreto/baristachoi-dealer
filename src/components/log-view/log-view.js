"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
/*
  Generated class for the LogView component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
var LogViewComponent = (function () {
    function LogViewComponent(myDatabase) {
        this.myDatabase = myDatabase;
        console.log('Hello LogView Component');
        this.refreshLogs();
    }
    LogViewComponent.prototype.refreshLogs = function () {
        var _this = this;
        if (this.myDatabase.databaseLoaded) {
            this.myDatabase.showLoading();
            this.myDatabase.getLogs().then(function (result) {
                _this.myDatabase.hideLoading();
                console.log(result);
                _this.logs = result;
            }, function (error) {
                _this.myDatabase.hideLoading();
                console.log("ERROR: ", error);
            });
        }
        else {
            setTimeout(function () {
                _this.refreshLogs();
            }, 1000);
        }
    };
    LogViewComponent = __decorate([
        core_1.Component({
            selector: 'log-view',
            templateUrl: 'log-view.html'
        })
    ], LogViewComponent);
    return LogViewComponent;
}());
exports.LogViewComponent = LogViewComponent;
//# sourceMappingURL=log-view.js.map
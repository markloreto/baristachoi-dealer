"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var HelloIonicPage = (function () {
    function HelloIonicPage() {
    }
    HelloIonicPage.prototype.doRefresh = function (refresher) {
        console.log('Begin async operation', refresher);
        setTimeout(function () {
            console.log('Async operation has ended');
            refresher.complete();
        }, 2000);
    };
    HelloIonicPage = __decorate([
        core_1.Component({
            selector: 'page-hello-ionic',
            templateUrl: 'hello-ionic.html'
        })
    ], HelloIonicPage);
    return HelloIonicPage;
}());
exports.HelloIonicPage = HelloIonicPage;
//# sourceMappingURL=hello-ionic.js.map
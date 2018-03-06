"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var ionic_angular_1 = require('ionic-angular');
var ionic_native_1 = require('ionic-native');
var my_database_1 = require('../providers/my-database');
var my_functions_1 = require('../providers/my-functions');
var hello_ionic_1 = require('../pages/hello-ionic/hello-ionic');
var list_1 = require('../pages/list/list');
var map_1 = require('../pages/map/map');
var client_1 = require('../pages/client/client');
var callsheet_1 = require('../pages/callsheet/callsheet');
var MyApp = (function () {
    function MyApp(platform, menu, events, myDatabase, myFunctions) {
        this.platform = platform;
        this.menu = menu;
        this.events = events;
        this.myDatabase = myDatabase;
        this.myFunctions = myFunctions;
        // make HelloIonicPage the root (or first) page
        this.rootPage = hello_ionic_1.HelloIonicPage;
        this.initializeApp();
        // set our app's pages
        this.pages = [
            { title: 'Home', component: hello_ionic_1.HelloIonicPage, icon: "home" },
            { title: 'Callsheets', component: callsheet_1.CallsheetPage, icon: "paper" },
            { title: 'My First List', component: list_1.ListPage, icon: "home" },
            { title: 'Map', component: map_1.MapPage, icon: "home" },
            { title: 'Client', component: client_1.ClientPage, icon: "home" },
        ];
    }
    MyApp.prototype.initializeApp = function () {
        var _this = this;
        this.platform.ready().then(function () {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            ionic_native_1.StatusBar.styleDefault();
            ionic_native_1.Splashscreen.hide();
            ionic_native_1.StatusBar.hide();
            _this.myDatabase.loadDatabase();
            _this.resumeCheck();
            if (_this.platform.is('mobile')) {
                cordova.plugins.autoStart.enable();
                cordova.plugins.backgroundMode.setDefaults({
                    text: 'Doing heavy tasks.',
                    title: 'Barista Choi'
                });
                cordova.plugins.backgroundMode.enable();
            }
            ionic_native_1.Network.onConnect().subscribe(function () {
                _this.myFunctions.toastIt("You are now connected to the Internet");
                // We just got a connection but we need to wait briefly
                // before we determine the connection type.  Might need to wait
                // prior to doing any api requests as well.
            });
            ionic_native_1.Network.onDisconnect().subscribe(function () {
                _this.myFunctions.toastIt("Internet Disconnected :-(");
            });
            document.addEventListener('resume', function () {
                _this.resumeCheck();
            });
            document.addEventListener('pause', function () {
                _this.pauseCheck();
            });
            //Minimize the app when back button is pressed
            _this.platform.registerBackButtonAction(function () {
                if (!_this.myFunctions.disabledOptionBtn) {
                    var view = _this.nav.getActive();
                    if (_this.nav.canGoBack() || view && view.isOverlay) {
                        _this.nav.pop();
                    }
                    else {
                        if (_this.nav.getActive().component.name == "HelloIonicPage")
                            window.plugins.appMinimize.minimize();
                        else
                            _this.nav.setRoot(hello_ionic_1.HelloIonicPage);
                    }
                }
            }, 1);
            //
            if (_this.myDatabase.gps_bg == "enabled") {
                _this.myFunctions.enableBackgroundLocation();
            }
        });
    };
    MyApp.prototype.pauseCheck = function () {
        if (this.myDatabase.databaseLoaded)
            this.myDatabase.setTimeInSettings();
    };
    MyApp.prototype.resumeCheck = function () {
        this.myFunctions.checkGps();
        if (this.myDatabase.databaseLoaded)
            this.myDatabase.chkTime();
    };
    MyApp.prototype.openPage = function (page) {
        this.myFunctions.disableLocation();
        // close the menu when clicking a link from the menu
        this.menu.close();
        // navigate to the new page if it is not the current page
        var view = this.nav.getActive();
        if (view.instance instanceof page.component) {
            this.myFunctions.toastIt("You are already in this page");
        }
        else {
            this.nav.setRoot(page.component);
        }
    };
    MyApp.prototype.menuClosed = function () {
        this.events.publish('map:clickable', '');
    };
    MyApp.prototype.menuOpened = function () {
        this.events.publish('map:unclickable', '');
    };
    __decorate([
        core_1.ViewChild(ionic_angular_1.Nav)
    ], MyApp.prototype, "nav");
    MyApp = __decorate([
        core_1.Component({
            templateUrl: 'app.html',
            providers: [my_database_1.MyDatabase, my_functions_1.MyFunctions]
        })
    ], MyApp);
    return MyApp;
}());
exports.MyApp = MyApp;
//# sourceMappingURL=app.component.js.map
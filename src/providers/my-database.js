"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
require('rxjs/add/operator/map');
var ionic_native_1 = require('ionic-native');
var moment = require('moment');
/*
  Generated class for the MyDatabase provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
var MyDatabase = (function () {
    function MyDatabase(http, alertCtrl, loadingCtrl) {
        var _this = this;
        this.http = http;
        this.alertCtrl = alertCtrl;
        this.loadingCtrl = loadingCtrl;
        console.log('Hello MyDatabase Provider');
        if (!this.isOpen) {
            this.databaseLoaded = false;
            this.wrongDate = false;
            this.isOpen = true;
            this.wrongDateAlertOpen = false;
        }
        ionic_native_1.NativeStorage.getItem('gps_bg').then(function (data) {
            _this.gps_bg = data;
            console.log('gps_bg ' + data);
        }, function (error) {
            console.error(error);
            ionic_native_1.NativeStorage.setItem('gps_bg', 'enabled')
                .then(function () { _this.gps_bg = 'enabled'; }, function (error) { return console.error('Error storing item', error); });
        });
    }
    MyDatabase.prototype.loadDatabase = function () {
        var _this = this;
        this.showLoading();
        this.storage = new ionic_native_1.SQLite();
        this.storage.openDatabase({ name: "data.db", location: "default" }).then(function () {
            _this.hideLoading();
            _this.databaseLoaded = true;
            _this.storage.executeSql("DROP TABLE IF EXISTS machines", []);
            _this.storage.executeSql("DROP TABLE IF EXISTS settings", []);
            _this.storage.executeSql("DROP TABLE IF EXISTS logs", []);
            _this.storage.executeSql("DROP TABLE IF EXISTS clients", []);
            //table creation
            _this.storage.executeSql("CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '', alias TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '', contact TEXT NOT NULL DEFAULT '', contact2 TEXT NOT NULL DEFAULT '', photo TEXT NOT NULL DEFAULT '', lat REAL, lng REAL, last_order_date INT, created_date INT, updated_date)", []);
            _this.storage.executeSql("CREATE TABLE IF NOT EXISTS machines (id INTEGER PRIMARY KEY NOT NULL, creator_id TEXT NOT NULL DEFAULT '', owner_id TEXT NOT NULL DEFAULT '', qr_id TEXT NOT NULL DEFAULT '', created_date INT NOT NULL, updated_date INT NOT NULL, last_visit_date INT NOT NULL, maintenance_date INT NOT NULL, region TEXT NOT NULL DEFAULT '', municipal TEXT NOT NULL DEFAULT '', brgy TEXT NOT NULL DEFAULT '', accuracy REAL NOT NULL DEFAULT 0, delivery TEXT NOT NULL DEFAULT 'Unspecified', lat REAL NOT NULL, lng REAL NOT NULL, machine_type TEXT NOT NULL DEFAULT '', sequence INT NOT NULL DEFAULT 0, photo TEXT NOT NULL DEFAULT '')", []);
            _this.storage.executeSql("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY NOT NULL, type TEXT NOT NULL DEFAULT 'entry', ref_id INT NOT NULL DEFAULT 0, data TEXT NOT NULL DEFAULT '')", []);
            _this.storage.executeSql("CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, name TEXT, data TEXT)", []);
            //start time check and log
        });
    };
    MyDatabase.prototype.getTimestamp = function () {
        return this.timestamp = moment().format("x");
    };
    MyDatabase.prototype.setTimeInSettings = function () {
        if (!this.wrongDate)
            this.storage.executeSql("INSERT OR REPLACE INTO settings (id, name, data ) VALUES (?, ?, ?)", [1, "time_in", this.getTimestamp()]);
    };
    MyDatabase.prototype.chkTime = function () {
        var _this = this;
        this.storage.executeSql("SELECT COUNT(*) AS total FROM settings WHERE data > ? AND name = 'time_in'", [this.getTimestamp()]).then(function (data) {
            if (data.rows.item(0).total) {
                console.log("Wrong date");
                _this.wrongDate = true;
                if (!_this.wrongDateAlertOpen) {
                    _this.wrongDateAlertOpen = true;
                    var alert_1 = _this.alertCtrl.create({
                        title: 'Incorrect Date/time!!!',
                        subTitle: 'You will be redirected to date settings to adjust it correctly',
                        buttons: [
                            {
                                text: 'Ok, ayusin ko na lang ang date/time',
                                handler: function () {
                                    _this.wrongDateAlertOpen = false;
                                    setTimeout(function () {
                                        if (typeof cordova.plugins.settings.openSetting != undefined) {
                                            cordova.plugins.settings.openSetting("date", function () {
                                                console.log("opened date settings");
                                                alert_1.dismiss();
                                            }, function () {
                                                console.log("failed to open date settings");
                                            });
                                        }
                                    }, 1000);
                                    return true;
                                }
                            }
                        ],
                        enableBackdropDismiss: false
                    });
                    alert_1.present();
                }
            }
            else {
                if (_this.wrongDate) {
                    _this.alertCtrl.create({
                        title: 'Hey Buddy!',
                        message: "I'm so proud of you! Thank you for fixing your date/time",
                        buttons: ['OK']
                    }).present();
                    _this.wrongDate = false;
                    _this.setTimeInSettings();
                }
            }
        }, function (error) {
            console.log(error);
        });
    };
    MyDatabase.prototype.getLogs = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.storage.executeSql("SELECT * FROM logs", []).then(function (data) {
                var logs = [];
                if (data.rows.length > 0) {
                    for (var i = 0; i < data.rows.length; i++) {
                        logs.push({
                            id: data.rows.item(i).id
                        });
                    }
                }
                resolve(logs);
            }, function (error) {
                reject(error);
            });
        });
    };
    MyDatabase.prototype.createPerson = function (firstname, lastname) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.storage.executeSql("INSERT INTO people (firstname, lastname) VALUES (?, ?)", [firstname, lastname]).then(function (data) {
                resolve(data);
            }, function (error) {
                reject(error);
            });
        });
    };
    MyDatabase.prototype.showLoading = function () {
        this.loading = this.loadingCtrl.create({
            content: 'Please wait...'
        });
        this.loading.present();
    };
    MyDatabase.prototype.hideLoading = function () {
        this.loading.dismiss();
    };
    MyDatabase = __decorate([
        core_1.Injectable()
    ], MyDatabase);
    return MyDatabase;
}());
exports.MyDatabase = MyDatabase;
//# sourceMappingURL=my-database.js.map
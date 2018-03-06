"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var ionic_angular_1 = require('ionic-angular');
var app_component_1 = require('./app.component');
var hello_ionic_1 = require('../pages/hello-ionic/hello-ionic');
var item_details_1 = require('../pages/item-details/item-details');
var list_1 = require('../pages/list/list');
var map_1 = require('../pages/map/map');
var client_1 = require('../pages/client/client');
var callsheet_1 = require('../pages/callsheet/callsheet');
var add_machine_1 = require('../pages/add-machine/add-machine');
var google_map_1 = require('../components/google-map/google-map');
var log_view_1 = require('../components/log-view/log-view');
var search_client_1 = require('../pages/search-client/search-client');
var add_client_1 = require('../pages/add-client/add-client');
var my_database_1 = require('../providers/my-database');
var my_functions_1 = require('../providers/my-functions');
var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        core_1.NgModule({
            declarations: [
                app_component_1.MyApp,
                hello_ionic_1.HelloIonicPage,
                item_details_1.ItemDetailsPage,
                list_1.ListPage,
                map_1.MapPage,
                client_1.ClientPage,
                google_map_1.GoogleMapComponent,
                log_view_1.LogViewComponent,
                client_1.PopoverPage,
                callsheet_1.CallsheetPage,
                add_machine_1.AddMachinePage,
                search_client_1.SearchClientPage,
                add_client_1.AddClientPage,
            ],
            imports: [
                ionic_angular_1.IonicModule.forRoot(app_component_1.MyApp)
            ],
            bootstrap: [ionic_angular_1.IonicApp],
            entryComponents: [
                app_component_1.MyApp,
                hello_ionic_1.HelloIonicPage,
                item_details_1.ItemDetailsPage,
                list_1.ListPage,
                map_1.MapPage,
                client_1.ClientPage,
                client_1.PopoverPage,
                callsheet_1.CallsheetPage,
                add_machine_1.AddMachinePage,
                search_client_1.SearchClientPage,
                add_client_1.AddClientPage,
            ],
            providers: [{ provide: core_1.ErrorHandler, useClass: ionic_angular_1.IonicErrorHandler }, my_database_1.MyDatabase, my_functions_1.MyFunctions]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map
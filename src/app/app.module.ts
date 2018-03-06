import { SyncPage } from './../pages/sync/sync';
import { SparePartsPage } from './../pages/spare-parts/spare-parts';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { SplashScreen } from '@ionic-native/splash-screen';
import { MyApp } from './app.component';
import { HelloIonicPage } from '../pages/hello-ionic/hello-ionic';
import { MapPage } from  '../pages/map/map';
import { ClientPage, ClientsPopUpPage} from '../pages/client/client';
import { CallsPage } from  '../pages/calls/calls';
import { AddMachinePage } from '../pages/add-machine/add-machine';
import { GoogleMapComponent } from '../components/google-map/google-map';
import { LogViewComponent } from '../components/log-view/log-view';
import { SearchClientPage } from '../pages/search-client/search-client'
import { AddClientPage } from '../pages/add-client/add-client'
import { SlideComponent } from '../components/slide/slide'
import { CallsheetDayPage, CallSheetPopUpPage } from '../pages/callsheet-day/callsheet-day'
import { LoginPage } from '../pages/login/login'
import { RegisterPage } from '../pages/register/register'
import {CoverageAreaPage} from '../pages/coverage-area/coverage-area'
import {SettingsPage} from  '../pages/settings/settings'
import {CallsheetsPage} from '../pages/callsheets/callsheets'
import {ActionModalPage} from '../pages/action-modal/action-modal'
import {CallsheetItemsPage} from  '../pages/callsheet-items/callsheet-items'
import {CallsheetStatsPage} from '../pages/callsheet-stats/callsheet-stats'
import {DailyInventorySalesReportPage} from '../pages/daily-inventory-sales-report/daily-inventory-sales-report'
import {DisrItemPage} from '../pages/disr-item/disr-item'
import {DisrItemsPage} from '../pages/disr-items/disr-items'
import {PointOfSalePage} from '../pages/point-of-sale/point-of-sale'
import {CartItemSelectionPage} from '../pages/cart-item-selection/cart-item-selection'
import {ReceiptPage} from '../pages/receipt/receipt'
import {ProductSettingsPage} from '../pages/product-settings/product-settings'
import {ProductSettingsModifyPage} from '../pages/product-settings-modify/product-settings-modify'
import {AdminContactsPage} from '../pages/admin-contacts/admin-contacts'
import {UnsentMessagesPage} from '../pages/unsent-messages/unsent-messages'
import {HomeTabPage} from '../pages/home-tab/home-tab'
import {CarrierPagePage} from '../pages/carrier-page/carrier-page'
import {ReportsPage} from '../pages/reports/reports'
import {TripPage} from '../pages/trip/trip'
import {TravelLogsPage} from '../pages/travel-logs/travel-logs'
import {OrderClient} from '../pages/order-client/order-client'
import {OffTakePrevious} from '../pages/off-take-previous/off-take-previous'
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Geolocation } from '@ionic-native/geolocation';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { FileChooser } from '@ionic-native/file-chooser';
import { WheelSelector } from '@ionic-native/wheel-selector';
import { NativeStorage } from '@ionic-native/native-storage';
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { NativeAudio } from '@ionic-native/native-audio';

import { MyDatabase } from '../providers/my-database';
import { MyFunctions } from '../providers/my-functions';
import {CustomErrorHandler} from '../providers/custom-error-handler'

import {SortablejsModule} from 'angular-sortablejs'
import {ChartsModule} from 'ng2-charts'
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyBi9F704myDFkv6eVEVlvtZMdWjRnLvOCo",
  authDomain: "barista-choi-sas.firebaseapp.com",
  databaseURL: "https://barista-choi-sas.firebaseio.com",
  storageBucket: "barista-choi-sas.appspot.com",
  messagingSenderId: '233348829004'
};

@NgModule({
  declarations: [
    MyApp,
    HelloIonicPage,
    MapPage,
    ClientPage,
    GoogleMapComponent,
    LogViewComponent,
    CallsPage,
    AddMachinePage,
    SearchClientPage,
    AddClientPage,
    SlideComponent,
    CallsheetDayPage,
    CallSheetPopUpPage,
    ClientsPopUpPage,
    LoginPage,
    RegisterPage,
    CoverageAreaPage,
    SettingsPage,
    CallsheetsPage,
    ActionModalPage,
    CallsheetItemsPage,
    CallsheetStatsPage,
    DailyInventorySalesReportPage,
    DisrItemPage,
    DisrItemsPage,
    PointOfSalePage,
    CartItemSelectionPage,
    ReceiptPage,
    ProductSettingsPage,
    ProductSettingsModifyPage,
    AdminContactsPage,
    UnsentMessagesPage,
    HomeTabPage,
    CarrierPagePage,
    ReportsPage,
    TripPage,
    TravelLogsPage,
    OrderClient,
    OffTakePrevious,
    SparePartsPage,
    SyncPage
  ],
  imports: [
    BrowserModule, HttpModule, IonicModule.forRoot(MyApp, {tabsPlacement: 'bottom'}), SortablejsModule, ChartsModule, NgbModule.forRoot(),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HelloIonicPage,
    MapPage,
    ClientPage,
    CallsPage,
    AddMachinePage,
    SearchClientPage,
    AddClientPage,
    CallsheetDayPage,
    CallSheetPopUpPage,
    ClientsPopUpPage,
    LoginPage,
    RegisterPage,
    CoverageAreaPage,
    SettingsPage,
    CallsheetsPage,
    ActionModalPage,
    CallsheetItemsPage,
    CallsheetStatsPage,
    DailyInventorySalesReportPage,
    DisrItemPage,
    DisrItemsPage,
    PointOfSalePage,
    CartItemSelectionPage,
    ReceiptPage,
    ProductSettingsPage,
    ProductSettingsModifyPage,
    AdminContactsPage,
    UnsentMessagesPage,
    HomeTabPage,
    CarrierPagePage,
    ReportsPage,
    TripPage,
    TravelLogsPage,
    OrderClient,
    OffTakePrevious,
    SparePartsPage,
    SyncPage
  ],
  providers: [{provide: ErrorHandler, useClass: CustomErrorHandler}, MyDatabase, MyFunctions, SplashScreen, BarcodeScanner, Geolocation, BackgroundGeolocation, FileChooser, WheelSelector, NativeStorage, Contacts, TextToSpeech, NativeAudio]
})
export class AppModule {}

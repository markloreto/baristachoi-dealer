import { SyncPage } from './../pages/sync/sync';
import { SparePartsPage } from './../pages/spare-parts/spare-parts';
import { Component, ViewChild, ErrorHandler } from '@angular/core';

import { Platform, MenuController, Nav, Events, AlertController } from 'ionic-angular';

import { StatusBar, Network, Facebook} from 'ionic-native';
import { SplashScreen } from '@ionic-native/splash-screen';


import { MyDatabase } from '../providers/my-database';
import { MyFunctions } from '../providers/my-functions';
import {CustomErrorHandler} from '../providers/custom-error-handler'
import { AuthService } from '../providers/auth-service';
import { MapPage } from  '../pages/map/map';
import { ClientPage } from '../pages/client/client';
import { CallsPage } from '../pages/calls/calls';
import  { LoginPage } from '../pages/login/login'
import {CoverageAreaPage} from '../pages/coverage-area/coverage-area'
import {SettingsPage} from '../pages/settings/settings'
import {CallsheetsPage} from '../pages/callsheets/callsheets'
import {DailyInventorySalesReportPage} from '../pages/daily-inventory-sales-report/daily-inventory-sales-report'
import {HomeTabPage} from '../pages/home-tab/home-tab'
import {ReportsPage} from '../pages/reports/reports'

import { File } from 'ionic-native';


declare var cordova
declare var window
declare var navigator

@Component({
  templateUrl: 'app.html',
  providers: [AuthService, {provide: ErrorHandler, useClass: CustomErrorHandler}],
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  // make HelloIonicPage the root (or first) page
  rootPage: any = LoginPage;
  loginName: any
  pages: Array<{title: string, component: any, icon: string}>;

  constructor(
    public platform: Platform,
    public menu: MenuController,
    public events: Events,
    public myDatabase: MyDatabase,
    public myFunctions: MyFunctions,
    private alertCtrl: AlertController,
    public splashScreen: SplashScreen
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      this.splashScreen.hide();
      StatusBar.hide();


      /*window.sqlitePlugin.deleteDatabase({name: 'mydb', location: 'default'}, function() {
        console.log("database removed")
      })*/
      this.myFunctions.loadbarangays()
      let self = this

      this.myDatabase.loadDatabase().then(() => {
        this.loginName = ""
        let t = setInterval(()=>{
      if(this.myDatabase.databaseLoaded){
        clearInterval(t)
        this.loginName = this.myDatabase.userInfo.name
      }
    }, 50)
        window.plugins.intent.getCordovaIntent(function (Intent) {
          console.log(Intent);
        }, function () {
          console.log('Error');
        });

        window.plugins.intent.setNewIntentHandler(function (Intent) {
          console.log(Intent);
          if(Intent.data){
            var fileExt = Intent.data.split('.').pop();
            console.log("Extention:", fileExt)
            if(fileExt == "baristachoi"){
              self.myDatabase.showLoading("Reading File...")
              var path = Intent.data.substring(0, Math.max(Intent.data.lastIndexOf("/"), Intent.data.lastIndexOf("\\")));
              var fName = Intent.data.replace(/^.*[\\\/]/, '').replace(/\%20/gim, " ")
              console.log("Path", path)
              console.log("Filename", fName)
              File.readAsText(path, fName).then((content:any) => {
                var contentJson = JSON.parse(content)
                console.log(contentJson)
                if (typeof contentJson.databaseImport != "undefined") {
                  console.log("databaseImport", contentJson.databaseImport)
                  self.myDatabase.importDb(contentJson.databaseImport).then((c:any) => {
                    //if login
                    if(Object.keys(self.myDatabase.userInfo).length !== 0){
                      self.myDatabase.dbQueryRes("UPDATE machines SET creator_id = ? WHERE creator_id = ?", [self.myDatabase.userInfo.id, contentJson.owner.id]).then(()=>{
                        self.myDatabase.dbQueryRes("UPDATE clients SET creator_id = ? WHERE creator_id = ?", [self.myDatabase.userInfo.id, contentJson.owner.id]).then(()=>{
                          self.myFunctions.toastIt("Database Imported to " + self.myDatabase.userInfo.name)
                          self.myDatabase.hideLoading()
                          self.myFunctions.import2Contacts()
                        })
                      })
                    }else{
                      var importJson = {"data": {"inserts" : {"users" : [contentJson.owner]}}}
                      self.myDatabase.importDb(importJson).then((k:any)=>{
                        self.myFunctions.toastIt("Database Imported to " + contentJson.owner.name)
                        self.myDatabase.hideLoading()
                        self.myFunctions.import2Contacts()
                        self.myDatabase.login(contentJson.owner.id).then((ui:any)=>{
                          console.log("is now logged in: ", ui)
                          self.nav.setRoot(HomeTabPage)
                        })
                      })
                    }
                  })
                }
                if (typeof contentJson.RECORDS != "undefined"){
                  var rec = contentJson.RECORDS
                  for(var x in rec){
                    self.myDatabase.dbQueryRes("INSERT INTO spare_parts (id, name, category, description, price, sku, unit_name) VALUES (?, ?, ?, ?, ?, ?, ?)", [parseInt(rec[x].id), rec[x].name, rec[x].category, rec[x].description, rec[x].price, rec[x].sku.toLowerCase(), rec[x].unit_name])
                  }

                  setTimeout(() => {
                    self.myDatabase.dbQueryRes("SELECT * FROM spare_parts", []).then((d:any) => {
                      console.log(d)
                    })
                  },10000)
                }
              })
            }
          }

        });

        this.myDatabase.getSettings('minimumGPSMeter').then((data:any) => {
          if(data == "No Data" || "undefined" === typeof data){
            this.myDatabase.setSettings("minimumGPSMeter", 60)
            this.myDatabase.minimumGPSMeter = 60
            this.myFunctions.gpsMinimumMeter = 60
          }
          else{
            this.myDatabase.minimumGPSMeter = parseInt(data)
            this.myFunctions.gpsMinimumMeter = parseInt(data)
          }
        })

        this.myFunctions.startWhatchSMS()
        // set our app's pages
        this.pages = [
          { title: 'Home', component: HomeTabPage, icon: "home" },
          { title: 'Daily Schedule', component: CallsPage, icon: "paper" },
          { title: 'Coverage Area', component: CoverageAreaPage, icon: "globe" },
          { title: 'Callsheets', component: CallsheetsPage, icon: "list-box" },
          { title: 'D.I.S.R', component: DailyInventorySalesReportPage, icon: "clipboard" },
          { title: 'Reports', component: ReportsPage, icon: "pie" },
          { title: 'Map', component: MapPage, icon: "map" },
          { title: 'Clients', component: ClientPage, icon: "people" },
          /* { title: 'Spare Parts', component: SparePartsPage, icon: "construct" }, */
          /* { title: 'Sync', component: SyncPage, icon: "sync" }, */
          { title: 'Settings', component: SettingsPage, icon: "settings" }
        ];

        console.log("Background location:", this.myDatabase.gps_bg)
        if(this.myDatabase.gps_bg == "enabled"){
          this.myFunctions.enableBackgroundLocation()
        }

        /*this.myFunctions.importMachines().then((data:any) => {
          var r = data.RECORDS
          let self = this
          function go(x){
            console.log(x)
            self.myDatabase.dbQuery("INSERT OR REPLACE INTO machines VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [r[x].id, self.myDatabase.userInfo.id, r[x].owner_id, r[x].qr_id, r[x].created_date, r[x].updated_date, r[x].last_visit_date, r[x].maintenance_date, r[x].region, r[x].municipal, r[x].brgy, r[x].accuracy, r[x].delivery, r[x].lat, r[x].lng, r[x].machine_type, r[x].sequence, r[x].photo, r[x].thumbnail]).then((data:any) => {
              x = x+1
              if(x < r.length)
                go(x)
            })
          }

          //go(0)



        })*/
      })

      this.resumeCheck()


      if(this.platform.is('mobile')){

        cordova.plugins.autoStart.enable();

        cordova.plugins.backgroundMode.setDefaults({
          text: 'Doing heavy tasks.',
          title: 'Barista Choi',
        });
        cordova.plugins.backgroundMode.enable();

      }

      Network.onDisconnect().subscribe(() => {
        this.myFunctions.toastIt("Internet Disconnected :-(");
        this.myDatabase.isOnline = false
      });

      Network.onConnect().subscribe(() => {
        if(!this.myFunctions.synching){
          setTimeout(_ => {
            //this.myFunctions.sync()
          }, 5000)
        }
          
        this.myFunctions.toastIt("You are now connected to the Internet")
        this.myDatabase.isOnline = true
      });

      document.addEventListener('resume', () => {
        this.resumeCheck();
      });

      document.addEventListener('pause', () => {
        this.pauseCheck();
      });

      //Minimize the app when back button is pressed
      this.platform.registerBackButtonAction(() => {
        if(!this.myFunctions.disabledOptionBtn){
          let view = this.nav.getActive();

          if (this.nav.canGoBack() || view && view.isOverlay) {
            this.nav.pop();
            this.myDatabase.hideLoading()
          }
          else {
            if(this.nav.getActive().component.name == "HomeTabPage")
              window.plugins.appMinimize.minimize();
            else{
              this.nav.setRoot(HomeTabPage);
            }

          }
        }
      }, 1);
      //

      cordova.plugins.diagnostic.requestRuntimePermissions(function(statuses){
        for (var permission in statuses){
          switch(statuses[permission]){
            case cordova.plugins.diagnostic.permissionStatus.GRANTED:
              console.log("Permission granted to use "+permission);
              break;
            case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
              console.log("Permission to use "+permission+" has not been requested yet");
              break;
            case cordova.plugins.diagnostic.permissionStatus.DENIED:
              console.log("Permission denied to use "+permission+" - ask again?");
              break;
            case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
              console.log("Permission permanently denied to use "+permission+" - guess we won't be using it then!");
              break;
          }
        }
      }, function(error){
        console.error("The following error occurred: "+error);
      },[
        cordova.plugins.diagnostic.permission.SEND_SMS,
        cordova.plugins.diagnostic.permission.CAMERA,
        cordova.plugins.diagnostic.permission.READ_CONTACTS,
        cordova.plugins.diagnostic.permission.WRITE_EXTERNAL_STORAGE
      ]);

      //check facebook
      Facebook.getLoginStatus().then(s => {
        console.log(s)
        this.myDatabase.fbConnect = s.status
        if(s.status != "connected"){
          this.alertCtrl.create({
            title: 'Facebook Connect',
            message: 'Please connect your facebook account to baristachoi app',
            buttons: [
              {
                text: 'Cancel',
                role: 'cancel',
                handler: () => {
                  console.log('Cancel clicked');
                }
              },
              {
                text: 'Ok',
                handler: () => {
                  Facebook.login(["public_profile"]).then(f => {
                    console.log(f)
                  }).catch(e => {
                    console.log(e)
                  })
                }
              }
            ]
          }).present()
        }
      })

    });
  }

  pauseCheck(){
    if(this.myDatabase.databaseLoaded)
        this.myDatabase.setTimeInSettings();
  }

  resumeCheck(){
      this.myFunctions.checkGps();
      if(this.myDatabase.databaseLoaded)
        this.myDatabase.chkTime();

  }

  openPage(page) {
    // close the menu when clicking a link from the menu
    this.myFunctions.disableLocation();
    this.menu.close();
    // navigate to the new page if it is not the current page
    let view = this.nav.getActive();
    if ( view.instance instanceof page.component ){
      this.myFunctions.toastIt("You are already in this page")
    }
    else{
      this.nav.setRoot(page.component);
    }

  }

  menuClosed() {
    this.events.publish('map:clickable', '');
  }

  menuOpened() {
    this.events.publish('map:unclickable', '');
  }

  logout(){
    this.alertCtrl.create({
      title: 'Admin Pass Code',
      message: "Please provide the Admin Pass Code to log-out user",
      inputs: [
        {
          name: 'passcode',
          placeholder: 'Admin Pass Code',
          type: 'password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Log out',
          handler: data => {
            if (data.passcode == this.myDatabase.passcode) {
              Facebook.logout()
              this.myDatabase.setSettings("userInfo", "")
              this.myDatabase.userInfo = false
              this.menu.close()
              this.nav.setRoot(LoginPage)
            } else {
              this.myFunctions.toastIt("Invalid Admin Pass Code")
            }
          }
        }
      ]
    }).present()

  }

}

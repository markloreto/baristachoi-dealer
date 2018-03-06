import { Component } from '@angular/core';
import {MyDatabase} from '../../providers/my-database'
import {MyFunctions} from '../../providers/my-functions'
import { AlertController, NavController } from 'ionic-angular';
import { Transfer, LocalNotifications } from 'ionic-native';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {CallsheetDayPage} from "../callsheet-day/callsheet-day";

import * as moment from 'moment';
import * as _ from 'lodash';

declare var cordova
declare var window
@Component({
  selector: 'page-hello-ionic',
  templateUrl: 'hello-ionic.html'
})
export class HelloIonicPage {
  version:any
  downloadProgress:number = 0
  oldVList: any = []
  sync_code: any
  consoleList: any = []
  progress: any = -1
  thisWeekCommission: any = 0
  lastWeekCommission: any = 0
  thisMonthCommission: any = 0
  lastMonthCommission: any = 0
  warningStock: any = []
  isSynching: boolean = false
  synchingMsg: string = ""
  nearestMachines: any = []
  interval: any
  lastSync: any
  
  constructor(public navCtrl: NavController, public myDatabase: MyDatabase, public myFunction: MyFunctions, public alertCtrl: AlertController, private barcodeScanner: BarcodeScanner) {

    //this.consoleList.unshift("<samp></samp>")
  }

  ionViewDidLoad(){
    console.log("Nearest Machine Interval Started")
    try{clearInterval(this.interval)}
    catch(e){}
    this.interval = setInterval(() => {
      this.nearBy()
    }, 900000)

    this.nearBy()
    if(!this.myFunction.synching){
      this.myFunction.sync()
    }
    this.myFunction.disabledOptionBtn = false
    this.version = this.myDatabase.appVersion
    console.log("Current Version: ", this.version)
    LocalNotifications.registerPermission()
    this.isSynching = this.myFunction.synching
    this.synchingMsg = this.myFunction.synchingMsg
    this.lastSync = (this.myDatabase.lastSync != 'N/A') ? moment(parseInt(this.myDatabase.lastSync)).format("LLL") : this.myDatabase.lastSync
    console.log("Last Sync", this.myDatabase.lastSync)

    this.myFunction.getLatestRemainingStock().then((inv: any) => {
      console.log(inv)
      var a = inv.productSum
      var b = []
      var c
      for(var x in a){
        if(a[x].remaining == null)
          a[x].remaining == 0
          
        if(a[x].beginning != 0 || a[x].previous != 0 || a[x].reload){
          c = Math.floor((a[x].beginning + a[x].previous + a[x].reload) * 0.25)
          if(c != 0 && c >= a[x].remaining)
            b.push({remaining: a[x].remaining, name: a[x].c_name, threshold: c, unit_name: a[x].unit_name})
        }
      }

      this.warningStock = b
      console.log("Warning Stock", b)
    })

    this.myFunction.soldGoods(moment().isoWeekday(-5).format("x"), moment().isoWeekday(0).format("x")).then((soldsL: any) => {
      var a = this.myFunction.groupBySum(soldsL, "product_category", "total")
      var b = _.filter(a, ['group', "Powder Mix"])
      this.lastWeekCommission = (b.length) ? b[0].value * 19 : 0

      this.myFunction.soldGoods(moment().startOf("isoWeek").format("x"), moment().endOf("isoWeek").format("x")).then((solds: any) => {
        var c = this.myFunction.groupBySum(solds, "product_category", "total")
        var d = _.filter(c, ['group', "Powder Mix"])
        this.thisWeekCommission = (d.length) ? d[0].value * 19 : 0
      })
    })

    this.myFunction.soldGoods(moment().subtract(1,'months').startOf("month").format("x"), moment().subtract(1,'months').endOf("month").format("x")).then((soldsL: any) => {
      console.log("Last Month", soldsL)
      var a = this.myFunction.groupBySum(soldsL, "product_category", "total")
      var b = _.filter(a, ['group', "Powder Mix"])
      this.lastMonthCommission = (b.length) ? b[0].value * 19 : 0

      this.myFunction.soldGoods(moment().startOf("month").format("x"), moment().endOf("month").format("x")).then((solds: any) => {
        var c = this.myFunction.groupBySum(solds, "product_category", "total")
        var d = _.filter(c, ['group', "Powder Mix"])
        this.thisMonthCommission = (d.length) ? d[0].value * 19 : 0
      })
    })
  }

  ionViewWillLeave(){
    console.log("Clearing Invterval for Nearest Machine")
    clearInterval(this.interval)
  }

  nearBy(){
    this.myFunction.getCurrentGPSLocation().then((location: any) => {
      this.myDatabase.dbQueryRes("SELECT * FROM machines ORDER BY ((lat-?)*(lat-?)) + ((lng - ?)*(lng - ?)) ASC LIMIT 30", [location.coords.latitude, location.coords.latitude, location.coords.longitude, location.coords.longitude]).then((machines: any) => {
        
        for(var x in machines){
          machines[x].distance = this.myFunction.distance(location.coords.latitude, location.coords.longitude, machines[x].lat, machines[x].lng)
          if(machines[x].distance <= 120){
            this.nearestMachines.push(machines[x].id)
          }
        }
        console.log("Nearest", machines)

      })
    })
  }

  openCsDay(){
    this.navCtrl.push(CallsheetDayPage, {
      ids: this.nearestMachines,
      title: "Nearest Machines",
    });
  }

  clrscr(){
    this.oldVList = []
    this.consoleList = []
    this.progress = -1
  }

  scan(){
    this.clrscr()
    this.barcodeScanner.scan().then((barcodeData:any) => {
      // Success! Barcode data is here
      console.log(barcodeData)
      if(barcodeData.text.search("sync_code") != -1){
        this.sync_code = barcodeData.text
        this.sync_code = this.sync_code.slice(this.sync_code.indexOf("=") + 1)
        console.log(this.sync_code)
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/x.baristachoi.v1+json');
        this.myDatabase.showLoading()
        this.myDatabase.getJson("http://"+this.sync_code+".ngrok.io/baristachoi-depot/public/api/groups/all", {headers: headers}).then((json:any) => {
          console.log(json)
          this.oldVList = json
          this.myDatabase.hideLoading()
        }).catch(_ => {
          this.myDatabase.hideLoading()
        })
      }
     }, (err) => {
         // An error occurred
     });
  }

  updateProgess(val, upto){
    this.progress = (val / upto) * 100
  }

  oldVListLoad(id){
    
    this.myFunction.confirm("Please confirm", "Do you want to import clients from old barista choi depot?").then(_ => {
      this.clrscr()
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');
      headers.append('Accept', 'application/x.baristachoi.v1+json');
      this.myDatabase.showLoading()
      this.updateProgess(1, 100)
      this.myDatabase.getJson("http://"+this.sync_code+".ngrok.io/baristachoi-depot/public/api/groups/download/" + id, {headers: headers}).then((json:any) => {
        console.log(json)
        this.myDatabase.hideLoading()
        var c = 0
        let self = this
        function insertIt(v){
          console.log("Inserting", v)
          var id = v.key.replace(/\D/g, "")
          var delivery = (v.delivery == 1) ? "Mon" : (v.delivery == 2) ? "Tue" : (v.delivery == 3) ? "Wed" : (v.delivery == 4) ? "Thu" : (v.delivery == 5) ? "Fri" : (v.delivery == 6) ? "Sat" : (v.delivery == 7) ? "Sun" : "Unspecified"
          var machines = [
            "Unspecified",
            "Sapoe 8703",
            "Kape Time",
            "Le Vending f303v",
            "Teatime dsk632",
            "Teatime dsk622ma",
            "Teatime dg700fm",
            "Teatime dg808fm",
            "Teatime 108f3m"
          ]

          var d
  
          var machine = "Unspecified"
          for(var x in machines){
            if(v.machine != ""){
              if(machines[x].search(v.machine.slice(v.machine.indexOf("_")+1)) != -1)
                machine = machines[x]
            }
            
          }

          var name = (v.name != "") ? v.name : (v.alias != "") ? v.alias : "Unknown"
          console.log("Machine", machine)
          self.myDatabase.dbQuery("INSERT OR REPLACE INTO clients (id, name, alias, company, contact, contact2, photo, created_date, updated_date, creator_id, email, lat, lng, thumbnail, sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, v.name, v.alias, "", v.contact, "", "", id, id, self.myDatabase.userInfo.id, "", null, null, null, null]).then(() => {
            self.myFunction.getLocation([v.lat, v.long]).then((data:any) => {
              self.myDatabase.dbQuery("INSERT OR REPLACE INTO machines (id, creator_id, owner_id, created_date, updated_date, region, municipal, brgy, delivery, lat, lng, machine_type, photo, accuracy, establishment_type, thumbnail, sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )", [id, self.myDatabase.userInfo.id, id, id, id, data.NAME_1, data.NAME_2, data.NAME_3, delivery, v.lat, v.long, machine, "", v.accuracy, "", null, null]).then(() => {
                c++
                self.updateProgess(c, json.length)
                d = (delivery == "Unspecified") ? "Unspecified" : moment(delivery, "ddd").format("dddd")
                self.consoleList.unshift("<samp><strong>"+name+"</strong> is added to <em>"+d+"</em> schedule</samp>")
                if(c < json.length){
                  insertIt(json[c])
                }
                else{
                  self.consoleList.unshift("<samp><strong>"+json.length+"</strong> Client/Machines added to <em>Database</em></samp>")
                }
              })
            })
          })
        }
  
        if(json.length){
          
          insertIt(json[c])
        }
      })
    })
    
  }

  downloadUpdate(v){

    const fileTransfer = new Transfer();
    let url = 'https://www.dropbox.com/s/2gyl1iei8i7jp2b/android-debug.apk?dl=1';
    fileTransfer.download(url, cordova.file.externalDataDirectory + 'baristachoi.apk').then((entry) => {
      console.log('download complete: ' + entry.toURL());

      cordova.plugin.pDialog.dismiss();
    }, (error) => {
      // handle error
    });
    fileTransfer.onProgress((p:any) => {
      this.downloadProgress = parseFloat(((p.loaded / p.total) * 100).toFixed(2))
    })
  }

  checkUpdateNew(){
    let updateUrl = 'https://www.dropbox.com/s/ibby4rez0s3irnv/baristachoi_version.xml?dl=1';
    //AppUpdate.checkAppUpdate(updateUrl);
    window.AppUpdate.checkAppUpdate((c) => {this.myFunction.toastIt(c.msg)}, (c) => {this.myFunction.toastIt(c.msg)}, updateUrl);
  }

  checkUpdate(){
    this.myDatabase.showLoading("Checking new updates...")
    this.myDatabase.getJson("https://www.dropbox.com/s/5y2y3snz894gxlj/baristachoi_version.json?dl=1").then((v:any) => {
      console.log(v)
      this.myDatabase.hideLoading()
      if(v.version > this.version){
        this.alertCtrl.create({
          title: 'A new version found!',
          subTitle: "Would you like to update to Version " + v.version + "?",
          message: v.message,
          buttons: [
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Cancel clicked');
              }
            },
            {
              text: 'Update',
              handler: () => {
                this.downloadUpdate(v)
              }
            }
          ]
        }).present()
      }
    }).catch((e:any) => {
      this.myDatabase.hideLoading()
      if(!this.myDatabase.isOnline){
        this.myFunction.toastIt("Please check your internet connection...")
      }
      else{
        this.myFunction.toastIt("There's a problem checking for new updates...")
      }

    })
  }

  doRefresh(refresher) {
    console.log('Begin async operation', refresher);

    setTimeout(() => {
      console.log('Async operation has ended');
      refresher.complete();
    }, 2000);
  }
}

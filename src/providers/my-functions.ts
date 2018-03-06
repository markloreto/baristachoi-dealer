

import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { ToastController, Events, AlertController, Platform } from 'ionic-angular';
import { Diagnostic, LocationAccuracy, SMS, Sim, Contacts, ContactField, ContactFindOptions, ImageResizer, ImageResizerOptions, File } from 'ionic-native';
import { MyDatabase } from '../providers/my-database'
import { AngularFireDatabase, FirebaseListObservable } from 'angularfire2/database';
import { Geolocation } from '@ionic-native/geolocation';
import { BackgroundGeolocation, BackgroundGeolocationConfig, BackgroundGeolocationResponse } from '@ionic-native/background-geolocation';
import { FileChooser } from '@ionic-native/file-chooser';
import { WheelSelector } from '@ionic-native/wheel-selector';

import 'rxjs/add/operator/map';
import * as moment from 'moment';
import * as _ from 'lodash';
declare let window: any
declare var cordova: any
declare var navigator

/*
  Generated class for the MyFunctions provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class MyFunctions {
  gpsSubscription: any;
  disabledOptionBtn: boolean = false;
  days: any;
  regions: any;
  gpsSignal: boolean = false
  gpsMinimumMeter: number
  csDaySelection: boolean = false
  barangays: any
  smsArived: (result: any) => void
  myPos: any
  depot: FirebaseListObservable<any[]>;
  gpsError: boolean = false
  synching: boolean = false
  synchingMsg: string = ""
  gpsFails: number = 0
  syncTables: any = ["users", "clients", "machines", "disr", "disr_payments", "orders", "order_payments", "disr_items", "actions", "callsheets", "admin_contacts", "reporting_contacts", "sms_unsent", "coverage_area"]
  constructor(public platform: Platform, public http: Http, public toastCtrl: ToastController, public events: Events, public myDatabase: MyDatabase, public alertCtrl: AlertController, public afDB: AngularFireDatabase, private geolocation: Geolocation, private backgroundGeolocation: BackgroundGeolocation, private fileChooser: FileChooser, private selector: WheelSelector) {
    console.log('Hello MyFunctions Provider');
    Sim.getSimInfo().then(
      (info) => console.log('Sim info: ', info),
      (err) => console.log('Unable to get sim info: ', err)
    )

    this.days = [
      { title: 'Monday', minify: 'Mon'},
      { title: 'Tuesday', minify: 'Tue'},
      { title: 'Wednesday', minify: 'Wed'},
      { title: 'Thursday', minify: 'Thu'},
      { title: 'Friday', minify: 'Fri'},
      { title: 'Saturday', minify: 'Sat'},
      { title: 'Sunday', minify: 'Sun'},
    ];

    this.regions = ["Cebu", "Bohol", "Rizal", "Manila"]

    //this.importMachines()

    this.smsArived = (result: any) => {
      console.log("New SMS Arrived: ", result);
      var sms = result.data.body.split(' ');
      if(sms[0] == "BC"){
        this.smsCommand(sms, result.data.address)
      }
    }

    this.getCurrentGPSLocation()
/*     var test = []
    test[0] = "BC"
    test[1] = "DISR"
    test[2] = "inventory"
    setTimeout(_ => {
      this.smsCommand(test, "09173242410")
    }, 5000) */
    setTimeout(() => {

      /* for(var x in this.syncTables){
        this.myDatabase.dbQueryRes("UPDATE " + this.syncTables[x] +" SET sync = ? WHERE sync IS NOT NULL", [null])
      } */


      /* let db = this.afDB.database
      var ref = db.ref("machines");
      ref.orderByChild("depot_creator_id").equalTo("0_1501026885069").limitToFirst(1000).on("child_added", (s) => {
        console.log("Snapshow", s.val())
      }) */
    }, 8000)



  }

  myFcm(data){
    if(data.type == "update"){
      this.alert(data.update_title, data.update_msg)
    }
  }

  checkTransfers(s){
    var c = 0
    var transfers = []
    var self = this
    const toast = this.toastCtrl.create({
      message: 'transfer ' + c + ' of ' + transfers.length,
      position: 'top'
    })
    function g(){
      if(c < transfers.length){
        self.confirm("Please Confirm Transfer", "Would you like to accept a " + transfers[c].table + " transfer from " + transfers[c].name + "?").then(_ => {
          self.http.get("https://"+s+".ngrok.io/baristachoi-server/public/api/getDataViaId?table=" + transfers[c].table + "&data_id=" + transfers[c].data_id + "&delete_id=" + transfers[c].delete_id)
          .map(res => res.json())
          .subscribe(data => {
            console.log("transfer fetch", data)
            self.cloudInsert(transfers[c].table, data)
            c++
            toast.setMessage('transfer ' + c + ' of ' + transfers.length)
            toast.present()
            g()
          });
        }).catch(_ => {
          c++
          g()
        })
      }else{
        toast.dismiss()
        self.synching = false
      }
    }

    this.http.get("https://"+s+".ngrok.io/baristachoi-server/public/api/getTransfers?id=" + this.myDatabase.userInfo.id)
    .map(res => res.json())
    .subscribe(data => {
      console.log(data)
      if(data.length){
        transfers = data
        g()
      }
      else{
        this.synching = false
      }
    });
  }

  sync(){
    console.log("Synching started")
    if(this.synching)
      return;
    this.synching = true
    let self = this
    let db = self.afDB.database
    var numKey = self.myDatabase.depot.numKey

    var headers = new Headers();
    headers.append("Accept", 'application/json');
    headers.append('Content-Type', 'application/json' );
    let options = new RequestOptions({ headers: headers });
    var sync_code = ""

    const toast = this.toastCtrl.create({
      message: 'Syncing...',
      position: 'top'
    })

    function syncNow(syncData){
      console.log("Synching: ", syncData)

      syncData.depot = numKey
      syncData.table = self.syncTables[currentChk]
      if(syncData.creator_id)
        syncData.creator_id = syncData.creator_id.toString()

      self.http.post("https://"+sync_code+".ngrok.io/baristachoi-server/public/api/sync", syncData, options)
      .subscribe(data => {
        console.log("Data from server", data);
        self.myDatabase.dbQueryRes("UPDATE " + self.syncTables[currentChk] + " SET sync = ? WHERE id = ?", [self.myDatabase.getTimestamp(), syncData.id]).then(_ => {
          syncPrepare(self.syncTables[currentChk])
          console.log("Sync Success", syncData)
        })
      }, error => {
        console.log(error);// Error getting the data
        currentChk++
        syncPrepare(self.syncTables[currentChk])
      });
    }

    //////

    function syncPrepare(table){
      var col = "creator_id"
      console.log("Preparing", table)
      self.myDatabase.chkColumn(table, "creator_id").then((data:any) => {
        if(!data){
          col = "id"
        }

        self.myDatabase.dbQueryRes("SELECT * FROM " + table + " WHERE " + col + " = ? AND sync IS NULL LIMIT 1", [self.myDatabase.userInfo.id]).then((data: any) => {
          if(data.length){
            self.synchingMsg = table
            toast.present()
            syncNow(data[0])
          }
          else{
            currentChk++
            if(currentChk < self.syncTables.length)
              syncPrepare(self.syncTables[currentChk])
            else{
              self.synchingMsg = ""
              self.myDatabase.setSettings("lastSync", self.myDatabase.getTimestamp())
              self.myDatabase.lastSync = self.myDatabase.getTimestamp()
              toast.dismiss()
              self.checkTransfers(sync_code)
            }
          }
        })
      })
    }

    if(this.myDatabase.depot.name != "N/A"){
      console.log("Sync Check")
      var currentChk = 0

      let depotRef = db.ref("depot");
      depotRef.orderByChild("numKey").equalTo(numKey).once("value", (snapshot) => {
        const depotData = snapshot.val();
        console.log("Depot Data", depotData)
        if(depotData){

          this.getSyncCode().then((s:any) => {
            sync_code = s;
            syncPrepare(self.syncTables[currentChk])
          })
        }

        else
          this.toastIt(self.myDatabase.depot.alias + " is currently unable to sync data. please contact the developer")
      })

    }else{
      console.log("Synch N/A")
      self.synching = false
    }
  }

  removeUser(id){
    return new Promise((resolve, reject) => {
      for(var x in this.syncTables){
        if(x == "0")
          this.myDatabase.dbQueryRes("DELETE FROM " + this.syncTables[x] + " WHERE id = ?", [id])
        else
          this.myDatabase.dbQueryRes("DELETE FROM " + this.syncTables[x] + " WHERE creator_id = ?", [id])
      }

      resolve()
    })
  }

  getCloudUsers(numKey, minimal = false){
    return new Promise((resolve, reject) => {
      var sync_code = ""
      this.getSyncCode().then((s:any) => {
        sync_code = s;
        var min = (minimal) ? "&minimal=true" : ""
        this.http.get("https://"+sync_code+".ngrok.io/baristachoi-server/public/api/getUsers?depot="+ numKey + min)
        .map(res => res.json())
        .subscribe(data => {
          resolve(data)
        });
      })

    })
  }

  transferMachines(machines){
    return new Promise((resolve, reject) => {
      var sync_code
      var t = 0
      let self = this
      let db = self.afDB.database
      var numKey = self.myDatabase.depot.numKey
      var headers = new Headers();
      var to
      headers.append("Accept", 'application/json');
      headers.append('Content-Type', 'application/json' );
      let options = new RequestOptions({ headers: headers });

      function tm(){
        if(t < machines.length){
          var m = {from: parseInt(machines[t].creator_id), to: to, table: "machines", data_id: machines[t].id}
          self.http.post("https://"+sync_code+".ngrok.io/baristachoi-server/public/api/transfer", m, options)
          .subscribe(data => {
            console.log("Data from server", data);
            if(machines[t].client_id){
              var m2 = {from: parseInt(machines[t].creator_id), to: to, table: "clients", data_id: machines[t].client_id}
              self.http.post("https://"+sync_code+".ngrok.io/baristachoi-server/public/api/transfer", m2, options)
              .subscribe(data => {
                t++
                tm()
              }, error => {
                console.log(error);// Error getting the data
                t++
                tm()
              });
            }
            else{
              t++
              tm()
            }
          }, error => {
            console.log(error);// Error getting the data
            t++
            tm()
          });
        }else{
          self.myDatabase.hideLoading()

          self.toastIt("Transfer Complete")
          resolve()
          //done
        }

      }

      let depotRef = db.ref("depot");
      this.myDatabase.showLoading()
      depotRef.orderByChild("numKey").equalTo(numKey).once("value", (snapshot) => {

        const depotData = snapshot.val();
        console.log("Depot Data", depotData)
        if(depotData){

          this.getSyncCode().then((s:any) => {
            sync_code = s;

            this.getCloudUsers(numKey, true).then((users: any) => {
              this.myDatabase.hideLoading()
              console.log(users)
              let usersData = []
              for(var x in users){
                users[x].description = users[x].name
                usersData.push(users[x])
              }

              this.selector.show({
                title: "Please select a user to transfer",
                items: [
                  usersData
                ],
              }).then(
                result => {
                  this.myDatabase.showLoading()
                  console.log("Result", result);
                  to = usersData[result[0].index].id
                  tm()

                },
                err => {this.myDatabase.hideLoading()}
              );
            })
          })
        }

        else{
          this.myDatabase.hideLoading()
          this.toastIt(self.myDatabase.depot.alias + " is currently unable to sync data. please contact the developer")
        }

      })
    })
  }

  importUserCloudData(id){
    var currentChk = 1
    let self = this
    let db = this.afDB.database
    var cnt
    var timeout
    var ref
    var recNum = 1
    var skip = 0;
    var batch = 0

    var headers = new Headers();
    headers.append("Accept", 'application/json');
    headers.append('Content-Type', 'application/json' );
    let options = new RequestOptions({ headers: headers });
    var sync_code = ""

    function getData(){
      batch++
      var syncData = {table: self.syncTables[currentChk], id: id, skip: skip}
      self.http.post("https://"+sync_code+".ngrok.io/baristachoi-server/public/api/importUser", syncData, options)
      .subscribe(data => {
        console.log("Data from server", data);
        let body = JSON.parse(data["_body"])
        self.myDatabase.loading.setContent("Inserting " + body.length + " records from batch " + batch + " of " + self.syncTables[currentChk] + " table")
        if(body.length){
          for(var x in body){
            body[x].sync = self.myDatabase.getTimestamp();
            self.cloudInsert(self.syncTables[currentChk], body[x])
          }
          skip = skip + 10
          syncPrepare(self.syncTables[currentChk])
        }
        else{
          currentChk++
          if(currentChk < self.syncTables.length){
            batch = 0
            skip = 0;

            syncPrepare(self.syncTables[currentChk])
          }else{
            self.myDatabase.loading.setContent("Success! Restarting application... please wait")
            setTimeout(_ => {
              alert("Press ok to restart")
              self.myDatabase.restartApplication()
            }, 5000)
          }

        }

      }, error => {
        console.log(error);// Error getting the data
        currentChk++
        syncPrepare(self.syncTables[currentChk])
      });
    }

    function syncPrepare(table){
      console.log("Table", table)
      console.log("ID", id)
      recNum = 0
      self.myDatabase.loading.setContent("Preparing table " + table)
      getData()
    }


    this.getSyncCode().then((s:any) => {
      sync_code = s;
      syncPrepare(self.syncTables[currentChk])
    })

  }

  cloudInsert(table, data){
    var obj = ""
    var qm = ""
    var values = []
    var data2 = _.omit(data, ['depot', 'description'])
    var v
    console.log(data2)
    for(var x in data2){
      obj += x + ","
      qm += "?,"
      v = (data2[x] == "null") ? null : data2[x]
      values.push(v)
    }

    obj = obj.slice(0, -1);
    qm = qm.slice(0, -1);
    console.log(obj)
    console.log(qm)

    this.myDatabase.dbQueryRes("INSERT OR REPLACE INTO " + table + " ("+obj+") VALUES ("+qm+")", values)
  }


  checkDepotKey(key){
    return new Promise((resolve, reject) => {
      let db = this.afDB.database
      let depotRef = db.ref("depot");
      depotRef.orderByChild("password").equalTo(key).once("value", (snapshot:any) => {
        console.log(snapshot)
        var data = snapshot.val();
        console.log("Key", data)
        if(data)
          resolve(data)
        else
          reject()
      })
    })
  }

  getDepot(){
    return new Promise((resolve, reject) => {
      let db = this.afDB.database
      let depotDb = db.ref("depot").once("value").then((s: any) => {
        console.log("Snapshot", s.val())
        resolve({val: s.val(), key: s.key})
      })
    })
  }

  getSyncCode(){
    return new Promise((resolve, reject) => {
      let db = this.afDB.database
      let depotDb = db.ref("sync_code").once("value").then((s: any) => {
        console.log("Sync Code", s.val())
        resolve(s.val())
      })
    })
  }

  getCloudByDepot(table, numKey){
    return new Promise((resolve, reject) => {
      let db = this.afDB.database
      let depotRef = db.ref(table);
      depotRef.orderByChild("depot").equalTo(numKey).once("value", (snapshot) => {
        const data = snapshot.val();
        console.log("Cloud Data", data)
        if(data)
          resolve(data)
        else
          reject()
      })
    })
  }

  fileOpen(){
    return new Promise((resolve, reject) => {
      this.fileChooser.open()
      .then(uri => resolve(uri))
      .catch(e => console.log(e));
    })
  }

  smsCommand(sms, number){
    if(sms[1] == "callsheet"){
      if(sms[2] == "daily"){
        if("undefined" === typeof sms[3]){
          this.dailyReport(moment().format("x"), false, number)
        }else{
          if(moment(sms[3]).isValid()){
            this.dailyReport(moment(sms[3]).format("x"),false, number)
          }
          else{
            this.sendSMS([number], "Barista Choi: Invalid Date Requested", false)
          }
        }
      }
    }

    if(sms[1] == "DISR"){
      if(sms[2] == "inventory"){
        if("undefined" === typeof sms[3]){
          this.remainingStockReport(number)
        }else{
          this.remainingStockReport(number, sms[3])
        }
      }
    }

    if(sms[1] == "passcode"){
      if(sms[2] == "reset"){
        if("undefined" === typeof sms[3]){
          this.myDatabase.passcode = "1234"
          this.myDatabase.setSettings("passcode", "1234")
          this.sendSMS([number], "Updated Passcode to 1234", false)
        }else{
          this.myDatabase.passcode = sms[3]
          this.myDatabase.setSettings("passcode", sms[3])
          this.sendSMS([number], "Updated Passcode to " + sms[3], false)
        }
      }
    }

    if(sms[1] == "location"){
      let lat = this.myPos.coords.latitude
      let lng = this.myPos.coords.longitude
      let msg = ""
      this.getLocation([lat, lng]).then((loc:any) => {
        let address = (loc.NAME_1) ? loc.NAME_1 + ", " + loc.NAME_2 + ", " + loc.NAME_3 : "Unknown"

        this.contactSearch(number.replace("+63", "0")).then((contact:any) => {
          console.log("Contact Searched: ", contact)
          let greet = ""
          let dTime = ("undefined" === typeof this.myPos.timestamp) ? this.myPos.coords.time : this.myPos.timestamp
          if(contact.length){
            greet = "Hi " + contact[0].displayName + ",\n"
          }
          else{
            greet = "Good Day!\n"
          }

          msg += greet
          msg += "My last known location is " + address + " @ " + moment(dTime).format('LLLL') + "\n\n"
          msg += "Map: http://maps.google.com/?q="+lat+","+lng
          this.sendSMS([number], msg, false)
        })
      })
    }
  }

  week_of_month(date = moment()) {

        var prefixes = [1,2,3,4,5];

    return prefixes[0 | moment(date).date() / 7]

  }

  remainingStockReportGet(number, disr){
    var products
    var keys = []
    var productSum = []
    var totals = []
    var salesTotal = 0
    this.getProductsAndKeys().then((pk:any)=>{
      products = pk.products
      keys = pk.keys
      var ar
      for(var x in pk.raw){
        ar = pk.raw[x]
        productSum[ar.id] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0, name: ar.name}
      }

      for(var x in keys){
        totals[keys[x]] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0}
      }

      this.getInventories(disr.id).then((data:any)=> {
        console.log("disr Inventories", data)

        productSum = data.productSum
        totals = data.totals
        salesTotal = data.salesTotal


        this.myDatabase.dbQueryRes("SELECT (SUM(disr_items.plus) - SUM(disr_items.minus)) AS inventory, disr_items.*, products.category AS category, products.price FROM disr_items, products WHERE products.id = disr_items.product_id AND disr_items.creator_id = ? AND disr_items.disr_id < ? GROUP BY disr_items.product_id", [this.myDatabase.userInfo.id, disr.id]).then((disrData:any)=>{
          console.log("DISR Data", disrData)
          for(var x in disrData){
            productSum[disrData[x]["product_id"]].previous += disrData[x].inventory
            productSum[disrData[x]["product_id"]].remaining += disrData[x].inventory

            totals[disrData[x]["category"]]["remaining"] += disrData[x].inventory
            totals[disrData[x]["category"]]["previous"] += disrData[x].inventory
          }



          let thisDate = moment().format("ddd, MMM D")

          var msg = "Remaining Stock " + thisDate + "\n"
          msg += "NAME P/B/R/S [REMAINING]\n"
          var ps = productSum
          for(var x in ps){
            if(ps[x].previous != 0 || ps[x].beginning != 0)
              msg += ps[x].name + " " + ps[x].previous + "/" + ps[x].beginning + "/" + ps[x].reload + "/" + /*(ps[x].sold * -1)*/ ((ps[x].previous + ps[x].beginning + ps[x].reload) - ps[x].remaining) + " [" + ps[x].remaining + "]\n"
          }
          //
          msg += "-Summary-\n"
          if(totals["Machine"].previous != 0 || totals["Machine"].beginning != 0)
            msg += "Machine " + totals["Machine"].previous + "/" + totals["Machine"].beginning + "/" + totals["Machine"].reload + "/" + ((totals["Machine"].previous + totals["Machine"].beginning + totals["Machine"].reload) - totals["Machine"].remaining) + " [" + totals["Machine"].remaining + "]\n"
          if(totals["Paper Cups"].previous != 0 || totals["Paper Cups"].beginning != 0)
            msg += "Paper Cups " + totals["Paper Cups"].previous + "/" + totals["Paper Cups"].beginning + "/" + totals["Paper Cups"].reload + "/" + ((totals["Paper Cups"].previous + totals["Paper Cups"].beginning + totals["Paper Cups"].reload) - totals["Paper Cups"].remaining) + " [" + totals["Paper Cups"].remaining + "]\n"
          if(totals["Powder Mix"].previous != 0 || totals["Powder Mix"].beginning != 0)
            msg += "Powder Mix " + totals["Powder Mix"].previous + "/" + totals["Powder Mix"].beginning + "/" + totals["Powder Mix"].reload + "/" + ((totals["Powder Mix"].previous + totals["Powder Mix"].beginning + totals["Powder Mix"].reload) - totals["Powder Mix"].remaining) + " [" + totals["Powder Mix"].remaining + "]\n"
          console.log(msg)
          let contacts = number.split(",")
          this.sendSMS(contacts, msg, false)
        })
      })


    })
  }

  getLatestRemainingStock(){
    return new Promise((resolve, reject) => {
      this.myDatabase.dbQueryRes("SELECT id FROM disr WHERE creator_id = ? AND status = ? ORDER BY id DESC LIMIT 1", [this.myDatabase.userInfo.id, "active"]).then((disr:any) => {
        this.getInventories(disr[0].id).then((inv: any) => {
          resolve(inv)
        })
      })
    })
  }

  remainingStockReport(number, disrSeq:any = false){
    if(disrSeq){
      this.myDatabase.dbQueryRes("SELECT * FROM disr WHERE creator_id = ? AND sequence_id = ?", [this.myDatabase.userInfo.id, disrSeq]).then((disr:any) => {
        this.remainingStockReportGet(number, disr[0])
      })
    }else{
      this.myDatabase.dbQueryRes("SELECT * FROM disr WHERE creator_id = ? AND status = ? ORDER BY id DESC LIMIT 1", [this.myDatabase.userInfo.id, "active"]).then((disr:any) => {
        this.remainingStockReportGet(number, disr[0])
      })
    }
  }

  getCurrentGPSLocation(){
    return new Promise((resolve, reject) => {
      let self = this

          var onSuccess = function(position) {
            self.myPos = position
            self.gpsSignal = true
            resolve(position)
          };

          // onError Callback receives a PositionError object
          //
          function onError(error) {
            console.log(error)
            reject(error)
          }

          navigator.geolocation.getCurrentPosition(onSuccess, onError, {enableHighAccuracy: true});
    })
  }

  getInventories(id){
    var productSum
    var totals = []
    var salesTotal = 0
    var psr = []
    var ar
    return new Promise((resolve, reject) => {

      this.getProductsAndKeys().then((pk:any)=>{
        for(var x in pk.raw){
          ar = pk.raw[x]
          psr[ar.id] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0, name: ar.sku, c_name: ar.name, unit_name: ar.unit_name}
        }

        productSum = psr
        totals = new Array()
        salesTotal = 0

        for(var x in pk.keys){
          totals[pk.keys[x]] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0}
        }

        this.myDatabase.dbQueryRes("SELECT disr_items.*, products.category AS category, products.price, products.name FROM disr_items, products WHERE products.id = disr_items.product_id AND disr_items.creator_id = ? AND disr_items.disr_id = ?", [this.myDatabase.userInfo.id, id]).then((res:any) => {
          console.log(res)

          for(var x in res){

            if(res[x].type == "Beginning"){
              productSum[res[x].product_id].beginning += res[x].plus
              totals[res[x].category]["beginning"] += res[x].plus
            }

            if(this.pluses(res[x].type)){
              productSum[res[x].product_id].remaining += res[x].plus
              totals[res[x].category]["remaining"] += res[x].plus
            }

            if(this.minuses(res[x].type)){
              productSum[res[x].product_id].remaining -= res[x].minus
              totals[res[x].category]["remaining"] -= res[x].minus
            }

            if(res[x].type == "Reloaded"){
              productSum[res[x].product_id].reload += res[x].plus
              totals[res[x].category]["reload"] += res[x].plus
            }

            if(res[x].type == "Removed"){
              productSum[res[x].product_id].reload -= res[x].minus
              totals[res[x].category]["reload"] -= res[x].minus
            }

            if(res[x].type == "Sold"){
              productSum[res[x].product_id].sold -= res[x].minus
              totals[res[x].category]["sold"] -= res[x].minus
              salesTotal += res[x].minus * res[x].price
            }
          }


          resolve({productSum: productSum, totals: totals, salesTotal: salesTotal, raw: res})
        }).catch(e => {
          console.log(e)
        })

      })


    })
  }

  getProductsAndKeys(){
    return new Promise((resolve, reject) => {
      let products = []
      let keys = []

      this.myDatabase.dbQueryRes("SELECT * from products ORDER BY sequence", []).then((data:any) => {
        var ar
        var arr = []
        for(var x in data){
          ar = data[x]
          arr.push(ar)
        }
        products =  _.groupBy(arr, 'category')
        keys = Object.keys(products);

        resolve({keys: keys, products: products, raw: data})

      })
    })
  }

  sendClientReportNow(machine){
    let start = moment().startOf("year").format("x")
    let end = moment().endOf("year").format("x")
    this.myDatabase.dbQueryRes("SELECT products.id, disr_items.created_date, disr_items.minus FROM disr_items, products, orders WHERE disr_items.product_id = products.id AND orders.id = disr_items.order_id AND orders.client_id = ? AND (disr_items.created_date >= ? AND disr_items.created_date <= ?) AND disr_items.type = ? AND products.sku = ?", [machine.client_id, start, end, "Sold", "cup_65"]).then((items: any) => {
      console.log("Client Report Sold", items)
      if(items.length){
        for(var x in items){
          items[x].date = moment(items[x].created_date).format("MMM")
        }

        let months = _.groupBy(items, 'date')
        console.log("months", months)
        var data = []
        var rem = []
        var sum = 0
        var total = 0
        for(var x in months){
          sum = 0
          for(var y in months[x]){
            if(months[x][y].id == 11)
              sum += (months[x][y].minus * 1.44)

            total += (months[x][y].minus * 1.44)
          }
          data.push({sum: sum, count: months[x].length, date: x})
          rem.push({sum: sum, count: months[x].length, date: x})
        }

        console.log("Data", data)
        var current = data[data.length - 1]
        console.log("Current Month", current)
        var remainingMonths = _.filter(rem, function(o) { return (o.date != current.date); });
        console.log("Remaining Months", remainingMonths)
        var year = moment().format("YYYY")
        let msg = "Hi " + machine.client_name + ",\nAng iyong " + year + " Kapeng Vendo estimated Net income\n\n"
        msg += "Current Month: ₱" + current.sum + "\n\n"
        for(var x in remainingMonths){
          msg += remainingMonths[x].date + ": ₱" + remainingMonths[x].sum + "\n"
        }
        msg += "TOTAL: ₱" + total + "\n"
        let address = (machine.region == "") ? "Unknown" : machine.region + ", " + machine.municipal + ", " + machine.brgy
        msg += "Machine Located @ " + address + "\n"
        msg += "Map: http://maps.google.com/?q="+machine.lat+","+machine.lng
        this.sendSMS([machine.client_contact], msg, false)
        this.myDatabase.dbQueryRes("UPDATE machines SET report_date = ? WHERE id = ?", [this.myDatabase.getTimestamp(), machine.id])
      }

    })
  }

  sendClientReport(machine){
    this.myDatabase.dbQueryRes("SELECT report_date FROM machines WHERE id = ?", [machine.id]).then((r:any) => {
      console.log("Report Date", r[0].report_date)
      var thisMonth = moment().format("MM-YYYY");
      console.log("This Month", thisMonth)
      if(r[0].report_date == null){
        if(machine.client_contact.length > 7)
          this.sendClientReportNow(machine)
      }else{
        let lastReportMonth = moment(r[0].report_date).format("MM-YYYY")
        if(thisMonth != lastReportMonth){
          if(machine.client_contact.length > 7)
            this.sendClientReportNow(machine)
        }else{
          console.log("Report already sent and updated")
        }
      }
    })
  }

  chkCalls(ts){
    console.log(ts)
    return new Promise((resolve, reject) => {

      let ddd = moment(parseInt(ts)).format("ddd");
      let month = moment(parseInt(ts)).format("MM");
      let day = moment(parseInt(ts)).format("DD");
      let year = moment(parseInt(ts)).format("YYYY");
      let ts2 = moment(year + "-" + month + "-" + day).format("x")

      console.log("data", [ddd, month, day, year])
      this.myDatabase.dbQueryRes("SELECT COUNT(id) AS total_visited FROM machines WHERE creator_id = ? AND delivery = ? AND created_date < ? AND id IN (SELECT machine_id FROM callsheets WHERE creator_id = ? AND (strftime('%m', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%d', date(created_date / 1000, 'unixepoch', '+8 hours')) = ?) AND (distance <= ? OR distance IS NULL))", [this.myDatabase.userInfo.id, ddd, ts2, this.myDatabase.userInfo.id, month, year, day, this.gpsMinimumMeter]).then((vc:any) => {
        console.log("Visited Calls", vc[0].total_visited)
        this.myDatabase.dbQueryRes("SELECT COUNT(id) AS total_units FROM machines WHERE creator_id = ? AND delivery = ? AND created_date <= ?", [this.myDatabase.userInfo.id, ddd, ts2]).then((tc:any) => {
          console.log("Total Calls", tc[0].total_units)
          resolve({"total_visited": vc[0].total_visited, "total_units": tc[0].total_units})
        })
      })
    })
  }

  confirm(title, msg, agree = 'Agree', disagree = 'Disagree'){
    return new Promise((resolve, reject) => {
      this.alertCtrl.create({
        title: title,
        message: msg,
        buttons: [
          {
            text: disagree,
            handler: () => {
              reject()
            }
          },
          {
            text: agree,
            handler: () => {
              resolve()
            }
          }
        ]
      }).present()
    })
  }

  soldGoods(start, end){
    return new Promise((resolve, reject) => {
      //Sold Powder
      this.myDatabase.dbQueryRes("SELECT SUM(disr_items.minus) AS total, products.name AS product_name, products.category AS product_category, products.id AS product_id FROM disr_items, products WHERE disr_items.type = 'Sold' AND disr_items.creator_id = ? AND (disr_items.created_date >= ? AND disr_items.created_date <= ?) AND disr_items.product_id = products.id GROUP BY products.id", [this.myDatabase.userInfo.id, start, end]).then((solds:any) => {
        resolve(solds)
      })
    })
  }

  dailyCallsheet(ts){
    return new Promise((resolve, reject) => {

      let ts1 = parseInt(ts)
      let ddd = moment(ts1).format("ddd");
      let month = moment(ts1).format("MM");
      let day = moment(ts1).format("DD");
      let year = moment(ts1).format("YYYY");
      let ts2 = moment(year + "-" + month + "-" + day).format("x")
      let sDate = moment(year + "-" + month + "-" + day).format("dddd, MMMM Do YYYY")

      let calls = []
      let chartData = []
      let chartLabels = []
      let totalNew = 0
      let new_ids = []
      let visited_ids = []
      let total_machines = 0
      let missed_ids = []
      let sales = []
      this.myDatabase.dbQueryRes("SELECT callsheets.*, machines.created_date AS machine_created_date, machines.lat AS machine_lat, machines.lng AS machine_lng, machines.region AS machine_region, machines.municipal AS machine_municipal, machines.brgy AS machine_brgy, machines.delivery AS delivery, clients.name AS client_name from callsheets LEFT OUTER JOIN machines ON callsheets.machine_id = machines.id LEFT OUTER JOIN clients ON machines.owner_id = clients.id WHERE callsheets.creator_id = ? AND strftime('%m', date(callsheets.created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(callsheets.created_date / 1000, 'unixepoch')) = ? AND strftime('%d', date(callsheets.created_date / 1000, 'unixepoch', '+8 hours')) = ?", [this.myDatabase.userInfo.id, month, year, day]).then((data:any) => {
        if(data.length === 0){
          resolve({calls: calls, chartData: chartData, chartLabels: chartLabels, totalNew: totalNew, new_ids: new_ids, visited_ids: visited_ids, total_machines: total_machines, missed_ids: missed_ids, sales: sales})
        }

        var k = []
        var ar
        for(var x in data){
          ar = data[x]
          if(ar.type == "Sale")
            ar.icon = "cart"
          if(ar.type == "No Sale")
            ar.icon = "sad"
          if(ar.type == "Development")
            ar.icon = "chatbubbles"
          if(ar.type == "Repair")
            ar.icon = "construct"
          if(ar.type == "Cleaning")
            ar.icon = "color-fill"
          if(ar.type == "No Action")
            ar.icon = "hand"

          ar.time = moment(ar.created_date).format("hh:mm A")
          ar.isNew = (sDate == moment(ar.machine_created_date).format("dddd, MMMM Do YYYY")) ? true : false
          calls.push(ar)
          if(ar.distance <= this.gpsMinimumMeter)
            k.push(ar)
        }

        var c = _.countBy(k, 'type');


        for(var x in c){
          chartData.push(c[x])
          chartLabels.push(x)
        }

        // newly added clients
        this.myDatabase.dbQueryRes("SELECT id FROM machines WHERE creator_id = ? AND delivery = ? AND (strftime('%m', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%d', date(created_date / 1000, 'unixepoch', '+8 hours')) = ?)", [this.myDatabase.userInfo.id, ddd, month, year, day]).then((nac:any) => {
          totalNew = nac.length
          for (var x in nac) {
            new_ids.push(nac[x].id)
          }

          //Visited calls
          this.myDatabase.dbQueryRes("SELECT id FROM machines WHERE creator_id = ? AND delivery = ? AND created_date < ? AND id IN (SELECT machine_id FROM callsheets WHERE creator_id = ? AND (strftime('%m', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%d', date(created_date / 1000, 'unixepoch', '+8 hours')) = ?) AND (distance <= ? OR distance IS NULL))", [this.myDatabase.userInfo.id, ddd, ts2, this.myDatabase.userInfo.id, month, year, day, this.gpsMinimumMeter]).then((vc:any) => {
            for (var x in vc) {
              visited_ids.push(vc[x].id)
            }

            //total calls
            this.myDatabase.dbQueryRes("SELECT COUNT(id) AS total_units FROM machines WHERE creator_id = ? AND delivery = ? AND created_date <= ?", [this.myDatabase.userInfo.id, ddd, ts2]).then((tc:any) => {
              total_machines = tc[0].total_units

              //missed
              this.myDatabase.dbQueryRes("SELECT id FROM machines WHERE creator_id = ? AND delivery = ? AND created_date < ? AND id NOT IN (SELECT machine_id FROM callsheets WHERE creator_id = ? AND (strftime('%m', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%d', date(created_date / 1000, 'unixepoch', '+8 hours')) = ?) AND (distance <= ? OR distance IS NULL))", [this.myDatabase.userInfo.id, ddd, ts2, this.myDatabase.userInfo.id, month, year, day, this.gpsMinimumMeter]).then((mc:any) => {
                for(var x in mc){
                  missed_ids.push(mc[x].id)
                }

                //Sold Powder
                this.myDatabase.dbQueryRes("SELECT SUM(disr_items.minus) AS total, products.name AS product_name, products.category AS product_category FROM disr_items, products WHERE disr_items.type = 'Sold' AND disr_items.creator_id = ? AND (strftime('%m', date(disr_items.created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(disr_items.created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%d', date(disr_items.created_date / 1000, 'unixepoch', '+8 hours')) = ?) AND disr_items.product_id = products.id GROUP BY products.id", [this.myDatabase.userInfo.id, month, year, day]).then((sp:any) => {
                  console.log(sp)
                  var ar
                  for(var x in sp){
                    ar = sp[x]
                    sales.push(ar)
                  }

                  resolve({calls: calls, chartData: chartData, chartLabels: chartLabels, totalNew: totalNew, new_ids: new_ids, visited_ids: visited_ids, total_machines: total_machines, missed_ids: missed_ids, sales: sales})
                })

              })
            })
          })
        })
      })
    })
  }

  firstCall(){
    let ts = parseInt(this.myDatabase.getTimestamp())
    let month = moment(ts).format("MM");
    let day = moment(ts).format("DD");
    let year = moment(ts).format("YYYY");

    this.myDatabase.dbQueryRes("SELECT callsheets.*, clients.name AS name, clients.contact AS contact, machines.region, machines.municipal, machines.brgy FROM callsheets, machines LEFT OUTER JOIN clients ON machines.owner_id = clients.id WHERE callsheets.machine_id = machines.id AND callsheets.creator_id = ? AND (strftime('%m', date(callsheets.created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(callsheets.created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%d', date(callsheets.created_date / 1000, 'unixepoch', '+8 hours')) = ?) AND (callsheets.distance <= ? OR callsheets.distance IS NULL) ORDER BY callsheets.id LIMIT 1", [this.myDatabase.userInfo.id, month, year, day, this.gpsMinimumMeter]).then((res:any) => {
      this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "new machine report"]).then((nc:any) => {
        if(nc.length){
          let result = res[0]
          let contacts = nc[0].number.split(",")
          let address = (result.region) ? result.region + ", " + result.municipal + ", " + result.brgy : "Unknown"

          let thisDate = moment(result.created_date).format("ddd, MMM D")
          let thisTime = moment(result.created_date).format("hh:mm a")
          var msg = "First Call ("+thisDate+")\n"
          msg += "Time: " + thisTime + "\n"
          msg += "Validation: " + moment().format("x") + "\n"
          msg += "Reporting from: " + address + "\n\n"

          if(result.contact)
            msg += "To validate this first call please contact "+result.contact+" and look for "+result.name+"\n\n"
          else if (result.name)
            msg += result.name + " does not have a contact info to validate this first call\n\n"
          else{
            msg += "The machine visited is still in lead status\n\n"
          }

          msg += "Map: http://maps.google.com/?q="+result.lat+","+result.lng

          this.sendSMS(contacts, msg, false)
        }
      })
    })
  }

  dailyReport(ts, intent = false, number:any = false){
    this.dailyCallsheet(ts).then((data:any) => {
      this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "general report"]).then((nc:any) => {
        if(nc.length){
          this.getMachineStatus().then((machineStatus:any)=>{
            let lat = this.myPos.coords.latitude
            let lng = this.myPos.coords.longitude
            this.getLocation([lat, lng]).then((loc:any) => {
              let contacts = nc[0].number.split(",")
              if(data.calls.length === 0){
                var msg = "Barista Choi: No Data Retrieved for the selected daily Callsheet"
              }
              else{
                let address = (loc.NAME_1) ? loc.NAME_1 + ", " + loc.NAME_2 + ", " + loc.NAME_3 : "Unknown"

                let ddd = moment(parseInt(ts)).format("ddd")
                let thisDate = moment(data.calls[0].created_date).format("ddd, MMM D")
                let firstCall = moment(data.calls[0].created_date).format("hh:mm a")
                let lastCall = moment(data.calls[data.calls.length - 1].created_date).format("hh:mm a")
                let catSales = this.groupBySum(data.sales, "product_category", "total")
                let totalSales = 0
                let GPSProblem = 0
                let specialVisit = 0
                let newClient = 0


                var msg = "DCS Report ("+thisDate+")\n"

                msg += "First Call: " + firstCall + "\n"
                msg += "Last Call: " + lastCall + "\n"
                msg += "Visits: " + data.visited_ids.length + " / "+ data.total_machines +"\n"
                for(var x in data.chartData){
                  msg += data.chartLabels[x] + ": " + data.chartData[x] + "\n"
                }


                for(var x in catSales){
                  msg += catSales[x].group + ": " + catSales[x].value + "\n"
                }

                msg += "Lead: " + machineStatus.lead + "\n"
                msg += "Prospect: " + machineStatus.prospect + "\n"
                msg += "Active: " + machineStatus.active + "\n"
                msg += "Total Machines: " + (machineStatus.active + machineStatus.prospect + machineStatus.lead) + "\n"

                for(var x in data.calls){
                  if(data.calls[x].type == "Sale"){
                    totalSales += parseFloat(data.calls[x].note)
                  }

                  if(data.calls[x].distance === null)
                    GPSProblem++
                  if(ddd != data.calls[x].delivery)
                    specialVisit++
                  if(data.calls[x].isNew)
                    newClient++
                }

                /*if(data.calls.length > 1){
                  let t_a = moment(data.calls[0].created_date)
                  let t_b = moment(data.calls[data.calls.length - 1].created_date)

                  msg += "Consumed Time: "+ t_a.to(t_b, true) + "\n"
                }*/


                if(GPSProblem)
                  msg += "GPS Problem: "+ GPSProblem + "\n"
                if(specialVisit)
                  msg += "Special Visit: "+ specialVisit + "\n"
                /*if(newClient)
                  msg += "New Client: "+ newClient + "\n"*/
                if(this.myDatabase.unsents.length)
                  msg += "Unsent Msg: " + this.myDatabase.unsents.length + "\n"

                msg += "Total Sales: ₱" + totalSales + "\n"
                msg += "Validation: " + moment().format("x") + "\n"

                msg += "Reporting from: " + address + "\n\n"

                msg += "Map: http://maps.google.com/?q="+lat+","+lng
              }


              if(number)
                contacts = [number]
              this.sendSMS(contacts, msg, intent)
            })
          })

        }
      })
    })
  }

  getMachineStatus(){
    return new Promise(resolve => {
      this.myDatabase.dbQueryRes("SELECT machines_a.owner_id AS owner_id, clients_a.last_order_date AS client_last_order_date, (SELECT order_c.client_id FROM orders order_c WHERE order_c.client_id = clients_a.id ORDER BY order_c.created_date DESC LIMIT 1 ) AS last_order FROM machines machines_a LEFT OUTER JOIN clients clients_a ON machines_a.owner_id = clients_a.id WHERE machines_a.creator_id = ?", [this.myDatabase.userInfo.id]).then((data:any)=>{
        var ar
        var arr = []
        for(var x in data){
          ar = data[x]
          ar.client_status = (ar.last_order) ? "active" : (ar.client_last_order_date) ? "active" : (ar.owner_id) ? "prospect" : "lead"
          arr.push(ar)
        }

        var c = _.countBy(arr, 'client_status');
        var stat = {lead: 0, prospect: 0, active: 0}
        if("undefined" !== typeof c.lead)
          stat.lead = c.lead
        if("undefined" !== typeof c.prospect)
          stat.prospect = c.prospect
        if("undefined" !== typeof c.active)
          stat.active = c.active

        console.log("Status", stat)
        resolve(stat)
      })
    })
  }

  groupBySum(array, groupBy, sumBy){
    let output = _(array)
      .groupBy(groupBy)
      .map((v, k) => ({
        'group': k,
        'value': _.sumBy(v, sumBy)
      })).value();

    return output
  }

  groupByCountSum(array, groupBy, totalField){
    var group = _.groupBy(array, groupBy)
    return _.map(_.keys(group), function(e) {
        return _.reduce(group[e], function(r, o) {
          return r.sum += +o[totalField].toFixed(2), r
        }, {name: e, sum: 0, count: group[e].length})
      })
  }

  getCarrier(c){
    var carriers = this.myDatabase.carriers
    var res = _.filter(carriers, function(cr) { return c.search(cr.prefix) != -1; });
    if(res.length == 1)
      return res[0].carrier
    if(res.length > 1){
      var ord = _.orderBy(res, ['prefix'], ['desc']);
      return ord[0].carrier
    }
    else
      return "Unknown"
  }

  capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
  }

  importMachines(){
    return new Promise(resolve => {
      this.http.get('assets/machines.json')
        .map(res => res.json())
        .subscribe(data => {
          resolve(data)
        });
    })
  }

  startIt(){
    if (window.SMS) {
      window.SMS.startWatch(() => {
        console.log("startWatch");
      }, error => {
        console.log(error);
        console.log("error startWatch");
      });
    }
    document.addEventListener('onSMSArrive', this.smsArived);
  }


  startWhatchSMS() {

    var filter = {
      box : 'inbox', // 'inbox' (default), 'sent', 'draft', 'outbox', 'failed', 'queued', and '' for all

      // following 4 filters should NOT be used together, they are OR relationship
      read : 0, // 0 for unread SMS, 1 for SMS already read

      // following 2 filters can be used to list page up/down
      indexFrom : 0, // start from index 0
      maxCount : 10, // count of SMS to return each time
    };
    if(window.SMS) window.SMS.listSMS(filter, (data:any) =>{
      console.log(data)
      this.startIt()
    }, function(err){
      console.log('error list sms: ' + err);
    });


  }

  locationAccuracyRequest(){
    LocationAccuracy.canRequest().then((canRequest: boolean) => {

      if(canRequest) {
        // the accuracy option will be ignored by iOS
        LocationAccuracy.request(LocationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
            () => {
              console.log("Location is now fully working");
            },
            error => {
              alert("The GPS settings is turned off, please turn it on when using this application...")
              this.platform.exitApp()
            }
        );
      }else{

      }

    });
  }

  checkGps(){
    //GPS Check!
    let locationSuccessCallback = (isAvailable) => {
      if(isAvailable){
        console.log("Yes GPS");
      }
      else{
        this.locationAccuracyRequest();
      }
    };
    let locationErrorCallback = (e) => {
      this.toastCtrl.create({
        message: 'Barista Choi App: Location Error',
        showCloseButton: true,
        duration: 1000
      }).present();
    };
    Diagnostic.isLocationAvailable().then(locationSuccessCallback, locationErrorCallback);
    //End of GPS Check
  }

  disableLocation(){
    try {
      navigator.geolocation.clearWatch(this.gpsSubscription);
      console.log("GPS Watch disabled!");
    } catch (e){
      console.log("GPS unable to disable... variable not ready", e)
    }
  }

  enableLocation(){
    this.disableLocation();
    console.log("Enable Location")

    let self = this

    function onSuccess(position) {
      self.events.publish('location:watching', position);
      console.log(position)
      self.myPos = position
      self.gpsSignal = true
      self.gpsError = false
    }

    // onError Callback receives a PositionError object
    //
    function onError(error) {
      console.log(error)
      self.gpsError = true
    }

    // Options: throw an error if no update is received every 30 seconds.
    //
    this.gpsSubscription = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true, maximumAge: 0 });

  }

  enableBackgroundLocation(){

    const config: BackgroundGeolocationConfig = {
      desiredAccuracy: 10,
      stationaryRadius: 20,
      distanceFilter: 30,
      debug: false, //  enable this hear sounds for background-geolocation life-cycle.
      stopOnTerminate: true, // enable this to clear background location settings when the app terminates
      startOnBoot: true,
    };

    this.backgroundGeolocation.configure(config)
    .subscribe((location: BackgroundGeolocationResponse) => {

      console.log('[js] BackgroundGeolocation callback:  ' + location.latitude + ',' + location.longitude);
      this.events.publish('location:watching', {coords:location});
      console.log(location);
      this.myPos = {coords:location}
      this.gpsSignal = true

      // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
      // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
      // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
      //BackgroundGeolocation.finish(); // FOR IOS ONLY

    });

    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
    this.backgroundGeolocation.start();
  }



  getGPSlogs(){
    return new Promise((resolve, reject) => {
      this.backgroundGeolocation.getLogEntries(10000).then(logEntries => {
        //console.log("Geo Log Entries", logEntries)

        function toFloat(str){
          return parseFloat(str)
        }

        var newLogs = []
        var myDate
        var myTime
        var theMsg
        var locSlice
        var velSlice
        var bearSlice
        var altSlice
        for(var x in logEntries){
          if(logEntries[x].message.search("vel=") != -1){
            if(logEntries[x].message.search("vel=0.0") == -1){
              theMsg = logEntries[x].message
              myDate = moment(logEntries[x].timestamp).format("MM/DD/YYYY")
              myTime = moment(logEntries[x].timestamp).format("hh:mm:ss A")
              locSlice = theMsg.slice(theMsg.indexOf("[gps ") + 5)
              velSlice = theMsg.slice(theMsg.indexOf("vel=") + 4)
              bearSlice = theMsg.slice(theMsg.indexOf("bear=") + 5)
              altSlice = theMsg.slice(theMsg.indexOf("alt=") + 4)
              logEntries[x]["myDate"] = myDate
              logEntries[x]["myTime"] = myTime
              logEntries[x]["mode"] = (theMsg.search("BGLocation") != -1) ? "Background" : "Foreground"
              logEntries[x]["location"] = locSlice.slice(0, locSlice.indexOf(" ")).split(",").map(toFloat)
              logEntries[x]["speed"] = parseFloat(velSlice.slice(0, velSlice.indexOf(" ")))
              logEntries[x]["bearing"] = parseFloat(bearSlice.slice(0, bearSlice.indexOf(" ")))
              logEntries[x]["altitude"] = parseFloat(altSlice.slice(0, altSlice.indexOf(" ")))
              newLogs.push(logEntries[x])
            }

          }

        }

        //console.log("Geo Log Entries", newLogs)
        resolve(newLogs)
      }).catch(_=> {reject()})
    })

  }

  disableBackgroundLocation(){
    this.backgroundGeolocation.stop();
  }

  toastIt(msg, duration = 10000, position = "bottom"){
    this.toastCtrl.create({
      message: msg,
      showCloseButton: true,
      duration: duration,
      position: position
    }).present();
  }

  distance(lat1, lon1, lat2, lon2) {
    var p = 0.017453292519943295;    // Math.PI / 180
    var c = Math.cos;
    var a = 0.5 - c((lat2 - lat1) * p)/2 +
      c(lat1 * p) * c(lat2 * p) *
      (1 - c((lon2 - lon1) * p))/2;

    return (12742 * Math.asin(Math.sqrt(a)) * 1000).toFixed(2); // 2 * R; R = 6371 km
  }

  checkIfFileExists(path, fileName){
    return new Promise((resolve) => {
      window.resolveLocalFileSystemURL(path, function(ob) {

        var storeOb = ob;

        //Let's check the directory to see if our file exists
        storeOb.getFile(fileName, {create:false}, function(f) {
          console.log('file did exist');
          resolve(true)
        }, function(e) {
          console.log('file did not exist');
          resolve(false)

        });
      });
    })
  }

  loadbarangays(){
    let self = this
    this.checkIfFileExists(cordova.file.externalApplicationStorageDirectory, "barangays.db").then((c:any) => {
      if(c){
        this.barangays = window.sqlitePlugin2.openDatabase({name: cordova.file.externalApplicationStorageDirectory + "barangays.db", location: 'default'});
      }else{
        var URI_DB = 'file:///android_asset/www/assets/';
        var PARENT_DIR = cordova.file.externalApplicationStorageDirectory
        var NAME_DB ="barangays.db";
        var NEW_NAME_BACKUP = "barangays.db";
        window.resolveLocalFileSystemURL(URI_DB+NAME_DB, function(fs) {
          window.resolveLocalFileSystemURL(PARENT_DIR, function(directoryEntry){
            fs.copyTo(directoryEntry, NEW_NAME_BACKUP, function() {
              console.log("barangays db successfully copied!");
              self.barangays = window.sqlitePlugin2.openDatabase({name: cordova.file.externalApplicationStorageDirectory + "barangays.db", location: 'default'});
            });
          });
        });
      }
    })
  }

  brgyDbExec(transaction, values){
    return new Promise((resolve, reject) => {
      this.barangays.transaction(function (tx) {
        tx.executeSql(transaction, values, function (tx, rs) {
          var arr = []
          for(var i = 0; i < rs.rows.length; i++){
            arr.push(rs.rows.item(i))
          }
          resolve(arr)
        }, function (tx, error) {
          reject(error)
        });
      })
    });
  }

  isPointInPoly(vs, point) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

    var x = point[0], y = point[1];

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];

      var intersect = ((yi > y) != (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  getLocation(pos){
    return new Promise((resolve, reject) => {
      let self = this
      this.barangays.transaction(function (tx) {
        tx.executeSql('SELECT NAME_1, NAME_2, NAME_3, ASGeoJSON(Geometry) AS geo FROM barangays WHERE MbrWithin(GeomFromText(?), geometry)', ['POINT('+pos[1]+' '+pos[0]+')'], function (tx, rs) {
          var arr = []
          var geo
          var real = {"NAME_1": "", "NAME_2": "", "NAME_3": ""}
          for(var i = 0; i < rs.rows.length; i++){
            arr.push(rs.rows.item(i))
          }
          console.log("BRGY Result: ", arr)

          for(var x in arr){
            geo = JSON.parse(arr[x].geo)
            geo = geo["coordinates"][0][0]
            if(self.isPointInPoly(geo, [pos[1], pos[0]])){
              real = arr[x]
            }
          }

          console.log(real)

          resolve(real)
        }, function (tx, error) {
          reject(error)
        });
      })
    });
  }

  sendSMSNow(n, msg, intent, save, id){
    return new Promise((resolve, reject) => {
      if(n){
        SMS.send(n, msg, {replaceLineBreaks: true, android: {intent: (intent) ? "INTENT" : ''}}).then(()=>{
          console.log("SMS sent:", msg, n)
          if(id){
            this.myDatabase.dbQueryRes("DELETE FROM sms_unsent WHERE id = ?", [id]).then(()=>{
              this.myDatabase.refreshUnsents()
              resolve()
            })
          }else{
            resolve()
          }
        }).catch(e => {
          console.log("Sending SMS failed", e)
          if(save){
            this.toastIt("An SMS sent in background has failed. pls check your Unsent SMS")
            if(n){
              this.myDatabase.dbQueryRes("INSERT INTO sms_unsent VALUES (?, ?, ?, ?, ?)", [this.myDatabase.getTimestamp(), this.myDatabase.userInfo.id, msg, n, null]).then(()=>{
                this.myDatabase.refreshUnsents()
                reject(e)
              })
            }else{
              reject(e)
            }
          }else{
            if(id){
              this.events.publish('sms:failed', id);
              this.toastIt("An SMS sent in background has failed. you may manually send it using your default SMS program")
            }
            else{
              this.myDatabase.refreshUnsents()
            }
            reject(e)
          }
        })
      }else{
        reject()
      }

    })
  }

  sendSMS(n, msg, intent, save = true, id = 0){
    return new Promise((resolve, reject) => {
      let sent = -1
      let self = this
      console.log("numbers:", n)
      function s(){
        sent++
        if("undefined" === typeof n[sent]){
          resolve()
        }else{
          self.sendSMSNow(n[sent], msg, intent, save, id).then(()=>{
            if(sent < n.length){
              s()
            }else{
              resolve()
            }
          }).catch(()=>{
            if(sent < n.length){
              s()
            }else{
              resolve()
            }
          })
        }
      }

      if(intent){
        this.sendSMSNow(n, msg, intent, save, id).then(()=>{
          resolve()
        })
      }else{
        s()
      }


    })
  }

  convertDay(day){
    return moment().day(day).format("dddd")
  }

  addS(name, value){
    return (value > 1) ? name + "s" : name
  }

  alert(title, msg){
    this.alertCtrl.create({
      title: title,
      subTitle: msg,
      buttons: ['OK']
    }).present()
  }

  pluses(val){
    return _.includes(["Beginning", "Reloaded", "Previous"], val)
  }

  minuses(val){
    return _.includes(["Removed", "Sold", "Transferred"], val)
  }

  isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  import2Contacts(){
    this.myDatabase.showLoading("Importing Contacts...")
    this.myDatabase.dbQueryRes("SELECT name, contact, contact2 FROM clients WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((c:any)=>{
      console.log("Clients", c)
      var counter = 0
      var y = 0
      let self = this
      var phoneNumbers = [];

      function onSuccess(contact) {
        counter++
        go()
      };

      function onError(contactError) {
        counter++
        go()
      };

      function go(){
        phoneNumbers = []
        y = 0
        if(counter < c.length){
          if(c[counter].contact){
            self.contactSearch(c[counter].contact).then((r:any)=>{
              if(r.length == 0){


                var contact = navigator.contacts.create();
                contact.displayName = c[counter].name
                phoneNumbers[y] = new ContactField(self.getCarrier(c[counter].contact), c[counter].contact, true);


                if(c[counter].contact2){
                  y++;
                  phoneNumbers[y] = new ContactField(self.getCarrier(c[counter].contact2), c[counter].contact2, false);
                }


                contact.phoneNumbers = phoneNumbers;
                console.log("Importing ", c[counter].name)
                contact.save(onSuccess,onError);
              }else{
                counter++
                go()
              }
            })
          }
          else{
            counter++
            go()
          }
        }else{
          self.myDatabase.hideLoading()
        }
      }

      go()
    })
  }

  contactSearch(val) {
    return new Promise((resolve, reject) => {
      function ContactOnSuccess(contacts) {
        resolve(contacts)
      }

      function ContactOnError(contactError) {
        reject(contactError)
      }


      var options = new ContactFindOptions();
      options.filter = val;
      options.multiple = true;
      options.hasPhoneNumber = true;
      var fields = [navigator.contacts.fieldType.phoneNumbers];
      navigator.contacts.find(fields, ContactOnSuccess, ContactOnError, options);
    })
  }

  b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }

  resizeIt(cDir, filename, quality, width, height){
    return new Promise((resolve, reject) => {
      let self = this
      let options = {
        uri: cDir + filename,
        folderName: 'baristachoi_converts',
        fileName: filename,
        quality: quality,
        width: width, /* 128 */
        height: height /** 96 */
      } as ImageResizerOptions;
      console.log("Read Dir", cDir + filename)
      ImageResizer
        .resize(options)
        .then(
          (filePath: string) => {
            console.log('FilePath', filePath);

            window.resolveLocalFileSystemURL(filePath, gotFile, fail);

            function fail(e) {
              alert('Cannot found requested file');
            }

            function gotFile(fileEntry) {
              fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onloadend = function(e) {
                  var content = this.result;
                  var path = filePath.substring(0, Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\")));
                  var fName = filePath.replace(/^.*[\\\/]/, '').replace(/\%20/gim, " ")
                  resolve({content: content, dir: path, filename: fName})
                };
                // The most important point, use the readAsDatURL Method from the file plugin
                reader.readAsDataURL(file);
              });
            }
          },
          () => { reject('Error occured'); }
      )}
    )
  }

  savebase64AsImageFile(filename,content,contentType, dirP){
    return new Promise((resolve, reject) => {
      // Convert the base64 string in a Blob
      var DataBlob = this.b64toBlob(content,contentType, 512);
      let self = this
      console.log("Starting to write the file :3");

      window.resolveLocalFileSystemURL(dirP, function(dir) {
        console.log("Access to the directory granted succesfully");
        dir.getFile(filename, {create:true}, function(file) {
          console.log("File created succesfully.");
          file.createWriter(function(fileWriter) {
            console.log("Writing content to file");
            fileWriter.onwrite = function(evt) {
                resolve(filename);
            };
            fileWriter.write(DataBlob);

          }, function(){
            reject('Unable to save file in path '+ dirP);
          });
        });
      });
    })
  }

}

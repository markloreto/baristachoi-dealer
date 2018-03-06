import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ToastController, Events, AlertController } from 'ionic-angular';
import { Diagnostic, LocationAccuracy, Geolocation, BackgroundGeolocation, SMS, Sim, Contacts, ContactField, ContactFindOptions } from 'ionic-native';
import { MyDatabase } from '../providers/my-database'
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
  constructor(public http: Http, public toastCtrl: ToastController, public events: Events, public myDatabase: MyDatabase, public alertCtrl: AlertController) {
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

  remainingStockReportGet(number, disr){
    var products = []
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
        productSum[ar.id] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0}
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
          console.log(disrData)
          for(var x in disrData){
            productSum[disrData[x]["product_id"]].previous += disrData[x].inventory
            productSum[disrData[x]["product_id"]].remaining += disrData[x].inventory

            totals[disrData[x]["category"]]["remaining"] += disrData[x].inventory
            totals[disrData[x]["category"]]["previous"] += disrData[x].inventory
          }

          /*this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "remit and deposits report"]).then((nc:any) => {
            if(nc.length){
              let lat = this.myPos.coords.latitude
              let lng = this.myPos.coords.longitude
              this.getLocation([lat, lng]).then((loc:any) => {

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


                var msg = "Daily Callsheet Summary ("+thisDate+")\n"

                msg += "First Call: " + firstCall + "\n"
                msg += "Last Call: " + lastCall + "\n"
                msg += "Visits: " + data.visited_ids.length + " / "+ data.total_machines +"\n"
                for(var x in data.chartData){
                  msg += data.chartLabels[x] + ": " + data.chartData[x] + "\n"
                }

                console.log(catSales)

                for(var x in catSales){
                  msg += catSales[x].group + ": " + catSales[x].value + "\n"
                }

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

                if(data.calls.length > 1){
                  let t_a = moment(data.calls[0].created_date)
                  let t_b = moment(data.calls[data.calls.length - 1].created_date)

                  msg += "Consumed Time: "+ t_a.to(t_b, true) + "\n"
                }


                if(GPSProblem)
                  msg += "GPS Problem: "+ GPSProblem + "\n"
                if(specialVisit)
                  msg += "Special Visit: "+ specialVisit + "\n"
                if(newClient)
                  msg += "New Client: "+ newClient + "\n"

                msg += "Total Sales: ₱" + totalSales + "\n"

                msg += "Reporting from: " + address + "\n\n"

                msg += "Map: http://maps.google.com/?q="+lat+","+lng


                this.sendSMS([number], msg, false)
              })
            }
          })*/


        })
      })


    })
  }

  remainingStockReport(number, disrSeq:any = false){
    if(disrSeq){
      this.myDatabase.dbQueryRes("SELECT * FROM disr WHERE creator_id = ? AND sequence_id = ?", [this.myDatabase.userInfo.id, disrSeq]).then((disr:any) => {
        this.remainingStockReportGet(number, disr)
      })
    }else{
      this.myDatabase.dbQueryRes("SELECT * FROM disr WHERE creator_id = ? AND status = ?", [this.myDatabase.userInfo.id, "active"]).then((disr:any) => {
        this.remainingStockReportGet(number, disr)
      })
    }
  }

  getCurrentGPSLocation(){
    Geolocation.getCurrentPosition().then((resp) => {
      this.myPos = resp
      this.gpsSignal = true
    }).catch((error) => {
      console.log('Error getting location', error);
    });
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
          psr[ar.id] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0}
        }

        productSum = psr
        totals = new Array()
        salesTotal = 0

        for(var x in pk.keys){
          totals[pk.keys[x]] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0}
        }

        this.myDatabase.dbQueryRes("SELECT disr_items.*, products.category AS category, products.price FROM disr_items, products WHERE products.id = disr_items.product_id AND disr_items.creator_id = ? AND disr_items.disr_id = ?", [this.myDatabase.userInfo.id, id]).then((res:any) => {
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

  confirm(title, msg){
    return new Promise((resolve, reject) => {
      this.alertCtrl.create({
        title: title,
        message: msg,
        buttons: [
          {
            text: 'Disagree',
            handler: () => {
              reject()
            }
          },
          {
            text: 'Agree',
            handler: () => {
              resolve()
            }
          }
        ]
      }).present()
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


                var msg = "Daily Callsheet Summary ("+thisDate+")\n"

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
      this.myDatabase.dbQueryRes("SELECT t1.owner_id AS owner_id, t3.last_order_date AS client_last_order_date, (SELECT t2.created_date FROM orders t2 WHERE t2.client_id = t3.id ORDER BY t2.created_date DESC LIMIT 1) AS last_order FROM machines t1 LEFT OUTER JOIN clients t3 ON t1.owner_id = t3.id WHERE t1.creator_id = ?", [this.myDatabase.userInfo.id]).then((data:any)=>{
        var ar
        var arr = []
        for(var x in data){
          ar = data[x]
          ar.client_status = (ar.last_order) ? "active" : (ar.owner_id) ? "prospect" : "lead"
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
              this.toastCtrl.create({
                message: error.message,
                showCloseButton: true,
                duration: 1000
              }).present();
              setTimeout(() => {
                this.checkGps();
              }, 2000)

            }
        );
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
      this.gpsSubscription.unsubscribe();
      console.log("GPS Watch disabled!");
    } catch (e){
      console.log("GPS unable to disable... variable not ready")
    }
  }

  enableLocation(){
    this.disableLocation();
    console.log("Enable Location")
    this.gpsSubscription = Geolocation.watchPosition().subscribe(position => {
      this.events.publish('location:watching', position);
      console.log(position)
      this.myPos = position
      this.gpsSignal = true
    });
  }

  enableBackgroundLocation(){
    let config = {
      desiredAccuracy: 10,
      stationaryRadius: 20,
      distanceFilter: 30,
      debug: false, //  enable this hear sounds for background-geolocation life-cycle.
      stopOnTerminate: true, // enable this to clear background location settings when the app terminates
      startOnBoot: true,
    };

    BackgroundGeolocation.configure((location) => {
      console.log('[js] BackgroundGeolocation callback:  ' + location.latitude + ',' + location.longitude);
      //this.events.publish('location:watching', location);
      console.log(location);
      this.myPos = {coords:location}
      this.gpsSignal = true

      // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
      // and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
      // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
      //BackgroundGeolocation.finish(); // FOR IOS ONLY

    }, (error) => {
      console.log('BackgroundGeolocation error');
    }, config);

    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
    BackgroundGeolocation.start();
  }



  getGPSlogs(){
    return new Promise((resolve, reject) => {
      BackgroundGeolocation.getLogEntries(10000).then(logEntries => {
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
    BackgroundGeolocation.stop();
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
              this.myDatabase.dbQueryRes("INSERT INTO sms_unsent VALUES (?, ?, ?, ?)", [this.myDatabase.getTimestamp(), this.myDatabase.userInfo.id, msg, n]).then(()=>{
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

}

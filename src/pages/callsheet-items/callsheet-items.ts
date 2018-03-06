import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import { MapPage } from  '../../pages/map/map';
import {CallsheetStatsPage} from '../../pages/callsheet-stats/callsheet-stats'
import {CallsheetDayPage} from '../../pages/callsheet-day/callsheet-day'
import {ReceiptPage} from '../../pages/receipt/receipt'
import * as moment from 'moment';

/*
  Generated class for the CallsheetItems page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-callsheet-items',
  templateUrl: 'callsheet-items.html'
})
export class CallsheetItemsPage {
  month:any
  year:any
  day:any
  title:any
  calls:any = []
  ddd:any
  chartLabels:any = []
  chartData:any = []
  total_new:number = 0
  new_ids:any = []
  ts:any
  visited_ids:any = []
  total_machines:number
  missed_ids:any = []
  today: any
  sales: any = []
  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public myFunctions: MyFunctions,
              public myDatabase: MyDatabase,
  ) {
    this.month = navParams.get("month")
    this.year = navParams.get("year")
    this.day = navParams.get("day")
    this.title = moment(this.year + "-" + this.month + "-" + this.day).format("dddd, MMMM Do YYYY")
    this.today = moment().format("dddd, MMMM Do YYYY")
    this.ts = moment(this.year + "-" + this.month + "-" + this.day).format("x")//.add(23, "hours").add(59, "minutes").add(59, "seconds")
    this.ddd = moment(this.year + "-" + this.month + "-" + this.day).format("ddd")
  }

  reportIt(ev){
    this.myFunctions.dailyReport(this.ts, false)
    this.myFunctions.toastIt("Sending Daily Report")
  }

  ionViewWillEnter(){
    this.startIt()
  }

  startIt(){
    this.calls = []
    this.chartLabels = []
    this.chartData = []
    this.total_new = 0
    this.new_ids = []
    this.missed_ids = []
    this.visited_ids = []
    this.sales = []
    this.total_machines = 0
    this.myDatabase.showLoading()

    this.myFunctions.dailyCallsheet(this.ts).then((data:any) => {
      this.calls = data.calls
      this.chartLabels = data.chartLabels
      this.chartData = data.chartData
      this.total_new = data.total_new
      this.new_ids = data.new_ids
      this.missed_ids = data.missed_ids
      this.visited_ids = data.visited_ids
      this.sales = data.sales
      this.total_machines = data.total_machines
      this.myDatabase.hideLoading()
    })
  }

  sIt(machine_id){
    this.myDatabase.hideLoading()

    this.myDatabase.dbQueryRes("SELECT created_date FROM callsheets WHERE machine_id = ? ORDER BY created_date DESC LIMIT 1", [machine_id]).then((cd:any) => {
      var created_date
      if(cd.length){
        created_date = cd[0].created_date
      }
      else{
        created_date = null
      }

      this.myDatabase.dbQueryRes("UPDATE machines SET last_visit_date = ? WHERE id = ? AND creator_id = ?", [created_date, machine_id, this.myDatabase.userInfo.id]).then(()=>{
        this.myFunctions.toastIt("Call Successfully removed")
        this.startIt()
      })
    })
  }

  remove(call){
    this.myDatabase.showLoading()

    if(call.order_id){
      this.myDatabase.dbQueryBatch([["DELETE FROM callsheets WHERE id = ?", [call.id]], ["DELETE FROM disr_items WHERE creator_id = ? AND order_id = ?", [this.myDatabase.userInfo.id, call.order_id]], ["DELETE FROM orders WHERE creator_id = ? AND id = ?", [this.myDatabase.userInfo.id, call.order_id]], ["DELETE FROM order_payments WHERE creator_id = ? AND order_id = ?", [this.myDatabase.userInfo.id, call.order_id]]]).then(()=>{
        this.sIt(call.machine_id)
      })
    }else{
      this.myDatabase.dbQuery("DELETE FROM callsheets WHERE id = ?", [call.id]).then(() => {
        this.sIt(call.machine_id)
      })

    }

  }

  mapDistance(call){
    this.navCtrl.push(MapPage, {
      markers: [{lat: call.lat, lng: call.lng, title: "Transaction Location", draggable: false, snippet: ""}, {lat: call.machine_lat, lng: call.machine_lng, title: (parseFloat(this.myFunctions.distance(call.lat, call.lng, call.machine_lat, call.machine_lng)) != call.distance) ? "This machine updated it's location" : "Machine is here", draggable: false, snippet: (call.client_name) ? call.client_name : (call.machine_region) ? call.machine_region + ", " + call.machine_municipal + ", " + call.machine_brgy : "Unknown"}],
      focus: [call.machine_lat, call.machine_lng]
    });
  }

  newMachines(){
    this.navCtrl.push(CallsheetDayPage,{
      ids: this.new_ids,
      title: "Newly added units"
    });
  }

  openStats(){
    this.navCtrl.push(CallsheetStatsPage,{
      data: this.chartData,
      labels: this.chartLabels,
      title: "Statistic"
    });
  }

  openSales(){
    var ar
    var data = []
    var labels = []
    var dov = []
    var lov = []
    let totalSales = 0

    console.log(this.sales)

    for(var x in this.sales){
      ar = this.sales[x]
      if(ar.product_category != "Paper Cups" && ar.total != 0){
        data.push(ar.total)
        labels.push(ar.product_name)
      }

      if(ar.total != 0){
        dov.push(ar.total)
        lov.push(ar.product_name)
      }
    }

    for(var x in this.calls) {
      if (this.calls[x].type == "Sale") {
        totalSales += parseFloat(this.calls[x].note)
      }
    }

    if(totalSales != 0){
      dov.push("₱ " + totalSales)
      lov.push("Total Sales")
    }

    this.navCtrl.push(CallsheetStatsPage,{
      data: data,
      labels: labels,
      title: "Statistic",
      dataOveriddes: dov,
      labelOveriddes: lov
    });
  }

  visitedList(){
    this.navCtrl.push(CallsheetDayPage,{
      ids: this.visited_ids,
      title: "Visited units"
    });
  }

  missedCalls(){
    this.navCtrl.push(CallsheetDayPage,{
      ids: this.missed_ids,
      title: "Missed Calls"
    });
  }

  orderPage(ord){
    this.navCtrl.push(ReceiptPage, {
      orderId: ord.order_id,
      sendSMS: false
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CallsheetItemsPage');
  }

}

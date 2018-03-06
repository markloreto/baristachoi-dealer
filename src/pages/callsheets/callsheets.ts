import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import {CallsheetItemsPage} from '../../pages/callsheet-items/callsheet-items'
import * as moment from 'moment';

/*
  Generated class for the Callsheets page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-callsheets',
  templateUrl: 'callsheets.html'
})
export class CallsheetsPage {

  calls:any = []
  today: any
  thisMonth: any
  currentMonth:any
  headerMonth:any
  previousMonth:any
  nextMonth:any
  hideNext: any

  loading: boolean = true;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public myFunctions: MyFunctions,
              public myDatabase: MyDatabase,
  ) {
    this.today = moment().format("MMMM DD, YYYY - dddd")

    this.thisMonth = moment().format("MM,YYYY").split(",")
    this.currentMonth = moment().format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])

  }

  ionViewDidEnter(){
    this.loadData(this.currentMonth[0], this.currentMonth[1])
  }

  loadData(month, year){
    this.loading = true
    this.myDatabase.showLoading()

    this.calls = []
    this.myDatabase.dbQueryRes("SELECT strftime('%Y-%m-%d', date(created_date / 1000, 'unixepoch', '+8 hours')) AS created_date, COUNT(*) FROM callsheets WHERE creator_id = ? AND strftime('%m', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? GROUP BY strftime('%Y-%m-%d', date(created_date / 1000, 'unixepoch', '+8 hours')) ORDER BY created_date DESC", [this.myDatabase.userInfo.id, month, year]).then((data:any) => {
      console.log(data)
      var ar
      for(var x in data){
        ar = data[x]
        ar.cs_item = moment(ar.created_date).format("YYYY,MM,DD").split(",")
        ar.date = moment(ar.created_date).format("MMMM DD, YYYY - dddd")
        ar.day = moment(ar.created_date).format("ddd")
        ar.startTime = parseInt(moment(moment(ar.created_date).format("YYYY-MM-DD")).format("x"))
        ar.endTime = parseInt(moment(moment(ar.created_date).format("YYYY-MM-DD")).add(23, "hours").add(59, "minutes").add(59, "seconds").format("x"))
        ar.total_units = 0
        ar.visited = 0
        ar.total_new = 0
        ar.missed_calls = 0
        ar.total_special_visit = 0
        ar.total_invalid_visit = 0
        ar.total_gps_problem = 0
        this.calls.push(ar)
      }

      console.log(this.calls)
      if(this.calls.length)
        this.loadOtherInfo(0)
      else
        this.myDatabase.hideLoading()
    })

    setTimeout(()=>{
      if(this.calls.length == 0){
        this.myDatabase.hideLoading()
      }
    },5000)
  }

  pMonth(){
    this.currentMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
    this.loadData(this.currentMonth[0], this.currentMonth[1])
  }

  nMonth(){
    this.currentMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
    this.loadData(this.currentMonth[0], this.currentMonth[1])
  }

  csItem(year, month, day){
    this.navCtrl.push(CallsheetItemsPage, {
      month: month,
      year: year,
      day: day
    });
  }


  loadOtherInfo(n:number){
    this.myDatabase.dbQueryRes("SELECT (SELECT COUNT(DISTINCT id) FROM callsheets WHERE creator_id = ? AND (callsheets.created_date > ? AND callsheets.created_date < ?) AND distance IS NULL) AS total_gps_problem, (SELECT COUNT(DISTINCT id) FROM callsheets WHERE creator_id = ? AND (callsheets.created_date > ? AND callsheets.created_date < ?) AND distance > ?) AS total_invalid_visit, (SELECT COUNT(DISTINCT machine_id) FROM callsheets, machines WHERE callsheets.creator_id = ? AND callsheets.machine_id = machines.id AND machines.delivery != ? AND (callsheets.created_date > ? AND callsheets.created_date < ?) AND (callsheets.distance <= ? OR callsheets.distance IS NULL)) AS total_special_visit, (SELECT COUNT(id) FROM machines WHERE creator_id = ? AND delivery = ? AND created_date < ? AND id IN (SELECT machine_id FROM callsheets WHERE creator_id = ? AND (created_date > ? AND created_date < ?) AND (distance <= ? OR distance IS NULL))) AS visited_calls, (SELECT COUNT(*) FROM machines WHERE creator_id = ? AND delivery = ? AND (created_date > ? AND created_date < ?)) AS total_new, COUNT(id) AS total_units, (SELECT COUNT(id) FROM machines WHERE creator_id = ? AND delivery = ? AND created_date < ? AND id NOT IN (SELECT machine_id FROM callsheets WHERE creator_id = ? AND (created_date > ? AND created_date < ?) AND (distance <= ? OR distance IS NULL))) AS missed_calls FROM machines WHERE creator_id = ? AND delivery = ? AND created_date <= ?", [/*GPS Problem*/this.myDatabase.userInfo.id, this.calls[n].startTime, this.calls[n].endTime, /*Invalid Visits*/this.myDatabase.userInfo.id, this.calls[n].startTime, this.calls[n].endTime, this.myFunctions.gpsMinimumMeter, /*Special Visits*/this.myDatabase.userInfo.id,  this.calls[n].day, this.calls[n].startTime, this.calls[n].endTime, this.myFunctions.gpsMinimumMeter, /*Visited Calls*/this.myDatabase.userInfo.id, this.calls[n].day, this.calls[n].startTime, this.myDatabase.userInfo.id, this.calls[n].startTime, this.calls[n].endTime, this.myFunctions.gpsMinimumMeter, /*New Machines*/this.myDatabase.userInfo.id, this.calls[n].day, this.calls[n].startTime, this.calls[n].endTime, /*Missed Calls*/this.myDatabase.userInfo.id, this.calls[n].day, this.calls[n].startTime, this.myDatabase.userInfo.id, this.calls[n].startTime, this.calls[n].endTime, this.myFunctions.gpsMinimumMeter, /*End*/this.myDatabase.userInfo.id, this.calls[n].day, this.calls[n].startTime/**/]).then((d:any) => {
      console.log(d)
      this.calls[n].total_units = d[0].total_units
      this.calls[n].missed_calls = d[0].missed_calls
      this.calls[n].visited = d[0].visited_calls
      this.calls[n].total_new = d[0].total_new
      this.calls[n].total_special_visit = d[0].total_special_visit
      this.calls[n].total_invalid_visit = d[0].total_invalid_visit
      this.calls[n].total_gps_problem = d[0].total_gps_problem
      n++
      if(n < this.calls.length){
        this.loadOtherInfo(n)
      }else{
        console.log(this.calls)
        this.loading = false
        this.myDatabase.hideLoading()
      }
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CallsheetsPage');
  }

}

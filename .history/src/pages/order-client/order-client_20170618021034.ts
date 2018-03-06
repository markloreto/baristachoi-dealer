import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import { MyFunctions } from '../../providers/my-functions';
import * as moment from 'moment';

/**
 * Generated class for the OrderClient page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-order-client',
  templateUrl: 'order-client.html',
})
export class OrderClient {
  name: string
  id: any
  offset: number = 0
  orders: any = []

  thisMonth: any
  currentMonth:any
  headerMonth:any
  previousMonth:any
  nextMonth:any
  hideNext: any
  constructor(public navCtrl: NavController, public navParams: NavParams, private myDatabase: MyDatabase, public myFunctions: MyFunctions) {
    this.name = navParams.get("name")
    this.id = navParams.get("id")

    this.thisMonth = moment().format("MM,YYYY").split(",")
    this.currentMonth = moment().format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
  }

  pMonth(){
    this.currentMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
    //this.loadData(this.currentMonth[0], this.currentMonth[1])
  }

  nMonth(){
    this.currentMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
    //this.loadData(this.currentMonth[0], this.currentMonth[1])
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OrderClient');
  }

  loadIt(month, year){
    this.myDatabase.dbQueryRes("SELECT * FROM orders WHERE client_id = ? AND creator_id = ? AND strftime('%m', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(created_date / 1000, 'unixepoch', '+8 hours')) = ?", [this.id, this.myDatabase.userInfo.id, month, year]).then((data:any) => {
      this.orders = data
      console.log(data)
    })
  }

  ionViewDidEnter(){
    this.loadIt(this.currentMonth[0], this.currentMonth[1])
  }
}

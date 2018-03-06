import { Component } from '@angular/core';
import { NavController, NavParams, AlertController  } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import {DisrItemsPage} from '../../pages/disr-items/disr-items'
import * as moment from 'moment';

/*
  Generated class for the DailyInventorySalesReport page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-daily-inventory-sales-report',
  templateUrl: 'daily-inventory-sales-report.html'
})
export class DailyInventorySalesReportPage {
  today: any
  thisMonth: any
  currentMonth:any
  headerMonth:any
  previousMonth:any
  nextMonth:any
  hideNext: any
  disr: any = []
  disrCount: number = 0
  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public myFunctions: MyFunctions,
              public myDatabase: MyDatabase,
              public alertCtrl: AlertController
  ) {
    this.today = moment().format("MMMM DD, YYYY - dddd")

    this.thisMonth = moment().format("MM,YYYY").split(",")
    this.currentMonth = moment().format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
    this.myDatabase.dbQueryRes("SELECT COUNT(id) AS totalA FROM disr WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((t:any) => {
      this.disrCount = t[0].totalA
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DailyInventorySalesReportPage');
  }

  ionViewDidEnter(){
    this.loadIt(this.currentMonth[0], this.currentMonth[1])
  }

  loadIt(month, year){
    this.myDatabase.showLoading()
    this.disr = []

    this.myDatabase.dbQueryRes("SELECT * FROM disr WHERE creator_id = ? AND status = ?", [this.myDatabase.userInfo.id, 'active']).then((cc:any)=>{
      this.disrCount = cc.length
      this.myDatabase.dbQueryRes("SELECT * FROM disr WHERE creator_id = ? AND strftime('%m', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? AND strftime('%Y', date(created_date / 1000, 'unixepoch', '+8 hours')) = ? ORDER BY created_date DESC", [this.myDatabase.userInfo.id, month, year]).then((data:any) => {
        console.log(data)
        var ar
        for(var x in data){
          ar = data[x]
          ar.date = moment(ar.created_date).format("MMMM DD, YYYY - dddd")
          this.disr.push(ar)
        }



        this.myDatabase.hideLoading()
      })
    })


  }

  pMonth(){
    this.currentMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
    this.loadIt(this.currentMonth[0], this.currentMonth[1])
  }

  nMonth(){
    this.currentMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MM,YYYY").split(",")
    this.headerMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").format("MMMM - YYYY")
    this.previousMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").subtract(1, "months").format("MMMM")
    this.nextMonth = moment(this.currentMonth[1] + "-" + this.currentMonth[0] + "-01").add(1, "months").format("MMMM")
    this.hideNext = (this.thisMonth[0] != this.currentMonth[0] || this.thisMonth[1] != this.currentMonth[1])
    this.loadIt(this.currentMonth[0], this.currentMonth[1])
  }

  disrItem(d){
    this.navCtrl.push(DisrItemsPage, {
      id: d.id,
      parent_id: d.parent_id,
      status: d.status,
      sequenceId: d.sequence_id
    });
  }

  add(){
    this.alertCtrl.create({
      title: 'DISR Sequence #',
      message: "Please input the sequece #",
      inputs: [
        {
          name: 'sequence',
          placeholder: 'Sequence #',
          type: 'number'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            console.log(data);
            if(data.sequence != ""){
              let t = this.myDatabase.getTimestamp()
              this.myDatabase.dbQueryRes("INSERT INTO disr VALUES (?, ?, ?, ?, ?, ?, ?)", [t, t, t, this.myDatabase.userInfo.id, "active", data.sequence.replace(/[^A-Z0-9]+/ig, "").replace(/\s/gim, ""), null]).then((res:any) => {
                this.myFunctions.toastIt("DISR # " + data.sequence + " is now added")
                this.loadIt(this.currentMonth[0], this.currentMonth[1])
              })
            }
            else{
              this.myFunctions.alert("Invalid Input!", "Please input the sequence #")
            }
          }
        }
      ]
    }).present()
  }

}

import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController  } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';
import {DomSanitizer} from '@angular/platform-browser';
import * as moment from 'moment';
declare let window: any
/*
  Generated class for the Receipt page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-receipt',
  templateUrl: 'receipt.html'
})
export class ReceiptPage {
  orderId: any
  items: any
  payments: any = []
  grandTotal: number = 0
  totalPayments: number = 0
  change:number = 0
  client:any
  orderDate: any = ""
  sendSMS: boolean= false
  constructor(public navCtrl: NavController, private sanitizer: DomSanitizer, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase, public actionSheetCtrl: ActionSheetController) {
    this.orderId = navParams.get("orderId")
    this.sendSMS = navParams.get("orderId")

    this.client = {photo: ""}
    this.myDatabase.dbQueryRes("SELECT clients.*, orders.created_date AS cdate FROM orders, clients WHERE orders.creator_id = ? AND orders.id = ? AND orders.client_id = clients.id", [this.myDatabase.userInfo.id, this.orderId]).then((res:any) => {
      var res = res[0]
      this.client = res
      this.orderDate = moment(res.cdate).format('LLLL')

      if(this.client.photo){
        let base64Image = 'data:image/jpeg;base64,' + this.client.photo;
        this.client.photo = this.sanitizer.bypassSecurityTrustUrl(base64Image);
      }else{
        this.client.photo = "assets/images/no_user_1.jpg"
      }


      if(this.sendSMS){
        this.sendReceipt()
      }
    })

    this.myDatabase.dbQueryRes("SELECT * FROM disr_items, products WHERE creator_id = ? AND disr_items.order_id = ? AND disr_items.product_id = products.id", [this.myDatabase.userInfo.id, this.orderId]).then((res:any) => {
      console.log(res)
      var ar
      for(var i in res){
        ar = res[i]
        ar.avatar
        this.grandTotal += (ar.minus * ar.price)
      }
      this.items = res
    })

    this.myDatabase.dbQueryRes("SELECT * FROM order_payments WHERE creator_id = ? AND order_id = ?", [this.myDatabase.userInfo.id, this.orderId]).then((res:any) => {
      var ar
      for(var i in res){
        ar = res[i]
        ar.dateTime = moment(ar.created_date).format('LLLL')
        this.totalPayments += ar.amount
        this.change += ar.change
        this.payments.push(ar)
      }
    })
  }

  sendNow(n){
    var msg = "SMS Receipt\n"
    msg += "-" + this.client.name + "\n\n"
    var ar
    for(var x in this.items){
      ar = this.items[x]
      msg += "-" + ar.minus + "x " + ar.name + " @" + ar.price + "\n"
    }

    msg += "Total:" + this.grandTotal + "\n"
    msg += "Amount Paid:" + this.totalPayments + "\n"
    if(this.change)
      msg += "Change:" + this.change + "\n"

    msg += "\nThis is " + this.myDatabase.userInfo.name + " your Sales and Service Crew!"

    //if(window.SMS) window.SMS.sendSMS(n, msg, function(){console.log("Msg Sent")}, function(){});
    this.myFunctions.sendSMS(n.split(","), msg, true)
  }

  sendReceipt(){
    var number
    if(this.client.contact && this.client.contact2){
      number = [this.client.contact, this.client.contact2]
    }else{
      number = [this.client.contact]
    }

    var c = []
    for(var x in number){
      c.push(this.myFunctions.getCarrier(number[x]))
    }

    var btns = []
    for(var x in number){
      let n = number[x]
      btns.push({
        text: number[x] + " ["+c[x]+"]",
        handler: () => {
          this.sendNow(n)
        }
      })
    }

    btns.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    })

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Send Receipt to',
      buttons: btns
    });
    actionSheet.present();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReceiptPage');
  }

}

import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import {DisrItemPage} from '../../pages/disr-item/disr-item'
import {DailyInventorySalesReportPage} from '../../pages/daily-inventory-sales-report/daily-inventory-sales-report'
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts';
import * as moment from 'moment';

/*
  Generated class for the DisrItems page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-disr-items',
  templateUrl: 'disr-items.html'
})
export class DisrItemsPage {
  id:any
  parent_id:any
  products:any = []
  keys: any = []
  productSum: any = []
  totals:any = []
  segment:string = "inventory"
  payments: any = []
  salesTotal: number = 0
  paymentsTotal: number = 0
  status: string = ""
  isLoaded: any = false
  sequenceId: any
  accColor: string = "blue"
  constructor(
    public navCtrl: NavController, public navParams: NavParams,
    public myFunctions: MyFunctions,
    public myDatabase: MyDatabase, private alertCtrl: AlertController, private contacts: Contacts
  ) {
    this.id = navParams.get("id")
    this.parent_id = navParams.get("parent_id")
    this.status = navParams.get("status")
    this.sequenceId = navParams.get("sequenceId")

    this.myFunctions.getProductsAndKeys().then((pk:any)=>{
      this.products = pk.products
      this.keys = pk.keys
      var ar
      for(var x in pk.raw){
        ar = pk.raw[x]
        this.productSum[ar.id] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0}
      }

      for(var x in this.keys){
        this.totals[this.keys[x]] = {remaining: 0, beginning: 0, reload: 0, previous: 0, sold: 0}
      }
      this.isLoaded = true
    })
  }

  computeRemaining(parentData){
    for(var x in parentData.productSum){
      this.productSum[x].previous += parentData.productSum[x].remaining
      this.productSum[x].remaining += parentData.productSum[x].remaining
    }

    for(var x in parentData.totals){
      this.totals[x]["remaining"] += parentData.totals[x]["remaining"]
      this.totals[x]["previous"] += parentData.totals[x]["remaining"]
    }
  }

  loadNow(){
    this.myDatabase.showLoading()
    console.log("id", this.id)
    console.log("Parent id", this.parent_id)
    this.myFunctions.getInventories(this.id).then((data:any)=> {
      console.log("disr Inventories", data)

      this.productSum = data.productSum
      this.totals = data.totals
      this.salesTotal = data.salesTotal
      this.isLoaded = true
      if(this.parent_id){

        this.myDatabase.dbQueryRes("SELECT (SUM(disr_items.plus) - SUM(disr_items.minus)) AS inventory, disr_items.*, products.category AS category, products.price FROM disr_items, products WHERE products.id = disr_items.product_id AND disr_items.creator_id = ? AND disr_items.disr_id < ? GROUP BY disr_items.product_id", [this.myDatabase.userInfo.id, this.id]).then((disrData:any)=>{
          console.log(disrData)
          for(var x in disrData){
            this.productSum[disrData[x]["product_id"]].previous += disrData[x].inventory
            this.productSum[disrData[x]["product_id"]].remaining += disrData[x].inventory

            this.totals[disrData[x]["category"]]["remaining"] += disrData[x].inventory
            this.totals[disrData[x]["category"]]["previous"] += disrData[x].inventory
          }
          this.myDatabase.hideLoading()
        })
      }
      else{
        this.myDatabase.hideLoading()
      }
    })
  }

  openItem(p){
    this.navCtrl.push(DisrItemPage, {
      product: p,
      disr_id: this.id,
      previous: this.productSum[p.id].previous,
      parent_id: this.parent_id
    });
  }

  removePayment(id){
    this.myDatabase.dbQueryRes("DELETE FROM disr_payments WHERE creator_id = ? AND id = ?", [this.myDatabase.userInfo.id, id]).then(()=> {
      this.refreshPayments()
    })
  }

  addPayment(){
    this.alertCtrl.create({
      title: 'Add Payment',
      inputs: [
        {
          name: 'amount',
          placeholder: 'Amount',
          type: "number"
        },
        {
          name: 'notes',
          placeholder: 'Notes',
          type: "text"
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
          text: 'Receivable',
          handler: data => {
            data.amount = data.amount.replace("-", "").replace(",", "")
            if(data.amount != ""){
              this.myFunctions.toastIt("This feature is not yet supported")
            }
          }
        },
        {
          text: 'Paid',
          handler: data => {
            data.amount = data.amount.replace("-", "").replace(",", "")
            if(data.amount != ""){
              var t = this.myDatabase.getTimestamp()
              this.myDatabase.dbQueryRes("INSERT INTO disr_payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [t, t, t, this.myDatabase.userInfo.id, this.id, data.amount, data.notes, "Paid", null, "", null]).then(() => {
                this.refreshPayments()
                this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "remit and deposits report"]).then((nc:any) => {
                  if(nc.length){
                    let lat = this.myFunctions.myPos.coords.latitude
                    let lng = this.myFunctions.myPos.coords.longitude
                    this.myFunctions.getLocation([lat, lng]).then((loc:any) => {

                      let contacts = nc[0].number.split(",")
                      let address = (loc.NAME_1) ? loc.NAME_1 + ", " + loc.NAME_2 + ", " + loc.NAME_3 : "Unknown"

                      let thisDate = moment(parseInt(t)).format("ddd, MMM D")


                      let msg = "Deposit Report ("+thisDate+")\n"

                      msg += "Deposited Amount: ₱" + data.amount + "\n"
                      msg += "Deposit Type: Paid\n"
                      msg += "Description / notes: " + data.notes + "\n\n"
                      msg += "D.I.S.R. Sequence #: " + this.sequenceId + "\n"
                      msg += "Total Deposits: ₱" + this.paymentsTotal + "\n"
                      msg += "Total Sales: ₱" + this.salesTotal + "\n"
                      msg += "Remaining Amount to Deposit: ₱" + (this.salesTotal-this.paymentsTotal) + "\n"


                      msg += "Reporting from: " + address + "\n\n"

                      msg += "Map: http://maps.google.com/?q="+lat+","+lng

                      //if(window.SMS) window.SMS.sendSMS(n, msg, function(){console.log("Msg Sent")}, function(){});
                      this.myFunctions.sendSMS(contacts, msg, false)
                    })
                  }
                })
              })
            }
          }
        }
      ]
    }).present()
  }

  refreshPayments(){
    this.payments = []
    this.paymentsTotal = 0
    this.myDatabase.dbQueryRes("SELECT * FROM disr_payments WHERE creator_id = ? AND disr_id = ?", [this.myDatabase.userInfo.id, this.id]).then((res:any) => {
      var arr
      for(var x in res){
        arr = res[x]
        arr.date = moment(arr.created_date).format("LLLL")
        this.paymentsTotal += arr.amount
        this.payments.push(arr)
      }
    })
  }

  addDisr(){
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

              this.myDatabase.dbQueryRes("SELECT id FROM disr WHERE sequence_id = ? AND creator_id = ?", [data.sequence, this.myDatabase.userInfo.id]).then((d:any)=>{
                if(d.length == 0){
                  this.myDatabase.dbQueryRes("INSERT INTO disr (id, created_date, updated_date, creator_id, status, sequence_id, parent_id, sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [t, t, t, this.myDatabase.userInfo.id, "active", data.sequence.replace(/[^A-Z0-9]+/ig, "").replace(/\s/gim, ""), this.id, null]).then((res:any) => {
                    this.myFunctions.toastIt("DISR # " + data.sequence + " is now added")
                    let items = []

                    items.push(["UPDATE disr SET status = ?, sync = ? WHERE creator_id = ? AND id = ?", ["complete", null, this.myDatabase.userInfo.id, this.id]])

                    this.myDatabase.dbQueryBatch(items).then(()=>{
                      this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "remit and deposits report"]).then((nc:any) => {
                        if(nc.length){
                          this.myDatabase.dbQueryRes("SELECT * FROM disr_payments WHERE creator_id = ? AND disr_id = ?", [this.myDatabase.userInfo.id, this.id]).then((payments:any) => {
                            let lat = this.myFunctions.myPos.coords.latitude
                            let lng = this.myFunctions.myPos.coords.longitude
                            this.myFunctions.getLocation([lat, lng]).then((loc:any) => {

                              let contacts = nc[0].number.split(",")
                              let address = (loc.NAME_1) ? loc.NAME_1 + ", " + loc.NAME_2 + ", " + loc.NAME_3 : "Unknown"

                              let thisDate = moment(parseInt(t)).format("ddd, MMM D")


                              let msg = "Completed D.I.S.R. Report ("+thisDate+")\n"

                              msg += "D.I.S.R. Sequence #: " + this.sequenceId + "\n"
                              msg += "Payments:"
                              for(var x in payments){
                                msg += "\n-" + moment(parseInt(payments[x].id)).format("YYYY-MM-DD") + "/" + payments[x].status + "/₱" + payments[x].amount + "/" + payments[x].notes
                              }

                              msg += "\n\nTotal Sales: ₱" + this.salesTotal + "\n"


                              msg += "Reporting from: " + address + "\n\n"

                              msg += "Map: http://maps.google.com/?q="+lat+","+lng

                              //if(window.SMS) window.SMS.sendSMS(n, msg, function(){console.log("Msg Sent")}, function(){});
                              this.myFunctions.sendSMS(contacts, msg, false).then(()=>{
                                this.myFunctions.remainingStockReport(nc[0].number)
                              })
                            })
                          })
                        }
                        this.navCtrl.setRoot(DailyInventorySalesReportPage)

                      })
                    })
                  })
                }else{
                  this.myFunctions.toastIt("The sequence # you entered already exist!")
                }
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

  sendReport(){
    this.contacts.pickContact().then(c => {
      console.log(c)
    })
  }

  remit(){
    this.alertCtrl.create({
      title: 'Would you like to set this D.I.S.R to Complete?',
      message: 'Remaining stock will be transferred to the new D.I.S.R',
      buttons: [
        {
          text: 'No',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.addDisr()
          }
        }
      ]
    }).present()
  }

  loadIt(){
    setTimeout(()=>{
      if(this.isLoaded)
        this.loadNow()
      else
        this.loadIt()
    }, 500)
  }

  ionViewDidEnter(){
    this.loadIt()
    this.refreshPayments()
  }

}

import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';
import { TextToSpeech } from '@ionic-native/text-to-speech';
import { NativeAudio } from '@ionic-native/native-audio';
import {
  File
} from 'ionic-native';
import {CartItemSelectionPage} from '../../pages/cart-item-selection/cart-item-selection'
import {ReceiptPage} from '../../pages/receipt/receipt'
import {OffTakePrevious} from '../../pages/off-take-previous/off-take-previous'
import {DailyInventorySalesReportPage} from '../../pages/daily-inventory-sales-report/daily-inventory-sales-report'
import * as _ from 'lodash';
import * as moment from 'moment';

declare var cordova: any
/*
  Generated class for the PointOfSale page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-point-of-sale',
  templateUrl: 'point-of-sale.html'
})
export class PointOfSalePage {
  clientId:any
  disrId:any
  machineId:any
  products:any = []
  keys:any = []
  photoDir: any
  selectedMachine: any
  items: any = []
  total: number = 0
  pos: any
  distance:any
  machine: any
  constructor(private nativeAudio: NativeAudio, private tts: TextToSpeech, public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase, private alertCtrl: AlertController) {
    this.clientId = this.navParams.get("clientId")
    this.machineId = this.navParams.get("machineId")
    this.pos = this.navParams.get("pos")
    this.distance = this.navParams.get("distance")
    this.machine = this.navParams.get("machine")
    this.selectedMachine = {avatar: ""}
    this.nativeAudio.preloadSimple('cash', 'assets/sound/cash.mp3').then(s => {
      console.log("Preload cash register", s)
    }, e => {
      console.log("Preload cash register", e)
    });
    /*if(this.myDatabase.offTake){
      var fm = moment().startOf("month").format("x")
      var lm = moment().endOf("month").format("x")
      this.myDatabase.dbQueryRes("SELECT id FROM orders WHERE creator_id = ? AND (created_date >= ? AND created_date <= ?)", [this.myDatabase.userInfo.id, fm, lm]).then((data:any) => {
        //with orders within this month
        console.log("Off-take Orders", data)
        if(data.length){
          if(this.myFunctions.week_of_month() != 4 || this.myFunctions.week_of_month() != 5){
            this.myFunctions.confirm("Off-Take", "Count the remaining stock from previous order?", "Yes", "No").then(() => {
              new Promise((resolve, reject) => {
                this.navCtrl.push(OffTakePrevious, {resolve: resolve, order_ids: data});
              }).then((data:any) => {

              });
            })
          }
        }
      })
    }*/

    this.myDatabase.showLoading()
    this.myDatabase.dbQueryRes("SELECT machines.*, clients.name AS client_name from machines, clients WHERE machines.creator_id = ? AND machines.id = ? AND machines.owner_id = clients.id", [this.myDatabase.userInfo.id, this.machineId]).then((machine:any) => {
      File.createDir(cordova.file.externalApplicationStorageDirectory, "machine_photo", true).then((dir:any) => {
        this.photoDir = dir.nativeURL

        if(machine[0].photo != "")
          machine[0].avatar = this.photoDir + machine[0].id + ".jpg"
        else{
          machine[0].avatar = cordova.file.applicationDirectory + "www/assets/images/machines/"+machine[0].machine_type+".png"
        }

        this.selectedMachine = machine[0]

      })

      this.myDatabase.dbQueryRes("SELECT * FROM disr WHERE status = ? AND creator_id = ?", ["active", this.myDatabase.userInfo.id]).then((d:any)=> {

        if(d.length){
          let disr = d[0]
          let products = []
          this.disrId = disr.id
          console.log("disr", disr)
          this.myFunctions.getProductsAndKeys().then((pk:any)=>{
            products = pk.raw
            for(var x in products){
              products[x].inventory = 0
            }

            products =  _.groupBy(products, 'id')

            console.log("products", products)

            this.myFunctions.getInventories(disr.id).then((inv:any)=> {

              for(var x in inv.productSum){
                products[x][0].inventory += inv.productSum[x].remaining
              }

              if(disr.parent_id){
                this.myDatabase.dbQueryRes("SELECT (SUM(disr_items.plus) - SUM(disr_items.minus)) AS inventory, disr_items.*, products.category AS category, products.price FROM disr_items, products WHERE products.id = disr_items.product_id AND disr_items.creator_id = ? AND disr_items.disr_id < ? GROUP BY disr_items.product_id", [this.myDatabase.userInfo.id, disr.id]).then((disrData:any)=>{
                  for(var x in disrData){
                    products[disrData[x]["product_id"]][0].inventory += disrData[x].inventory
                  }
                  this.buildProducts(products)
                  this.myDatabase.hideLoading()
                })
              }
              else{
                this.buildProducts(products)
                this.myDatabase.hideLoading()
              }
            })
          })
        }
        else{
          this.myFunctions.alert("No D.I.S.R", "Please create your first D.I.S.R");
          this.navCtrl.setRoot(DailyInventorySalesReportPage)
          this.myDatabase.hideLoading()
        }
      })
    })
  }

  speech(s){
    return new Promise((resolve, reject) => {
      this.tts.speak({text: s, locale: "en-PH", rate: 0.9})
      .then(() => resolve())
      .catch((reason: any) => reject());
    })
  }

  itemSpeak(item){
    var unit = (item.unit_name == "kg") ? "kilogram" : (item.unit_name == "pc") ? "piece" : (item.unit_name == "unit") ? "unit" : ""
    unit = (item.qty > 1) ? unit + "s" : unit
    var name = item.name.replace("6.5oz", "6.5 ounce")
    return item.qty + " " + unit + " " + name
  }

  speak(){
    console.log("Items", this.items)
    let self = this


    var i = 0
    function s(){
      let speak = self.itemSpeak(self.items[i])
      self.speech(speak).then(() => {
        i++
        if(i < self.items.length){
          s()
        }else{
          self.speech("With a total price of " + self.total + " pesos")
        }
      })
    }
    s()
  }

  buildProducts(p){
    let ps = []
    for(var x in p){
      ps.push(p[x][0])
    }

    console.log("ps", ps)

    let newProducts = []
    for(var x in ps){
      if(ps[x].inventory != 0)
        newProducts.push(ps[x])
    }

    this.products =  _.groupBy(newProducts, 'category')
    this.keys = Object.keys(this.products);
  }

  checkOutStart(){
    if(this.items.length != 0){
      this.speech("Please pay the amount of " + this.total + " pesos")
      this.alertCtrl.create({
        title: 'Amount Tendered',
        message: "Please input the amount paid by the client",
        inputs: [
          {
            name: 'amount',
            value: this.total.toString(),
            placeholder: 'Amount to pay',
            type: "number",
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
            text: 'Pay',
            handler: data => {
              data.amount = data.amount.replace("-", "").replace(",", "")
              if(data.amount != ""){
                this.paymentStart(parseFloat(data.amount))
              }
            }
          }
        ]
      }).present()
    }else{
      this.myFunctions.toastIt("Please add item in Cart")
    }

  }

  paymentStart(amount){
    console.log("Amount", amount)
    if(amount >= this.total){
      this.nativeAudio.play('cash')
      let q = []
      let id = this.myDatabase.getTimestamp()
      let change = amount - this.total
      var prd
      for(var x in this.items){
        prd = this.items[x]
        q.push(["INSERT INTO disr_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id+(x+1), id, id, this.myDatabase.userInfo.id, 0, prd.qty, "Sold", id, parseInt(this.disrId), prd.id, null, null]])
      }

      q.push(["INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?)", [id, id, id, this.myDatabase.userInfo.id, "Paid", this.clientId, null]])
      q.push(["INSERT INTO order_payments VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [id, id, id, this.myDatabase.userInfo.id, amount, id, change, null]])
      q.push(["INSERT INTO callsheets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, id, id, this.myDatabase.userInfo.id, this.machineId, id, "Sale", this.pos.coords.latitude, this.pos.coords.longitude, amount-change, this.distance, null]])
      if(this.distance <= this.myFunctions.gpsMinimumMeter || this.distance == null){
        q.push(["UPDATE machines SET last_visit_date = ?, updated_date = ?, sync = ? WHERE creator_id = ? AND id = ?", [id, id, null, this.myDatabase.userInfo.id, this.machineId]])
        q.push(["UPDATE clients SET last_order_date = ?, sync = ? WHERE creator_id = ? AND id = ?", [id, null, this.myDatabase.userInfo.id, this.clientId]])
      }

      if(change > 0){
        this.myFunctions.alert("Total Change", "Please give the client a total change of ₱ " + change)
        setTimeout(() => {
          this.speech("I Received " + this.total + " pesos, your change is " + change + " pesos. Have a good day " + this.selectedMachine.client_name)
        }, 1500)
      }else{
        setTimeout(() => {
          this.speech("I Received " + this.total + " pesos. Have a good day " + this.selectedMachine.client_name)
        }, 1500)
      }

      this.myDatabase.dbQueryBatch(q).then(() => {
        this.myFunctions.chkCalls(this.myDatabase.getTimestamp()).then((t:any) => {
          //first call
          if(t.total_visited == 1 && this.distance <= this.myFunctions.gpsMinimumMeter){
            this.myFunctions.firstCall()
          }
          //last call
          if(t.total_visited == t.total_units && t.total_units != 0 && this.distance <= this.myFunctions.gpsMinimumMeter)
            this.myFunctions.dailyReport(this.myDatabase.getTimestamp())
        })
        this.myFunctions.sendClientReport(this.machine)
        this.navCtrl.setRoot(ReceiptPage, {
          orderId: id,
          sendSMS: true
        })
      })
    }
    else{
      console.log("Less than the total")
    }
  }

  addItem(){
    new Promise((resolve, reject) => {
      this.navCtrl.push(CartItemSelectionPage, {
        resolve: resolve,
        products: this.products,
        keys: this.keys
      });
    }).then((item:any) => {
      item.photo = (item.photo) ? item.photo : (_.includes([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], item.id)) ? cordova.file.applicationDirectory + "www/assets/images/products/"+item.id+".png" : cordova.file.applicationDirectory + "www/assets/images/products/no_photo.png"

      this.alertCtrl.create({
        title: 'Quantity',
        message: "Enter the quantity for " + item.name,
        inputs: [
          {
            name: 'qty',
            placeholder: 'Quantity',
            type: "number"
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
            text: 'Add Item',
            handler: data => {
              data.qty = data.qty.replace("-", "").replace(",", "")
              if(data.qty != ""){
                let qty = parseInt(data.qty)

                if(qty > item.inventory){
                  this.myFunctions.alert("Not Enough Inventory!", item.inventory + " " + this.myFunctions.addS(item.unit_name, item.inventory) + " left for " + item.name)
                }else{
                  //in items
                  let inItem = _.find(this.items, {id: item.id})

                  if(inItem){
                    let index = _.findIndex(this.items, {id: item.id});
                    let newQty = this.items[index].qty + qty
                    this.items[index].qty = newQty
                    this.items[index].subTotal = parseFloat((this.items[index].qty * this.items[index].price).toFixed(2))
                  }else{
                    item.qty = qty
                    item.subTotal = parseFloat((qty * item.price).toFixed(2))
                    this.items.push(item)
                  }

                  let seq = _.findIndex(this.products[item.category], {id: item.id});
                  this.products[item.category][seq].inventory -= qty
                  this.speech(this.itemSpeak(item))
                  console.log(this.items)
                  this.sumIt()
                }


              }
            }
          }
        ]
      }).present()
    });
  }

  sumIt(){
    var total = _.sumBy(this.items, "subTotal")
    this.total = total.toFixed(2)
  }

  removeItem(p, index){
    let seq = _.findIndex(this.products[p.category], {id: p.id});
    this.products[p.category][seq].inventory += p.qty
    this.items.splice(index, 1);
    this.sumIt()
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PointOfSalePage');
  }

}

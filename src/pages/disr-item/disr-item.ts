import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import * as moment from 'moment';
import * as _ from 'lodash';
/*
  Generated class for the DisrItem page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-disr-item',
  templateUrl: 'disr-item.html'
})
export class DisrItemPage {
  product:any
  totalQty:number = 0
  disr_id:any
  items: any = []
  previous:any
  constructor(
    public navCtrl: NavController, public navParams: NavParams,
    public myFunctions: MyFunctions,
    public myDatabase: MyDatabase,
    public alertCtrl: AlertController
  ) {
    this.product = navParams.get("product")
    this.disr_id = navParams.get("disr_id")
    this.previous = navParams.get("previous")
  }

  ionViewDidEnter(){
    this.loadIt()
  }

  loadIt(){
    this.items = []
    this.totalQty = (this.previous) ? this.totalQty + this.previous : 0
    this.myDatabase.showLoading()
    this.myDatabase.dbQueryRes("SELECT * FROM disr_items WHERE creator_id = ? AND disr_id = ? AND product_id = ? ORDER BY created_date ASC", [this.myDatabase.userInfo.id, this.disr_id, this.product.id]).then((res:any) => {
      var arr = []
      var ar

      if(this.previous){
        arr.push({
          type: "Previous",
          to: this.previous,
          from: 0,
          plus: this.previous
        })
      }

      for(var x in res){
        ar = res[x]
        ar.date = moment(ar.created_date).format("MMMM DD, YYYY - dddd @ hh:mm A")
        ar.from = this.totalQty
        if(this.myFunctions.pluses(ar.type))
          this.totalQty += ar.plus
        if(this.myFunctions.minuses(ar.type))
          this.totalQty -= ar.minus
        ar.to = this.totalQty
        arr.push(ar)
      }

      this.items = _.reverse(arr)


      this.myDatabase.hideLoading()
    })
  }

  addQty(){
    this.alertCtrl.create({
      title: 'Add stock for ' + this.product.name,
      inputs: [
        {
          name: 'add',
          placeholder: 'Enter Quantity',
          type: "number",
          value: "1"
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Add',
          handler: data => {
            console.log(data)
            if(parseInt(data.add) != 0){
              this.myDatabase.setQty(this.disr_id, this.product.id, parseInt(data.add), "", "add").then((r:any) => {
                this.myFunctions.toastIt(data.add + " " + this.myFunctions.addS(this.product.unit_name, data.add) + " of " + this.product.name + " was added")
                this.loadIt()
              })
            }else{
              this.myFunctions.toastIt("Ooopss! adding 0 value is not valid")
            }
          }
        }
      ]
    }).present()
  }

  minusQty(){
    this.alertCtrl.create({
      title: 'Remove stock for ' + this.product.name,
      inputs: [
        {
          name: 'remove',
          placeholder: 'Enter Quantity',
          type: "number",
          value: "1"
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Remove',
          handler: data => {
            console.log(data)
            if(data.remove > this.totalQty){
              this.myFunctions.toastIt("Not enough stock to remove")
            }
            else if(parseInt(data.remove) != 0){
              this.myDatabase.setQty(this.disr_id, this.product.id, parseInt(data.remove), "Removed", "minus").then((r:any) => {
                this.myFunctions.toastIt(data.remove + " " + this.myFunctions.addS(this.product.unit_name, data.remove) + " of " + this.product.name + " was removed")
                this.loadIt()
              })
            }
            else{
              this.myFunctions.toastIt("Ooopss! removing 0 value is not valid")
            }
          }
        }
      ]
    }).present()
  }

}

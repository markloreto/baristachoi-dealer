import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, Platform } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'

import * as _ from 'lodash';

/*
  Generated class for the CarrierPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-carrier-page',
  templateUrl: 'carrier-page.html'
})
export class CarrierPagePage {
  globe:any = []
  smart:any = []
  sun:any = []

  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase, private alertCtrl: AlertController, public platform: Platform) {
    this.categorized()
  }

  categorized(){
    this.globe = []
    this.smart = []
    this.sun = []
    console.log("Carriers: ", this.myDatabase.carriers)
    var grouped = _.mapValues(_.groupBy(this.myDatabase.carriers, 'carrier'),
      clist => clist.map(c => _.omit(c, 'carrier')));

    if(grouped.Globe)
      this.globe = grouped.Globe
    if(grouped.Smart)
      this.smart = grouped.Smart
    if(grouped.Sun)
      this.sun = grouped.Sun
    console.log("Carrier Group", grouped)

  }

  remove(c){
    this.alertCtrl.create({
      title: 'Remove ' + c.prefix + "?",
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
            this.myDatabase.dbQueryRes("DELETE FROM carriers WHERE id = ?", [c.id]).then(() => {
              this.myDatabase.refreshCarriers().then(()=>{
                this.categorized()
              })

            })
          }
        }
      ]
    }).present()

  }

  addGlobe(){
    this.alertCtrl.create({
      title: 'Globe Prefix',
      inputs: [
        {
          name: 'globe',
          placeholder: 'prefix',
          type: 'number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {

          }
        },
        {
          text: 'Submit',
          handler: data => {
            this.myDatabase.dbQuery("INSERT INTO carriers VALUES (?, ?, ?)", [this.myDatabase.getTimestamp(), "Globe", data.globe]).then(() => {
              this.myDatabase.refreshCarriers().then(() => {
                this.categorized()
              })
            })
          }
        }
      ]
    }).present()
  }

  addSmart(){
    this.alertCtrl.create({
      title: 'Smart Prefix',
      inputs: [
        {
          name: 'smart',
          placeholder: 'prefix',
          type: 'number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {

          }
        },
        {
          text: 'Submit',
          handler: data => {
            this.myDatabase.dbQuery("INSERT INTO carriers VALUES (?, ?, ?, ?)", [this.myDatabase.getTimestamp(), this.myDatabase.userInfo.id, "Smart", data.smart]).then(() => {
              this.myDatabase.refreshCarriers().then(() => {
                this.categorized()
              })
            })
          }
        }
      ]
    }).present()
  }

  addSun(){
    this.alertCtrl.create({
      title: 'Sun Prefix',
      inputs: [
        {
          name: 'sun',
          placeholder: 'prefix',
          type: 'number'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {

          }
        },
        {
          text: 'Submit',
          handler: data => {
            this.myDatabase.dbQuery("INSERT INTO carriers VALUES (?, ?, ?, ?)", [this.myDatabase.getTimestamp(), this.myDatabase.userInfo.id, "Sun", data.sun]).then(() => {
              this.myDatabase.refreshCarriers().then(() => {
                this.categorized()
              })
            })
          }
        }
      ]
    }).present()
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CarrierPagePage');
  }

}

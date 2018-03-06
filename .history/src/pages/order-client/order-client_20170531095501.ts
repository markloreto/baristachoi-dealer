import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import { MyFunctions } from '../../providers/my-functions';

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
  constructor(public navCtrl: NavController, public navParams: NavParams, private myDatabase: MyDatabase, public myFunctions: MyFunctions) {
    this.name = navParams.get("name")
    this.id = navParams.get("id")
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OrderClient');
  }

}

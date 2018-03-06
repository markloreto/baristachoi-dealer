import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

/*
  Generated class for the CartItemSelection page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-cart-item-selection',
  templateUrl: 'cart-item-selection.html'
})
export class CartItemSelectionPage {
  products: any = []
  keys: any = []
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.products = navParams.get("products")
    this.keys = navParams.get("keys")
  }

  selectProduct(p){
    this.navCtrl.pop().then(() => this.navParams.get('resolve')(p))
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CartItemSelectionPage');
  }

}

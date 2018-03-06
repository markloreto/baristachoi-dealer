import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import {ProductSettingsModifyPage} from '../product-settings-modify/product-settings-modify'
import {DomSanitizer} from '@angular/platform-browser';
import * as _ from 'lodash';

/*
  Generated class for the ProductSettings page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-product-settings',
  templateUrl: 'product-settings.html'
})
export class ProductSettingsPage {
  products:any = []
  keys: any = []
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions,
              public myDatabase: MyDatabase, private sanitizer: DomSanitizer) {
    this.myDatabase.dbQueryRes("SELECT * from products ORDER BY sequence", []).then((data:any) => {
      console.log(data)
      var ar
      var arr = []
      for(var x in data){
        ar = data[x]
        ar.photoV = (ar.photo != "") ? this.sanitizer.bypassSecurityTrustUrl(ar.photo) : ""
        arr.push(ar)
      }
      this.products =  _.groupBy(arr, 'category')
      this.keys = Object.keys(this.products);
    })
  }

  productModify(p){
    this.navCtrl.push(ProductSettingsModifyPage, {
      product: p
    })
  }

  reorderItems(indexes, key) {
    console.log(indexes)
    let element = this.products[key][indexes.from];
    this.products[key].splice(indexes.from, 1);
    this.products[key].splice(indexes.to, 0, element);
    var arr = []
    for(var x in this.products[key]){
      arr.push(["UPDATE products SET sequence = ? WHERE id = ?", [x, this.products[key][x].id]])
    }

    this.myDatabase.showLoading("Saving Sequence...")
    this.myDatabase.dbQueryBatch(arr).then(() => {
      this.myDatabase.hideLoading()
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProductSettingsPage');
  }

}

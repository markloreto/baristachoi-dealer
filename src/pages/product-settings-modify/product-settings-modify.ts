import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import {ProductSettingsPage} from '../product-settings/product-settings'
import {
  Camera,
  PhotoViewer
} from 'ionic-native';
import {DomSanitizer} from '@angular/platform-browser';

/*
  Generated class for the ProductSettingsModify page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-product-settings-modify',
  templateUrl: 'product-settings-modify.html'
})
export class ProductSettingsModifyPage {
  product:any
  photo:any
  photoRaw:any
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, private sanitizer: DomSanitizer,
              public myDatabase: MyDatabase) {
    this.product = navParams.get("product")
    this.photoRaw = this.product.photo
    this.photo = this.sanitizer.bypassSecurityTrustUrl(this.product.photo);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProductSettingsModifyPage');
  }

  viewPhoto(photo){
    PhotoViewer.show(photo);
  }

  submitIt(){
    this.myDatabase.showLoading()
    this.myDatabase.dbQueryRes("UPDATE products SET name = ?, category = ?, price = ?, unit_name = ?, description = ?, photo = ? WHERE id = ?", [this.product.name, this.product.category, this.product.price, this.product.unit_name, this.product.description, this.photoRaw, this.product.id]).then(() => {
      this.myDatabase.hideLoading()
      this.navCtrl.setRoot(ProductSettingsPage)
      this.myFunctions.toastIt(this.product.name + " is now updated")
    })
  }

  capture(){
    Camera.getPicture({quality: 80, targetWidth: 1024, targetHeight: 768, destinationType: 0}).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;

      this.photoRaw = base64Image
      this.photo = this.sanitizer.bypassSecurityTrustUrl(base64Image);
    }, (err) => {
      // Handle error
    });
  }

}

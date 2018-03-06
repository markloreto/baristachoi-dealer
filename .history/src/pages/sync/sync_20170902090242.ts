import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';

/**
 * Generated class for the SyncPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */

@Component({
  selector: 'page-sync',
  templateUrl: 'sync.html',
})
export class SyncPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private barcodeScanner: BarcodeScanner) {
    this.barcodeScanner.scan().then((barcodeData:any) => {
      // Success! Barcode data is here
      console.log(barcodeData)
      var sync_code = barcodeData.text
      sync_code = sync_code.slice(sync_code.indexOf("=") + 1)
      console.log(sync_code)
     }, (err) => {
         // An error occurred
     });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SyncPage');
  }

}

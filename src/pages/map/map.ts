import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';



/*
  Generated class for the Map page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-map',
  templateUrl: 'map.html'
})
export class MapPage {
  markers: any;
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.markers = navParams.get('markers');
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MapPage');
  }
}

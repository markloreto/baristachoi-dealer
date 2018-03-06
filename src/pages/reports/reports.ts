import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {TripPage} from '../trip/trip'

/*
  Generated class for the Reports page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-reports',
  templateUrl: 'reports.html'
})
export class ReportsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReportsPage');
  }

  tripPage(){
    this.navCtrl.push(TripPage)
  }



}

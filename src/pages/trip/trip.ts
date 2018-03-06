import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';
import {TravelLogsPage} from '../travel-logs/travel-logs'
import * as moment from 'moment';
import * as _ from 'lodash';
/*
  Generated class for the Trip page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-trip',
  templateUrl: 'trip.html'
})
export class TripPage {
  from:any
  to:any
  topSpeed:any
  averageSpeed:any = 0.0
  highestAlt:any
  lowestAlt:any
  overSpeeding:any = []
  dates:any = []
  tricycle:any = []
  maxSpeed:any = 40
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase) {
    this.topSpeed = {speed: 0.0}
    this.highestAlt = {altitude: 0.0}
    this.lowestAlt = {altitude: 0.0}
    this.maxSpeed = this.myDatabase.maximumSpeed
    this.myDatabase.showLoading()
    this.myFunctions.getGPSlogs().then((logs:any)=>{
      this.tricycle = logs //_.filter(logs, function(o) { return o.speed >= 10 ; });
      console.log("Tricycle", this.tricycle)
      this.topSpeed = this.maxBy(this.tricycle, "speed")
      this.from = logs[logs.length - 1].myDate
      this.to = logs[0].myDate
      this.averageSpeed = this.meanBy(this.tricycle, "speed")
      this.highestAlt = this.maxBy(this.tricycle, 'altitude');
      this.lowestAlt = this.minBy(this.tricycle, 'altitude');
      this.overSpeeding = this.filterd(this.tricycle, "speed")
      this.dates = _.toArray(_.groupBy(this.tricycle, 'myDate'))
      console.log("dates", this.dates)
      this.myDatabase.hideLoading()
    }).catch(_=>{
      this.myDatabase.hideLoading()
    })
  }

  meanBy(a, v){
    return _.meanBy(a, v);
  }

  maxBy(a, v){
    return _.maxBy(a, v);
  }

  minBy(a, v){
    return _.minBy(a, v);
  }

  filterd(a, v){
    var ms = this.maxSpeed
    return _.filter(a, function(o) { return (o[v] >= ms) });
  }

  travelLogs(item){
    this.navCtrl.push(TravelLogsPage, {
      items: item
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TripPage');
  }

}

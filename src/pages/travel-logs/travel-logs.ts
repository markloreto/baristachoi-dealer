import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';

declare var cordova: any

/*
  Generated class for the TravelLogs page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-travel-logs',
  templateUrl: 'travel-logs.html'
})
export class TravelLogsPage {
  markers: any = []
  items: any = []
  maxSpeed:any
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase) {
    this.items = navParams.get("items")
    this.maxSpeed = this.myDatabase.maximumSpeed
    var arrow
    var title
    for(var x in this.items){
      arrow = "blue"
      title = [this.items[x].myTime, this.items[x].speed + " mps"].join("\n")

      if(x == "0")
        arrow = "grey"
      if(x === (this.items.length-1).toString())
        arrow = "green"
      if(this.items[x].speed >= this.maxSpeed)
        arrow = "red"

      this.markers.push({lat: this.items[x]["location"][0], lng: this.items[x]["location"][1], draggable: false, title: title, icon: {'url': cordova.file.applicationDirectory + "www/assets/images/arrows/"+arrow+"_arrow.png"}, rotation: this.items[x].bearing})
    }
    console.log("markers", this.markers)
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TravelLogsPage');
  }

}

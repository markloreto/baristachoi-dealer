import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';
import { AddMachinePage } from '../../pages/add-machine/add-machine'
import * as moment from 'moment';
import {CallsheetDayPage} from "../callsheet-day/callsheet-day";

/*
 Generated class for the Callsheet page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-callsheet',
  templateUrl: 'calls.html'
})
export class CallsPage {
  days: any;
  today: string;
  accuracy: any;
  accColor: string;
  pos: any;
  allData: any
  lead: number
  prospect: number
  active: number
  gpsError: boolean
  locWatchingC: (position:any) => void
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public events: Events, public myDatabase: MyDatabase) {
    this.myFunctions.checkGps();
    this.today = moment().format("ddd");
    this.allData = []
    this.gpsError = this.myFunctions.gpsError

    this.accuracy = "Positioning...";
    this.accColor = "danger";

    this.locWatchingC = (position) => {
      this.accuracy = position.coords.accuracy.toFixed(2);
      this.accColor = (this.accuracy <= this.myFunctions.gpsMinimumMeter) ? "green" : "yellow";
      this.pos = position;
    }

    this.days = this.myFunctions.days

    this.myFunctions.getMachineStatus().then((machineStatus:any) => {
      this.lead = machineStatus.lead
      this.prospect = machineStatus.prospect
      this.active = machineStatus.active
    })

  }

  groupBy(arr, key) {
    var newArr = [],
      types = {},
      i, j, cur;
    for (i = 0, j = arr.length; i < j; i++) {
      cur = arr[i];
      if (!(cur[key] in types)) {
        types[cur[key]] = [];
        newArr[cur[key]] = types[cur[key]];
      }
      types[cur[key]].push(cur);
    }
    return newArr;
  }

  ionViewDidLoad() {
    //if(this.myDatabase.gps_bg == "disabled")
    this.myFunctions.enableLocation();
  }

  ionViewWillLeave(){
    this.events.unsubscribe('location:watching', this.locWatchingC);
  }

  ionViewDidEnter(){
    this.myDatabase.dbQueryRes("SELECT delivery FROM machines WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((data:any) => {
      let arr = []
      for(var x = 0; x < data.length; x++) {
        arr.push(data[x])
      }

      this.allData = this.groupBy(arr, "delivery")


      this.days = this.myFunctions.days
    })



    this.events.subscribe('location:watching', this.locWatchingC);
  }

  cs(day, full){
    this.navCtrl.push(CallsheetDayPage, {
      day: full,
      delivery: day,
    });
  }

  addMachine(ev){
    if(this.accColor == "danger"){
      this.myFunctions.checkGps();
      this.myFunctions.toastIt("GPS is still positioning... please wait")
    }
    else{
      this.navCtrl.push(AddMachinePage, {
        pos: this.pos,
        days: this.days,
        delivery: this.today
      });
    }

  }

}

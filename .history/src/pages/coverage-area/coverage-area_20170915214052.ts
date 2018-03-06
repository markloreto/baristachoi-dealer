import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';
import {CallsheetDayPage} from "../callsheet-day/callsheet-day";
import { File } from 'ionic-native';
import * as _ from 'lodash';
import * as moment from 'moment';

declare var cordova: any
declare var window
/*
  Generated class for the CoverageArea page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-coverage-area',
  templateUrl: 'coverage-area.html'
})
export class CoverageAreaPage {
  areas: any = [];
  notYourAreas: any = []
  areasNum: number = 0
  notYourAreaNum: number = 0
  coverageArea: any = []
  today: string;
  accuracy: any;
  accColor: string;
  pos: any;
  allData: any
  locWatchingC: (position:any) => void
  myLoc: any = ""
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public events: Events, public myDatabase: MyDatabase) {
    this.myFunctions.checkGps();
    this.allData = []

    this.accuracy = "Positioning...";
    this.accColor = "danger";

    this.locWatchingC = (position) => {
      this.accuracy = position.coords.accuracy.toFixed(2);
      this.accColor = (this.accuracy <= this.myFunctions.gpsMinimumMeter) ? "green" : "yellow";
      this.pos = position;
      if(this.myLoc == ""){
        this.myFunctions.getLocation([position.coords.latitude, position.coords.longitude]).then((data:any) => {
          this.myLoc = data.NAME_1 + ", " + data.NAME_2 + ", " + data.NAME_3
        })
      }

    }

  }

  cs(area){
    console.log(area)
    if(area[0] === ""){
      console.log("Loading Unknown")
      this.navCtrl.push(CallsheetDayPage, {
        area: area,
      });
    }
    else{
      this.myDatabase.showLoading()
      this.myFunctions.brgyDbExec("SELECT ASGeoJSON(Geometry) AS geo FROM barangays WHERE NAME_1 = ? AND NAME_2 = ? AND NAME_3 = ?", [area[0], area[1], area[2]]).then((r:any)=>{
        var geo = JSON.parse(r[0].geo)
        geo = geo["coordinates"][0][0]
        var newGeo = []
        for(var x in geo){
          newGeo.push({"lat": geo[x][1], "lng" : geo[x][0]})
        }
        this.myDatabase.hideLoading()
        this.navCtrl.push(CallsheetDayPage, {
          area: area,
          poly: newGeo
        });
      })
    }

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CoverageAreaPage');
    this.myFunctions.enableLocation();
  }

  ionViewWillLeave(){
    this.events.unsubscribe('location:watching', this.locWatchingC);
  }

  loadIt(){
    this.notYourAreas = []
    this.areas = []
    this.coverageArea = []
    this.myDatabase.dbQueryRes("SELECT * FROM coverage_area WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((ca:any) => {
      for(var x in ca){
        this.coverageArea.push(ca[x].area)
      }
      console.log("Coverage Area: ", ca)

      this.myDatabase.dbQueryRes("SELECT region, municipal, brgy, COUNT(*) AS numbers FROM machines WHERE creator_id = ? GROUP BY region, municipal, brgy ORDER BY COUNT(*) DESC", [this.myDatabase.userInfo.id]).then((data:any) => {
        this.areasNum = 0
        this.notYourAreaNum = 0
        for(var x = 0; x < data.length; x++) {
          if(_.includes(this.coverageArea, data[x].region + ', ' + data[x].municipal + ', ' + data[x].brgy)){
            this.areasNum += data[x].numbers
            this.areas.push(data[x])
          }

          else{
            this.notYourAreaNum += data[x].numbers
            this.notYourAreas.push(data[x])
          }

        }

      })
    })
  }

  ionViewDidEnter(){
    this.loadIt()
    this.events.subscribe('location:watching', this.locWatchingC);

  }

  set(area){
    this.myDatabase.showLoading()
    this.myDatabase.dbQueryRes("INSERT INTO coverage_area VALUES (?, ?, ?)", [this.myDatabase.getTimestamp(), this.myDatabase.userInfo.id, area.region + ', ' + area.municipal + ', ' + area.brgy]).then(()=>{
      this.loadIt()
      this.myDatabase.hideLoading()
    })
  }

  unset(area){
    this.myDatabase.showLoading()
    this.myDatabase.dbQueryRes("DELETE FROM coverage_area WHERE creator_id = ? AND area = ?", [this.myDatabase.userInfo.id, area.region + ', ' + area.municipal + ', ' + area.brgy]).then(()=>{
      this.loadIt()
      this.myDatabase.hideLoading()
    })
  }

  writeNow(area){
    this.myDatabase.dbQueryRes("SELECT * FROM machines WHERE creator_id = ? AND region = ? AND municipal = ? AND brgy = ?", [this.myDatabase.userInfo.id, area.region, area.municipal, area.brgy]).then((machines:any) => {
      var json = {"databaseImport": {"data": {"inserts" : {"machines" : machines}}}}
      console.log("JSON:", JSON.stringify(json))
      var path = cordova.file.externalApplicationStorageDirectory + "backups"
      var fName = area.region + '_' + area.municipal + '_' + area.brgy + "_" + moment().format("YYYY-MM-DD_mm-ss-A") + ".baristachoi"
      File.writeFile(path, fName, JSON.stringify(json)).then(()=>{

      }).catch(e => console.log(e))
    })
  }

  buConfirm(){
    this.myDatabase.backUpConfirm()
  }

  backup(area){
    this.myDatabase.showLoading()
    //this.myDatabase.dbQueryRes("SELECT * FROM machines WHERE creator_id = ? AND region = ? AND municipal = ? AND brgy = ?",
    this.myDatabase.dbQueryRes("SELECT * FROM machines WHERE creator_id = ? AND region = ? AND municipal = ? AND brgy = ?", [this.myDatabase.userInfo.id, area.region, area.municipal, area.brgy]).then((machines:any) => {
      for(var x in machines){
        this.myDatabase.machineBackups.push(machines[x])
      }

      this.myDatabase.machineBackups = _.uniqBy(this.myDatabase.machineBackups, 'id');
      console.log(this.myDatabase.machineBackups)
      this.myDatabase.hideLoading()
    })
  }

}

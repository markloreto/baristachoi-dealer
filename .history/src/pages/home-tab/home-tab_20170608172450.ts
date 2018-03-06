import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {UnsentMessagesPage} from '../../pages/unsent-messages/unsent-messages'
import {HelloIonicPage} from '../../pages/hello-ionic/hello-ionic'
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'

/*
  Generated class for the HomeTab page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-home-tab',
  templateUrl: 'home-tab.html'
})
export class HomeTabPage {
  page1 = HelloIonicPage
  page2 = UnsentMessagesPage
  machineIds: any = []
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase) {
    this.myDatabase.refreshUnsents()
    this.myDatabase.dbQueryRes("SELECT id FROM machines WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((data:any) => {
      console.log("All machine ids", data)
      if(data.length > 1){
        this.machineIds = data
        this.machineThumbnail(0)
      }
    })
  }

  machineThumbnail(i){
    this.myDatabase.dbQueryRes("SELECT photo FROM machines WHERE id = ?", [this.machineIds[i].id]).then((data:any) => {
      console.log("Base64:", data)
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomeTabPage');
  }

}

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
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase) {
    this.myDatabase.refreshUnsents()
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomeTabPage');
  }

}

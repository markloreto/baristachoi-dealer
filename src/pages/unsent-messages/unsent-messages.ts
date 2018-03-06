import { Component } from '@angular/core';
import { NavController, NavParams, Events } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import * as moment from 'moment';
/*
  Generated class for the UnsentMessages page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-unsent-messages',
  templateUrl: 'unsent-messages.html'
})
export class UnsentMessagesPage {
  m: any = moment
  smsWatch: (id:any) => void
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase, public events: Events) {
    this.myDatabase.refreshUnsents()

    this.smsWatch = (id) => {
      for(var x in this.myDatabase.unsents){
        if(this.myDatabase.unsents[x].id == id){
          this.myDatabase.unsents[x].disabled = false
        }
      }
    }
  }

  ionViewWillLeave(){
    this.events.unsubscribe('sms:failed', this.smsWatch);
  }

  ionViewDidEnter(){

    this.events.subscribe('sms:failed', this.smsWatch);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad UnsentMessagesPage');
  }

  sendIt(unsent){
    let contacts = unsent.numbers.split(",")
    unsent.disabled = true
    this.myFunctions.toastIt("Sending SMS...")
    this.myFunctions.sendSMS(contacts, unsent.msg, false, false, unsent.id)
  }

}

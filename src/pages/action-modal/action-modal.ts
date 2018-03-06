import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, AlertController } from 'ionic-angular';

/*
  Generated class for the ActionModal page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-action-modal',
  templateUrl: 'action-modal.html'
})
export class ActionModalPage {
  items:any
  note:string = ""
  action:string
  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public alertCtrl: AlertController) {
    this.items = navParams.get("data")
    this.action = navParams.get("action")

  }

  dismiss() {
    this.viewCtrl.dismiss({text: ""});
  }

  submitIt(n = this.note, id = false){
    this.viewCtrl.dismiss({text: n, id: id});
  }

  addAction(e){
    this.alertCtrl.create({
      title: 'Add note for ' + this.action,
      message: "Please provide more than 3 characters",
      inputs: [
        {
          name: 'note',
          placeholder: 'Type your notes here',
          type: 'text'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Submit',
          handler: data => {
            if (data.note.length > 3) {
              this.submitIt(data.note)
            } else {
              this.alertCtrl.create({
                title: "Wrong inputs",
                subTitle: "Please provide more than 3 characters for your note",
                buttons: ['Dismiss']
              }).present();
            }
          }
        }
      ]
    }).present()
  }

  removeItem(item){
    this.viewCtrl.dismiss({text: item.name, remove: item.id});
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ActionModalPage');
  }

}

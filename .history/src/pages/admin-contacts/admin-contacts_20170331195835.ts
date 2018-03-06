import { Component } from '@angular/core';
import { NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import {
  Contacts
} from 'ionic-native';

/*
  Generated class for the AdminContacts page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-admin-contacts',
  templateUrl: 'admin-contacts.html'
})
export class AdminContactsPage {
  items:any = []
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions,
              public myDatabase: MyDatabase, public actionSheetCtrl: ActionSheetController) {

    this.startIt()
  }

  startIt(){
    this.myDatabase.dbQueryRes("SELECT * FROM admin_contacts WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((res:any) => {
      this.items = res
    })
  }

  removeItem(item){
    this.myDatabase.showLoading()
    this.myDatabase.dbQuery("DELETE FROM admin_contacts WHERE creator_id = ? and id = ?", [this.myDatabase.userInfo.id, item.id]).then(() => {
      this.myDatabase.hideLoading()
      this.startIt()
    })
  }

  addAdminContact(name, number){
    console.log(name + " " + number)
    number = number.replace("+63","0")
    number = number.replace(/[^0-9]/gim,"")
    this.myDatabase.dbQueryRes("INSERT INTO admin_contacts (id, created_date, updated_date, creator_id, name, contact) VALUES (?, ?, ?, ?, ?, ?)", [this.myDatabase.getTimestamp(), this.myDatabase.getTimestamp(), this.myDatabase.getTimestamp(), this.myDatabase.userInfo.id, name, number]).then(()=>{
      this.startIt()
    })
  }

  addAction(){
    Contacts.pickContact().then(c => {
      console.log(c)
      if(c.phoneNumbers){
        if(c.phoneNumbers.length > 1){

          var btns = []

          for(var x in c.phoneNumbers){
            let n = c.phoneNumbers[x].value
            btns.push({
              text: c.phoneNumbers[x].value + " ["+this.myFunctions.getCarrier(c.phoneNumbers[x].value)+"]",
              handler: () => {
                this.addAdminContact(c.displayName, n)
              }
            })
          }

          btns.push({
            text: "Cancel",
            role: 'cancel',
            handler: () => {

            }
          })

          this.actionSheetCtrl.create({
            title: 'Select phone number',
            buttons: btns
          }).present()
        }
        else{
          this.addAdminContact(c.displayName, c.phoneNumbers[0].value)
        }
      }else{
        this.myFunctions.toastIt("Selected contact does not have a phone number")
      }

    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AdminContactsPage');
  }

}

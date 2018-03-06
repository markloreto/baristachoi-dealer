import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, ModalController } from 'ionic-angular';
import { AddClientPage } from '../../pages/add-client/add-client'
import { MyDatabase } from '../../providers/my-database';
import {
  PhotoViewer
} from 'ionic-native';
import {DomSanitizer} from '@angular/platform-browser';
/*
  Generated class for the SearchClient page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-search-client',
  templateUrl: 'search-client.html'
})
export class SearchClientPage {
  clientList: any
  data: any
  searchQ: any

  constructor(public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public modalCtrl: ModalController, public sanitizer: DomSanitizer, public myDatabase: MyDatabase) {

    this.clientList = []
    this.searchQ = []
    this.data = {}
    this.refreshClients()
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchClientPage');
  }

  viewPhoto(id){
  
    this.myDatabase.dbQueryRes("SELECT photo FROM clients WHERE id = ?", [id]).then((d:any) => {
      console.log(d)
      PhotoViewer.show(d[0].photo);
    })
    
  }

  resolvePhoto(photo){
    if(photo == "")
      return "assets/images/machines/Unspecified.png"
    return this.sanitizer.bypassSecurityTrustUrl(photo);
  }

  selectIt(id){
    this.data.id = id
    this.navCtrl.pop().then(() => this.navParams.get('resolve')(this.data))
  }

  refreshClients(){
    this.clientList = []
    this.myDatabase.dbQuery("SELECT c.id, c.alias, c.company, c.contact, c.contact2, c.created_date, c.creator_id, c.email, c.last_order_date, c.lat, c.lng, c.name, c.thumbnail, c.updated_date, (SELECT COUNT(*) FROM machines m_b WHERE m_b.owner_id = c.id) AS units, (SELECT o_b.client_id FROM orders o_b WHERE o_b.client_id = c.id ORDER BY o_b.created_date DESC LIMIT 1) AS last_order FROM clients c WHERE c.creator_id = ? ORDER BY c.name ASC", [this.myDatabase.userInfo.id]).then((data:any) => {
      let arr = []
      var ar
      for(var x = 0; x < data.rows.length; x++) {
        ar = data.rows.item(x)
        ar.photo = (ar.thumbnail) ? ar.thumbnail : "assets/images/no_user_1.jpg"
        ar.client_status = (ar.last_order) ? "active" : (ar.owner_id) ? "prospect" : "lead"
        ar.client_status_icon = (ar.client_status == "active") ? ["success", "heart"] : (ar.client_status == "prospect") ? ["warning", "chatbubbles"] : ["error", "contacts"]
        arr.push(ar)
      }

      console.log(arr)
      this.clientList = arr;
      this.searchQ = arr;
    });
  }

  getItems(ev: any) {
    // Reset items back to all of the items
    this.searchQ = this.clientList
    // set val to the value of the searchbar
    let val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.searchQ = this.searchQ.filter((item) => {
        return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
  }

  addClient(){
    new Promise((resolve, reject) => {
      this.navCtrl.push(AddClientPage, {resolve: resolve});
    }).then((data:any) => {
      if(data.id){
        console.log("Checking @ Search Client", data)
        this.data = data
        this.refreshClients()
        this.selectIt(data.id)
      }
    });
  }

}

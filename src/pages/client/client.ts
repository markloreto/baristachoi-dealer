import { Component } from '@angular/core';
import { NavController, NavParams, PopoverController, ViewController, ActionSheetController, AlertController, ModalController} from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import { AddClientPage } from '../../pages/add-client/add-client'
import {OrderClient} from '../../pages/order-client/order-client'
import {
  PhotoViewer
} from 'ionic-native';
import { MyFunctions } from '../../providers/my-functions';

/*
  Generated class for the Client page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/

@Component({
  template: `
    <ion-list>
      <button ion-item (click)="toggleSelection()">Toggle Selection</button>
      <button ion-item (click)="selectAll()" *ngIf="selection && (selectedClients.length != clients.length)">Select All <span class="badge">{{ clients.length }}</span></button>
      <button ion-item (click)="deSelectAll()" *ngIf="selection && selectedClients.length">Deselect All <span class="badge">{{ selectedClients.length }}</span></button>
      <button ion-item (click)="withSelected()" *ngIf="selectedClients.length">With selected <span class="badge">{{ selectedClients.length }}</span></button>
    </ion-list>
  `
})
export class ClientsPopUpPage {
  clients: any = [];
  selectedClients: any = []
  selection: any
  constructor(public viewCtrl: ViewController, private navParams: NavParams, public actionSheetCtrl: ActionSheetController, private alertCtrl: AlertController) {
    this.clients = this.navParams.get("clients")
    this.selection = this.navParams.get("selection")
    
    for(var x in this.clients) {
      if (this.clients[x].chk)
        this.selectedClients.push(this.clients[x])
    }
  }

  selectAll(){
    this.viewCtrl.dismiss({selection: this.selection, remove: [], delivery: [], selectAll: true})
  }

  deSelectAll(){
    this.viewCtrl.dismiss({selection: this.selection, remove: [], delivery: [], deSelectAll: true})
  }

  withSelected(){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Please select',
      buttons: [
        {
          icon: "trash",
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            let alert = this.alertCtrl.create({
              message: 'Are you sure you want to remove ' + this.selectedClients.length + ' ' + ((this.selectedClients.length > 1) ? "clients" : "client") + "?",
              title: 'Please confirm',
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel',
                  handler: () => {
                    console.log('Cancel clicked');
                  }
                },
                {
                  text: 'Yes',
                  handler: () => {
                    this.viewCtrl.dismiss({selection: this.selection, remove: this.selectedClients})
                  }
                }
              ]
            });
            alert.present();
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'u-bg-red',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ],
    });

    actionSheet.present();
  }

  close() {
    this.viewCtrl.dismiss({selection: this.selection, remove: []})
  }

  toggleSelection(){
    this.selection = (this.selection) ? !this.selection : !this.selection

    this.close()
  }
}


@Component({
  selector: 'page-client',
  templateUrl: 'client.html'
})
export class ClientPage {
  clients: any = [];
  searchQ: any = []
  selection: boolean = false
  data: any
  constructor(public navCtrl: NavController, public navParams: NavParams, private myDatabase: MyDatabase, public popoverCtrl: PopoverController, public myFunctions: MyFunctions, public modalCtrl: ModalController) {

  }

  getItems(ev: any) {
    // Reset items back to all of the items
    this.searchQ = this.clients
    // set val to the value of the searchbar
    let val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.searchQ = this.searchQ.filter((item) => {
        return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
  }

  viewPhoto(id){
  
    this.myDatabase.dbQueryRes("SELECT photo FROM clients WHERE id = ?", [id]).then((d:any) => {
      console.log(d)
      PhotoViewer.show(d[0].photo);
    })
    
  }

  updateClient(c){
    new Promise((resolve, reject) => {
      this.myDatabase.dbQueryRes("SELECT photo FROM clients WHERE id = ?", [c.id]).then((d:any) => {
        c.rawPhoto = d[0].photo
        this.navCtrl.push(AddClientPage, {resolve: resolve, client: c});
      })
      
    }).then((data:any) => {
      if(data.id){
        this.data = data
      }
    });
  }

  orders(client){
    this.navCtrl.push(OrderClient, {
      id: client.id,
      name: client.name
    })
  }

  loadIt(){
    this.myDatabase.showLoading()
    this.myDatabase.dbQuery("SELECT c.id, c.alias, c.company, c.contact, c.contact2, c.created_date, c.creator_id, c.email, c.last_order_date, c.lat, c.lng, c.name, c.thumbnail, c.updated_date, (SELECT COUNT(*) FROM machines m_b WHERE m_b.owner_id = c.id) AS units, (SELECT o_b.client_id FROM orders o_b WHERE o_b.client_id = c.id ORDER BY o_b.created_date DESC LIMIT 1) AS last_order, c.last_order_date AS client_last_order_date FROM clients c WHERE c.creator_id = ? ORDER BY c.name ASC", [this.myDatabase.userInfo.id]).then((data:any) => {
      let arr = []
      this.clients = []
      var ar
      for(var x = 0; x < data.rows.length; x++) {
        ar = data.rows.item(x)
        ar.photo = (ar.thumbnail) ? ar.thumbnail : "assets/images/no_user_1.jpg"
        ar.chk = false
        ar.client_status = (ar.last_order) ? "active" : (ar.client_last_order_date) ? "active" : (ar.owner_id) ? "prospect" : "lead"
        ar.client_status_icon = (ar.client_status == "active") ? ["success", "heart"] : (ar.client_status == "prospect") ? ["warning", "chatbubbles"] : ["error", "contacts"]
        arr.push(ar)
      }

      this.clients = arr
      console.log("Clients", arr)
      this.searchQ = arr
      this.myDatabase.hideLoading()


    })
  }

  resetSelection(){
    for(var x in this.clients){
      if(this.clients[x].chk)
        this.clients[x].chk = false
    }
  }

  presentPopover(myEvent) {
    if(this.selection == false){
      this.resetSelection()
    }

    let popover = this.popoverCtrl.create(ClientsPopUpPage, {
      clients: this.clients,
      selection: this.selection
    });
    popover.present({
      ev: myEvent
    });

    popover.onDidDismiss((data:any) => {
      //this.selection = data
      if(data !== null){
        this.selection = (data.selection === null) ? this.selection : data.selection

        if(data.remove.length){
          this.myDatabase.showLoading()
          var arr = [];
          for(var x in data.remove){
            arr.push(["DELETE FROM clients WHERE id = ?", [data.remove[x].id]])
            arr.push(["DELETE FROM orders WHERE client_id = ?", [data.remove[x].id]])
            arr.push(["UPDATE machines SET owner_id = '', sync = ? WHERE owner_id = ?",[null, data.remove[x].id]])
          }

          this.myDatabase.dbQueryBatch(arr).then((data:any) => {
            this.myDatabase.hideLoading()
            this.myFunctions.toastIt("Selected clients are now removed")
            this.selection = false
            this.loadIt()
          })
        }

        if(data.selectAll){
          for(var x in this.clients){
            this.clients[x].chk = true
          }
        }

        if(data.deSelectAll){
          for(var x in this.clients){
            this.clients[x].chk = false
          }
        }
      }
    })
  }

  addClient(){
    new Promise((resolve, reject) => {
      this.navCtrl.push(AddClientPage, {resolve: resolve});
    }).then((data:any) => {
      if(data.id){
        this.data = data
        this.loadIt()
      }
    });
  }

  ionViewDidLoad() {

  }

  ionViewDidEnter(){
    this.loadIt()
  }

}

import {Component} from '@angular/core';
import { NavController, NavParams, Events, ActionSheetController, AlertController, PopoverController, ViewController, ModalController, ItemSliding } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';
import {DomSanitizer} from '@angular/platform-browser';
import {
  PhotoViewer,
  File,
  ImageResizer, ImageResizerOptions,
  CallNumber
} from 'ionic-native';
import { MapPage } from  '../../pages/map/map';
import { AddMachinePage } from '../../pages/add-machine/add-machine'
import {ActionModalPage} from '../../pages/action-modal/action-modal'
import {PointOfSalePage} from '../../pages/point-of-sale/point-of-sale'
import * as moment from 'moment';
import * as _ from 'lodash';
declare var cordova: any
declare var window
/*
  Generated class for the CallsheetDay page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/

@Component({
  template: `
    <ion-list>
      <button ion-item (click)="toggleSelection()">Toggle Selection Mode</button>
      <button ion-item (click)="selectAll()" *ngIf="selection && (selectedMachines.length != machines.length)">Select All <span class="badge">{{ machines.length }}</span></button>
      <button ion-item (click)="deSelectAll()" *ngIf="selection && selectedMachines.length">Deselect All <span class="badge">{{ selectedMachines.length }}</span></button>
      <button ion-item (click)="withSelected()" *ngIf="selectedMachines.length">With selected <span class="badge">{{ selectedMachines.length }}</span></button>
      <button ion-item (click)="sendSMS(globe)" *ngIf="globe.length">Send SMS to Globe ({{globe.length}})</button>
      <button ion-item (click)="sendSMS(smart)" *ngIf="smart.length">Send SMS to Smart ({{smart.length}})</button>
      <button ion-item (click)="sendSMS(sun)" *ngIf="sun.length">Send SMS to Sun ({{sun.length}})</button>
      <button ion-item (click)="sendSMS(unknown)" *ngIf="unknown.length">Send SMS to Unknown ({{unknown.length}})</button>
    </ion-list>
  `
})
export class CallSheetPopUpPage {
  machines: any = [];
  selectedMachines: any = []
  selection: any
  withContact:any = []
  globe: any = []
  smart: any = []
  sun: any = []
  unknown:any = []
  constructor(public viewCtrl: ViewController, public myDatabase: MyDatabase, private navParams: NavParams, public actionSheetCtrl: ActionSheetController, private alertCtrl: AlertController, public myFunctions: MyFunctions) {
    this.machines = this.navParams.get("machines")
    this.selection = this.navParams.get("selection")

    this.withContact = this.navParams.get("withContact")
    this.globe = this.navParams.get("globe")
    this.smart = this.navParams.get("smart")
    this.sun = this.navParams.get("sun")
    this.unknown = this.navParams.get("unknown")
    for(var x in this.machines){
      if(this.machines[x].chk){
        this.selectedMachines.push(this.machines[x])
      }
    }

  }

  sendSMS(n){
    this.myFunctions.sendSMS(n, "", true, false)
  }

  selectAll(){
    this.viewCtrl.dismiss({selection: this.selection, remove: [], delivery: [], selectAll: true})
  }

  deSelectAll(){
    this.viewCtrl.dismiss({selection: this.selection, remove: [], delivery: [], deSelectAll: true})
  }

  withSelected(){
    let delivery = (day:any) => {
      this.viewCtrl.dismiss({selection: this.selection, remove: [], delivery: this.selectedMachines, day: day})
    }

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Please select',
      buttons: [
        {
          icon: "trash",
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            let alert = this.alertCtrl.create({
              message: 'Are you sure you want to remove ' + this.selectedMachines.length + ' ' + ((this.selectedMachines.length > 1) ? "machines" : "machine") + "?",
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
                    this.viewCtrl.dismiss({selection: this.selection, remove: this.selectedMachines, delivery: []})
                  }
                }
              ]
            });
            alert.present();
          }
        },
        {
          icon: "calendar",
          text: 'Change Delivery Schedule',
          handler: () => {
            this.actionSheetCtrl.create({
              title: 'Move delivery schedule to',
              buttons: [
                {
                  text: 'Monday',
                  handler: () => {
                    delivery("Mon")
                  }
                },
                {
                  text: 'Tuesday',
                  handler: () => {
                    delivery("Tue")
                  }
                },
                {
                  text: 'Wednesday',
                  handler: () => {
                    delivery("Wed")
                  }
                },
                {
                  text: 'Thursday',
                  handler: () => {
                    delivery("Thu")
                  }
                },
                {
                  text: 'Friday',
                  handler: () => {
                    delivery("Fri")
                  }
                },
                {
                  text: 'Saturday',
                  handler: () => {
                    delivery("Sat")
                  }
                },
                {
                  text: 'Sunday',
                  handler: () => {
                    delivery("Sun")
                  }
                },
                {
                  text: 'Unspecified',
                  handler: () => {
                    delivery("Unspecified")
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
            }).present()
          }
        },
        {
          icon: "mail",
          text: 'Send SMS ('+this.withContact.length+')',
          handler: () => {
            if(this.withContact.length)
              this.myFunctions.sendSMS(this.withContact, "", true, false)
            else
              this.myFunctions.toastIt("Selected items does not have valid contact number")
          }
        },
        {
          icon: "swap",
          text: 'Transfer to S.A.S.',
          handler: () => {
            if(this.myDatabase.depot.name != "N/A"){
              this.myFunctions.transferMachines(this.selectedMachines).then(_ => {
                this.close()
              })
            }else{
              this.myFunctions.alert("Error", "Please set-up the Depot in the Settings")
            }
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
    this.viewCtrl.dismiss({selection: this.selection, remove: [], delivery: []})
  }

  toggleSelection(){
    this.selection = (this.selection) ? !this.selection : !this.selection

    this.close()
  }
}

@Component({
  selector: 'page-callsheet-day',
  templateUrl: 'callsheet-day.html'
})
export class CallsheetDayPage {
  delivery: any
  title: any
  area: any
  ids: any
  machines: any
  accuracy: any;
  accColor: string;
  pos: any;
  swipeOption: boolean = true
  gpsOK = true
  gpsTimer = 60
  tab: any = "machines"
  markers: any = []
  mapEnabled: boolean = true
  locWatchingcs: (position:any) => void
  photoDir: any
  checked: any = []
  m: any = moment
  selection: boolean = false
  today: any = moment().format("MM-DD-YYYY");
  poly: any = []
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public events: Events, public myDatabase: MyDatabase, public sanitizer: DomSanitizer, public actionSheetCtrl: ActionSheetController, private alertCtrl: AlertController, public popoverCtrl: PopoverController, public modalCtrl: ModalController) {
    this.accuracy = "Positioning...";
    this.accColor = "danger";
    this.delivery = (navParams.get("delivery")) ? navParams.get("delivery") : "Unspecified"
    this.area = navParams.get("area")
    this.ids = (navParams.get('ids')) ? navParams.get('ids') : []
    this.poly = (navParams.get("poly")) ? navParams.get("poly") : []
    this.title = (navParams.get("title")) ? navParams.get("title") : (navParams.get("day")) ? navParams.get("day") + " Calls" : (this.area[0]) ? this.area[0] + ", " + this.area[1] + ", " + this.area[2] : "Unknown"
    this.machines = []

    this.myFunctions.checkGps();
    this.myFunctions.enableLocation()

    this.locWatchingcs = (position) => {
      this.accuracy = position.coords.accuracy.toFixed(2);
      this.accColor = (this.accuracy <= this.myFunctions.gpsMinimumMeter) ? "green" : "yellow";
      this.pos = position;
    }

  }


  ionViewWillEnter(){
    this.events.subscribe('location:watching', this.locWatchingcs);
  }

  ionViewWillLeave(){
    this.events.unsubscribe('location:watching', this.locWatchingcs);
  }

  chkSegment(){

    if(this.tab == "map"){
      this.events.publish("map:animatemarkers")
    }
  }

  resetSelection(){
    for(var x in this.machines){
      if(this.machines[x].chk)
        this.machines[x].chk = false
    }
  }

  presentPopover(myEvent) {
    if(this.selection == false){
      this.resetSelection()
    }

    var withContact = []
    var globe = []
    var smart = []
    var sun = []
    var unknown = []
    var aContact = []

    for(var x in this.machines){
      if(this.machines[x].chk){

        if(this.machines[x].client_contact != null){
          if(this.machines[x].client_contact.length == 11)
            withContact.push(this.machines[x].client_contact)
        }
      }

      if(this.machines[x].client_contact != null){
        if(this.machines[x].client_contact.length == 11)
          aContact.push(this.machines[x].client_contact)
      }
    }

    withContact = _.uniq(withContact);
    aContact = _.uniq(aContact);
    var c;
    for(var x in aContact){
      c = this.myFunctions.getCarrier(aContact[x])

      if(c == "Globe")
        globe.push(aContact[x])
      if(c == "Smart")
        smart.push(aContact[x])
      if(c == "Sun")
        sun.push(aContact[x])
      if(c == "Unknown")
        unknown.push(aContact[x])
    }

    let popover = this.popoverCtrl.create(CallSheetPopUpPage, {
      machines: this.machines,
      selection: this.selection,
      withContact: withContact,
      globe: globe,
      smart: smart,
      sun: sun,
      unknown: unknown
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
            arr.push(["DELETE FROM machines WHERE id = ?", [data.remove[x].id]])
            arr.push(["DELETE FROM callsheets WHERE machine_id = ?", [data.remove[x].id]])
          }

          this.myDatabase.dbQueryBatch(arr).then((data:any) => {
            this.myDatabase.hideLoading()
            this.myFunctions.toastIt("Selected machines are now removed")
            this.navCtrl.pop()
          })
        }

        if(data.delivery.length){
          this.myDatabase.showLoading()
          var arr = [];
          for(var x in data.delivery){
            arr.push(["UPDATE machines SET delivery = ?, sync = ? WHERE id = ?", [data.day, null, data.delivery[x].id]])
          }

          this.myDatabase.dbQueryBatch(arr).then((data1:any) => {
            this.myDatabase.hideLoading()
            this.myFunctions.toastIt("Selected machines are now set to " + data.day + " delivery")
            this.navCtrl.pop()
          })
        }

        if(data.selectAll){
          for(var x in this.machines){
            this.machines[x].chk = true
          }
        }

        if(data.deSelectAll){
          for(var x in this.machines){
            this.machines[x].chk = false
          }
        }
      }
    })
  }

  chkb(machine){
    console.log(machine.chk)

  }

  activity(machine, slidingItem: ItemSliding){
    slidingItem.close();
    let self = this

    function transact(machine, action, pos, distance){
      if(action == "Sale"){
        if(!machine.client_id){
          self.alertCtrl.create({
            title: 'Machine is still in lead status',
            subTitle: 'Please update the client information first',
            buttons: ['OK']
          }).present()
          self.updateMachine(machine, slidingItem)
        }
        else{
          self.navCtrl.push(PointOfSalePage, {
            clientId: machine.client_id,
            machineId: machine.id,
            pos: pos,
            distance: distance,
            machine: machine
          })
        }
      }

      else{
        self.myFunctions.disabledOptionBtn = true
        self.myDatabase.dbQueryRes("SELECT name, id FROM actions WHERE action = ? AND creator_id = ?", [action, self.myDatabase.userInfo.id]).then((data:any) => {
          let actionModal = self.modalCtrl.create(ActionModalPage, { data: data, action: action });
          actionModal.onDidDismiss(d => {
            if(d.remove){
              self.myDatabase.dbQuery("DELETE FROM actions WHERE id = ?", [d.remove]).then(() => {
                self.alertCtrl.create({
                  title: action,
                  subTitle: d.text + " is now removed",
                  buttons: ['Dismiss']
                }).present();
              })
            }else{
              if(d.text != ""){
                var id = (d.id) ? d.id : self.myDatabase.getTimestamp()
                self.myDatabase.dbQuery("INSERT OR REPLACE INTO actions (id, creator_id, name, action, sync) VALUES (?, ?, ?, ?, ?)", [id, self.myDatabase.userInfo.id, d.text, action, null]).then(() => {
                  var id = self.myDatabase.getTimestamp()
                  var note = d.text
                  var arr = []

                  arr.push(["INSERT INTO callsheets (id, creator_id, machine_id, created_date, updated_date, type, lat, lng, note, distance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, self.myDatabase.userInfo.id, machine.id, id, id, action, pos.coords.latitude, pos.coords.longitude, note, distance]])

                  console.log(machine)
                  self.myFunctions.sendClientReport(machine)

                  if(distance <= self.myFunctions.gpsMinimumMeter || distance == null)
                    arr.push(["UPDATE machines SET last_visit_date = ?, updated_date = ?, sync = ? WHERE id = ?", [id, id, null, machine.id]])

                  self.myDatabase.dbQueryBatch(arr).then((data:any) => {
                    self.alertCtrl.create({
                      title: action,
                      subTitle: d.text + " - is now added to Callsheet",
                      buttons: ['Ok']
                    }).present();

                    if(machine.client_contact && action == "No Action"){
                      self.myFunctions.confirm("Please Confirm", "Would you like to inform your client about you action?").then(() => {
                        self.myFunctions.sendSMS(machine.client_contact, "Hi " + machine.client_name + ",\nI've visited your machine and performed no action for the following reason:\n" + d.text + "\n\nlocated @\nMap: http://maps.google.com/?q="+machine.lat+","+machine.lng + "\n\nI'm about "+distance+"m from your machine. Your Sales and Service Crew \n-" + self.myDatabase.userInfo.name, true, false)
                      })
                    }

                    self.loadIt()

                    self.myFunctions.chkCalls(self.myDatabase.getTimestamp()).then((t:any) => {
                      //first call
                      if(t.total_visited == 1 && distance <= self.myFunctions.gpsMinimumMeter){
                        self.myFunctions.firstCall()
                      }
                      //last call
                      if(t.total_visited == t.total_units && t.total_units != 0 && distance <= self.myFunctions.gpsMinimumMeter)
                        self.myFunctions.dailyReport(self.myDatabase.getTimestamp())
                    })

                  })
                })
              }

            }

          });
          actionModal.present();
        })
      }

    }

    function chkSignal(machine, action){
      if(!self.pos && self.gpsOK){
        let alert = self.alertCtrl.create({
          title: 'GPS is still locating...',
          subTitle: 'Please wait for ' + self.gpsTimer + ' seconds',
          buttons: ['Dismiss']
        });
        alert.present();
        if(self.gpsTimer == 60){
          let t = setInterval(() => {

            if(self.pos){
              clearInterval(t);
            }

            self.gpsTimer = self.gpsTimer - 1
            if(1/* self.gpsTimer <= 0 */){
              clearInterval(t);
              self.gpsOK = false
              self.alertCtrl.create({
                title: "GPS Signal problem detected!",
                subTitle: 'You may still do transactions for now even without GPS',
                buttons: ['Dismiss']
              }).present();

              //todo: created report for no GPS
            }

          }, 1000)
        }
      }else{
        var d
        var pos
        if(self.pos){
          self.gpsOK = true
          pos = self.pos
          d = parseFloat(self.distance(machine.lat, machine.lng))
        }
        else{
          self.gpsOK = false
          pos = {coords: {latitude: null, longitude: null}}
          d = null
        }

        if(self.gpsOK){
          if(d <= self.myFunctions.gpsMinimumMeter){

            transact(machine, action, pos, d)
          }
          else{

            self.alertCtrl.create({
              title: 'Minimum distance for transactions failed!',
              message: 'The required ' + self.myFunctions.gpsMinimumMeter + ' meters minimum distance from you to the machine has failed! if you continue, this transaction is not valid ',
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel',
                  handler: () => {

                  }
                },
                {
                  text: 'Continue',
                  handler: () => {
                    transact(machine, action, pos, d)
                  }
                }
              ]
            }).present();
          }
        }else{
          transact(machine, action, pos, d)
        }



      }
    }

    this.myFunctions.disabledOptionBtn = true
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select Action',
      subTitle: machine.client_name,
      enableBackdropDismiss: false,
      buttons: [
        {
          text: 'Sale',
          icon: 'cart',
          handler: () => {
            chkSignal(machine, "Sale")
          }
        },{
          text: 'No Sale',
          icon: 'sad',
          handler: () => {
            chkSignal(machine, "No Sale")
          }
        },{
          text: 'Development',
          icon: 'chatbubbles',
          handler: () => {
            chkSignal(machine, "Development")
          }
        },{
          text: 'Repair',
          icon: 'construct',
          handler: () => {
            chkSignal(machine, "Repair")
          }
        },{
          text: 'Cleaning',
          icon: 'color-fill',
          handler: () => {
            chkSignal(machine, "Cleaning")
          }
        },{
          text: 'No Action',
          icon: 'hand',
          handler: () => {
            chkSignal(machine, "No Action")
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'u-bg-red',
          handler: () => {
            this.myFunctions.disabledOptionBtn = false
          }
        }
      ],
    });
    actionSheet.present();
  }

  ionViewDidEnter(){
    this.loadIt()
  }

  mapRange(lat, lng, place, name){
    this.mapEnabled = false
    setTimeout(()=>{
      this.navCtrl.push(MapPage, {
        markers: [{lat: lat, lng: lng, title: place, draggable: false, snippet: name}],
        focus: [lat, lng]
      });
    }, 500)

  }

  updateMachine(machine, slidingItem: ItemSliding){
    slidingItem.close();
    this.mapEnabled = false
    var pos
    if(this.pos){
      pos = this.pos
    }else{
      pos = {coords: {accuracy: machine.accuracy, latitude: machine.latitude, longitude: machine.longitude}}
    }
    console.log("cs")
    this.navCtrl.push(AddMachinePage,{
      id: machine.id,
      pos: pos
    })
  }


  b64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);

      byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
  }


  savebase64AsImageFile(filename,content,contentType, i){
    // Convert the base64 string in a Blob
    var DataBlob = this.b64toBlob(content,contentType, 512);
    let self = this
    console.log("Starting to write the file :3");

    window.resolveLocalFileSystemURL(this.photoDir, function(dir) {
      console.log("Access to the directory granted succesfully");
      dir.getFile(filename, {create:true}, function(file) {
        console.log("File created succesfully.");
        file.createWriter(function(fileWriter) {
          console.log("Writing content to file");
          fileWriter.write(DataBlob);
          let n = i+1
          if(n < self.machines.length) {
            self.chkFile(n)
          }
        }, function(){
          alert('Unable to save file in path '+ this.photoDir);
        });
      });
    });
  }

  chkFile(i){
    File.checkFile(this.photoDir, this.machines[i].id + ".jpg").then(_ => {
      let n = i+1
      if(n < this.machines.length) {
        this.chkFile(n)
      }
    }).catch(err => {
      this.myDatabase.dbQuery("SELECT photo FROM machines WHERE id = ? AND creator_id = ?", [this.machines[i].id, this.myDatabase.userInfo.id]).then((data:any) => {
        var d = data.rows.item(0)
        var photo = d.photo

        if(photo != "")
          this.savebase64AsImageFile(this.machines[i].id + ".jpg", photo.replace('data:image/jpeg;base64,', ''), 'image/jpeg', i)
        else{
          this.machines[i].avatar = cordova.file.applicationDirectory + "www/assets/images/machines/"+this.machines[i].machine_type+".png"
          let n = i+1
          if(n < this.machines.length) {
            this.chkFile(n)
          }
        }

      })
    });
  }

  loadIt(){
    let q = ""
    let v = []
    let ai = "SELECT (SELECT order_c.client_id FROM orders order_c WHERE order_c.client_id = client_a.id ORDER BY order_c.created_date DESC LIMIT 1 ) AS last_order, machine_a.id AS id, machine_a.creator_id AS creator_id, machine_a.owner_id AS owner_id, machine_a.qr_id AS qr_id, machine_a.created_date AS created_date, machine_a.updated_date AS updated_date, machine_a.last_visit_date AS last_visit_date, machine_a.maintenance_date AS maintenance_date, machine_a.region AS region, machine_a.municipal AS municipal, machine_a.brgy AS brgy, machine_a.accuracy AS accuracy, machine_a.delivery AS delivery, machine_a.lat AS lat, machine_a.lng AS lng, machine_a.machine_type AS machine_type, machine_a.sequence AS sequence, machine_a.thumbnail AS machine_thumbnail, client_a.id AS client_id, client_a.name AS client_name, client_a.alias AS client_alias, client_a.company AS client_company, client_a.contact AS client_contact, client_a.contact2 AS client_contact2, client_a.last_order_date AS client_last_order_date, client_a.lat AS client_lat, client_a.lng AS client_lng FROM machines machine_a LEFT OUTER JOIN clients client_a ON machine_a.owner_id = client_a.id "
    if(this.delivery){
      q = ai + "WHERE machine_a.creator_id = ? AND machine_a.delivery = ? ORDER BY machine_a.last_visit_date ASC"
      v = [this.myDatabase.userInfo.id, this.delivery]
    }
    if(this.area){
      q = ai + "WHERE machine_a.creator_id = ? AND machine_a.region = ? AND machine_a.municipal = ? AND machine_a.brgy = ? ORDER BY machine_a.last_visit_date ASC"
      v = [this.myDatabase.userInfo.id, this.area[0], this.area[1], this.area[2]]
    }
    if(this.ids.length){
      q = ai + "WHERE machine_a.creator_id = ? AND machine_a.id IN ("+this.ids.join()+") ORDER BY machine_a.last_visit_date ASC"
      v = [this.myDatabase.userInfo.id]
    }

    this.mapEnabled = true
    this.myDatabase.showLoading()
    this.myDatabase.dbQuery(q, v).then((data:any) => {
      let arr = []
      this.markers = []
      var ar


      File.createDir(cordova.file.externalApplicationStorageDirectory, "machine_photo", true).then((dir:any) => {
        console.log(dir)
        this.photoDir = dir.nativeURL

        for(var x = 0; x < data.rows.length; x++) {
          ar = data.rows.item(x)
          ar.drag = false
          ar.avatar = (ar.machine_thumbnail) ? ar.machine_thumbnail : 'assets/images/machines/' + ar.machine_type + '.png' //this.photoDir + ar.id + ".jpg"
          ar.distance = -1
          ar.distanceName = "m"
          ar.chk = false
          ar.client_status = (ar.last_order) ? "active" : (ar.client_last_order_date) ? "active" : (ar.owner_id) ? "prospect" : "lead"
          ar.client_status_icon = (ar.client_status == "active") ? ["success", "heart"] : (ar.client_status == "prospect") ? ["warning", "chatbubbles"] : ["error", "contacts"]
          ar.last_visit = moment(new Date(ar.last_visit_date)).format("MM-DD-YYYY");
          ar.lv = (ar.last_visit_date) ? moment().diff(moment(ar.last_visit_date), "days") : null
          ar.last_visit_info = (!ar.last_visit_date) ? ["warning", "Not Visited"] : (ar.lv > 7) ? ["error", ar.lv + " " + this.myFunctions.addS("day", ar.lv)] : (ar.lv === 0) ? ["success", "Today"] : ["success", ar.lv + " " + this.myFunctions.addS("day", ar.lv)]
          arr.push(ar)
          this.markers.push({lat: ar.lat, lng: ar.lng, title: (ar.region == "") ? "Unknown" : ar.region + ", " + ar.municipal + ", " + ar.brgy, draggable: false, snippet: ar.client_name})
        }

        this.machines = arr
        console.log(this.machines)
        this.myDatabase.hideLoading()

        if(data.rows.length){
          //this.chkFile(0)
        }
      })

    })
  }

  distance(lat,lng){
    let d = this.myFunctions.distance(this.pos.coords.latitude, this.pos.coords.longitude, lat, lng)
    return d
  }

  getTColor(machine){

    var d = parseFloat(this.distance(machine.lat, machine.lng))

    machine.distanceName = (d > 999) ? "Km" : "m"
    machine.distance = (d > 999) ? (d / 1000).toFixed(2) : d.toFixed(2)

    if(d <= this.myFunctions.gpsMinimumMeter)
      return "success"
    if(d <= 999 && d > this.myFunctions.gpsMinimumMeter)
      return "warning"
    if(d >= 1000)
      return "error"

  }

  sanitize(base64){
    return this.sanitizer.bypassSecurityTrustUrl(base64);
  }

  viewPhoto(machine){

    if(machine.avatar.search("base64") == -1){
      File.readAsDataURL(cordova.file.applicationDirectory, "www/assets/images/machines/"+machine.machine_type+".png").then((imgData:any) => {
          PhotoViewer.show(imgData);
      }).catch((error)=> console.log('error', error)); //Logs error {"code":1,"message":"NOT_FOUND_ERR"}
    }
    else{
      this.myDatabase.dbQueryRes("SELECT photo FROM machines WHERE id = ?", [machine.id]).then((pic:any) => {
        PhotoViewer.show(pic[0].photo);
      })
    }

  }

  addMachine(ev){
    this.mapEnabled = false
    if(this.accColor == "danger"){
      this.myFunctions.checkGps();
      this.myFunctions.toastIt("GPS is still positioning... please wait")
    }
    else{
      this.navCtrl.push(AddMachinePage, {
        pos: this.pos,
        delivery: this.delivery
      });
    }

  }

  ionViewDidLoad() {

  }

  callNow(n){
    CallNumber.callNumber(n, true)
     .then(() => console.log('Launched dialer!'))
     .catch(() => console.log('Error launching dialer'));
  }

  callIt(c){
    var btns = []

    btns.push({
      text: c.client_contact + " ["+this.myFunctions.getCarrier(c.client_contact)+"]",
      handler: () => {
        this.callNow(c.client_contact)
      }
    })

    if(c.client_contact2){
      btns.push({
        text: c.client_contact2 + " ["+this.myFunctions.getCarrier(c.client_contact2)+"]",
        handler: () => {
          this.callNow(c.client_contact2)
        }
      })
    }


    btns.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    })

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select Contact to call',
      buttons: btns
    });
    actionSheet.present();

  }

  smsNow(n){
    var btns = []

    btns.push({
      text: "Custom",
      handler: () => {
        this.myFunctions.sendSMS([n], "", true, false)
      }
    })


    btns.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    })

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select SMS Templates',
      buttons: btns
    });
    actionSheet.present();
  }

  smsIt(c){
    var btns = []

    btns.push({
      text: c.client_contact + " ["+this.myFunctions.getCarrier(c.client_contact)+"]",
      handler: () => {
        this.smsNow(c.client_contact)
      }
    })

    if(c.client_contact2){
      btns.push({
        text: c.client_contact2 + " ["+this.myFunctions.getCarrier(c.client_contact2)+"]",
        handler: () => {
          this.smsNow(c.client_contact2)
        }
      })
    }


    btns.push({
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
        console.log('Cancel clicked');
      }
    })

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select Contact to text',
      buttons: btns
    });
    actionSheet.present();

  }

}

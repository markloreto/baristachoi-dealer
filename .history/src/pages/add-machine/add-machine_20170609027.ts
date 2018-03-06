import { Component } from '@angular/core';
import { NavController, NavParams, Events, ModalController } from 'ionic-angular';
import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';
import { SearchClientPage } from '../../pages/search-client/search-client';
import {
    Camera,
    PhotoViewer,
    File
} from 'ionic-native';
import {DomSanitizer} from '@angular/platform-browser';
import { MapPage } from  '../../pages/map/map';

import * as _ from 'lodash';

declare var cordova: any;
/*
  Generated class for the AddMachine page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-add-machine',
  templateUrl: 'add-machine.html'
})
export class AddMachinePage {
  pos: any;
  machineType: any
  machines: any;
  days: any
  delivery: any
  photo: any = ""
  photoRaw: any = ""
  lat: any
  lng: any
  client: any
  clientPhoto: any
  clientPhotoRaw: any = ""
  address: string = ""
  addressT:any
  region: any = ""
  municipal: any = ""
  brgy:any = ""
  id: number
  ts: any = 0;
  establishmentType: string = ""
  dragEnd: (pos:any) => void
  leave: boolean = true;
  isLoading: boolean = false
  coverageArea: any = []
  isYourArea: boolean = true
  thumb: any = null
  convertDirectory: any
  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public events: Events,
              public myFunctions: MyFunctions,
              public myDatabase: MyDatabase,
              private sanitizer: DomSanitizer,
              public modalCtrl: ModalController
  ) {
    this.id = navParams.get('id');

    this.pos = navParams.get('pos');
    this.delivery = (navParams.get('delivery')) ? navParams.get('delivery') : "Unspecified";
    this.days = this.myFunctions.days
    this.lat = this.pos.coords.latitude
    this.lng = this.pos.coords.longitude

    this.machineType = "Unspecified";
    this.machines = [
      "Unspecified",
      "Sapoe 8703",
      "Kape Time",
      "Le Vending f303v",
      "Teatime dsk632",
      "Teatime dsk622ma",
      "Teatime dg700fm",
      "Teatime dg808fm",
      "Teatime 108f3m"
    ]

    this.client = {id: "", units: 0, photo: "", contact: ""}

    this.clientPhoto = "assets/images/machines/Unspecified.png"

    this.myDatabase.dbQueryRes("SELECT * FROM coverage_area WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((ca:any) => {
      for(var x in ca){
        this.coverageArea.push(ca[x].area)
      }

      if(this.id){
        this.myDatabase.dbQuery("SELECT * FROM machines where id = ?",[this.id]).then((data:any) => {
          var mData = data.rows.item(0)
          this.lat = mData.lat
          this.lng = mData.lng
          this.delivery = mData.delivery
          this.machineType = mData.machine_type
          //this.updateAddress(this.lat, this.lng)
          this.establishmentType = mData.establishment_type
          this.address = (mData.region == "") ? "Unknown" : mData.region + ", " + mData.municipal + ", " + mData.brgy
          if(mData.region != ""){
            this.region = mData.region
            this.municipal = mData.municipal
            this.brgy = mData.brgy
          }
          this.loadClient(mData.owner_id)

          if(mData.photo != ""){
            this.photoRaw = mData.photo
            this.photo = this.sanitizer.bypassSecurityTrustUrl(mData.photo);
          }
        })
      }else{
        this.updateAddress(this.lat, this.lng)
      }
    })

    this.dragEnd = (pos) => {
      this.lat = pos.lat
      this.lng = pos.lng
      this.updateAddress(this.lat, this.lng)
    }

  }



  ionViewDidLoad() {
      this.events.subscribe('map:dragend', this.dragEnd);
  }

  ionViewWillLeave(){
    if(this.leave){
      this.events.unsubscribe('map:dragend', this.dragEnd);
    }
  }

  ionViewDidEnter(){
    this.leave = true
  }

  submitIt(ev){
    var si = parseInt(this.myDatabase.getTimestamp())
    this.myDatabase.showLoading()
    if(this.id){
      var v = [this.client.id, si, this.region, this.municipal, this.brgy, this.pos.coords.accuracy, this.delivery, this.lat, this.lng, this.machineType, this.photoRaw, this.establishmentType, this.id, this.thumb]
      this.myDatabase.dbQuery("UPDATE machines SET owner_id = ?, updated_date = ?, region = ?, municipal = ?, brgy = ?, accuracy = ?, delivery = ?, lat = ?, lng = ?, machine_type = ?, photo = ?, establishment_type = ?, thumbnail = ? WHERE id = ?", v).then((data:any) => {
        this.myFunctions.toastIt("Machine updated!");
        this.myDatabase.hideLoading()
        File.removeFile(cordova.file.externalApplicationStorageDirectory + "machine_photo", this.id + ".jpg").then((res:any) => {this.navCtrl.pop();}).catch(err => {this.navCtrl.pop();})

      })
    }else{
      var v = [si, this.myDatabase.userInfo.id, this.client.id, si, si, this.region, this.municipal, this.brgy, this.delivery, this.lat, this.lng, this.machineType, this.photoRaw, this.pos.coords.accuracy, this.establishmentType, this.thumb]
      this.myDatabase.dbQuery("INSERT INTO machines (id, creator_id, owner_id, created_date, updated_date, region, municipal, brgy, delivery, lat, lng, machine_type, photo, accuracy, establishment_type, thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )", v).then((data:any) => {
        this.myFunctions.toastIt("Machine added!");
        this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "new machine report"]).then((nc:any) => {
          if(nc.length){
            this.myFunctions.getMachineStatus().then((machineStatus:any)=>{
              let contacts = nc[0].number.split(",")

              let newMsg = "";
              let status = (this.client.id) ? "Prospect" : "Lead"
              var msg = "New "+status+" machine:\n"
              msg += "Location: " + this.address + "\n"
              if(this.client.id){
                msg += "Name: " + this.client.name + "\n"
                newMsg = "Good day " + this.client.name + "!\n"
                newMsg += "I'm " + this.myDatabase.userInfo.name + " you're Sales and Service crew. I will visit your Vendo Machine every " + this.myFunctions.convertDay(this.delivery) + ".\n"
                newMsg += "I offer the following services as your Barista Choi partner:\n"
                newMsg += "*FREE Delivery\n"
                newMsg += "*FREE Machine Repair\n"
                newMsg += "*FREE Machine Cleaning\n"
                newMsg += "*FREE Machine Calibration\n\n"
                newMsg += "If you have questions please contact me with this number.\n\n"
                newMsg += "Like us on facebook! https://www.facebook.com/BaristaChoiPhilippines/"
              }

              msg += "Accuracy: " + this.pos.coords.accuracy.toFixed(2) + "\n"
              msg += "Delivery: " + this.myFunctions.convertDay(this.delivery) + "\n"
              if(this.machineType){
                msg += "Machine Type: " + this.machineType + "\n"
              }

              msg += "Lead: " + machineStatus.lead + "\n"
              msg += "Prospect: " + machineStatus.prospect + "\n"
              msg += "Active: " + machineStatus.active + "\n"
              msg += "Total Machines: " + (machineStatus.active + machineStatus.prospect + machineStatus.lead) + "\n"

              if(this.establishmentType)
                msg += "Establishment Type: " + this.establishmentType + "\n"

              msg += "Map: http://maps.google.com/?q="+this.lat+","+this.lng

              this.myFunctions.sendSMS(contacts, msg, false)

              if(this.client.id && this.client.contact)
                this.myFunctions.sendSMS([this.client.contact], newMsg, false)

              this.myDatabase.hideLoading()
              this.navCtrl.pop();
            })
          }else{
            this.myDatabase.hideLoading()
            this.navCtrl.pop();
          }
        })

      })
    }


  }

  viewPhoto(photo){
    PhotoViewer.show(photo);
  }

  updateAddress(lat, lng){

    this.ts = this.ts + 1
    if(this.ts < 2){
      setTimeout(() => {
        this.ts = 0
      }, 1000)
      this.isLoading = true

      this.myFunctions.getLocation([lat, lng]).then(data => {

        this.addressT = data
        var theAddress = (this.addressT.NAME_1 == "") ? "Unknown" : this.addressT.NAME_1 + ", " + this.addressT.NAME_2 + ", " + this.addressT.NAME_3
        this.address = theAddress
        this.region = this.addressT.NAME_1
        this.municipal = this.addressT.NAME_2
        this.brgy = this.addressT.NAME_3
        if(_.includes(this.coverageArea, this.region + ', ' + this.municipal + ', ' + this.brgy)){
          this.isYourArea = true
        }

        else{
          this.isYourArea = false
        }
        this.isLoading = false
      }).catch((e) => {
        console.log(e)
        this.isLoading = false
      });
    }else{

    }

  }

  updateMarker(){
    this.leave = false
    this.events.unsubscribe('map:dragend', this.dragEnd)
    this.events.subscribe('map:dragend', this.dragEnd)
    this.navCtrl.push(MapPage, {
      markers: [{lat: this.lat, lng: this.lng, title: "Machine is here", draggable: true}],
      focus: [this.lat, this.lng]
    });
  }

  loadClient(id){
    if(id){
      console.log(id)
      this.client.id = id
      this.myDatabase.getClient(id).then((client:any) => {

        if(client.photo == ""){
          this.clientPhoto = "assets/images/machines/Unspecified.png"
          this.clientPhotoRaw = "assets/images/machines/Unspecified.png"
        }
        else{
          this.clientPhoto = this.sanitizer.bypassSecurityTrustUrl(client.photo);
          this.clientPhotoRaw = client.photo
        }

        this.client.name = client.name
        this.client.units = client.units
        this.client.contact = client.contact
      })
    }

  }

  presentModal() {
    new Promise((resolve, reject) => {
      this.navCtrl.push(SearchClientPage, {resolve: resolve});
    }).then((data:any) => {
      if(Object.keys(data).length !== 0){
        console.log("Checking @ add machine", data)
        this.loadClient(data.id)
      }
    });
  }

  capture(){
    Camera.getPicture({quality: 80, targetWidth: 1024, targetHeight: 768, destinationType: 0}).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;

      this.photoRaw = base64Image
      this.photo = this.sanitizer.bypassSecurityTrustUrl(base64Image);

      File.createDir(cordova.file.externalApplicationStorageDirectory, "converts", true).then((dir:any) => {
        this.convertDirectory = dir.nativeURL
        this.myFunctions.savebase64AsImageFile("add_machine.jpg", imageData, 'image/jpeg', this.convertDirectory).then(_ => {
            this.myFunctions.resizeIt(this.convertDirectory, "add_machine.jpg", 100, 192, 144).then((content: any) => {
            console.log("Converted base64", content.content)
            this.thumb = content.content
            console.log("directory to erase:", content.dir)
            console.log("filename to remove", content.filename)
            File.removeFile(content.dir, content.filename).then((res:any) => {}).catch(err => {})
            File.removeFile(this.convertDirectory, "add_machine.jpg").then((res:any) => {}).catch(err => {})
          })
        })
      })

      
    }, (err) => {
      // Handle error
    });
  }

}

import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, Platform } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import { HomeTabPage } from '../home-tab/home-tab';
import {ProductSettingsPage} from '../product-settings/product-settings'
import {AdminContactsPage} from '../admin-contacts/admin-contacts'
import {CarrierPagePage} from '../carrier-page/carrier-page'
import {DomSanitizer} from '@angular/platform-browser';
import {
    Camera,
    PhotoViewer, File
} from 'ionic-native';
declare var cordova: any
declare var window
/*
  Generated class for the Settings page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  adminContactNumbers:any = []
  generalReportContacts:any = []
  newMachineReportContact:any = []
  remittanceAndDepositsReportContact:any = []
  myPasscode: string = ""
  gpsRadius: number
  maximumSpeed: number
  gpsBg: boolean
  profile:any
  photoSanitized:any
  offTake: boolean
  offTakeAccess: boolean = true
  passwordInput: string = "password"
  
  machineIds: any = []
  clientIds: any = []
  convertDirectory: any
  depot: any
  depotList: any = []
  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              public myFunctions: MyFunctions,
              public myDatabase: MyDatabase, private alertCtrl: AlertController, public platform: Platform, private sanitizer: DomSanitizer
  ) {

    this.profile = this.myDatabase.userInfo
    this.photoSanitized = this.sanitizer.bypassSecurityTrustUrl(this.profile.photo);

    this.myPasscode = this.myDatabase.passcode
    this.gpsRadius = this.myDatabase.minimumGPSMeter
    this.maximumSpeed = this.myDatabase.maximumSpeed
    this.gpsBg = (this.myDatabase.gps_bg == "enabled") ? true : false
    this.offTake = this.myDatabase.offTake
    this.myDatabase.getSettings("depot").then((d) => {
      console.log(d)
      this.depot = d
    })

    this.myFunctions.getDepot().then((d: any) => {
      this.depotList = d
    })


    if ("undefined" !== typeof this.myFunctions.myPos) {
      this.myFunctions.getLocation([this.myFunctions.myPos.coords.latitude, this.myFunctions.myPos.coords.longitude]).then((data:any) => {
        if(data.NAME_1 == "Cebu"){
          this.offTakeAccess = false
        }
      })
    }

    this.alertCtrl.create({
      title: 'Admin Pass Code',
      message: "Please provide the Admin Pass Code to modify settings",
      inputs: [
        {
          name: 'passcode',
          placeholder: 'Admin Pass Code',
          type: 'password'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            this.navCtrl.setRoot(HomeTabPage)
          }
        },
        {
          text: 'Login',
          handler: data => {
            if (data.passcode == this.myDatabase.passcode) {
              this.passwordInput = "text"
            } else {
              this.navCtrl.setRoot(HomeTabPage)
              this.myFunctions.toastIt("Invalid Admin Pass Code")
            }
          }
        }
      ]
    }).present()
  }

  fix3point3(){
    this.myDatabase.showLoading("Fixing...")
    this.myDatabase.dbQueryRes("SELECT id FROM machines WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((data:any) => {
      console.log("All machine ids", data)
      if(data.length > 1){
        this.machineIds = data
        File.createDir(cordova.file.externalApplicationStorageDirectory, "converts", true).then((dir:any) => {
          this.convertDirectory = dir.nativeURL
          this.machineThumbnail(0)
        })
        
      }
    })
  }

  clientThumbnail(i){
    this.myFunctions.toastIt("Fixing Client " + (i+1) + "/" + this.clientIds.length, 2000)
    this.myDatabase.dbQueryRes("SELECT photo FROM clients WHERE id = ?", [this.clientIds[i].id]).then((data:any) => {
      console.log("Base64:", data)
      if(data[0].photo){
        this.myFunctions.savebase64AsImageFile(this.clientIds[i].id + ".jpg", data[0].photo.replace('data:image/jpeg;base64,', ''), 'image/jpeg', this.convertDirectory).then(() => {

        this.myFunctions.resizeIt(this.convertDirectory, this.clientIds[i].id + ".jpg", 100, 192, 144).then((content: any) => {
          console.log("Converted base64", content.content)
          this.myDatabase.dbQueryRes("UPDATE clients SET thumbnail = ? WHERE id = ?", [content.content, this.clientIds[i].id]).then(_ => {
              console.log("directory to erase:", content.dir)
              console.log("filename to remove", content.filename)
              File.removeFile(content.dir, content.filename).then((res:any) => {}).catch(err => {})
              i = i + 1
              if(i < this.clientIds.length)
                this.clientThumbnail(i)
              else
                this.myDatabase.hideLoading()
            })
          })
          
        })
      }else{
        this.myDatabase.dbQueryRes("UPDATE clients SET thumbnail = ? WHERE id = ?", [null, this.clientIds[i].id]).then(_ => {
          i = i + 1
          if(i < this.clientIds.length)
            this.clientThumbnail(i)
          else
            this.myDatabase.hideLoading()
        })
        
      }
      
    })
  }

  machineThumbnail(i){
    this.myFunctions.toastIt("Fixing Machine " + (i+1) + "/" + this.machineIds.length, 2000)
    this.myDatabase.dbQueryRes("SELECT photo FROM machines WHERE id = ?", [this.machineIds[i].id]).then((data:any) => {
      console.log("Base64:", data)
      if(data[0].photo){
        this.myFunctions.savebase64AsImageFile(this.machineIds[i].id + ".jpg", data[0].photo.replace('data:image/jpeg;base64,', ''), 'image/jpeg', this.convertDirectory).then(() => {

        this.myFunctions.resizeIt(this.convertDirectory, this.machineIds[i].id + ".jpg", 100, 192, 144).then((content: any) => {
          console.log("Converted base64", content.content)
          this.myDatabase.dbQueryRes("UPDATE machines SET thumbnail = ? WHERE id = ?", [content.content, this.machineIds[i].id]).then(_ => {
              console.log("directory to erase:", content.dir)
              console.log("filename to remove", content.filename)
              File.removeFile(content.dir, content.filename).then((res:any) => {}).catch(err => {})
              File.removeFile(this.convertDirectory, this.machineIds[i].id + ".jpg").then((res:any) => {}).catch(err => {})
              i = i + 1
              if(i < this.machineIds.length)
                this.machineThumbnail(i)
              else{
                  this.myDatabase.dbQueryRes("SELECT id FROM clients WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((data2:any) => {
                  console.log("All client ids", data2)
                  if(data.length > 1){
                    this.clientIds = data2
                    File.createDir(cordova.file.externalApplicationStorageDirectory, "converts", true).then((dir:any) => {
                      this.convertDirectory = dir.nativeURL
                      this.clientThumbnail(0)
                    })
                    
                  }
                })
              }
            })
          })
          
        })
      }else{
        this.myDatabase.dbQueryRes("UPDATE machines SET thumbnail = ? WHERE id = ?", [null, this.machineIds[i].id]).then(_ => {
          i = i + 1
          if(i < this.machineIds.length)
            this.machineThumbnail(i)
          else{
            this.myDatabase.dbQueryRes("SELECT id FROM clients WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((data2:any) => {
              console.log("All client ids", data2)
              if(data2.length > 1){
                this.clientIds = data2
                File.createDir(cordova.file.externalApplicationStorageDirectory, "converts", true).then((dir:any) => {
                  this.convertDirectory = dir.nativeURL
                  this.clientThumbnail(0)
                })
                
              }
            })
          }
        })
        
      }
      
    })
  }

  fullBackup(){
    this.myDatabase.fullBackUp()
  }

  capture(){
    Camera.getPicture({quality: 80, targetWidth: 1024, targetHeight: 768, destinationType: 0}).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;

      this.photoSanitized = this.sanitizer.bypassSecurityTrustUrl(base64Image);

      this.myDatabase.userInfo.photo = base64Image
      this.profile = this.myDatabase.userInfo
      this.myDatabase.setSettings("userInfo", JSON.stringify(this.profile))
    }, (err) => {
      // Handle error
    });
  }

  viewPhoto(photo){
    PhotoViewer.show(photo);
  }

  updateProfile(){
    this.alertCtrl.create({
      title: 'Update Profile',
      inputs: [
        {
          name: 'name',
          placeholder: 'Name',
          value: this.profile.name
        },
        {
          name: 'contact',
          placeholder: 'Contact',
          value: this.profile.contact
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: data => {
            this.myDatabase.dbQueryRes("UPDATE users SET name = ?, contact = ? WHERE id = ?", [data.name, data.contact, this.profile.id]).then(()=>{

              this.myDatabase.userInfo.name = data.name
              this.myDatabase.userInfo.contact = data.contact
              this.profile = this.myDatabase.userInfo
              this.myDatabase.setSettings("userInfo", JSON.stringify(this.profile))
              this.myFunctions.toastIt("Profile Updated!")
            })
          }
        }
      ]
    }).present()
  }

  setGPSBg(){
    this.myDatabase.gps_bg = (this.gpsBg) ? "enabled" : "disabled"
    this.myDatabase.setSettings("gps_bg", (this.gpsBg) ? "enabled" : "disabled")

    if(this.gpsBg){
      this.myFunctions.enableBackgroundLocation()
    }
    else{
      this.myFunctions.disableBackgroundLocation()
    }
  }

  setOffTake(){
    this.myDatabase.offTake = this.offTake
    this.myDatabase.setSettings("offTake", this.offTake)
  }

  setGPSRadius(){
    this.myDatabase.minimumGPSMeter = this.gpsRadius
    this.myFunctions.gpsMinimumMeter = this.gpsRadius
    this.myDatabase.setSettings("minimumGPSMeter", this.gpsRadius)
  }

  setMaximumSpeed(){
    this.myDatabase.maximumSpeed = this.maximumSpeed
    this.myDatabase.setSettings("maximumSpeed", this.maximumSpeed)
  }

  updatePasscode(){
    this.alertCtrl.create({
      title: 'Passcode Changed!',
      message: 'Update to a new Admin Passcode',
      buttons: [
        {
          text: 'Disagree',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Agree',
          handler: () => {
            this.myDatabase.setSettings("passcode", this.myPasscode)
            this.myDatabase.passcode = this.myPasscode
          }
        }
      ]
    }).present()

  }

  productSettings(){
    this.navCtrl.push(ProductSettingsPage)
  }

  adminContacts(){
    this.navCtrl.push(AdminContactsPage)
  }

  mobileCarriers(){
    this.navCtrl.push(CarrierPagePage)
  }

  contactReportUpdate(id, numbers, type){
    console.log(this.generalReportContacts)
    this.myDatabase.dbQuery("INSERT OR REPLACE INTO reporting_contacts (id, creator_id, number, type) VALUES (?, ?, ?, ?)", [id, this.myDatabase.userInfo.id, numbers.join(), type])
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');
  }

  softReset(){
    this.alertCtrl.create({
      title: 'Soft Reset Confirmation',
      subTitle: 'Are you sure you want to reset your database?',
      message: "this will clear your data, won't remove data from clients and machines",
      buttons: [
        {
          text: 'Disagree',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Agree',
          handler: () => {

            let arr = []
            this.myDatabase.showLoading("Soft Reset is now in progress")

            //arr.push(["DROP TABLE IF EXISTS settings",[]])
            //arr.push(["DROP TABLE IF EXISTS logs",[]])
            arr.push(["DROP TABLE IF EXISTS callsheets",[]])
            arr.push(["DROP TABLE IF EXISTS disr",[]])
            arr.push(["DROP TABLE IF EXISTS disr_items",[]])
            arr.push(["DROP TABLE IF EXISTS orders",[]])
            arr.push(["DROP TABLE IF EXISTS order_payments",[]])
            arr.push(["DROP TABLE IF EXISTS disr_payments",[]])
            //arr.push(["DROP TABLE IF EXISTS products",[]])
            //arr.push(["DROP TABLE IF EXISTS admin_contacts",[]])
            //arr.push(["DROP TABLE IF EXISTS reporting_contacts",[]])
            arr.push(["DROP TABLE IF EXISTS actions",[]])
            arr.push(["DROP TABLE IF EXISTS sms_unsent",[]])
            arr.push(["DROP TABLE IF EXISTS carriers",[]])

            this.myDatabase.dbQueryBatch(arr).then(()=>{
              this.platform.exitApp()

            })


          }
        }
      ]
    }).present()
  }

  import2C(){
    this.myFunctions.import2Contacts()
  }

  ionViewDidEnter(){
    this.myDatabase.dbQueryRes("SELECT * FROM admin_contacts WHERE creator_id = ?", [this.myDatabase.userInfo.id]).then((res:any) => {
      this.adminContactNumbers = res
    })

    //General report contacts
    this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "general report"]).then((gr:any) => {
      if(gr.length)
        this.generalReportContacts = gr[0].number.split(",")
    })

    //New Machine Report
    this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "new machine report"]).then((nc:any) => {
      if(nc.length)
        this.newMachineReportContact = nc[0].number.split(",")
    })

    //remit and deposit Report
    this.myDatabase.dbQueryRes("SELECT * FROM reporting_contacts WHERE creator_id = ? AND type = ?", [this.myDatabase.userInfo.id, "remit and deposits report"]).then((nc:any) => {
      if(nc.length)
        this.remittanceAndDepositsReportContact = nc[0].number.split(",")
    })
  }

  calibrateBrgy(){
    let self = this

    this.myFunctions.confirm("Please Confirm", "This will take awhile, would you like to continue?").then(()=>{
      this.myDatabase.showLoading("Analyzing Brgy data of machines...")
      this.myDatabase.dbQueryRes("SELECT machines.id AS machine_id, machines.region AS region, machines.municipal AS municipal, machines.brgy AS brgy, machines.lat AS lat, machines.lng AS lng, clients.name AS client_name FROM machines LEFT OUTER JOIN clients ON machines.owner_id = clients.id WHERE machines.creator_id = ?", [this.myDatabase.userInfo.id]).then((machines:any) => {
        var count = 0
        var name
        console.log("Machines to check", machines)
        function go(){
          if(count < machines.length){
            self.myFunctions.toastIt("Checking machine's brgy " + (count+1) + " of " + machines.length, 2000)
            self.myFunctions.getLocation([machines[count].lat, machines[count].lng]).then((brgy:any)=>{
              if(machines[count].brgy != brgy.NAME_3 && brgy.NAME_1 != ""){
                console.log("Updating brgy of", machines[count])
                name = (machines[count].client_name == null) ? "Unknown" : machines[count].client_name
                self.myFunctions.toastIt("Updating brgy for " + name + ". from " + machines[count].brgy + " to " + brgy.NAME_3, 4000, "top")
                self.myDatabase.dbQueryRes("UPDATE machines SET region = ?, municipal = ?, brgy = ? WHERE id = ?", [brgy.NAME_1, brgy.NAME_2, brgy.NAME_3, machines[count].machine_id]).then(()=>{
                  count++
                  go()
                })
              }else{
                console.log("this machines's brgy is ok", machines[count])
                count++
                go()
              }
            })
          }
          else{
            self.myDatabase.hideLoading()
          }
        }

        go()
      })
    }).catch(()=>{

    })
  }

}

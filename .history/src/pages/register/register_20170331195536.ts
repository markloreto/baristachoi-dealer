import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import {DomSanitizer} from '@angular/platform-browser';
import {LoginPage} from '../../pages/login/login'

import {
  Camera
} from 'ionic-native';


@Component({
  selector: 'page-register',
  templateUrl: 'register.html'
})
export class RegisterPage {
  photo: any = ''
  photoRaw: string = "assets/images/no-profile-img.gif"
  warningPhoto: string = ""
  name: string = ""
  warningName: string = ""
  contact: string = ""
  warningContact:string = ""
  constructor(private nav: NavController, private alertCtrl: AlertController, public myDatabase: MyDatabase, public myFunction: MyFunctions, private sanitizer: DomSanitizer) {

  }

  capture(){
    Camera.getPicture({quality: 80, targetWidth: 1024, targetHeight: 768, destinationType: 0, cameraDirection: 1}).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;
      this.photoRaw = base64Image
      this.photo = this.sanitizer.bypassSecurityTrustUrl(base64Image);
      this.warningPhoto = ""
    }, (err) => {
      // Handle error
    });
  }

  register(){
    if(this.name != "" && this.photo != "" && (this.contact.length == 11)){

      this.warningName = ""
      this.warningContact = ""
      this.warningPhoto = ""

      this.myDatabase.showLoading()
      this.alertCtrl.create({
        title: 'Admin Pass Code',
        message: "Please provide the Admin Pass Code to register user",
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
              console.log('Cancel clicked');
            }
          },
          {
            text: 'Register',
            handler: data => {
              if (data.passcode == this.myDatabase.passcode) {
                let t = parseInt(this.myDatabase.getTimestamp())
                let c = [t, this.name, t, t, this.photoRaw, this.contact]
                this.myDatabase.dbQuery("INSERT OR REPLACE INTO users (id, name, created_date, updated_date, photo, contact ) VALUES (?, ?, ?, ?, ?, ?)", c).then((data:any) => {
                  this.myDatabase.hideLoading()
                  this.nav.setRoot(LoginPage)
                })
              } else {
                this.myFunction.toastIt("Invalid Admin Pass Code")
              }
            }
          }
        ]
      }).present()


    }
    else{
      if(this.name == "")
        this.myFunction.toastIt("*fill your full name")
      else
        this.warningName = ""
      if(this.photo == "")
        this.myFunction.toastIt("*take a picture!")
      else
        this.warningPhoto = ""
      if((this.contact.length != 11))
        this.myFunction.toastIt("*Please set your 11 digit cellphone number")
      else
        this.warningContact = ""


    }
  }

}

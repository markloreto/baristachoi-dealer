import { Component } from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MyFunctions} from '../../providers/my-functions'
import {LoginPage} from '../../pages/login/login'
import { NavController } from 'ionic-angular';
import {
  Camera,
  PhotoViewer
} from 'ionic-native';

import {MyDatabase} from '../../providers/my-database'

/*
  Generated class for the Slide component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'slide',
  templateUrl: 'slide.html'
})
export class SlideComponent {
  name: string = ""
  contact: string = ""
  photo: any
  swiper:any;
  photoRaw: string = "assets/images/no-profile-img.gif"
  warningName: string = ""
  warningPhoto: string = ""
  warningPasscode:string = ""
  warningContact:string = ""
  passcode:any = ""
  rpasscode:any = ""


  passcodeChk:boolean = false
  registerChk:boolean = false

  myNext:() => void

  constructor(private nav: NavController, private sanitizer: DomSanitizer, public myDatabase: MyDatabase, public myFunction: MyFunctions) {
    this.photo = ""
    this.myFunction.disabledOptionBtn = true
    this.myNext = () => {

    }
  }


  viewPhoto(photo){
    PhotoViewer.show(photo);
  }

  checkr(){
    if(this.passcodeChk){
      if(this.passcode != "" && this.passcode.length > 3 && this.rpasscode == this.passcode){
        this.swiper.lockSwipeToNext(false)
        this.warningPasscode = ""

        this.myNext = () => {
          this.swiper.slideTo(0,0, false)
          this.myDatabase.setSettings("passcode", this.passcode)
          this.myDatabase.passcode = this.passcode
          this.swiper.slideTo(1,0, false)
        }
      }
      else{
        this.swiper.lockSwipeToNext(true)
        this.warningPasscode = '*Admin Pass Code must be longer than 3 characters and re-type it again exactly the same'
      }
    }

    if(this.registerChk){
      if(this.name != "" && this.photo != "" && (this.contact.length == 11)){
        this.swiper.lockSwipeToNext(false)
        this.warningName = ""
        this.warningContact = ""
        this.warningPhoto = ""

        this.myNext = () => {
          this.swiper.slideTo(0,0, false)
          let t = parseInt(this.myDatabase.getTimestamp())
          let c = [t, this.name, t, t, this.photoRaw, this.contact, null]
          this.myDatabase.usersNum = 1
          this.myDatabase.dbQuery("INSERT OR REPLACE INTO users (id, name, created_date, updated_date, photo, contact, sync ) VALUES (?, ?, ?, ?, ?, ?, ?)", c).then((data:any) => {

          })
          this.swiper.slideTo(1,0, false)
        }
      }
      else{
        if(this.name == "")
          this.warningName = "*fill your full name"
        if(this.photo == "")
          this.warningPhoto = "*take a picture!"
        if((this.contact.length != 11))
          this.warningContact = "*Please set your 11 digit cellphone number"

        this.swiper.lockSwipeToNext(true)
      }
    }

  }

  onBlur(){
    let s = this.swiper
    let i = s.getActiveIndex()
    this.myNext()
    if(i == 0){
      this.swiper.lockSwipeToNext(false)
      this.myNext = () => {
        console.log()
      }
    }


    if(s._slides[i].id == "passcode"){
      this.swiper.lockSwipeToNext(true)
      this.passcodeChk = true
    }
    else
      this.passcodeChk = false
    if(s._slides[i].id == "register"){
      this.swiper.lockSwipeToNext(true)
      this.registerChk = true
    }
    else
      this.registerChk = false

  }

  nameIt(){
    if(this.name != "")
      this.warningName = ""
  }

  contactIt(){
    if(this.contact.length == 11)
      this.warningContact = ""
  }

  checkDrag(event){
    console.log(event)
    this.swiper = event;
    this.onBlur()

  }

  startIt(){
    this.nav.setRoot(LoginPage)

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

}

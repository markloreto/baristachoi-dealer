import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, Events, AlertController  } from 'ionic-angular';
import {
    Camera,
    Contacts, ContactField, ContactFindOptions, ActionSheet, PhotoViewer, ImageResizer, ImageResizerOptions, File
} from 'ionic-native';
import {DomSanitizer} from '@angular/platform-browser';
import {Validators, FormBuilder, FormGroup, AbstractControl } from '@angular/forms';
import { MyDatabase } from '../../providers/my-database';
import { MyFunctions } from '../../providers/my-functions';

import { MapPage } from  '../../pages/map/map';
import * as moment from 'moment';
declare var cordova: any
declare var window
declare var navigator
/*
  Generated class for the AddClient page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-add-client',
  templateUrl: 'add-client.html',
})
export class AddClientPage {
  photo: any
  rawPhoto: any = ""
  photoSend: any
  addClientForm: FormGroup
  contactInput: any
  contactsfound: any
  contactsNameFound: any
  contactId: any
  theName: AbstractControl
  theContact: AbstractControl
  theContact2: AbstractControl
  company: AbstractControl
  alias: AbstractControl
  email: AbstractControl
  selectedContactVar: any
  address: string = "Purchaser Address"
  thumb: any = null
  convertDirectory: any
  dragEnd: (pos:any) => void
  lat: any
  lng: any
  leave: boolean = true;
  client:any
  constructor(public myFunctions: MyFunctions, public alertCtrl: AlertController, public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, private sanitizer: DomSanitizer, public events: Events, private formBuilder: FormBuilder, public myDatabase: MyDatabase) {
    this.photo = ""
    this.photoSend = ""
    this.contactsfound = [];
    this.contactsNameFound = []

    this.client = navParams.get("client")


    let emailRegex = '^[a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,15})$';

    this.addClientForm = this.formBuilder.group({
      name: ['', Validators.required],
      alias: [''],
      company: [''],
      contact: ['', Validators.compose([Validators.maxLength(11), Validators.minLength(11)])],
      contact2: [''],
      email: ['', Validators.pattern(emailRegex)]
    });

    this.theName = this.addClientForm.controls['name'];
    this.theContact = this.addClientForm.controls['contact'];
    this.theContact2 = this.addClientForm.controls['contact2'];
    this.company = this.addClientForm.controls['company'];
    this.alias = this.addClientForm.controls['alias'];
    this.email = this.addClientForm.controls['email'];

    this.contactId = "";
    this.contactInput = ""
    this.selectedContactVar = ""

    this.dragEnd = (pos) => {
      this.lat = pos.lat
      this.lng = pos.lng
      this.updateAddress(this.lat, this.lng)
    }

    if(this.client){
      console.log("Client info: ", this.client)
      this.theName.patchValue(this.client.name);
      this.theContact.patchValue(this.client.contact)
      this.theContact2.patchValue(this.client.contact2)
      this.email.patchValue(this.client.email)
      this.alias.patchValue(this.client.alias)
      this.company.patchValue(this.client.company)

      if(this.client.photo != 'assets/images/no_user_1.jpg'){
        this.rawPhoto = this.client.rawPhoto
        this.photo = this.sanitizer.bypassSecurityTrustUrl(this.client.rawPhoto);
      }

      if(this.client.lat){
        this.updateAddress(this.client.lat, this.client.lng)
      }
    }
  }

  ionViewWillLeave(){
    if(this.leave){
      this.events.unsubscribe('map:dragend', this.dragEnd);
    }
  }

  ionViewDidLoad() {
    this.events.subscribe('map:dragend', this.dragEnd);
  }

  ionViewDidEnter(){
    this.leave = true
  }

  updateAddress(lat, lng){
    this.myDatabase.showLoading()
    this.myFunctions.getLocation([lat, lng]).then((data:any) => {

      let addressT = data
      var theAddress = (addressT.NAME_1 == "") ? "Unknown" : addressT.NAME_1 + ", " + addressT.NAME_2 + ", " + addressT.NAME_3
      this.address = theAddress
      this.myDatabase.hideLoading()
    }).catch(() => {
      this.myDatabase.hideLoading()
    });

  }

  updateMarker(){
    this.leave = false
    this.events.unsubscribe('map:dragend', this.dragEnd)
    this.events.subscribe('map:dragend', this.dragEnd)
    this.navCtrl.push(MapPage, {
      markers: [{lat: this.myFunctions.myPos.coords.latitude, lng: this.myFunctions.myPos.coords.longitude, title: "Client is here", draggable: true}],
      focus: [this.myFunctions.myPos.coords.latitude, this.myFunctions.myPos.coords.longitude]
    });
  }

  viewPhoto(photo){
    PhotoViewer.show(photo);
  }

  capture(){
    Camera.getPicture({quality: 80, targetWidth: 1024, targetHeight: 768, destinationType: 0}).then((imageData) => {
      // imageData is either a base64 encoded string or a file URI
      // If it's base64:
      let base64Image = 'data:image/jpeg;base64,' + imageData;
      this.photoSend = base64Image
      this.rawPhoto = base64Image
      this.photo = this.sanitizer.bypassSecurityTrustUrl(base64Image);

      File.createDir(cordova.file.externalApplicationStorageDirectory, "converts", true).then((dir:any) => {
        this.convertDirectory = dir.nativeURL
        this.myFunctions.savebase64AsImageFile("add_machine.jpg", imageData, 'image/jpeg', this.convertDirectory).then(() => {
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

  selectedContact(contact){
    this.contactsfound = []
    this.contactId = contact.id
    this.selectedContactVar = contact
    for(var x in contact.phoneNumbers){
      if(contact.phoneNumbers[x].value.search(this.theContact.value) != -1){
        this.theContact.patchValue(contact.phoneNumbers[x].value.replace(/[^0-9]/gim,""))
        this.theName.patchValue(contact.displayName);
      }
    }
  }

  selectedNameContact(contact){
    //todo selection pop up for phone numbers
    this.contactsNameFound = []
    this.contactId = contact.id
    let self = this

    if(contact.phoneNumbers != null){
      if(contact.phoneNumbers.length == 1)
        this.theContact.patchValue(contact.phoneNumbers[0].value.replace("+63","0").replace(/[^0-9]/gim,""))
      else if(contact.phoneNumbers.length == 2){
        let buttonLabels = [];
        for(var x in contact.phoneNumbers){
          var p = contact.phoneNumbers[x].value.replace("+63","0").replace(/[^0-9]/gim,"")
          buttonLabels.push(p)
        }

        ActionSheet.show({
          'title': 'Select the primary contact for ' + contact.displayName,
          'buttonLabels': buttonLabels
        }).then((buttonIndex: number) => {
          if(buttonIndex == 1){
            self.theContact.patchValue(contact.phoneNumbers[0].value.replace("+63","0").replace(/[^0-9]/gim,""))
            self.theContact2.patchValue(contact.phoneNumbers[1].value.replace("+63","0").replace(/[^0-9]/gim,""))
          }
          else{
            self.theContact.patchValue(contact.phoneNumbers[1].value.replace("+63","0").replace(/[^0-9]/gim,""))
            self.theContact2.patchValue(contact.phoneNumbers[0].value.replace("+63","0").replace(/[^0-9]/gim,""))
          }
        });
      }
      else if(contact.phoneNumbers.length > 2){
        let buttonLabels = [];
        for(var x in contact.phoneNumbers){
          var p = contact.phoneNumbers[x].value.replace("+63","0").replace(/[^0-9]/gim,"")
          buttonLabels.push(p)
        }

        ActionSheet.show({
          'title': 'Select the primary contact for ' + contact.displayName,
          'buttonLabels': buttonLabels
        }).then((buttonIndexP: number) => {
          self.theContact.patchValue(contact.phoneNumbers[buttonIndexP-1].value.replace("+63","0").replace(/[^0-9]/gim,""))
          buttonLabels.splice(buttonIndexP-1, 1)
          let bb = buttonIndexP-1;

          ActionSheet.show({
            'title': 'Select other contact for ' + contact.displayName,
            'buttonLabels': buttonLabels
          }).then((buttonIndexO: number) => {
            let bb2 = buttonIndexO-1

            if(bb2 >= bb)
              bb2 = buttonIndexO
            self.theContact2.patchValue(contact.phoneNumbers[bb2].value.replace("+63","0").replace(/[^0-9]/gim,""))
          });
        });
      }
    }


    this.theName.patchValue(contact.displayName);
    this.selectedContactVar = contact

  }

  selectContact(){
    Contacts.pickContact().then(c => {
      console.log(c)
      this.selectedNameContact(c)
    })
  }

  submitSuccess(mom){
    let y = -1;
    let self = this;
    let formValues = this.addClientForm.value

    function onSuccess(contact) {
      self.myDatabase.hideLoading()

      self.navCtrl.pop().then(() => self.navParams.get('resolve')({id: mom}))
    };

    function onError(contactError) {
      console.log("Error = " + contactError);

      self.myDatabase.hideLoading()
    };

    var phoneNumbers = [];

    if(self.selectedContactVar != ""){

      var options      = new ContactFindOptions();
      options.filter   = self.selectedContactVar.id;
      options.multiple = true;
      options.hasPhoneNumber = true;
      var fields       = [navigator.contacts.fieldType.id];
      navigator.contacts.find(fields, (contactR) => {
        var contact = contactR[0]
        contact.displayName = self.theName.value;

        if(this.theContact.value != ""){
          y++;
          phoneNumbers[y] = new ContactField(this.myFunctions.getCarrier(this.theContact.value), this.theContact.value, true);
        }

        if(formValues.contact2 != ""){
          y++;
          phoneNumbers[y] = new ContactField(this.myFunctions.getCarrier(formValues.contact2), formValues.contact2, false);
        }

        if(phoneNumbers.length)
          contact.phoneNumbers = phoneNumbers;

        if(formValues.email != ""){
          var emails = []
          emails[0] = new ContactField('Barista Choi', formValues.email, true);
          contact.emails = emails
        }


        console.log("For contact update: ", self.selectedContactVar)
        contact.save(onSuccess,onError);
      }, () => {

      }, options);

    }
    else{
      var contact = navigator.contacts.create();
      contact.displayName = formValues.name;

      if(this.theContact.value != ""){
        y++;
        phoneNumbers[y] = new ContactField(this.myFunctions.getCarrier(this.theContact.value), this.theContact.value, true);
      }

      if(formValues.contact2 != ""){
        y++;
        phoneNumbers[y] = new ContactField(this.myFunctions.getCarrier(formValues.contact2), formValues.contact2, false);
      }

      if(phoneNumbers.length)
        contact.phoneNumbers = phoneNumbers;

      console.log("For new contact: ", contact)
      contact.save(onSuccess,onError);
    }
  }

  submitNow(){
    let formValues = this.addClientForm.value
    let mom = moment().format("x")

    this.myDatabase.showLoading()

    if(this.client){
      this.myDatabase.dbQueryRes("UPDATE clients SET name = ?, alias = ?, company = ?, contact = ?, contact2 = ?, photo = ?, updated_date = ?, creator_id = ?, email = ?, lat = ?, lng = ?, thumbnail = ?, sync = ? WHERE id = ? AND creator_id = ?", [formValues.name, formValues.alias, formValues.company, formValues.contact, formValues.contact2, this.rawPhoto, mom, this.myDatabase.userInfo.id, formValues.email, this.lat, this.lng, this.thumb, null, this.client.id, this.myDatabase.userInfo.id]).then((data:any) => {
        this.submitSuccess(mom)
      })
    }else{
      this.myDatabase.dbQuery("INSERT INTO clients (id, name, alias, company, contact, contact2, photo, created_date, updated_date, creator_id, email, lat, lng, thumbnail, sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [mom, formValues.name, formValues.alias, formValues.company, formValues.contact, formValues.contact2, this.rawPhoto, mom, mom, this.myDatabase.userInfo.id, formValues.email, this.lat, this.lng, this.thumb, null]).then((data:any) => {
        this.submitSuccess(mom)
      })
    }




  }

  logForm(){
    let formValues = this.addClientForm.value
    var msg = (this.client) ? "Update this client?" : 'Would you like to add ' + formValues.name + ' to your client list?'


    this.alertCtrl.create({
      title: 'Please confirm',
      message: msg,
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            return true;
          }
        },
        {
          text: 'Yes',
          handler: () => {
            this.submitNow()
          }
        }
      ]
    }).present()
  }


  ContactOnSuccess(contacts) {
    this.contactsfound = contacts
  }

  contactNameSearch(ev){
    var contactVal = this.theName.value;
    let self = this;
    function ContactOnSuccess(contacts) {
      self.contactsNameFound = contacts
    }

    function ContactOnError(contactError) {

    }

    if(contactVal.length > 2){
      var options      = new ContactFindOptions();
      options.filter   = contactVal;
      options.multiple = true;
      options.hasPhoneNumber = true;
      var fields       = [navigator.contacts.fieldType.displayName];
      navigator.contacts.find(fields, ContactOnSuccess, ContactOnError, options);
    }else{
      this.contactsNameFound = []
    }
  }

  contactSearch(ev){
    var contactVal = this.theContact.value;
    let self = this;
    function ContactOnSuccess(contacts) {
      self.contactsfound = contacts
    }

    function ContactOnError(contactError) {

    }

    if(contactVal.length > 2){
      var options      = new ContactFindOptions();
      options.filter   = contactVal;
      options.multiple = true;
      options.hasPhoneNumber = true;
      var fields       = [navigator.contacts.fieldType.phoneNumbers];
      navigator.contacts.find(fields, ContactOnSuccess, ContactOnError, options);
    }else{
      this.contactsfound = []
    }
  }

}

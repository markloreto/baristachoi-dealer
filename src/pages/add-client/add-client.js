"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var core_1 = require('@angular/core');
var ionic_native_1 = require('ionic-native');
var forms_1 = require('@angular/forms');
var moment = require('moment');
/*
  Generated class for the AddClient page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
var AddClientPage = (function () {
    function AddClientPage(navCtrl, navParams, viewCtrl, sanitizer, events, formBuilder) {
        var _this = this;
        this.navCtrl = navCtrl;
        this.navParams = navParams;
        this.viewCtrl = viewCtrl;
        this.sanitizer = sanitizer;
        this.events = events;
        this.formBuilder = formBuilder;
        this.databaseLoaded = false;
        this.photo = "";
        this.photoSend = "";
        this.contactsfound = [];
        this.contactsNameFound = [];
        this.addClientForm = this.formBuilder.group({
            name: ['', forms_1.Validators.required],
            alias: [''],
            company: [''],
            contact: ['', forms_1.Validators.compose([forms_1.Validators.maxLength(11), forms_1.Validators.minLength(11)])],
            contact2: ['']
        });
        this.theName = this.addClientForm.controls['name'];
        this.theContact = this.addClientForm.controls['contact'];
        this.theContact2 = this.addClientForm.controls['contact2'];
        this.storage = new ionic_native_1.SQLite();
        this.storage.openDatabase({ name: "data.db", location: "default" }).then(function () {
            _this.databaseLoaded = true;
        });
        this.contactId = "";
        this.contactInput = "";
        this.selectedContactVar = "";
    }
    AddClientPage.prototype.ionViewDidLoad = function () {
        console.log('ionViewDidLoad AddClientPage');
    };
    AddClientPage.prototype.dismiss = function () {
        var data = { 'foo': 'bar' };
        this.viewCtrl.dismiss(data);
    };
    AddClientPage.prototype.capture = function () {
        var _this = this;
        ionic_native_1.Camera.getPicture({ quality: 80, targetWidth: 1024, targetHeight: 768, destinationType: 0 }).then(function (imageData) {
            // imageData is either a base64 encoded string or a file URI
            // If it's base64:
            var base64Image = 'data:image/jpeg;base64,' + imageData;
            _this.photoSend = base64Image;
            _this.photo = _this.sanitizer.bypassSecurityTrustUrl(base64Image);
        }, function (err) {
            // Handle error
        });
    };
    AddClientPage.prototype.selectedContact = function (contact) {
        this.contactsfound = [];
        this.contactId = contact.id;
        this.selectedContactVar = contact;
        for (var x in contact.phoneNumbers) {
            if (contact.phoneNumbers[x].value.search(this.contactInput) != -1) {
                this.contactInput = contact.phoneNumbers[x].value.replace(/[^0-9]/gim, "");
                this.theName.patchValue(contact.displayName);
            }
        }
    };
    AddClientPage.prototype.selectedNameContact = function (contact) {
        //todo selection pop up for phone numbers
        this.contactsNameFound = [];
        this.contactId = contact.id;
        var self = this;
        if (contact.phoneNumbers.length == 1)
            this.contactInput = contact.phoneNumbers[0].value.replace(/[^0-9]/gim, "");
        else if (contact.phoneNumbers.length == 2) {
            var buttonLabels = [];
            for (var x in contact.phoneNumbers) {
                var p = contact.phoneNumbers[x].value.replace(/[^0-9]/gim, "");
                buttonLabels.push(p);
            }
            ionic_native_1.ActionSheet.show({
                'title': 'Select the primary contact for ' + contact.displayName,
                'buttonLabels': buttonLabels
            }).then(function (buttonIndex) {
                if (buttonIndex == 1) {
                    self.theContact.patchValue(contact.phoneNumbers[0].value.replace(/[^0-9]/gim, ""));
                    self.theContact2.patchValue(contact.phoneNumbers[1].value.replace(/[^0-9]/gim, ""));
                }
                else {
                    self.theContact.patchValue(contact.phoneNumbers[1].value.replace(/[^0-9]/gim, ""));
                    self.theContact2.patchValue(contact.phoneNumbers[0].value.replace(/[^0-9]/gim, ""));
                }
            });
        }
        else if (contact.phoneNumbers.length > 2) {
            var buttonLabels_1 = [];
            for (var x in contact.phoneNumbers) {
                var p = contact.phoneNumbers[x].value.replace(/[^0-9]/gim, "");
                buttonLabels_1.push(p);
            }
            ionic_native_1.ActionSheet.show({
                'title': 'Select the primary contact for ' + contact.displayName,
                'buttonLabels': buttonLabels_1
            }).then(function (buttonIndexP) {
                self.theContact.patchValue(contact.phoneNumbers[buttonIndexP - 1].value.replace(/[^0-9]/gim, ""));
                buttonLabels_1.splice(buttonIndexP - 1, 1);
                var bb = buttonIndexP - 1;
                ionic_native_1.ActionSheet.show({
                    'title': 'Select other contact for ' + contact.displayName,
                    'buttonLabels': buttonLabels_1
                }).then(function (buttonIndexO) {
                    var bb2 = buttonIndexO - 1;
                    if (bb2 >= bb)
                        bb2 = buttonIndexO;
                    self.theContact2.patchValue(contact.phoneNumbers[bb2].value.replace(/[^0-9]/gim, ""));
                });
            });
        }
        this.theName.patchValue(contact.displayName);
        this.selectedContactVar = contact;
    };
    AddClientPage.prototype.getCarrier = function (c) {
        var globe = ["0817", "0905", "0906", "0915", "0916", "0917", "0925", "0926", "0927", "0935", "0936", "0937", "0945", "0973", "0974", "0975", "0976", "0977", "0978", "0979", "0994", "0995", "0996", "0997", "09173", "09175", "09176", "09178"];
        var smart = ["0813", "0900", "0907", "0908", "0909", "0910", "0911", "0912", "0913", "0914", "0918", "0919", "0920", "0921", "0928", "0929", "0930", "0938", "0939", "0940", "0946", "0947", "0948", "0949", "0950", "0951", "0989", "0998", "0999"];
        var sun = ["0922", "0923", "0924", "0925", "0931", "0932", "0933", "0934", "0940", "0941", "0942", "0943", "0944"];
        if (globe.indexOf(c) != -1)
            return "Globe";
        else if (smart.indexOf(c) != -1)
            return "Smart";
        else if (sun.indexOf(c) != -1)
            return "Sun";
        else
            return "Unknown";
    };
    AddClientPage.prototype.logForm = function () {
        console.log(this.addClientForm.value);
        var y = -1;
        var self = this;
        var formValues = this.addClientForm.value;
        var mom = moment().format("x");
        this.storage.executeSql("INSERT INTO clients (id, name, alias, company, contact, contact2, photo, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [mom, formValues.name, formValues.alias, formValues.company, this.contactInput, formValues.contact2, this.photo, mom, mom]);
        function onSuccess(contact) {
            self.viewCtrl.dismiss({ name: formValues.name, id: mom, photo: self.photoSend });
        }
        ;
        function onError(contactError) {
            alert("Error = " + contactError.code);
        }
        ;
        var phoneNumbers = [];
        if (this.selectedContactVar != "") {
            var contact = this.selectedContactVar;
            var updateIt = false;
            contact.displayName = this.theName.value;
            for (var x in contact.phoneNumbers) {
                if (contact.phoneNumbers[x].value.search(this.contactInput) != -1) {
                    updateIt = true;
                }
            }
            if (!updateIt) {
                contact.phoneNumbers[contact.phoneNumbers.length] = { type: this.getCarrier(this.contactInput.slice(0, 4)), value: this.contactInput, pref: false };
            }
            updateIt = false;
            for (var x in contact.phoneNumbers) {
                if (contact.phoneNumbers[x].value.search(this.theContact2.value) != -1) {
                    updateIt = true;
                }
            }
            if (!updateIt) {
                contact.phoneNumbers[contact.phoneNumbers.length] = { type: this.getCarrier(this.theContact2.value.slice(0, 4)), value: this.theContact2.value, pref: false };
            }
            if (phoneNumbers.length) {
                contact.push(phoneNumbers);
            }
        }
        else {
            var contact = navigator.contacts.create();
            contact.displayName = formValues.name;
            if (this.theContact.value != "") {
                y++;
                phoneNumbers[y] = new ionic_native_1.ContactField(this.getCarrier(this.contactInput.slice(0, 4)), this.contactInput, true);
            }
            if (formValues.contact2 != "") {
                y++;
                phoneNumbers[y] = new ionic_native_1.ContactField(this.getCarrier(formValues.contact2.slice(0, 4)), formValues.contact2, false);
            }
            if (phoneNumbers.length)
                contact.phoneNumbers = phoneNumbers;
        }
        contact.save(onSuccess, onError);
    };
    AddClientPage.prototype.ContactOnSuccess = function (contacts) {
        this.contactsfound = contacts;
        console.log(this.contactsfound);
    };
    AddClientPage.prototype.contactNameSearch = function (ev) {
        var contactVal = this.theName.value;
        var self = this;
        function ContactOnSuccess(contacts) {
            self.contactsNameFound = contacts;
            console.log(self.contactsNameFound);
        }
        function ContactOnError(contactError) {
        }
        if (contactVal.length > 2) {
            var options = new ionic_native_1.ContactFindOptions();
            options.filter = contactVal;
            options.multiple = true;
            options.hasPhoneNumber = true;
            var fields = [navigator.contacts.fieldType.displayName];
            navigator.contacts.find(fields, ContactOnSuccess, ContactOnError, options);
        }
        else {
            this.contactsNameFound = [];
        }
    };
    AddClientPage.prototype.contactSearch = function (ev) {
        var contactVal = this.contactInput;
        var self = this;
        function ContactOnSuccess(contacts) {
            self.contactsfound = contacts;
            console.log(self.contactsfound);
        }
        function ContactOnError(contactError) {
        }
        if (contactVal.length > 2) {
            var options = new ionic_native_1.ContactFindOptions();
            options.filter = contactVal;
            options.multiple = true;
            options.hasPhoneNumber = true;
            var fields = [navigator.contacts.fieldType.phoneNumbers];
            navigator.contacts.find(fields, ContactOnSuccess, ContactOnError, options);
        }
        else {
            this.contactsfound = [];
        }
    };
    AddClientPage = __decorate([
        core_1.Component({
            selector: 'page-add-client',
            templateUrl: 'add-client.html'
        })
    ], AddClientPage);
    return AddClientPage;
}());
exports.AddClientPage = AddClientPage;
//# sourceMappingURL=add-client.js.map
import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {UnsentMessagesPage} from '../../pages/unsent-messages/unsent-messages'
import {HelloIonicPage} from '../../pages/hello-ionic/hello-ionic'
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions';

import {
  File,
  ImageResizer, ImageResizerOptions
} from 'ionic-native';

declare var cordova: any
declare var window

/*
  Generated class for the HomeTab page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-home-tab',
  templateUrl: 'home-tab.html'
})
export class HomeTabPage {
  page1 = HelloIonicPage
  page2 = UnsentMessagesPage
  machineIds: any = []
  convertDirectory: any = []
  constructor(public navCtrl: NavController, public navParams: NavParams, public myFunctions: MyFunctions, public myDatabase: MyDatabase) {
    this.myDatabase.refreshUnsents()
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

  resizeIt(cDir, filename, quality, width, height){
    return new Promise((resolve, reject) => {
      let self = this
      let options = {
        uri: cDir + "/" + filename,
        folderName: 'baristachoi_converts',
        fileName: filename,
        quality: quality,
        width: width, /* 128 */
        height: height /** 96 */
      } as ImageResizerOptions;
      console.log("Read Dir", cDir + "/" + filename)
      ImageResizer
        .resize(options)
        .then(
          (filePath: string) => {
            console.log('FilePath', filePath);

            window.resolveLocalFileSystemURL(filePath, gotFile, fail);

            function fail(e) {
              alert('Cannot found requested file');
            }

            function gotFile(fileEntry) {
              fileEntry.file(function(file) {
                var reader = new FileReader();
                reader.onloadend = function(e) {
                  var content = this.result;
                  resolve(content)
                };
                // The most important point, use the readAsDatURL Method from the file plugin
                reader.readAsDataURL(file);
              });
            }
          },
          () => { reject('Error occured'); }
      )}
    )
  }

  savebase64AsImageFile(filename,content,contentType, dirP){
    return new Promise((resolve, reject) => {
      // Convert the base64 string in a Blob
      var DataBlob = this.b64toBlob(content,contentType, 512);
      let self = this
      console.log("Starting to write the file :3");

      window.resolveLocalFileSystemURL(dirP, function(dir) {
        console.log("Access to the directory granted succesfully");
        dir.getFile(filename, {create:true}, function(file) {
          console.log("File created succesfully.");
          file.createWriter(function(fileWriter) {
            console.log("Writing content to file");
            fileWriter.write(DataBlob);
            resolve(filename);
          }, function(){
            reject('Unable to save file in path '+ dirP);
          });
        });
      });
    })
  }

  machineThumbnail(i){
    this.myDatabase.dbQueryRes("SELECT photo FROM machines WHERE id = ?", [this.machineIds[i].id]).then((data:any) => {
      console.log("Base64:", data)
      if(data[0].photo){
        this.savebase64AsImageFile(this.machineIds[i].id + ".jpg", data[0].photo.replace('data:image/jpeg;base64,', ''), 'image/jpeg', this.convertDirectory).then(() => {

        this.resizeIt(this.convertDirectory, this.machineIds[i].id + ".jpg", 100, 128, 96).then((base64: any) => {
          console.log("Converted base64", base64)
          i = i + 1
          if(i < this.machineIds.length)
            this.machineThumbnail(i)
          })
        })
      }else{
        i = i + 1
        if(i < this.machineIds.length)
          this.machineThumbnail(i)
      }
      
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad HomeTabPage');
  }

}

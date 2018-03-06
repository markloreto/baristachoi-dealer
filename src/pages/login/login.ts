import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { MyDatabase } from '../../providers/my-database';
import {MyFunctions} from '../../providers/my-functions'
import { RegisterPage } from '../register/register';
import { HomeTabPage } from '../home-tab/home-tab';
import { WheelSelector } from '@ionic-native/wheel-selector';



@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {
  passcode: any = ""
  slide: boolean = false
  users: any =[]
  res1: any = false
  res2: any = false
  selectedUser: any = ""
  numKey: any

  constructor(private nav: NavController, public myDatabase: MyDatabase, public myFunction: MyFunctions, public alertCtrl: AlertController, public myFunctions: MyFunctions, private selector: WheelSelector) {
    this.myFunction.disabledOptionBtn = true
    let t = setInterval(()=>{
      if(this.myDatabase.databaseLoaded){
        clearInterval(t)
        this.myDatabase.refreshCarriers()
        //this.myDatabase.dbQueryRes("UPDATE machines SET creator_id = ? WHERE creator_id = ?", [this.myDatabase.userInfo.id, "1489213620904"])
        //this.myDatabase.exportDb()
        this.loadit()
      }
    }, 50)
  }

  restoreBackup(){
    this.myFunctions.fileOpen().then((uri:any) => {
      console.log(uri)
      var fileExt = uri.split('.').pop();
      if(fileExt == "sqlite"){

        this.myDatabase.wipeDatabase().then((count: any) => {
          this.myDatabase.restoreDb(uri)
        })
      }

    })
  }

  cloudImport(){
    if(this.myDatabase.isOnline){

      this.alertCtrl.create({
        title: 'Key Required',
        message: "Please Input Depot Key",
        inputs: [
          {
            name: 'key',
            placeholder: 'Key'
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
            text: 'Submit',
            handler: data => {
              this.myDatabase.showLoading()
              console.log(data.key)
              this.myFunction.checkDepotKey(data.key).then((key: any) => {
                console.log("Key", key)
                //this.numKey = key[0].numKey
                for(var x in key){
                  this.numKey = key[x].numKey
                }

                console.log("Now Key", this.numKey)
                this.myFunction.getCloudUsers(this.numKey).then((users: any) => {
                  console.log(users)
                  let usersData = []
                  for(var x in users){
                    users[x].description = users[x].name
                    usersData.push(users[x])
                  }

                  this.myDatabase.hideLoading()
                  this.selector.show({
                    title: "Please select a user to import",
                    items: [
                      usersData
                    ],
                  }).then(
                    result => {
                      console.log("Result", result);
                      this.myFunction.cloudInsert("users", usersData[result[0].index])
                      this.myDatabase.showLoading()
                      this.myFunction.importUserCloudData(usersData[result[0].index].id)

                    },
                    err => console.log('Error: ', err)
                  );
                })
              }).catch(() => {
                this.myFunction.toastIt("Invalid Key")
                this.myDatabase.hideLoading()
              })
            }
          }
        ]
      }).present()
    }else{
      this.myFunctions.toastIt("Please connect to internet")
    }
  }

  removeNow(){
    if(this.selectedUser == "")
      this.myFunction.toastIt("Please select a user to switch")
    else{
      this.myFunction.confirm("Please Confirm", "Remove this user?").then(_ => {
        this.myFunction.removeUser(this.selectedUser).then(_ => {
          this.loadit()
        })
      })
    }
  }

  switchNow(){
    console.log("Selected user", this.selectedUser)
    if(this.selectedUser == "")
      this.myFunction.toastIt("Please select a user to switch")
    else{

      this.alertCtrl.create({
        title: 'Admin Pass Code',
        message: "Please provide the Admin Pass Code to switch user",
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
            text: 'Login',
            handler: data => {
              if (data.passcode == this.myDatabase.passcode) {
                this.myDatabase.login(this.selectedUser).then((ui:any) => {
                  console.log("is now logged in: ", ui)
                  this.nav.setRoot(HomeTabPage)
                })
              } else {
                this.myFunction.toastIt("Invalid Admin Pass Code")
              }
            }
          }
        ]
      }).present()


    }
  }

  public loadit(){
    this.myDatabase.dbQuery("SELECT * FROM users", []).then((users_result:any) => {
      this.myDatabase.usersNum = users_result.rows.length

      if(users_result.rows.length == 0){
        this.res1 = true
      }
      else{
        if(Object.keys(this.myDatabase.userInfo).length !== 0 && !this.res1){
          console.log("Logging in as: ", this.myDatabase.userInfo)
          this.nav.setRoot(HomeTabPage)
        }
        else{
          this.users = []
          for(var x = 0; x < users_result.rows.length; x++){
            this.users.push(users_result.rows.item(x))
          }

          console.log("Users: ", this.users)
        }

      }

      this.myDatabase.getSettings("passcode").then((passcode_result:any) => {
        console.log("Password: ", passcode_result)
        if(passcode_result == "No Data"){
          this.res2 = true
        }
        else{
          this.myDatabase.passcode = passcode_result
          this.passcode = passcode_result
          this.res2 = !passcode_result
        }

        this.slide = false//this.res1 || this.res2
      })
    })
  }

  public createAccount() {
    this.nav.push(RegisterPage);
  }
}

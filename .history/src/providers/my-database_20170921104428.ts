import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import {SQLite, NativeStorage, Device, AppVersion, File, SocialSharing } from 'ionic-native';
import { AlertController, LoadingController, ActionSheetController  } from 'ionic-angular';
import * as moment from 'moment';
import {DomSanitizer} from '@angular/platform-browser';
import * as _ from 'lodash';

declare var cordova
declare var window
declare var navigator
/*
  Generated class for the MyDatabase provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class MyDatabase {

  public storage: SQLite;
  public timestamp: any;
  public wrongDate: boolean;
  public isOpen: boolean;
  public databaseLoaded: boolean;
  private wrongDateAlertOpen: boolean;
  public loading: any;
  public gps_bg: string; // settings
  public passcode: string // settings
  public userInfo: any
  public uuid: string = ""
  public appVersion: any
  public appVersionCode: any
  public usersNum: number = 0
  public fbConnect: any
  public isOnline:boolean = false
  public minimumGPSMeter: number
  public carriers: any = []
  public machineBackups: any = []
  public maximumSpeed: number
  public offTake: boolean
  
  unsents: any = []
  depot: any

  constructor(public http: Http, public alertCtrl: AlertController, public loadingCtrl: LoadingController, public sanitizer: DomSanitizer, public actionSheetCtrl: ActionSheetController) {
    console.log('Hello MyDatabase Provider');

    if(!this.isOpen){
      this.databaseLoaded = false;
      this.wrongDate = false;
      this.isOpen = true;
      this.wrongDateAlertOpen = false;

      // GPS Background Settings
      this.getSettings('gps_bg').then((data:any) => {
        if(data == "No Data" || "undefined" === typeof data){
          this.setSettings("gps_bg", 'enabled')
          this.gps_bg = 'enabled'
        }
        else{
          this.gps_bg = data
        }
      })

      this.getSettings("depot").then((d) => {
        if(d == "No Data"){
          this.depot = {name: "N/A", key: "1234"}
          
        }
        else
          this.depot = d
          console.log("Depot", this.depot)
      })

      this.getSettings('passcode').then((data:any) => {
        if(data == "No Data" || "undefined" === typeof data){
          this.setSettings("passcode", '1234')
          this.passcode = '1234'
        }
        else{
          this.passcode = data
        }
      })

      this.getSettings('maximumSpeed').then((data:any) => {
        if(data == "No Data" || "undefined" === typeof data){
          this.setSettings("maximumSpeed", 40)
          this.maximumSpeed = 40
        }
        else{
          this.maximumSpeed = data
        }
      })

      this.getSettings('offTake').then((data:any) => {
        if(data == "No Data" || "undefined" === typeof data){
          this.setSettings("offTake", false)
          this.offTake = false
        }
        else{
          this.offTake = data
        }
      })
    }

  }

  getSettings(name){
    return new Promise((resolve) => {
      NativeStorage.getItem(name).then(data => {
        resolve(data)
      }, reject => {
        resolve("No Data")
      })
    })
  }

  setSettings(name, value){
    NativeStorage.setItem(name, value)
  }

  importDb(content){
    return new Promise((resolve) => {
      var successFn = function(json, count){
        console.log("Exported JSON: ", json);
        resolve(count)
      };

      var progressFn = function(current, total){
        console.log("Imported "+current+"/"+total+" statements");
      };

      var errorFn = function(error){
        console.log("The following error occurred: "+error.message);
      };

      cordova.plugins.sqlitePorter.importJsonToDb(this.storage, content, {
        successFn: successFn,
        progressFn: progressFn,
        errorFn: errorFn,
        batchInsertSize: 1
      });
    })

  }

  public loadDatabase(){
    return new Promise((resolve) => {
      //window.sqlitePlugin.deleteDatabase({name: 'barangays', location: 'default'}, function(){console.log("database removed")}, function(){});

      this.showLoading();
      this.storage = new SQLite();
      this.storage.openDatabase({name: "data.db", location: "default"}).then(() => {
        this.hideLoading();
        //this.databaseLoaded = true;
        //this.storage.executeSql("DROP TABLE IF EXISTS machines", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS settings", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS logs", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS clients", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS users", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS callsheets", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS disr", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS disr_items", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS orders", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS order_payments", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS disr_payments", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS products", []);
        //this.storage.executeSql("DROP TABLE IF EXISTS carriers", []);

        //table creation
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL DEFAULT '', created_date INT, updated_date INT, photo TEXT NOT NULL DEFAULT '', contact TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY, name TEXT NOT NULL DEFAULT '', alias TEXT NOT NULL DEFAULT '', company TEXT NOT NULL DEFAULT '', contact TEXT NOT NULL DEFAULT '', contact2 TEXT NOT NULL DEFAULT '', photo TEXT NOT NULL DEFAULT '', lat REAL, lng REAL, last_order_date INT, created_date INT, updated_date INT, creator_id TEXT NOT NULL DEFAULT '', email TEXT, thumbnail TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS machines (id INTEGER PRIMARY KEY NOT NULL, creator_id TEXT, owner_id TEXT, qr_id TEXT, created_date INT NOT NULL, updated_date INT NOT NULL, last_visit_date INT, maintenance_date INT, region TEXT NOT NULL DEFAULT '', municipal TEXT NOT NULL DEFAULT '', brgy TEXT NOT NULL DEFAULT '', accuracy REAL NOT NULL DEFAULT 0, delivery TEXT NOT NULL DEFAULT 'Unspecified', lat REAL NOT NULL DEFAULT 0, lng REAL NOT NULL DEFAULT 0, machine_type TEXT NOT NULL DEFAULT '', sequence INT NOT NULL DEFAULT 0, photo TEXT NOT NULL DEFAULT '', thumbnail TEXT, establishment_type TEXT, report_date INT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY NOT NULL, type TEXT NOT NULL DEFAULT 'entry', ref_id INT NOT NULL DEFAULT 0, data TEXT NOT NULL DEFAULT '')", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, name TEXT, data TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS disr (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'active', sequence_id TEXT, parent_id INTEGER)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS disr_payments (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT NOT NULL DEFAULT '', disr_id INTEGER, amount REAL, notes TEXT, status TEXT, alarm INTEGER, photo TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT NOT NULL DEFAULT '', status TEXT, client_id INTEGER)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS order_payments (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT NOT NULL DEFAULT '', amount REAL, order_id INTEGER, change REAL)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS disr_items (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT NOT NULL DEFAULT '', plus INTEGER NOT NULL DEFAULT 0, minus INTEGER NOT NULL DEFAULT 0, type TEXT, order_id INTEGER, disr_id INTEGER, product_id INTEGER, remaining INT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS actions (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT NOT NULL DEFAULT '', name TEXT, action TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS callsheets (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT, machine_id INT, order_id INT, type TEXT, lat REAL, lng REAL, note TEXT, distance REAL)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, name TEXT, category TEXT, price REAL, unit_name TEXT, photo TEXT, sku TEXT, sequence INTEGER, description TEXT)", [])
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS admin_contacts (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT, name TEXT, contact TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS reporting_contacts (id INTEGER PRIMARY KEY, created_date INT, updated_date INT, creator_id TEXT, number TEXT, type TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS sms_unsent (id INTEGER PRIMARY KEY, creator_id INT, msg TEXT, numbers TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS carriers (id INTEGER PRIMARY KEY, carrier TEXT, prefix TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS coverage_area (id INTEGER PRIMARY KEY, creator_id INT, area TEXT)", []);
        this.storage.executeSql("CREATE TABLE IF NOT EXISTS spare_parts (id INTEGER PRIMARY KEY, name TEXT, category TEXT, description TEXT, price REAL, sku TEXT, unit_name TEXT, photo TEXT)", []);

        this.dbQuery("SELECT COUNT(id) AS mycount FROM products ", []).then((data:any) => {
          if(!data.rows.item(0).mycount){
            //this.showLoading("Installing products")
            let myArr = [
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [1, this.getTimestamp(), this.getTimestamp(), "Milky Choco Loco", "Powder Mix", 180, "kg", "", "pm_mcl", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [2, this.getTimestamp(), this.getTimestamp(), "Caramel Macchiato", "Powder Mix", 180, "kg", "", "pm_cm", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [3, this.getTimestamp(), this.getTimestamp(), "Coffee Pinoy Blend", "Powder Mix", 180, "kg", "", "pm_cpb", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [4, this.getTimestamp(), this.getTimestamp(), "Coffee White", "Powder Mix", 180, "kg", "", "pm_cw", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [5, this.getTimestamp(), this.getTimestamp(), "Coffee Brown", "Powder Mix", 180, "kg", "", "pm_cb", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [6, this.getTimestamp(), this.getTimestamp(), "Creamy Milk Tea", "Powder Mix", 180, "kg", "", "pm_cmt", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [7, this.getTimestamp(), this.getTimestamp(), "Mocha Cappuccino", "Powder Mix", 180, "kg", "", "pm_mc", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [8, this.getTimestamp(), this.getTimestamp(), "Coffee Vending Machine", "Machine", 12000, "unit", "", "mac_new", 0, "New"]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [9, this.getTimestamp(), this.getTimestamp(), "Coffee Vending Machine", "Machine", 10000, "unit", "", "mac_ref", 0, "Refurbished"]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [10, this.getTimestamp(), this.getTimestamp(), "Coffee Vending Machine", "Machine", 12000, "unit", "", "mac_free", 0, "New(F)"]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [11, this.getTimestamp(), this.getTimestamp(), "6.5oz Paper Cups", "Paper Cups", 0.75, "pc", "", "cup_65", 0, ""]],
              ["INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [12, this.getTimestamp(), this.getTimestamp(), "Coffee Vending Machine", "Machine", 1200, "unit", "", "mac_restore", 0, "Restore"]],
            ]
            this.dbQueryBatch(myArr).then((s:any) => {
              //this.hideLoading()
            })
          }

          if(data.rows.item(0).mycount == 11){
            this.dbQuery("INSERT OR REPLACE INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [12, this.getTimestamp(), this.getTimestamp(), "Coffee Vending Machine", "Machine", 1200, "unit", "", "mac_restore", 0, "Restoration"])
          }
        })

        this.dbQuery("SELECT COUNT(id) AS mycount FROM carriers ", []).then((data:any) => {
          if(!data.rows.item(0).mycount){
            this.showLoading("Installing Mobile Prefix")
            let self = this
            let sql = "INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492390730361','Globe','0817');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391100147','Globe','0905');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391107525','Globe','0906');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391114355','Globe','0915');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391117974','Globe','0916');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391123711','Globe','0917');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391131235','Globe','0926');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391137369','Globe','0927');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391142649','Globe','0935');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391147722','Globe','0936');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391153383','Globe','0945');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391159696','Globe','0975');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391165343','Globe','0976');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391172447','Globe','0977');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391176509','Globe','0978');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391182860','Globe','0979');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391189034','Globe','0994');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391192167','Globe','0995');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391195977','Globe','0996');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391203918','Globe','0997');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492391209951','Globe','0937');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396568646','Smart','0813');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396576598','Smart','0900');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396582799','Smart','0907');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396587796','Smart','0908');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396592598','Smart','0909');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396601767','Smart','0910');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396606960','Smart','0911');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396614608','Smart','0912');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396619642','Smart','0913');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396628006','Smart','0914');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396634462','Smart','0918');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396639997','Smart','0919');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396645227','Smart','0920');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396651291','Smart','0921');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396664034','Smart','0928');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396669287','Smart','0929');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396676342','Smart','0930');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396679958','Smart','0938');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396686006','Smart','0939');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396693228','Smart','0940');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396698560','Smart','0946');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396705890','Smart','0947');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396712002','Smart','0948');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396717089','Smart','0949');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396721548','Smart','0950');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396727060','Smart','0989');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396733201','Smart','0998');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396737445','Smart','0999');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396744189','Sun','0922');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396750060','Sun','0923');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396757948','Sun','0924');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396763676','Sun','0925');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396768418','Sun','0931');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396774434','Sun','0932');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396779440','Sun','0933');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396786733','Sun','0934');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396793629','Sun','0942');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396800540','Sun','0943');INSERT OR REPLACE INTO carriers(id,carrier,prefix) VALUES ('1492396808386','Sun','0944');"
            var successFn = function(count){
              console.log("Successfully imported "+count+" SQL statements to DB");
              self.hideLoading()
            };
            var errorFn = function(error){
              console.log("The following error occurred: "+error.message);
              self.hideLoading()
            };
            var progressFn = function(current, total){
              console.log("Imported "+current+"/"+total+" statements");
            };
            cordova.plugins.sqlitePorter.importSqlToDb(this.storage, sql, {
              successFn: successFn,
              errorFn: errorFn,
              progressFn: progressFn
            });
          }
        })


        this.addColumn("clients", "email", "TEXT")
        this.addColumn("machines", "establishment_type", "TEXT")
        this.addColumn("machines", "thumbnail", "TEXT")
        this.addColumn("clients", "thumbnail", "TEXT")
        this.addColumn("disr_items", "remaining", "INT")
        this.addColumn("machines", "report_date", "INT")

        //synchs
        this.addColumn("machines", "sync", "INT")
        this.addColumn("machines", "deleted_at", "INT")
        this.addColumn("clients", "sync", "INT")

        this.getSettings("userInfo").then((ui:any) => {
          if(ui == "No Data" || ui == ""){
            this.userInfo = false
            this.databaseLoaded = true
          }
          else{
            this.userInfo = JSON.parse(ui)
            this.databaseLoaded = true
          }
        })

        //Inits Variables
        this.uuid = Device.uuid

        AppVersion.getVersionNumber().then(data => {
          this.appVersion = parseFloat(data)
          console.log("App Version", data)
        })

        AppVersion.getVersionCode().then(vn => {
          this.appVersionCode = vn
          console.log("App Version Code", vn)
        })

        resolve()
      });
    });
  }

  login(id){
    this.showLoading()
    return new Promise((resolve, reject) => {
      this.dbQuery("SELECT * FROM users WHERE id = ?", [id]).then((ui:any) => {
        let userInfo = ui.rows.item(0)
        this.setSettings("userInfo", JSON.stringify(userInfo))
        this.userInfo = userInfo
        this.hideLoading()
        resolve(userInfo)
      })
    })
  }

  fullBackUp(){
    let self = this
    var path = cordova.file.externalApplicationStorageDirectory + "backups/"
    
    var Name = "db_backup_" + moment().format("YYYY-MM-DD_mm-ss-A")
    var fName = Name + ".sqlite"
    

    var successFn = function(sql, count){
      File.writeFile(path, fName, sql).then(()=>{
        console.log(sql)
        var URI_DB = path
        var PARENT_DIR = "file://mnt/sdcard/"
        var name = self.userInfo.name + " database"
        var NAME_DB = fName;
        var NEW_NAME_BACKUP = "backup.sqlite";
        
        self.showLoading()
        window.resolveLocalFileSystemURL(URI_DB+NAME_DB, function(fs) {
          window.resolveLocalFileSystemURL(PARENT_DIR, function(directoryEntry){
            fs.copyTo(directoryEntry, NEW_NAME_BACKUP, function() {
              console.log("The database backup was successful.");
              window.JJzip.zip(PARENT_DIR + NEW_NAME_BACKUP, {target: PARENT_DIR, name: name},function(data){
              SocialSharing.share("Full Back-up of " + self.userInfo.name, "Full Back-up of " + self.userInfo.name, PARENT_DIR + name + ".zip", PARENT_DIR + name + ".zip").then(_ => {
                self.machineBackups = []
                self.hideLoading()
              })
              },function(error){
                self.hideLoading()
              })
            });
          });
        });
      }).catch(e => {self.hideLoading()})
    };

    cordova.plugins.sqlitePorter.exportDbToSql(self.storage, {
        successFn: successFn
    });
  }

  wipeDatabase(){
    return new Promise((resolve, reject) => {
      let self = this
      var successFn = function(count){
        resolve(count)
      };
      var errorFn = function(error){
          alert("The following error occurred: "+error.message);
      };
      var progressFn = function(current, total){
          console.log("Wiped "+current+"/"+total+" tables");
      };
      cordova.plugins.sqlitePorter.wipeDb(self.storage, {
          successFn: successFn,
          errorFn: errorFn,
          progressFn: progressFn
      });
    })
  }

  restoreDb(uri){
    let self = this
    
    var progressFn = function(current, total){
      console.log("Imported "+current+"/"+total+" statements");
    
    };

    var successFnImport = function(count){
      self.hideLoading()
      alert("Database Successfully Imported")
      // keep startup url (in case your app is an SPA with html5 url routing)
      var initialHref = window.location.href;

      function restartApplication() {
        // Show splash screen (useful if your app takes time to load) 
        navigator.splashscreen.show();
        // Reload original app url (ie your index.html file)
        window.location = initialHref;
      }
      restartApplication()
    };

    var successFn = function(uriFix){
      self.showLoading()
      var path = uriFix.substring(0, Math.max(uriFix.lastIndexOf("/"), uriFix.lastIndexOf("\\")));
      var fName = uriFix.replace(/^.*[\\\/]/, '').replace(/\%20/gim, " ")
      File.readAsText(path, fName).then((content:any) => {
        console.log(content)
        cordova.plugins.sqlitePorter.importSqlToDb(self.storage, content, {
          successFn: successFnImport,
          errorFn: errorFn,
          progressFn: progressFn
        });
      })
    };
    var errorFn = function(error){
        alert("The following error occurred: "+error.message);
        self.hideLoading()
    };
    window.FilePath.resolveNativePath(uri, successFn, errorFn);
  }

  chkColumn(table, column){
    return new Promise((resolve, reject) => {
      this.dbQuery("PRAGMA table_info("+table+")", []).then((data:any) => {
        var a
        for(var x = 0; x < data.rows.length; x++) {
          a = data.rows.item(x)
          if(a.name == column)
            resolve(true)
        }
        resolve(false)
      })
    });
  }

  addColumn(table, col, opts){
    this.chkColumn(table, col).then((data:any) => {
      if(!data){
        this.dbQuery("ALTER TABLE "+table+" ADD COLUMN "+col+" "+opts, [])
      }
    })
  }

  dbQuery(q,v){
    return new Promise((resolve, reject) => {
      this.storage.executeSql(q, v).then((data:any) => {
        resolve(data);
      }, (error) => {
        console.log(error)
        reject(error);
      });
    });
  }

  dbQueryRes(q, v){
    return new Promise((resolve, reject) => {
      this.storage.executeSql(q, v).then((data:any) => {
        var ar = []
        for(var x = 0; x < data.rows.length; x++){
          ar.push(data.rows.item(x))
        }
        resolve(ar);
      }, (error) => {
        console.log(error)
        reject(error);
      });
    });
  }

  dbQueryBatch(q){
    return new Promise((resolve, reject) => {
      this.storage.sqlBatch(q).then((data:any) => {
        resolve(data)
      }, (error) => {
        console.log(error)
        reject(error);
      })
    })
  }

  setQty(disr_id, product_id, value, type, set, order_id = null){
    return new Promise((resolve, reject) => {
      this.dbQueryRes("SELECT * FROM disr_items WHERE creator_id = ? AND disr_id = ? AND product_id = ?", [this.userInfo.id, disr_id, product_id]).then((res:any) => {
        console.log(res)
        let resItems = res.length
        var add
        var minus
        if(set == "add"){
          add = value
          minus = 0
        }
        if(set == "minus"){
          minus = value
          add = 0
        }

        if(type == "" && set == "add" && resItems === 0)
          type = "Beginning"
        if(type == "" && set == "add" && resItems !== 0)
          type = "Reloaded"

        let t = this.getTimestamp()
        this.dbQueryRes("INSERT INTO disr_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [t, t, t, this.userInfo.id, parseInt(add), parseInt(minus), type, order_id, disr_id, product_id, null]).then((done:any) => {
          resolve(true)
        })
      })
    })
  }

  public getTimestamp(){
    return this.timestamp = moment().format("x");
  }

  public setTimeInSettings(){
    if(!this.wrongDate)
      this.storage.executeSql("INSERT OR REPLACE INTO settings (id, name, data ) VALUES (?, ?, ?)", [1, "time_in", this.getTimestamp()]);
  }

  exportDb(){
    this.showLoading()
    let self = this
    this.dbQueryRes("SELECT * FROM machines WHERE creator_id = ?", [this.userInfo.id]).then((machines:any) => {
      for(var x in machines){
        this.machineBackups.push(machines[x])
      }

      this.machineBackups = _.uniqBy(this.machineBackups, 'id');
      this.hideLoading()

      this.backUpWriteNow()
    })
  }

  backUpWriteNow(){
    this.showLoading()
    var clients_ids = []
    var commas = ""
    let self = this
    for(var x in this.machineBackups){
      if(this.machineBackups[x].owner_id)
        clients_ids.push(parseInt(this.machineBackups[x].owner_id))
    }
    for(var x in clients_ids){
      if(x === "0"){
        commas += "?"
      }
      else
        commas += ", ?"
    }

    console.log("Commas", commas)

    this.dbQueryRes("SELECT * FROM clients WHERE id IN ("+commas+")", clients_ids).then((clients:any) => {
      var json = {"databaseImport": {"data": {"inserts" : {"machines" : this.machineBackups, "clients" : clients}}}, "owner": this.userInfo}
      console.log("JSON:", JSON.stringify(json))
      var path = cordova.file.externalApplicationStorageDirectory + "backups"

      var Name = "machine_backup_" + moment().format("YYYY-MM-DD_mm-ss-A")
      var fName = Name + ".baristachoi"
      File.writeFile(path, fName, JSON.stringify(json)).then(()=>{

        window.JJzip.zip(path + "/" + fName, {target: path + "/", name: Name},function(data){
          SocialSharing.share("Shared back-up machines using", "Back-up Machines", path + "/" + Name + ".zip", path + "/" + Name + ".zip").then(_ => {
            self.machineBackups = []
            self.hideLoading()
          })
        },function(error){
          self.hideLoading()
        })

      }).catch(e => {self.hideLoading()})
    })


  }

  backUpConfirm(){
    this.actionSheetCtrl.create({
      title: 'Select Back-up option',
      buttons: [
        {
          text: 'Clear',
          role: 'destructive',
          handler: () => {
            this.machineBackups = []
          }
        },{
          text: 'Back-up and Share',
          handler: () => {
            File.checkDir(cordova.file.externalApplicationStorageDirectory, 'backups').then(_ => {
              this.backUpWriteNow()
            }).catch(err => {
              File.createDir(cordova.file.externalApplicationStorageDirectory, "backups", true).then((dir:any) => {
                this.backUpWriteNow()
              })
            });
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    }).present()
  }

  getClient(id){
    return new Promise((resolve, reject) => {
      this.storage.executeSql("SELECT clients.*, COUNT(machines.id) AS units FROM clients LEFT OUTER JOIN machines ON clients.id = machines.owner_id WHERE clients.id = ? GROUP BY clients.name", [id]).then((data) => {
        let t = data.rows.item(0)
        resolve(t);
      }, (error) => {
        reject(error);
      });
    });
  }

  public chkTime(){
    this.storage.executeSql("SELECT COUNT(*) AS total FROM settings WHERE data > ? AND name = 'time_in'", [this.getTimestamp()]).then((data) => {
      if(data.rows.item(0).total){
        console.log("Wrong date");
        this.wrongDate = true

        if(!this.wrongDateAlertOpen){
          this.wrongDateAlertOpen = true;
          let alert = this.alertCtrl.create({
            title: 'Incorrect Date/time!!!',
            subTitle: 'You will be redirected to date settings to adjust it correctly',
            buttons: [
              {
                text: 'Ok, ayusin ko na lang ang date/time',
                handler: () => {
                  this.wrongDateAlertOpen = false;
                  setTimeout(function () {
                    if(typeof cordova.plugins.settings.openSetting != undefined){
                      cordova.plugins.settings.openSetting("date", function(){
                            console.log("opened date settings")
                            alert.dismiss();
                          },
                          function(){
                            console.log("failed to open date settings")
                          });
                    }
                  }, 1000)
                  return true

                }
              }
            ],
            enableBackdropDismiss: false
          });
          alert.present();
        }

      }
      else{

        if(this.wrongDate){
          this.alertCtrl.create({
            title: 'Hey Buddy!',
            message: "I'm so proud of you! Thank you for fixing your date/time",
            buttons: ['OK']
          }).present();
          this.wrongDate = false;
          this.setTimeInSettings();
        }
      }
    }, (error) => {
      console.log(error);
    });
  }

  public getLogs() {
    return new Promise((resolve, reject) => {
      this.storage.executeSql("SELECT * FROM logs", []).then((data) => {
        let logs = [];
        if(data.rows.length > 0) {
          for(let i = 0; i < data.rows.length; i++) {
            logs.push({
              id: data.rows.item(i).id,
            });
          }
        }
        resolve(logs);
      }, (error) => {
        reject(error);
      });
    });
  }

  public createPerson(firstname: string, lastname: string) {
    return new Promise((resolve, reject) => {
      this.storage.executeSql("INSERT INTO people (firstname, lastname) VALUES (?, ?)", [firstname, lastname]).then((data) => {
        resolve(data);
      }, (error) => {
        reject(error);
      });
    });
  }

  public getJson(url, options = {}){
    return new Promise((resolve, reject) => {
      // We're using Angular HTTP provider to request the data,
      // then on the response, it'll map the JSON data to a parsed JS object.
      // Next, we process the data and resolve the promise with the new data.
      
      this.http.get(url, options)
        .map(res => res.json())
        .subscribe(data => {
          // we've got back the raw data, now generate the core schedule data
          // and save the data for later reference
          resolve(data);
        }, e => {reject(e)});
    });
  }

  refreshUnsents(){
    this.unsents = []
    this.dbQueryRes("SELECT * FROM sms_unsent WHERE creator_id = ? ORDER BY id DESC", [this.userInfo.id]).then((res:any)=>{
      for(var x in res){
        res[x].date = moment(parseInt(res[x].id)).format("LLLL")
        res[x].disabled = false
      }
      this.unsents = res
    })
  }

  refreshCarriers(){
    return new Promise((resolve) => {
      this.carriers = []
      this.dbQueryRes("SELECT * FROM carriers", []).then((d:any) => {
        this.carriers = d
        resolve()
      })
    });
  }

  public showLoading(message = "Please wait..."){
    this.loading = this.loadingCtrl.create({
      content: message
    });
    this.loading.present();
  }

  public hideLoading(){
    try{
      this.loading.dismiss();
    }catch(e){

    }

  }
}

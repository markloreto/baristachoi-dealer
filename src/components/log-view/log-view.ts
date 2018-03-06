import { Component } from '@angular/core';
import { MyDatabase } from '../../providers/my-database';
/*
  Generated class for the LogView component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'log-view',
  templateUrl: 'log-view.html'
})
export class LogViewComponent {
  public logs: Array<Object>;
  constructor(public myDatabase: MyDatabase) {
    this.refreshLogs();
  }

  public refreshLogs(){
    if(this.myDatabase.databaseLoaded){
      this.myDatabase.showLoading()
      this.myDatabase.getLogs().then((result) => {
        this.myDatabase.hideLoading();

        this.logs = <Array<Object>> result;
      }, (error) => {
        this.myDatabase.hideLoading();

      });
    }
    else {
      setTimeout(() => {
        this.refreshLogs();
      }, 1000)
    }

  }
}

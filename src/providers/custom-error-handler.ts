import { Injectable } from '@angular/core';
import { ErrorHandler } from '@angular/core';
import { IonicErrorHandler } from 'ionic-angular';
import { MyDatabase } from '../providers/my-database'
import {MyFunctions} from '../providers/my-functions'
import 'rxjs/add/operator/map';

/*
  Generated class for the CustomErrorHandler provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class CustomErrorHandler extends IonicErrorHandler implements ErrorHandler {

  constructor(
    public myDatabase: MyDatabase, public myFunctions: MyFunctions
  ) {
    // Call parent constructor (with no parameters).
    super();
  }

  handleError(err: any): void {
    // Call parent handleError method.
    super.handleError(err);

    // Wrap custom code in empty try/catch.
    try {
      this.myFunctions.toastIt("An Error Occurred Please Contact Mark @ 09173242410", 60000, "top")
      this.myDatabase.hideLoading()
    } catch (e) {console.log(e)}
  }

}

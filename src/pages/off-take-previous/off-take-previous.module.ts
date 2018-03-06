import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OffTakePrevious } from './off-take-previous';

@NgModule({
  declarations: [
    OffTakePrevious,
  ],
  imports: [
    IonicPageModule.forChild(OffTakePrevious),
  ],
  exports: [
    OffTakePrevious
  ]
})
export class OffTakePreviousModule {}

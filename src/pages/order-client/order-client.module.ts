import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OrderClient } from './order-client';

@NgModule({
  declarations: [
    OrderClient,
  ],
  imports: [
    IonicPageModule.forChild(OrderClient),
  ],
  exports: [
    OrderClient
  ]
})
export class OrderClientModule {}

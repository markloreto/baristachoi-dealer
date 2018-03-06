import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

/*
  Generated class for the CallsheetStats page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-callsheet-stats',
  templateUrl: 'callsheet-stats.html'
})
export class CallsheetStatsPage {
  public pieChartLabels:any = []
  public pieChartData:any = []
  public pieChartType:string = 'pie';

  dataV:any = []
  labelsV:any = []

  dataOveriddes: any = []
  labelOveriddes: any = []

  title: string
  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.pieChartData = navParams.get("data")
    this.pieChartLabels = navParams.get("labels")

    this.dataOveriddes = (navParams.get("dataOveriddes")) ? navParams.get("dataOveriddes") : []
    this.labelOveriddes = (navParams.get("labelOveriddes")) ? navParams.get("labelOveriddes") : []

    if(this.dataOveriddes.length && this.labelOveriddes.length){
      this.dataV = this.dataOveriddes
      this.labelsV = this.labelOveriddes
    }else{
      this.dataV = this.pieChartData
      this.labelsV = this.pieChartLabels
    }


    this.title = (navParams.get("title")) ? navParams.get("title") : "Chart"
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad CallsheetStatsPage');
  }
// events
  public chartClicked(e:any):void {
    console.log(e);
  }

  public chartHovered(e:any):void {
    console.log(e);
  }
}

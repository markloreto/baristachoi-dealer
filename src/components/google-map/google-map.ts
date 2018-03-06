import { Component, Input } from '@angular/core';
import {
  GoogleMap,
  GoogleMapsEvent,
  GoogleMapsLatLng,
  GoogleMapsMarkerOptions,
  GoogleMapsMarker
} from 'ionic-native';

import { MyFunctions } from '../../providers/my-functions';
import { MyDatabase } from '../../providers/my-database';

import { Events, NavParams} from 'ionic-angular';

/*
  Generated class for the GoogleMap component.

  See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
  for more info on Angular 2 Components.
*/
@Component({
  selector: 'google-map',
  templateUrl: 'google-map.html'
})
export class GoogleMapComponent {
  @Input()
  poly: any = [];
  @Input()
  markers: any;
  @Input()
  focus: any;
  @Input()
  clicky: boolean;
  @Input()
  toolbar: boolean = true;
  marker: any
  map: GoogleMap;
  accuracy: any;
  accColor: string;
  pos: any
  withFocus: boolean = true
  bounds: any = []
  mapClickable: () => void
  mapUnclickable: () => void
  locWatchingM: (position:any) => void
  animateMarkers: () => void
  tt: any
  polygon: any
  constructor(public events: Events, public myFunctions: MyFunctions, public navParams: NavParams, public myDatabase: MyDatabase) {

    this.mapClickable = () => {
      this.map.setClickable(false);
    }
    this.mapUnclickable = () => {
      this.map.setClickable(true);
    }

    this.animateMarkers = () => {
      console.log("animate It")
      this.bounds = []
      let mPos
      for(var x in this.markers) {
        mPos = new GoogleMapsLatLng(this.markers[x].lat, this.markers[x].lng)
        this.bounds.push(mPos)

        try{
          clearTimeout(this.tt)
        }catch(e){}

        this.tt = setTimeout(()=>{
          this.map.animateCamera({
            target: this.bounds,
          }).then(() => {
            this.map.setPadding(50, 50, 50, 50)
            if(this.bounds.length == 1)
              this.map.setZoom(14)
          });
        },500)

      }


    }

    this.locWatchingM = (position) => {
      this.accuracy = position.coords.accuracy.toFixed(2);
      this.accColor = (this.accuracy <= this.myFunctions.gpsMinimumMeter) ? "green" : "yellow";
      /*let latDist = 1.0 / 111.1 * 1.0;
      let lonDist = 1.0 / Math.abs(111.1*Math.cos(position.coords.latitude)) * 1.0;

      this.myDatabase.dbQuery("SELECT * FROM machines WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?",[position.coords.latitude-latDist, position.coords.latitude+latDist, position.coords.longitude-lonDist, position.coords.longitude+lonDist]).then((data:any) => {
        var values = []
        for(var i = 0; i < data.rows.length; i++){
          values.push(data.rows.item(i))
        }

        console.log(values)
      })*/

    }

    this.marker = [];


    this.focus = navParams.get('focus');
    if (typeof this.focus === "undefined") {
      this.withFocus = false
      this.focus = [14.670739, 121.0124673]

    }
    this.markers = navParams.get('markers');
    if (typeof this.markers === "undefined") {
      this.markers = [];
    }

    this.clicky = true;

    this.accuracy = "Positioning...";
    this.accColor = "danger";
  }

  ngOnDestroy(){
    console.log("map leave unsubscribe")
    this.events.unsubscribe('map:unclickable', this.mapUnclickable);
    this.events.unsubscribe('map:clickable', this.mapClickable);
    this.events.unsubscribe('location:watching', this.locWatchingM);
    this.events.unsubscribe('map:animatemarkers', this.animateMarkers);

  }

  ngAfterViewInit() {
    this.myFunctions.enableLocation();
    this.loadMap();

    console.log("map subscribe event")
    this.events.subscribe('map:unclickable', this.mapClickable);
    this.events.subscribe('map:clickable', this.mapUnclickable);
    this.events.subscribe('location:watching', this.locWatchingM);
    this.events.subscribe('map:animatemarkers', this.animateMarkers);

  }

  mapClear(){
    for(var x in this.marker){
      this.marker[x].remove()
    }


    this.map.clear();
    this.marker = []
    this.markers = []

    try{
      this.polygon.remove()
    }catch(e){

    }
  }


  setMapFocus(pos){
    this.map.animateCamera({
      'target': pos,
      'tilt': 0,
      'zoom': 17,
      'bearing': 0
    });
  }

  loadMap() {
    let location = new GoogleMapsLatLng(this.focus[0],this.focus[1]);


    this.map = new GoogleMap('map', {
      'backgroundColor': 'white',
      'controls': {
        'compass': true,
        'myLocationButton': true,
        'indoorPicker': true,
        'zoom': true
      },
      'gestures': {
        'scroll': true,
        'tilt': true,
        'rotate': true,
        'zoom': true
      },
      'camera': {
        'latLng': location,
        'tilt': 0,
        'zoom': 15,
        'bearing': 0
      }
    });


    this.map.one(GoogleMapsEvent.MAP_READY).then(() => {
      for(var x in this.marker){
        this.marker[x].removeEventListener()
        this.marker[x].remove()
      }


      this.map.clear();
      this.marker = []
      this.bounds = []
      try{
        this.polygon.remove()
      }catch(e){

      }

      var mPos
      for(var x in this.markers){
        mPos = new GoogleMapsLatLng(this.markers[x].lat, this.markers[x].lng)
        this.bounds.push(mPos)
        let markerOptions: GoogleMapsMarkerOptions = {
          position: mPos,
          title: this.markers[x].title,
          draggable: this.markers[x].draggable,
          snippet: (this.markers[x].snippet) ? this.markers[x].snippet : "",
          icon: (typeof this.markers[x].icon === 'object') ? this.markers[x].icon : "red",
          rotation: (this.markers[x].rotation) ? this.markers[x].rotation : 0
        };

        this.map.addMarker(markerOptions)
        .then((marker: GoogleMapsMarker) => {
          this.marker[x] = marker
          this.marker[x].showInfoWindow();
          if(this.markers[x].draggable){
            this.marker[x].addEventListener(GoogleMapsEvent.MARKER_DRAG_END).subscribe(
            data => {
              marker.getPosition().then((LatLng) => {
                this.events.publish('map:dragend', LatLng);
              });
            });
          }

        });
      }

      //polygon
      if(this.poly.length > 0){
        this.map.addPolygon({
          points: this.poly,
          strokeColor: '#b7b7b7',
          strokeWidth: 3,
          fillColor: '#b8e54e'
        }).then((pol) => {
          this.polygon = pol
        })
      }

      if(!this.markers){
        var myLoc
        this.map.getMyLocation().then((location2) => {
          let myLat: any
          let myLng: any
          if(this.withFocus){
            myLat = this.focus[0]
            myLng = this.focus[1]
          }
          else{
            myLat = location2.latLng.lat
            myLng = location2.latLng.lng
          }
          myLoc = new GoogleMapsLatLng(myLat, myLng)

          this.map.animateCamera({
            'target': myLoc,
            'tilt': 0,
            'zoom': 15,
            'bearing': 0
          });
        }, (msg) => {

        });
      }else{
        setTimeout(()=>{
          this.animateMarkers()
        }, 500)

      }






      /*if(!this.clicky){
        this.map.setClickable(false);
      }*/
    });


  }
}

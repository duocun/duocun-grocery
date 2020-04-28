import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { LocationService } from '../location.service';
import { IPlace } from '../location.model';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss']
})
export class LocationListComponent implements OnInit {

  @Input() places: IPlace[];
  @Input() account;
  @Output() placeSeleted = new EventEmitter();

  address;
  onDestroy$ = new Subject();
  constructor(
    private locationSvc: LocationService
  ) { }

  ngOnInit() {
  }

  onSelectPlace(place: IPlace) {
    const self = this;
    const address = place.structured_formatting.main_text + ', ' + place.structured_formatting.secondary_text;
    if (place.type === 'suggest') { // 'suggest'
      this.locationSvc.reqLocationByAddress(address).pipe(takeUntil(this.onDestroy$)).subscribe(r => {
        if(r.code==='success'){
        const rs = this.locationSvc.getLocationFromGeocode(r.data[0]);
        self.placeSeleted.emit({address: address, location: rs});
        }else{
        self.placeSeleted.emit({address: address, location: []});
        }
      });
    } else { // history
      const rs = place.location;
      self.placeSeleted.emit({address: address, location: rs});
    }
  }
}

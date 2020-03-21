import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-charge-summary',
  templateUrl: './charge-summary.component.html',
  styleUrls: ['./charge-summary.component.scss']
})
export class ChargeSummaryComponent implements OnInit, OnChanges {
  @Input() charge;
  @Input() bShowBalance;

  constructor() {

  }

  ngOnInit() {
  }

  ngOnChanges(e) {
    if (e.charge && e.charge.currentValue) {
      this.charge = e.charge.currentValue;
    }
  }

  abs(n) {
    return Math.abs(n);
  }
}

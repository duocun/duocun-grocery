import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import * as moment from 'moment';
import { environment } from '../../../environments/environment.prod';

const WeekDayMap = ['日', '一', '二', '三', '四', '五', '六'];

@Component({
  selector: 'app-delivery-item',
  templateUrl: './delivery-item.component.html',
  styleUrls: ['./delivery-item.component.scss']
})
export class DeliveryItemComponent implements OnInit {

  @Input() delivery: any;
  @Output() change = new EventEmitter();
  quantity = 0;
  lang = environment.language;
  constructor(
  ) {

  }

  ngOnInit() {
    this.quantity = this.delivery && this.delivery.quantity ? this.delivery.quantity : 0;
  }

  onChange(e) {
    const quantity = e.quantity;
    const delivery = { ...this.delivery, ...{ quantity } };
    this.change.emit(delivery);
  }

  toWeek(date) {
    const m = moment(date);
    const n = m.weekday();
    return this.lang === 'en' ? m.format('dddd') : '周' + WeekDayMap[n % 7];
  }
}

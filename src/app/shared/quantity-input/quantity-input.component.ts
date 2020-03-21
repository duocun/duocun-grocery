import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-quantity-input',
  templateUrl: './quantity-input.component.html',
  styleUrls: ['./quantity-input.component.scss']
})
export class QuantityInputComponent implements OnInit {

  @Input() quantity: number;
  @Output() change = new EventEmitter();
  val = 0;
  constructor() {

  }

  ngOnInit() {
    this.val = this.quantity ? this.quantity : 0;
  }

  onChange(e) {
    this.val = e.target.value ? +e.target.value : 0;
    this.change.emit({quantity: this.val});
  }
  onIncrease() {
    this.change.emit({quantity: this.val + 1});
  }
  onDecrease() {
    if (this.val > 0) {
      this.change.emit({quantity: this.val - 1});
    }
  }
}

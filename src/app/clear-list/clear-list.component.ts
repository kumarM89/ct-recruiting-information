import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-clear-list',
  templateUrl: './clear-list.component.html',
  styleUrls: ['./clear-list.component.css']
})
export class ClearListComponent implements OnInit {
  lists: any[] = [{
    value: 'YearlyData', viewValue: 'YearlyData'
  }, {
    value: 'YearlyDataGrouped', viewValue: 'Yearly Data Grouped'
  }, {
    value: 'ToHireData', viewValue: 'To Hire Data'
  }];
  selectedList: string;
  progressValue: number = 10;

  constructor() { }

  ngOnInit() {
  }

}

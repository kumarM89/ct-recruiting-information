import { Component, OnInit } from '@angular/core';
import { sp } from '@pnp/sp';

@Component({
  selector: 'app-clear-list',
  templateUrl: './clear-list.component.html',
  styleUrls: ['./clear-list.component.css']
})
export class ClearListComponent implements OnInit {
  lists: any[] = [{
    value: 'Yearly Data', viewValue: 'Yearly Data'
  }, {
    value: 'Yearly Data Grouped', viewValue: 'Yearly Data Grouped'
  }, {
    value: 'To Hire Data', viewValue: 'To Hire Data'
  }];
  selectedList: string;
  progressValue: number = 0;

  constructor() { }

  ngOnInit() {

  }

  clearList() {
    let list = sp.web.lists.getByTitle(this.selectedList);
    list.items.getAll().then((items: any[]) => {
      let itemCount = items.length;
      items.forEach((item, index) => {
        list.items.getById(item.ID).delete().then(_ => {
          this.progressValue = index * 100 / itemCount;
          if (index == itemCount) {
            console.log("The list has been cleared.");
          }
        });
      });
    });
  }
}

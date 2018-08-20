import { Component, OnInit } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
  isParent: boolean;
  parentID: number;
  //show: boolean;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H', isParent: true, parentID: null},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He', isParent: false, parentID: 1},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B', isParent: true, parentID: null},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C', isParent: false, parentID: 5},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N', isParent: true, parentID: null},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O', isParent: false, parentID: 7},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F', isParent: false, parentID: 7},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li', isParent: false, parentID: 1},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be', isParent: false, parentID: 1},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne', isParent: true, parentID: null},
];

@Component({
  selector: 'app-site-content',
  templateUrl: './site-content.component.html',
  styleUrls: ['./site-content.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class SiteContentComponent implements OnInit {
  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = ELEMENT_DATA.sort(elm => elm.position);
  expandedElement: PeriodicElement;
  expandedDetailElement: PeriodicElement[];

  expandRow(row) {
    this.expandedElement = row;
    this.expandedDetailElement = this.dataSource.filter((ele) => ele.parentID == row.position);
    //this.expandedDetailElement.forEach(elm => elm.show = true);
  }
  constructor() { }

  ngOnInit() {
  }

}

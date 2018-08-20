import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { sp } from '@pnp/sp';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-filter-dashboard',
  templateUrl: './filter-dashboard.component.html',
  styleUrls: ['./filter-dashboard.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', display: 'none' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class FilterDashboardComponent implements OnInit {
  displayedColumns: string[] = ['serial', 'name', 'rank', 'location', 'alignment', 'actualUtil', 'projUtil', 'fullUtil'];
  rowData: any;
  dataSource: any;
  isLoadingResultsDone: boolean = false;
  selectedActual: string = "0";
  dateReported: Date;
  selectedProj: string = "0";
  actualUtilOptions: number[] = [];
  projectedUtilOptions: number[] = [];
  pageSize: number = 10;
  filters: any[] = [{
    name: null,
    rank: null,
    location: null,
    alignment: null
  }];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('TABLE') table: ElementRef;

  constructor() {
    this.actualUtilOptions = Array.apply(null, { length: 51 }).map(Number.call, Number);
    this.projectedUtilOptions = Array.apply(null, { length: 4 }).map(Number.call, Number);
  }

  ngOnInit() {
    sp.web.lists.getByTitle("Yearly Data").items.top(5000).get().then((items: any[]) => {
      this.rowData = items;
      this.dateReported = items[0].ReportDate;
      const ELEMENT_DATA = items.map((value) => {
        var obj = {};
        obj['name'] = value.Title;
        obj['rank'] = value.RankDescription;
        obj['location'] = value.WorkLocation;
        obj['alignment'] = value.IOWPRoster;
        for (let actualVal in this.actualUtilOptions) {
          obj['actualUtil' + actualVal] = (value['Week' + actualVal] + (value['Week' + (parseInt(actualVal) - 1)] || 0)) * 100 / (parseInt(actualVal) + 1);
        }

        for (let projVal in this.projectedUtilOptions) {
          obj['projUtil' + projVal] = (value['ForecastedWeek' + projVal] + (value['ForecastedWeek' + (parseInt(projVal) - 1)] || 0)) * 100 / (parseInt(projVal) + 1);
        }
        obj['fullUtil'] = value.Week0 * 100;
        obj['isChild'] = true;
        return obj;
      });

      this.dataSource = new MatTableDataSource(ELEMENT_DATA);
      this.dataSource.filterPredicate = (data: any, filtersJson: string) => {
        const matchFilter = [];
        const filters = JSON.parse(filtersJson);
        const columns = (<any>Object).values(data);
      
        filters.forEach(filter => {      
          const customFilter = [];
          columns.forEach(column => customFilter.push(column.toLowerCase().includes(filter)));
          matchFilter.push(customFilter.some(Boolean)); // OR
        });
      
        // Choose one
        return matchFilter.every(Boolean);
      };
      //this.dataSource.filterPredicate = (data, filter: string) => data[filter.split('|')[0]].trim().toLowerCase() == filter.split('|')[1];
      this.paginator.pageSizeOptions = [10, 15, 20, 50, items.length];
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.isLoadingResultsDone = true;
    });
  }

  // applyFilter(target: any) {
  //   this.dataSource.filter = target.name + '|' + target.value.trim().toLowerCase();
  //   if (this.dataSource.paginator) {
  //     this.dataSource.paginator.firstPage();
  //   }
  // }

  applyFilter() {
    const tableFilters = [];
    this.filters.forEach((filter) => {
      tableFilters.push({
        name: filter.name,
        rank: filter.rank,
        location: filter.location,
        alignment: filter.alignment
      });
    });
    this.dataSource.filter = JSON.stringify(tableFilters);
  }

  exportAsExcel(eventTarget: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, 'UtilizationDashboard.xlsx');
  }
}

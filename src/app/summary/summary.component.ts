import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import { animate, state, style, transition, trigger } from '@angular/animations';
import * as _ from 'lodash';
import { sp } from '@pnp/sp';
import * as XLSX from 'xlsx';
import { Router } from '@angular/router';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})

export class SummaryComponent implements OnInit {


  displayedColumns: string[] = ['serial', 'rankgroup', 'alignment', 'actualUtil', 'projUtil', 'fullUtil'];
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
    rankgroup: null,
    alignment: null
  }];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('TABLE') table: ElementRef;

  constructor(private router: Router) {
    this.actualUtilOptions = Array.apply(null, { length: 51 }).map(Number.call, Number);
    this.projectedUtilOptions = Array.apply(null, { length: 4 }).map(Number.call, Number);

  }
  selectRow(row) {
    this.router.navigate(['/dashboard', { RankGroup: row.rankgroup, Alignment: row.alignment || "" }]);
  }
  
  ngOnInit() {
    sp.web.lists.getByTitle("Yearly Data Grouped").items.top(5000).orderBy("Ordinal", true).get().then((items: any[]) => {
      this.rowData = items;
      this.dateReported = items[0].ReportDate;
      var groupedData = this.dataWithAlignment();

      this.dataSource = new MatTableDataSource(groupedData);
      this.dataSource.filterPredicate = (data: any, filtersJson: string) => {
        const matchFilter = [];
        const filters = JSON.parse(filtersJson);
        const columns = (<any>Object).keys(data);
        filters.forEach(filter => {
          const customFilter = [];
          columns.forEach(column =>
            customFilter.push(filter[column] == undefined || filter[column] == "" || data[column].toString().toLowerCase().includes(filter[column].toLowerCase()))
          );
          matchFilter.push(customFilter.every(Boolean));
        });
        return matchFilter.every(Boolean); // AND condition
      }
      this.paginator.pageSizeOptions = [10, 15, 20, 50, 100];
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.isLoadingResultsDone = true;
    });
  }

  toggleAlignment(event: Event) {
    if ((<any>event).checked) {
      this.displayedColumns.splice(2, 0, 'alignment');
      this.dataSource.data = this.dataWithAlignment();
    }
    else {
      this.displayedColumns.splice(2, 1);
      this.dataSource.data = this.dataWithoutAlignment();
    }
  }

  dataWithAlignment() {
    return _(this.rowData).groupBy('RankGroup').map((d, RankGroup) => {
      return _(d).groupBy('IOWPRoster').map((e, IOWPRoster) => {
        var newObj = {};
        newObj['rankgroup'] = RankGroup;
        newObj['alignment'] = IOWPRoster;
        for (let actualVal in this.actualUtilOptions) {
          newObj['actualUtil' + actualVal] =
            ((e.map(t => t['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / e.length) + (newObj['actualUtil' + (parseInt(actualVal) - 1)] || 0)) / (parseInt(actualVal) + 1);
        }

        for (let projVal in this.projectedUtilOptions) {
          newObj['projUtil' + projVal] =
            ((e.map(t => t['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / e.length) + (newObj['projUtil' + (parseInt(projVal) - 1)] || 0)) / (parseInt(projVal) + 1);
        }
        newObj['fullUtil'] = e.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / e.length;
        return newObj;
      }).value();
    }).flatten().value();
  }

  dataWithoutAlignment() {
    return _(this.rowData).groupBy('RankGroup').map((e, RankGroup) => {
      var newObj = {};
      newObj['rankgroup'] = RankGroup;
      for (let actualVal in this.actualUtilOptions) {
        newObj['actualUtil' + actualVal] =
          e.map(t => t['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / e.length;
      }

      for (let projVal in this.projectedUtilOptions) {
        newObj['projUtil' + projVal] =
          e.map(t => t['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / e.length;
      }
      newObj['fullUtil'] = e.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / e.length;
      return newObj;
    }).flatten().value();
  }

  applyFilter() {
    const tableFilters = [];
    this.filters.forEach((filter) => {
      tableFilters.push({
        rankgroup: filter.rankgroup,
        alignment: filter.alignment
      });
    });
    this.dataSource.filter = JSON.stringify(tableFilters);
  }

  getActualUtil() {
    return (this.dataSource.filteredData.map(t => t['actualUtil' + this.selectedActual]).reduce((acc, value) => acc + value, 0)) / this.dataSource.filteredData.length;
  }

  getProjUtil() {
    return (this.dataSource.filteredData.map(t => t['projUtil' + this.selectedProj]).reduce((acc, value) => acc + value, 0)) / this.dataSource.filteredData.length;
  }

  getFullUtil() {
    return (this.dataSource.filteredData.map(t => t['fullUtil']).reduce((acc, value) => acc + value, 0)) / this.dataSource.filteredData.length;
  }

  exportAsExcel(eventTarget: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.table.nativeElement);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, 'UtilizationDashboard.xlsx');
  }
}

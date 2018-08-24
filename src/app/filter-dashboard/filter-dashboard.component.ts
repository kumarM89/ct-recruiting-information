import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { sp } from '@pnp/sp';
import * as XLSX from 'xlsx';
import * as _ from 'lodash';


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
  displayedColumns: string[] = ['serial', 'rankGroup', 'alignment', 'location', 'actualUtil', 'projUtil', 'fullUtil'];
  rowData: any;
  dataSource: any;
  dataSourceComparables: any;
  dataSourceTotal: any;
  isLoadingResultsDone: boolean = false;
  selectedActual: string = "0";
  selectedActualComparable: string = "0";
  selectedActualTotal: string = "0";
  dateReported: Date;
  selectedProj: string = "0";
  selectedProjComparable: string = "0";
  selectedProjTotal: string = "0";
  actualUtilOptions: number[] = [];
  projectedUtilOptions: number[] = [];
  pageSize: number = 10;
  filters: any[] = [{
    rankGroup: null,
    location: null,
    alignment: null
  }];
  rankGroups: any[];
  alignments: any[];
  locations: any[];

  @ViewChild('sPaginator') sPaginator: MatPaginator;
  @ViewChild('cPaginator') cPaginator: MatPaginator;
  @ViewChild('sTABLE') sTable: ElementRef;
  @ViewChild('cTABLE') cTable: ElementRef;

  constructor(private route: ActivatedRoute, private router: Router) {
    this.actualUtilOptions = Array.apply(null, { length: 51 }).map(Number.call, Number);
    this.projectedUtilOptions = Array.apply(null, { length: 4 }).map(Number.call, Number);
  }

  ngOnInit() {
    sp.web.lists.getByTitle("Yearly Data").items.orderBy("RankGroup", true).getAll().then((items: any[]) => {
      this.rowData = items;
      this.rankGroups = items.map(item => { return { value: item.RankGroup, viewValue: item.RankGroup } }).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i);
      this.alignments = items.map(item => { return { value: item.IOWPRoster, viewValue: item.IOWPRoster } }).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i);
      this.locations = items.map(item => { return { value: item.WorkLocation, viewValue: item.WorkLocation.split(',')[0] } }).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i);

      this.dateReported = items[0].ReportDate;

      const ELEMENT_DATA = _(this.rowData).groupBy('RankGroup').map((d, RankGroup) => {
        return _(d).groupBy('IOWPRoster').map((e, IOWPRoster) => {
          return _(e).groupBy('WorkLocation').map((k, WorkLocation) => {
            var newObj = {};
            newObj['rankGroup'] = RankGroup;
            newObj['alignment'] = IOWPRoster;
            newObj['alignmentGroup'] = k[0].Grouping;
            newObj['competency'] = k[0].CompetencyName;
            newObj['location'] = WorkLocation
            for (let actualVal in this.actualUtilOptions) {
              newObj['actualUtil' + actualVal] =
                ((k.map(t => t['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / k.length) + (newObj['actualUtil' + (parseInt(actualVal) - 1)] || 0)) / (parseInt(actualVal) + 1);
            }
            for (let projVal in this.projectedUtilOptions) {
              newObj['projUtil' + projVal] =
                ((k.map(t => t['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / k.length) + (newObj['projUtil' + (parseInt(projVal) - 1)] || 0)) / (parseInt(projVal) + 1);
            }
            newObj['fullUtil'] = k.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / k.length;
            return newObj;
          }).value();
        }).flatten().value();
      }).flatten().value();

      this.dataSource = new MatTableDataSource(ELEMENT_DATA);
      this.dataSource.filterPredicate = (data: any, filtersJson: string) => {
        const matchFilter = [];
        const filters = JSON.parse(filtersJson);
        const columns = (<any>Object).keys(data);
        filters.forEach(filter => {
          const customFilter = [];
          columns.forEach(column =>
            customFilter.push(filter[column] == undefined || filter[column] == "" || data[column].toString().toLowerCase() == filter[column].toLowerCase())
          );
          matchFilter.push(customFilter.every(Boolean));
        });
        return matchFilter.every(Boolean); // AND condition
      }

      this.dataSourceComparables = new MatTableDataSource(ELEMENT_DATA);
      this.dataSourceComparables.filterPredicate = (data: any, filtersJson: string) => {
        const matchFilter = [];
        const filters = JSON.parse(filtersJson);
        filters.forEach(filter => {
          const customFilter = [];
          customFilter.push(filter.rankGroup && data.rankGroup.trim().toLowerCase() == filter.rankGroup.trim().toLowerCase()
            && filter.alignment && data.alignment.trim().toLowerCase() == filter.alignment.trim().toLowerCase()
            && filter.location && data.location.trim().toLowerCase() != filter.location.trim().toLowerCase());
          matchFilter.push(customFilter.every(Boolean));
        });
        return matchFilter.every(Boolean);
      }

      this.dataSourceTotal = new MatTableDataSource(ELEMENT_DATA);
      this.dataSourceTotal.filterPredicate = (data: any, filtersJson: string) => {
        const matchFilter = [];
        const filters = JSON.parse(filtersJson);
        filters.forEach(filter => {
          const customFilter = [];
          customFilter.push(filter.rankGroup && data.rankGroup.trim().toLowerCase() == filter.rankGroup.trim().toLowerCase()
            && filter.alignment && data.alignment.trim().toLowerCase() == filter.alignment.trim().toLowerCase()
            && filter.location && data.location.trim().toLowerCase() != filter.location.trim().toLowerCase());
          matchFilter.push(customFilter.every(Boolean));
        });
        return matchFilter.every(Boolean);
      }

      this.isLoadingResultsDone = true;
      setTimeout(() => {
        this.sPaginator.pageSizeOptions = [10, 15, 20, 50, items.length];
        this.dataSource.paginator = this.sPaginator;
        this.cPaginator.pageSizeOptions = [10, 15, 20, 50, items.length];
        this.dataSourceComparables.paginator = this.cPaginator;
      });
      // this.route
      //   .params
      //   .subscribe(params => {
      //     this.filters.forEach((filter) => {
      //       filter.rankGroup = params['RankGroup'] || "";
      //       filter.alignment = params['Alignment'] || "";
      //     });
      //     this.applyFilter();
      //   });
    });
  }

  getActualUtil(rowType: string) {
    return rowType == 'specific'
      ? (this.dataSource.filteredData.map(t => t['actualUtil' + this.selectedActual]).reduce((acc, value) => acc + value, 0)) / this.dataSource.filteredData.length
      : (this.dataSourceComparables.filteredData.map(t => t['actualUtil' + this.selectedActualComparable]).reduce((acc, value) => acc + value, 0)) / this.dataSourceComparables.filteredData.length;
  }

  getProjUtil(rowType: string) {
    return rowType == 'specific'
      ? (this.dataSource.filteredData.map(t => t['projUtil' + this.selectedProj]).reduce((acc, value) => acc + value, 0)) / this.dataSource.filteredData.length
      : (this.dataSourceComparables.filteredData.map(t => t['projUtil' + this.selectedProjComparable]).reduce((acc, value) => acc + value, 0)) / this.dataSourceComparables.filteredData.length;
  }

  getFullUtil(rowType: string) {
    return rowType == 'specific'
      ? (this.dataSource.filteredData.map(t => t['fullUtil']).reduce((acc, value) => acc + value, 0)) / this.dataSource.filteredData.length
      : (this.dataSourceComparables.filteredData.map(t => t['fullUtil']).reduce((acc, value) => acc + value, 0)) / this.dataSourceComparables.filteredData.length;
  }

  applyFilter() {
    const tableFilters = [];
    this.filters.forEach((filter) => {
      tableFilters.push({
        rankGroup: filter.rankGroup,
        location: filter.location,
        alignment: filter.alignment
      });
    });
    this.dataSource.filter = JSON.stringify(tableFilters);
    this.dataSourceComparables.filter = JSON.stringify(tableFilters);
    this.dataSourceTotal.data = this.generateTotalTable(JSON.stringify(tableFilters));
  }

  generateTotalTable(tableFilters: any) {
    const tableData = [];
    const filters = JSON.parse(tableFilters);
    filters.forEach(filter => {
      var obj = {};
      // Alignment Grouping Data Row
      obj['rankGroup'] = filter.rankGroup;
      obj['alignment'] = 'All ' + this.rowData.filter((v, i) => { return v.IOWPRoster == filter.alignment })
        .map(item => item.Grouping).filter((v, i, a) => a.indexOf(v) == i).shift();
      obj['location'] = 'All Locations';
      const filteredItems = this.rowData.filter((v, i) => { return v.RankGroup == filter.rankGroup && v.Grouping == obj['alignment'] })
      for (let actualVal in this.actualUtilOptions) {
        obj['actualUtil' + actualVal] = ((filteredItems.map(item => item['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredItems.length) + (obj['actualUtil' + (parseInt(actualVal) - 1)] || 0)) / (parseInt(actualVal) + 1);
      }
      for (let projVal in this.projectedUtilOptions) {
        obj['projUtil' + projVal] = ((filteredItems.map(item => item['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredItems.length) + (obj['projUtil' + (parseInt(projVal) - 1)] || 0)) / (parseInt(projVal) + 1);
      }
      obj['fullUtil'] = filteredItems.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / filteredItems.length;
      tableData.push(obj);

      // Competency Data Row
      obj = {};
      obj['rankGroup'] = filter.rankGroup;
      obj['alignment'] = 'All ' + this.rowData.filter((v, i) => { return v.IOWPRoster == filter.alignment })
        .map(item => item.CompetencyName).filter((v, i, a) => a.indexOf(v) == i).shift();
      obj['location'] = 'All Locations';
      const filteredCompetencyItems = this.rowData.filter((v, i) => { return v.RankGroup == filter.rankGroup && v.CompetencyName == obj['alignment'] })
      for (let actualVal in this.actualUtilOptions) {
        obj['actualUtil' + actualVal] = ((filteredCompetencyItems.map(item => item['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredCompetencyItems.length) + (obj['actualUtil' + (parseInt(actualVal) - 1)] || 0)) / (parseInt(actualVal) + 1);
      }
      for (let projVal in this.projectedUtilOptions) {
        obj['projUtil' + projVal] = ((filteredCompetencyItems.map(item => item['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredCompetencyItems.length) + (obj['projUtil' + (parseInt(projVal) - 1)] || 0)) / (parseInt(projVal) + 1);
      }
      obj['fullUtil'] = filteredCompetencyItems.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / filteredCompetencyItems.length;
      tableData.push(obj);

      // All Ranks Data Row
      obj = {};
      obj['rankGroup'] = 'All Ranks';
      obj['alignment'] = 'All ' + this.rowData.filter((v, i) => { return v.IOWPRoster == filter.alignment })
        .map(item => item.CompetencyName).filter((v, i, a) => a.indexOf(v) == i).shift();
      obj['location'] = 'All Locations';
      const filteredRanksItems = this.rowData.filter((v, i) => { return v.CompetencyName == obj['alignment'] })
      for (let actualVal in this.actualUtilOptions) {
        obj['actualUtil' + actualVal] = ((filteredRanksItems.map(item => item['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredRanksItems.length) + (obj['actualUtil' + (parseInt(actualVal) - 1)] || 0)) / (parseInt(actualVal) + 1);
      }
      for (let projVal in this.projectedUtilOptions) {
        obj['projUtil' + projVal] = ((filteredRanksItems.map(item => item['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredRanksItems.length) + (obj['projUtil' + (parseInt(projVal) - 1)] || 0)) / (parseInt(projVal) + 1);
      }
      obj['fullUtil'] = filteredRanksItems.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / filteredRanksItems.length;
      tableData.push(obj);
    });
    return tableData;
  }

  exportAsExcel(eventTarget: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(this.sTable.nativeElement);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    /* save to file */
    XLSX.writeFile(wb, 'UtilizationDashboard.xlsx');
  }
}

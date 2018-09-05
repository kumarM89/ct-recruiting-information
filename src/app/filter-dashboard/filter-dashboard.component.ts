import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatPaginator, MatTableDataSource } from '@angular/material';
import { animate, state, style, transition, trigger, group } from '@angular/animations';
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
  displayedColumns: string[] = ['serial', 'rankGroup', 'discipline', 'location', 'actualUtil', 'projUtil', 'fullUtil', 'headcount'];
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

  public filters: any[] = [{
    rankGroup: null,
    location: null,
    discipline: null,
    competency: null,
    group: null
  }];
  rankGroups: any[];
  disciplines: any[];
  locations: any[];
  locationsCopy: any[];
  competencies: any[];
  groups: any[];
  filteredGroups: any[];

  @ViewChild('sPaginator') sPaginator: MatPaginator;
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
      this.competencies = items.map(item => { return { value: item.CompetencyName, viewValue: item.CompetencyName, rankGroup: item.RankGroup } }).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i).sort((a, b) => a.viewValue.localeCompare(b.viewValue));
      this.groups = items.map(item => { return { value: item.Grouping, viewValue: item.Grouping, parent: item.CompetencyName, rankGroup: item.RankGroup } }).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i).sort((a, b) => a.viewValue.localeCompare(b.viewValue));
      this.disciplines = items.map(item => { return { value: item.IOWPRoster, viewValue: item.IOWPRoster, parent: item.Grouping, competency: item.CompetencyName, rankGroup:item.RankGroup } }).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i).sort((a, b) => a.viewValue.localeCompare(b.viewValue));
      this.locations = items.map(item => { return { value: item.WorkLocation, viewValue: item.WorkLocation.split(',')[0], parent: item.IOWPRoster, grouping: item.Grouping, competency: item.CompetencyName, rankGroup: item.RankGroup } }).sort((a, b) => a.viewValue.localeCompare(b.viewValue));
      //this.locations =  Object.assign([],items.map(item => { return { value: item.WorkLocation, viewValue: item.WorkLocation.split(',')[0], parent: item.IOWPRoster} }).filter((v, i, a) => a.findIndex(d => d.value == v.value) == i).sort((a, b) => a.viewValue.localeCompare(b.viewValue)));
      //this.locationsCopy = Object.assign([], this.locations);
      this.dateReported = items[0].ReportDate;



      const ELEMENT_DATA = _(this.rowData).groupBy('RankGroup').map((d, RankGroup) => {
        return _(d).groupBy('IOWPRoster').map((e, IOWPRoster) => {
          return _(e).groupBy('WorkLocation').map((k, WorkLocation) => {
            var newObj = {};
            newObj['rankGroup'] = RankGroup;
            newObj['discipline'] = IOWPRoster;
            newObj['group'] = k[0].Grouping;
            newObj['competency'] = k[0].CompetencyName;
            newObj['location'] = WorkLocation;

            var headCount = 0;

            for (let i = 0; i < k.length; i++) {
              headCount += parseFloat(k[i].Headcount);
            }

            newObj['headcount'] = Math.round(headCount);


            for (let actualVal in this.actualUtilOptions) {
              newObj['actualUtil' + actualVal] =
                ((k.map(t => t['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / k.length) + ((newObj['actualUtil' + (parseInt(actualVal) - 1)] || 0) * parseInt(actualVal))) / (parseInt(actualVal) + 1);
            }
            for (let projVal in this.projectedUtilOptions) {
              newObj['projUtil' + projVal] =
                ((k.map(t => t['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / k.length) + ((newObj['projUtil' + (parseInt(projVal) - 1)] || 0) * parseInt(projVal))) / (parseInt(projVal) + 1);
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
            customFilter.push(filter[column] == undefined || filter[column] == "" || (data[column] != null && data[column].toString().toLowerCase() == filter[column].toLowerCase()))
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
            && filter.discipline && data.discipline.trim().toLowerCase() == filter.discipline.trim().toLowerCase()
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
            && filter.discipline && data.discipline.trim().toLowerCase() == filter.discipline.trim().toLowerCase()
            && (!filter.location || data.location.trim().toLowerCase() != filter.location.trim().toLowerCase()));
          matchFilter.push(customFilter.every(Boolean));
        });
        return matchFilter.every(Boolean);
      }

      this.isLoadingResultsDone = true;
      setTimeout(() => {
        this.sPaginator.pageSizeOptions = [10, 15, 20, 50, items.length];
        this.dataSource.paginator = this.sPaginator;
      });
      // this.route
      //   .params
      //   .subscribe(params => {
      //     this.filters.forEach((filter) => {
      //       filter.rankGroup = params['RankGroup'] || "";
      //       filter.discipline = params['Discipline'] || "";
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

  applyFilter(isClearAll?: boolean) {

    const tableFilters = [];
    this.filters.forEach((filter) => 
    {
      tableFilters.push({
        rankGroup: filter.rankGroup,
        location: filter.location,
        discipline: filter.discipline,
        competency: filter.competency,
        group: filter.group
      });
    });

    this.dataSource.filter = JSON.stringify(tableFilters);
    this.dataSourceComparables.filter = JSON.stringify(tableFilters);
    this.dataSourceTotal.data = this.generateTotalTable(JSON.stringify(tableFilters));
    // var filteredLocations=[];
    // var locationsFiltered=_.uniq(_.map(this.dataSource.filteredData, 'location'));
    //  for(var l=0; l<locationsFiltered.length ;l++)
    //   filteredLocations.push(locationsFiltered[l].split(",")[0]);
    //   let dd =[];
    //   filteredLocations.forEach(x=>{
    //     if(isClearAll){
    //       this.locations = Object.assign([],this.locationsCopy);

    //     }
    //     else{
    //     dd.push(this.locations.find(y=>y.viewValue == x));

    //     }
    //   });

    //   if(!isClearAll){
    //   this.locations=[];
    //   dd.forEach(x=>{
    //     this.locations.push(x);
    //   });
    //}


  }



  generateTotalTable(tableFilters: any) {
    const tableData = [];
    const filters = JSON.parse(tableFilters);
    filters.forEach(filter => {
      var obj = {};
      var headCount = 0;

      obj['rankGroup'] = filter.rankGroup;
      obj['discipline'] = filter.discipline;
      obj['location'] = filter.location;
      const filtered_Items = this.rowData.filter((v, i) => { return v.RankGroup == filter.rankGroup && v.IOWPRoster == obj['discipline'] && v.CompetencyName == filter.competency && v.Grouping == filter.group })
      for (let actualVal in this.actualUtilOptions) {
        obj['actualUtil' + actualVal] = ((filtered_Items.map(item => item['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / filtered_Items.length) + ((obj['actualUtil' + (parseInt(actualVal) - 1)] || 0) * parseInt(actualVal))) / (parseInt(actualVal) + 1);
      }
      for (let projVal in this.projectedUtilOptions) {
        obj['projUtil' + projVal] = ((filtered_Items.map(item => item['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / filtered_Items.length) + ((obj['projUtil' + (parseInt(projVal) - 1)] || 0) * parseInt(projVal))) / (parseInt(projVal) + 1);
      }
      obj['fullUtil'] = filtered_Items.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / filtered_Items.length;


      for (let i = 0; i < filtered_Items.length; i++) {
        headCount += parseFloat(filtered_Items[i].Headcount);
      }
      obj['headcount'] = Math.round(headCount);
      tableData.push(obj);



      // Discipline Grouping Data Row
      obj = {};
      headCount = 0;
      obj['rankGroup'] = filter.rankGroup;
      obj['discipline'] = this.rowData.filter((v, i) => { return v.IOWPRoster == filter.discipline })
        .map(item => item.Grouping).filter((v, i, a) => a.indexOf(v) == i).shift();
      obj['location'] = 'All Locations';
      const filteredItems = this.rowData.filter((v, i) => { return v.RankGroup == filter.rankGroup && v.Grouping == obj['discipline'] })
      for (let actualVal in this.actualUtilOptions) {
        obj['actualUtil' + actualVal] = ((filteredItems.map(item => item['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredItems.length) + ((obj['actualUtil' + (parseInt(actualVal) - 1)] || 0) * parseInt(actualVal))) / (parseInt(actualVal) + 1);
      }
      for (let projVal in this.projectedUtilOptions) {
        obj['projUtil' + projVal] = ((filteredItems.map(item => item['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredItems.length) + ((obj['projUtil' + (parseInt(projVal) - 1)] || 0) * parseInt(projVal))) / (parseInt(projVal) + 1);
      }
      obj['fullUtil'] = filteredItems.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / filteredItems.length;
      for (let i = 0; i < filteredItems.length; i++) {
        headCount += parseFloat(filteredItems[i].Headcount);
      }
      obj['headcount'] = Math.round(headCount);

      tableData.push(obj);


      // Competency Data Row
      obj = {};
      headCount = 0;
      obj['rankGroup'] = filter.rankGroup;
      obj['discipline'] = this.rowData.filter((v, i) => { return v.IOWPRoster == filter.discipline })
        .map(item => item.CompetencyName).filter((v, i, a) => a.indexOf(v) == i).shift();
      obj['location'] = 'All Locations';
      const filteredCompetencyItems = this.rowData.filter((v, i) => { return v.RankGroup == filter.rankGroup && v.CompetencyName == obj['discipline'] })
      for (let actualVal in this.actualUtilOptions) {
        obj['actualUtil' + actualVal] = ((filteredCompetencyItems.map(item => item['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredCompetencyItems.length) + ((obj['actualUtil' + (parseInt(actualVal) - 1)] || 0) * parseInt(actualVal))) / (parseInt(actualVal) + 1);
      }
      for (let projVal in this.projectedUtilOptions) {
        obj['projUtil' + projVal] = ((filteredCompetencyItems.map(item => item['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredCompetencyItems.length) + ((obj['projUtil' + (parseInt(projVal) - 1)] || 0) * parseInt(projVal))) / (parseInt(projVal) + 1);
      }
      obj['fullUtil'] = filteredCompetencyItems.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / filteredCompetencyItems.length;

      for (let i = 0; i < filteredCompetencyItems.length; i++) {
        headCount += parseFloat(filteredCompetencyItems[i].Headcount);
      }
      obj['headcount'] = Math.round(headCount);

      tableData.push(obj);

      // All Ranks Data Row
      obj = {};
      headCount = 0;
      obj['rankGroup'] = 'All Ranks';
      obj['discipline'] = this.rowData.filter((v, i) => { return v.IOWPRoster == filter.discipline })
        .map(item => item.CompetencyName).filter((v, i, a) => a.indexOf(v) == i).shift();
      obj['location'] = 'All Locations';
      const filteredRanksItems = this.rowData.filter((v, i) => { return v.CompetencyName == obj['discipline'] })
      for (let actualVal in this.actualUtilOptions) {
        obj['actualUtil' + actualVal] = ((filteredRanksItems.map(item => item['Week' + actualVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredRanksItems.length) + ((obj['actualUtil' + (parseInt(actualVal) - 1)] || 0) * parseInt(actualVal))) / (parseInt(actualVal) + 1);
      }
      for (let projVal in this.projectedUtilOptions) {
        obj['projUtil' + projVal] = ((filteredRanksItems.map(item => item['ForecastedWeek' + projVal]).reduce((acc, value) => acc + value, 0) * 100 / filteredRanksItems.length) + ((obj['projUtil' + (parseInt(projVal) - 1)] || 0) * parseInt(projVal))) / (parseInt(projVal) + 1);
      }
      obj['fullUtil'] = filteredRanksItems.map(t => t.Week0).reduce((acc, value) => acc + value, 0) * 100 / filteredRanksItems.length;

      for (let i = 0; i < filteredRanksItems.length; i++) {
        headCount += parseFloat(filteredRanksItems[i].Headcount);
      }
      obj['headcount'] = Math.round(headCount);

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

  btnClear() {
    this.route
      .params
      .subscribe(params => {
        this.filters.forEach((filter) => {
          filter.rankGroup = params['RankGroup'] || "";
          filter.discipline = params['Discipline'] || "";
          filter.location = params['Location'] || "";
          filter.competency = params['Competency'] || "";
          filter.group = params['Group'] || "";

        });
        this.applyFilter(true);
      });

  }

}

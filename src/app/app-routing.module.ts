import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SiteContentComponent } from './site-content/site-content.component';
import { ExcelUploadComponent } from './excel-upload/excel-upload.component';
import { FilterDashboardComponent } from './filter-dashboard/filter-dashboard.component';

const routes: Routes = [{
  path: 'content', component: SiteContentComponent
}, {
  path: 'dashboard', component: FilterDashboardComponent
}, {
  path: 'excelUpload', component: ExcelUploadComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SiteContentComponent } from './site-content/site-content.component';
import { ClearListComponent } from './clear-list/clear-list.component';
import { FilterDashboardComponent } from './filter-dashboard/filter-dashboard.component';
import { SummaryComponent } from './summary/summary.component';

const routes: Routes = [{
  path: 'content', component: SiteContentComponent
}, {
  path: 'dashboard', component: FilterDashboardComponent
}, {
  path: 'clearlist', component: ClearListComponent
}, {
  path: 'summary', component: SummaryComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

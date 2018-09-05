import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule, MatSidenavModule, MatIconModule, MatTableModule, MatCardModule, MatSelectModule, MatProgressSpinnerModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSlideToggleModule, MatProgressBarModule } from '@angular/material';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SiteContentComponent } from './site-content/site-content.component';
import { ExcelUploadComponent } from './excel-upload/excel-upload.component';
import { FilterDashboardComponent } from './filter-dashboard/filter-dashboard.component';
import { SummaryComponent } from './summary/summary.component';
import { ClearListComponent } from './clear-list/clear-list.component';
import { FilterGroup } from './filter-dashboard/filter-dashboard.component.pipe';

@NgModule({
  declarations: [
    AppComponent,
    SiteContentComponent,
    ExcelUploadComponent,
    FilterDashboardComponent,
    SummaryComponent,
    ClearListComponent,
    FilterGroup
 
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule, FormsModule,
    MatToolbarModule, MatSidenavModule, MatIconModule, MatTableModule, MatCardModule, MatSelectModule,
    MatProgressSpinnerModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSlideToggleModule, MatProgressBarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

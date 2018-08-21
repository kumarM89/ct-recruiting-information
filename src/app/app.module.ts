import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatToolbarModule, MatSidenavModule, MatIconModule, MatTableModule, MatCardModule, MatSelectModule, MatProgressSpinnerModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSlideToggleModule } from '@angular/material';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SiteContentComponent } from './site-content/site-content.component';
import { ExcelUploadComponent } from './excel-upload/excel-upload.component';
import { FilterDashboardComponent } from './filter-dashboard/filter-dashboard.component';
import { SummaryComponent } from './summary/summary.component';

@NgModule({
  declarations: [
    AppComponent,
    SiteContentComponent,
    ExcelUploadComponent,
    FilterDashboardComponent,
    SummaryComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule, FormsModule,
    MatToolbarModule, MatSidenavModule, MatIconModule, MatTableModule, MatCardModule, MatSelectModule,
    MatProgressSpinnerModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSlideToggleModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

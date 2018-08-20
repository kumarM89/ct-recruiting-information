import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterDashboardComponent } from './filter-dashboard.component';

describe('FilterDashboardComponent', () => {
  let component: FilterDashboardComponent;
  let fixture: ComponentFixture<FilterDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

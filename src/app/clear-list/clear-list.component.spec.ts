import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClearListComponent } from './clear-list.component';

describe('ClearListComponent', () => {
  let component: ClearListComponent;
  let fixture: ComponentFixture<ClearListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClearListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClearListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

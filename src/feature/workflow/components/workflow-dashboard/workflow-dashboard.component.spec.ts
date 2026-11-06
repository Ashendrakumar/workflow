import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowDashboardComponent } from './workflow-dashboard.component';

describe('WorkflowDashboardComponent', () => {
  let component: WorkflowDashboardComponent;
  let fixture: ComponentFixture<WorkflowDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

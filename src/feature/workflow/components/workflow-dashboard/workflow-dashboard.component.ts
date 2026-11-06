import { Component, computed, inject, signal } from '@angular/core';
import { HeaderComponent } from '../../../../app/components/header/header.component';
import { FormControl, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { WorkflowService } from '../../services/workflow.service';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-workflow-dashboard',
  imports: [HeaderComponent, ReactiveFormsModule, DatePipe],
  templateUrl: './workflow-dashboard.component.html',
  styleUrl: './workflow-dashboard.component.scss',
})
export class WorkflowDashboardComponent {
  query = signal('');
  showDialog = signal(false);
  private readonly svc = inject(WorkflowService);
  private readonly router = inject(Router)

  name = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(60),
    ],
  });

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.svc
      .workFlow()
      .filter((wf) => wf.name.toLowerCase().includes(q));
  });

  openDialog() {
    this.name.reset('');
    this.showDialog.set(true);
  }

  create() {
    this.name.markAllAsTouched();
    if (this.name.value.trim() === '' || this.name.invalid) return;
    const wf = this.svc.create(this.name.value);
    this.closeDialog();
    console.log(wf.id)
    this.router.navigate(['workflow', wf.id]);
  }

  reset(){
    this.name.reset('');
    this.name.markAsUntouched();
    this.showDialog.set(false);
  }

  closeDialog() {
    this.showDialog.set(false);
  }

  remove(id:string){
    this.svc.remove(id)
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Employee } from '../models/employee.model';
import { Employeeservice } from '../employeeservice';

@Component({
  selector: 'app-employees',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './employees.html',
  styleUrl: './employees.css',
})
export class Employees implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(Employeeservice);

  employeeId: number | null = null;
  isEditMode = false;
  isViewMode = false;
  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    department: ['', Validators.required],
    role: ['', Validators.required],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const isEditRoute = this.route.snapshot.url.some((segment) => segment.path === 'edit');

    if (idParam && isEditRoute) {
      const id = Number(idParam);
      if (!Number.isNaN(id)) {
        this.isEditMode = true;
        this.employeeId = id;
        this.loadEmployeeForEdit(id);
      }
    }
  }

  loadEmployeeForEdit(id: number): void {
    this.loading = true;
    this.error = '';
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
        this.form.patchValue({
          name: employee.name,
          phone: employee.phone,
          address: employee.address,
          department: employee.department,
          role: employee.role,
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = this.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  setViewMode(readonly: boolean): void {
    this.isViewMode = readonly;
    if (readonly) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const employee = this.form.getRawValue() as Employee;
    if (this.isEditMode && this.employeeId != null) {
      this.updateEmployee(this.employeeId, employee);
    } else {
      this.createEmployee(employee);
    }
  }

  createEmployee(employee: Employee): void {
    this.loading = true;
    this.error = '';
    this.employeeService.createEmployee(employee).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = this.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  updateEmployee(id: number, employee: Employee): void {
    this.loading = true;
    this.error = '';
    this.employeeService.updateEmployee(id, { ...employee, id }).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/employees', id]);
      },
      error: (err) => {
        this.error = this.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  onCancel(): void {
    if (this.employeeId != null) {
      this.router.navigate(['/employees', this.employeeId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  private getErrorMessage(err: { message?: string; status?: number }): string {
    if (err.status === 0) {
      return 'Cannot reach API. Is json-server running on port 8001?';
    }
    return err.message ?? 'Request failed';
  }
}

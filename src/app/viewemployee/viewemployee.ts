import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Employee } from '../models/employee.model';
import { Employeeservice } from '../employeeservice';

@Component({
  selector: 'app-viewemployee',
  imports: [RouterLink],
  templateUrl: './viewemployee.html',
  styleUrl: './viewemployee.css',
})
export class Viewemployee implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly employeeService = inject(Employeeservice);

  employee: Employee | null = null;
  loading = false;
  error = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isNaN(id)) {
        this.loadEmployee(id);
      }
    });
  }

  loadEmployee(id: number): void {
    this.loading = true;
    this.error = '';
    this.employee = null;
    this.employeeService.getEmployeeById(id).subscribe({
      next: (employee) => {
        this.employee = employee;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  onEdit(): void {
    const id = this.employee?.id;
    if (id != null) {
      this.router.navigate(['/employees', id, 'edit']);
    }
  }

  onDelete(): void {
    const id = this.employee?.id;
    if (id != null && confirm('Delete this employee?')) {
      this.deleteEmployee(id);
    }
  }

  deleteEmployee(id: number): void {
    this.loading = true;
    this.error = '';
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.error = this.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  private getErrorMessage(err: { message?: string; status?: number }): string {
    if (err.status === 0) {
      return 'Cannot reach API. Is json-server running on port 8001?';
    }
    return err.message ?? 'Request failed';
  }
}

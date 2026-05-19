import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Employee } from '../models/employee.model';
import { Employeeservice } from '../employeeservice';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly employeeService = inject(Employeeservice);
  private readonly router = inject(Router);

  employees: Employee[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.loading = true;
    this.error = '';
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.getErrorMessage(err);
        this.loading = false;
      },
    });
  }

  onAddEmployee(): void {
    this.router.navigate(['/employees/new']);
  }

  onViewEmployee(id: number): void {
    this.router.navigate(['/employees', id]);
  }

  onDeleteEmployee(id: number): void {
    if (confirm('Delete this employee?')) {
      this.deleteEmployee(id);
    }
  }

  deleteEmployee(id: number): void {
    this.loading = true;
    this.error = '';
    this.employeeService.deleteEmployee(id).subscribe({
      next: () => this.loadEmployees(),
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

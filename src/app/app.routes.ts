import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Employees } from './employees/employees';
import { Viewemployee } from './viewemployee/viewemployee';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'employees/new', component: Employees },
  { path: 'employees/:id/edit', component: Employees },
  { path: 'employees/:id', component: Viewemployee },
];

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompParentComponent } from './components/comp-parent/comp-parent.component';
import { CompChild1Component } from './components/comp-child1/comp-child1.component';
import { CompChild2Component } from './components/comp-child2/comp-child2.component';
import { ServService } from './services/serv.service';
import { API_URL1, API_URL2 } from './token/token';

@NgModule({
  declarations: [CompParentComponent, CompChild1Component, CompChild2Component],
  imports: [
    CommonModule
  ],
  providers: [
    // { provide: API_URL2, useClass: ServService },
    // { provide: API_URL1, useExisting: API_URL2 },
    // { provide: ServService, useExisting: ServService },
  ],
  exports: [CompParentComponent]
})
export class InjectTestModule { }

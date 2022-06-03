import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProvidePropertyDefValueDirective } from './directives/provide-property-def-value.directive';
import { RegisterPropertyDefService } from './services/register-property-def.service';
import { DynamicTableComponent } from './components/dynamic-table/dynamic-table.component';



@NgModule({
  declarations: [DynamicTableComponent, ProvidePropertyDefValueDirective],
  imports: [
    CommonModule,
  ],
  providers: [RegisterPropertyDefService],
  exports: [DynamicTableComponent, ProvidePropertyDefValueDirective]
})
export class DynamicTableModule { }

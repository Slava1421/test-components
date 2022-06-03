import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HoneyCellOutlet, HoneyHeaderRow, HoneyHeaderRowDef, HoneyNoDataRow, HoneyRow, HoneyRowDef } from './directives/row';
import { HoneyCell, HoneyCellDef, HoneyColumnDef, HoneyHeaderCell, HoneyHeaderCellDef } from './directives/cell';
import { HoneyRecycleRows, HoneyTable, DataRowOutlet, HeaderRowOutlet, NoDataRowOutlet } from './components/table/table.component';


const EXPORTED_DECLARATIONS = [
  HoneyTable,
  HoneyRowDef,
  HoneyCellDef,
  HoneyCellOutlet,
  HoneyHeaderCellDef,
  HoneyColumnDef,
  HoneyCell,
  HoneyRow,
  HoneyHeaderCell,
  HoneyHeaderRow,
  HoneyHeaderRowDef,
  DataRowOutlet,
  HeaderRowOutlet,
  HoneyNoDataRow,
  HoneyRecycleRows,
  NoDataRowOutlet,
];

@NgModule({
  exports: EXPORTED_DECLARATIONS,
  declarations: EXPORTED_DECLARATIONS,
  imports: [CommonModule],
})
export class TableModule { }

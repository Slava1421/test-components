import {
  ContentChild,
  Directive,
  ElementRef,
  Inject,
  Input,
  Optional,
  TemplateRef,
} from '@angular/core';
import { HONEY_TABLE } from '../shared/tokens';

export interface CellDef {
  template: TemplateRef<any>;
}

@Directive({selector: '[honeyCellDef]'})
export class HoneyCellDef implements CellDef {
  constructor(public template: TemplateRef<any>) {}
}

@Directive({selector: '[honeyHeaderCellDef]'})
export class HoneyHeaderCellDef implements CellDef {
  constructor(/** @docs-private */ public template: TemplateRef<any>) {}
}

@Directive({
  selector: '[honeyColumnDef]',
  inputs: ['sticky'],
  providers: [{provide: 'MAT_SORT_HEADER_COLUMN_DEF', useExisting: HoneyColumnDef}],
})
export class HoneyColumnDef {
  @Input('honeyColumnDef')
  get name(): string {
    return this._name;
  }
  set name(name: string) {
    this._setNameInput(name);
  }
  protected _name: string;

  @ContentChild(HoneyCellDef) cell: HoneyCellDef;

  @ContentChild(HoneyHeaderCellDef) headerCell: HoneyHeaderCellDef;

  cssClassFriendlyName: string;

  _columnCssClassName: string[];

  constructor(@Inject(HONEY_TABLE) @Optional() public _table?: any) {
  }

  protected _updateColumnCssClassName() {
    this._columnCssClassName = [`honey-column-${this.cssClassFriendlyName}`];
  }

  protected _setNameInput(value: string) {
    if (value) {
      this._name = value;
      this.cssClassFriendlyName = value.replace(/[^a-z0-9_-]/gi, '-');
      this._updateColumnCssClassName();
    }
  }
}

export class BaseHoneyCell {
  constructor(columnDef: HoneyColumnDef, elementRef: ElementRef) {
    elementRef.nativeElement.classList.add(...columnDef._columnCssClassName);
  }
}

@Directive({
  selector: 'honey-header-cell, th[honey-header-cell]',
  host: {
    'class': 'honey-header-cell',
    'role': 'columnheader',
  },
})
export class HoneyHeaderCell extends BaseHoneyCell {
  constructor(columnDef: HoneyColumnDef, elementRef: ElementRef) {
    super(columnDef, elementRef);
  }
}

@Directive({
  selector: 'honey-cell, td[honey-cell]',
  host: {
    'class': 'honey-cell',
  },
})
export class HoneyCell extends BaseHoneyCell {
  constructor(columnDef: HoneyColumnDef, elementRef: ElementRef) {
    super(columnDef, elementRef);
  }
}

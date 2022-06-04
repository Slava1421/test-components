import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  ViewEncapsulation,
  Inject,
  Optional,
  OnChanges,
  SimpleChanges,
  IterableDiffer,
  IterableDiffers,
  IterableChanges,
} from '@angular/core';
import { HONEY_TABLE } from '../shared/tokens';
import { HoneyCellDef, HoneyColumnDef } from './cell';

export const HONEY_ROW_TEMPLATE = `<ng-container honeyCellOutlet></ng-container>`;

@Directive()
export abstract class BaseRowDef {
  columns: Iterable<string>;
  protected _columnsDiffer: IterableDiffer<any>;
  constructor(
    public template: TemplateRef<any>,
    public vc: ViewContainerRef,
    protected _differs: IterableDiffers,
  ) { }
  
  getColumnsDiff(): IterableChanges<any> | null {
    return this._columnsDiffer.diff(this.columns);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Create a new columns differ if one does not yet exist. Initialize it based on initial value
    // of the columns property or an empty array if none is provided.
    if (!this._columnsDiffer) {
      const columns = (changes['columns'] && changes['columns'].currentValue) || [];
      this._columnsDiffer = this._differs.find(columns).create();
      this._columnsDiffer.diff(columns);
    }
  }

  extractCellTemplate(column: HoneyColumnDef): TemplateRef<any> {
    if (this instanceof HoneyHeaderRowDef) {
      return column.headerCell.template;
    } else {
      return column.cell.template;
    }
  }
}

@Directive({
  selector: '[honeyHeaderRowDef]',
  inputs: ['columns: honeyHeaderRowDef', 'sticky: honeyHeaderRowDefSticky'],
})
export class HoneyHeaderRowDef extends BaseRowDef implements OnChanges {
  constructor(
    template: TemplateRef<any>,
    vc: ViewContainerRef,
    _differs: IterableDiffers,
    @Inject(HONEY_TABLE) @Optional() public _table?: any,
  ) {
    super(template, vc, _differs)
  }
  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
  }
}

@Directive({
  selector: '[honeyRowDef]',
  inputs: ['columns: honeyRowDefColumns', 'when: honeyRowDefWhen'],
})
export class HoneyRowDef<T> extends BaseRowDef {

  constructor(
    template: TemplateRef<any>,
    vc: ViewContainerRef,
    _differs: IterableDiffers,
  ) {
    super(template, vc, _differs);
  }

  ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
  }
}

export interface HoneyCellOutletRowContext<T> {
  $implicit?: T;
  index?: number;
  count?: number;
  first?: boolean;
  last?: boolean;
  even?: boolean;
  odd?: boolean;
}

@Directive({ selector: '[honeyCellOutlet]' })
export class HoneyCellOutlet implements OnDestroy {
  context: any;
  static mostRecentCellOutlet: HoneyCellOutlet | null = null;

  constructor(public _viewContainer: ViewContainerRef) {
    HoneyCellOutlet.mostRecentCellOutlet = this;
  }

  ngOnDestroy() {
    if (HoneyCellOutlet.mostRecentCellOutlet === this) {
      HoneyCellOutlet.mostRecentCellOutlet = null;
    }
  }
}

@Component({
  selector: 'honey-header-row, tr[honey-header-row]',
  template: HONEY_ROW_TEMPLATE,
  host: {
    'class': 'honey-header-row',
    'role': 'row',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class HoneyHeaderRow { }

@Component({
  selector: 'honey-row, tr[honey-row]',
  template: HONEY_ROW_TEMPLATE,
  host: {
    'class': 'honey-row',
    'role': 'row',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  encapsulation: ViewEncapsulation.None,
})
export class HoneyRow { }

@Directive({
  selector: 'ng-template[honeyNoDataRow]',
})
export class HoneyNoDataRow {
  _contentClassName = 'honey-no-data-row';
  constructor(public templateRef: TemplateRef<any>) { }
}

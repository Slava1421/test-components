import {
  AfterContentChecked,
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  ContentChildren,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  EventEmitter,
  HostBinding,
  Input,
  IterableDiffer,
  IterableDiffers,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
} from '@angular/core';
import {
  BaseRowDef,
  HoneyCellOutlet,
  HoneyCellOutletRowContext,
  HoneyHeaderRowDef,
  HoneyNoDataRow,
  HoneyRow,
  HoneyRowDef,
} from '../../directives/row';

import { HoneyColumnDef } from '../../directives/cell';
import { DataSource, isDataSource } from '../../shared/data-source';
import { HONEY_TABLE as HONEY_TABLE } from '../../shared/tokens';
import { _CoalescedStyleScheduler, _COALESCED_STYLE_SCHEDULER } from '../../services/coalesced-style-scheduler';
import { _ViewRepeater, _VIEW_REPEATER_STRATEGY } from '../../shared/view-repeater';
import {
  BehaviorSubject,
  isObservable,
  Observable,
  of as observableOf,
  Subject,
  Subscription
} from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: 'honey-table[recycleRows], table[honey-table]',
})
export class HoneyRecycleRows { }

export interface RowOutlet {
  viewContainer: ViewContainerRef;
}

export type HoneyTableDataSourceInput<T> = readonly T[] | DataSource<T> | Observable<readonly T[]>;

@Directive({ selector: '[rowOutlet]' })
export class DataRowOutlet implements RowOutlet {
  constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) { }
}

@Directive({ selector: '[headerRowOutlet]' })
export class HeaderRowOutlet implements RowOutlet {
  constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) { }
}

@Directive({ selector: '[noDataRowOutlet]' })
export class NoDataRowOutlet implements RowOutlet {
  constructor(public viewContainer: ViewContainerRef, public elementRef: ElementRef) { }
}

export interface RowContext<T> extends HoneyCellOutletRowContext<T> { }

export interface RenderRow<T> {
  data: T;
  dataIndex: number;
  rowDef: HoneyRowDef<T>;
}

@Component({
  selector: 'honey-table, table[honey-table]',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  host: { 'class': 'honey-table' },
  providers: [
    { provide: HONEY_TABLE, useExisting: HoneyTable },
  ],
  encapsulation: ViewEncapsulation.None
})
export class HoneyTable<T> implements AfterContentInit, OnInit, AfterContentChecked {

  @Input()
  get dataSource(): HoneyTableDataSourceInput<T> {
    return this._dataSource;
  }
  set dataSource(dataSource: HoneyTableDataSourceInput<T>) {
    if (this._dataSource !== dataSource) {
      this._switchDataSource(dataSource);
    }
  }

  private _dataSource: HoneyTableDataSourceInput<T>;
  private _renderChangeSubscription: Subscription | null;
  private _columnDefsByName = new Map<string, HoneyColumnDef>();

  private readonly _onDestroy = new Subject<void>();
  private _renderRows: RenderRow<T>[];
  protected _data: readonly T[];

  private _dataDiffer: IterableDiffer<RenderRow<T>>;

  readonly viewChange = new BehaviorSubject<{ start: number; end: number }>({
    start: 0,
    end: Number.MAX_VALUE,
  });

  @ViewChild(DataRowOutlet, { static: true }) _rowOutlet: DataRowOutlet;
  @ViewChild(HeaderRowOutlet, { static: true }) _headerRowOutlet: HeaderRowOutlet;
  @ViewChild(NoDataRowOutlet, { static: true }) _noDataRowOutlet: NoDataRowOutlet;

  @ContentChildren(HoneyColumnDef, { descendants: true }) _contentColumnDefs: QueryList<HoneyColumnDef>;
  @ContentChildren(HoneyRowDef, { descendants: true }) _contentRowDefs: QueryList<HoneyRowDef<T>>;
  @ContentChildren(HoneyHeaderRowDef, { descendants: true, }) _contentHeaderRowDefs: QueryList<HoneyHeaderRowDef>;
  @ContentChildren(HoneyRow, { descendants: true, }) ss: QueryList<HoneyRow>;
  @ContentChild(HoneyNoDataRow) _noDataRow: HoneyNoDataRow;

  @Output() readonly contentChanged = new EventEmitter<void>();

  cl(): void {
    console.log(this._contentRowDefs);
    const viewContainer = this._rowOutlet.viewContainer;
    for (let renderIndex = 0, count = viewContainer.length; renderIndex < count; renderIndex++) {
      const viewRef = viewContainer.get(renderIndex);
      // const context = viewRef.context;
      // context.count = count;
      // context.first = renderIndex === 0;
      // context.last = renderIndex === count - 1;
      // context.even = renderIndex % 2 === 0;
      // context.odd = !context.even;
    }
  }

  constructor(protected readonly _differs: IterableDiffers,) { }

  ngOnInit(): void {
    this._dataDiffer = this._differs.find([]).create((_i: number, dataRow: RenderRow<T>) => {
      return dataRow;
    });
  }

  ngAfterContentChecked() {
    this._renderUpdatedColumns();
  }

  ngAfterContentInit() {

    this._cacheColumnDefs();
    this._renderHeadRow();
    this._observeRenderChanges();

  }

  private _renderUpdatedColumns(): void {
    const columnsDiffReducer = (acc: boolean, def: BaseRowDef) => acc || !!def.getColumnsDiff();

    // Force re-render data rows if the list of column definitions have changed.
    const dataColumnsChanged = this._contentRowDefs.reduce(columnsDiffReducer, false);
    if (dataColumnsChanged) {
      this._dataDiffer.diff([]);
      this._rowOutlet.viewContainer.clear();
      this.renderRows();
    }

    // Force re-render header/footer rows if the list of column definitions have changed.
    const headerColumnsChanged = this._contentHeaderRowDefs.reduce(columnsDiffReducer, false);
    if (headerColumnsChanged) {
      if (this._headerRowOutlet.viewContainer.length > 0) {
        this._headerRowOutlet.viewContainer.clear();
      }

      this._renderHeadRow();
    }
  }

  private _cacheColumnDefs() {
    this._columnDefsByName.clear();
    this._contentColumnDefs.forEach(columnDef => {
      this._columnDefsByName.set(columnDef.name, columnDef);
    });
  }

  private _switchDataSource(dataSource: HoneyTableDataSourceInput<T>) {
    this._data = [];

    if (isDataSource(this.dataSource)) {
      this.dataSource.disconnect(this);
    }

    if (this._renderChangeSubscription) {
      this._renderChangeSubscription.unsubscribe();
      this._renderChangeSubscription = null;
    }

    this._rowOutlet.viewContainer.clear();
    this._dataSource = dataSource;
  }

  private _observeRenderChanges() {
    if (!this.dataSource) {
      return;
    }

    let dataStream: Observable<readonly T[]> | undefined;

    if (isDataSource(this.dataSource)) {
      dataStream = this.dataSource.connect(this);
    } else if (isObservable(this.dataSource)) {
      dataStream = this.dataSource;
    } else if (Array.isArray(this.dataSource)) {
      dataStream = observableOf(this.dataSource);
    }

    this._renderChangeSubscription = dataStream!
      .pipe(takeUntil(this._onDestroy))
      .subscribe(data => {
        this._data = data || [];
        this.renderRows();
      });
  }

  _renderHeadRow(): void {
    this.renderRow(this._headerRowOutlet, this._contentHeaderRowDefs.first, 0);
  }

  renderRows() {
    if (this._contentRowDefs) {
      this._renderRows = this._getAllRenderRows();
      this._renderRows.forEach(row => {
        this.renderRow(this._rowOutlet, row.rowDef, row.dataIndex, { $implicit: row.data });
      });
    }
  }

  private renderRow(
    outlet: RowOutlet,
    rowDef: BaseRowDef,
    index: number,
    context: RowContext<T> = {},
  ) {
    outlet.viewContainer.createEmbeddedView(rowDef.template, context, index);

    const cellTpls = this._getCellTemplates(rowDef);

    for (const cell of cellTpls) {
      HoneyCellOutlet.mostRecentCellOutlet._viewContainer.createEmbeddedView(cell, context);
    }
  }

  private _getCellTemplates(rowDef: BaseRowDef): TemplateRef<any>[] {
    if (!rowDef || !rowDef.columns) {
      return [];
    }
    return Array.from(rowDef.columns, columnId => {
      const column = this._columnDefsByName.get(columnId);
      const tpl = rowDef.extractCellTemplate(column!);

      return tpl;
    });
  }

  private _getAllRenderRows(): RenderRow<T>[] {
    const rowDefs: RenderRow<T>[] = [];

    this._data.forEach((data, i) => {
      const r = this._getRenderRowsForData(data, i);
      rowDefs.push(r);
    });

    return rowDefs;
  }

  private _getRenderRowsForData(
    data: T,
    dataIndex: number,
  ): RenderRow<T> {
    const rowDef = this._contentRowDefs.first;
    return { data, rowDef, dataIndex };
  }
}

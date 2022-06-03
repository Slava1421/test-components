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
  selector: 'honey-table[recycleRows], table[honey-table][recycleRows]',
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

export interface RowContext<T>
  extends HoneyCellOutletRowContext<T> { }

abstract class RowViewRef<T> extends EmbeddedViewRef<RowContext<T>> { }

export interface RenderRow<T> {
  data: T;
  dataIndex: number;
  rowDef: HoneyRowDef<T>;
}

@Component({
  selector: 'honey-table, table[honey-table]',
  // exportAs: 'honeyTable',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  host: { 'class': 'honey-table' },
  providers: [
    { provide: HONEY_TABLE, useExisting: HoneyTable },
  ],
  encapsulation: ViewEncapsulation.None
})
export class HoneyTable<T> implements AfterContentInit {
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
  @ContentChild(HoneyNoDataRow) _noDataRow: HoneyNoDataRow;

  @Output() readonly contentChanged = new EventEmitter<void>();

  ngAfterContentInit() {

    this._cacheColumnDefs();
    this.renderHeadRow();
    this._observeRenderChanges();
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

  renderHeadRow(): void {
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

  private renderRow(outlet: RowOutlet,
    rowDef: BaseRowDef,
    index: number,
    context: RowContext<T> = {},
  ) {
    outlet.viewContainer.createEmbeddedView(rowDef.template, context, index);

    for (const cell of this._getCellTemplates(rowDef)) {
      HoneyCellOutlet.mostRecentCellOutlet._viewContainer.createEmbeddedView(cell, context);
    }
  }

  private _getCellTemplates(rowDef: BaseRowDef): TemplateRef<any>[] {
    if (!rowDef || !rowDef.columns) {
      return [];
    }
    return Array.from(rowDef.columns, columnId => {
      const column = this._columnDefsByName.get(columnId);


      return rowDef.extractCellTemplate(column!);
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

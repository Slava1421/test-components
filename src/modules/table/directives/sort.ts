import {
  Directive,
  EventEmitter,
  Inject,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {Subject} from 'rxjs';
import { SortDirection } from '../components/sort/sort-header';
import { BooleanInput, coerceBooleanProperty } from '../shared/boolean-property';

export type SortHeaderArrowPosition = 'before' | 'after';

export interface MatSortable {
  id: string;
  start: SortDirection;
  disableClear: boolean;
}

export interface Sort {
  active: string;
  direction: SortDirection;
}

export interface MatSortDefaultOptions {
  disableClear?: boolean;
  arrowPosition?: SortHeaderArrowPosition;
}

export const MAT_SORT_DEFAULT_OPTIONS = new InjectionToken<MatSortDefaultOptions>(
  'MAT_SORT_DEFAULT_OPTIONS',
);

@Directive({
  selector: '[matSort]',
  exportAs: 'matSort',
  host: {'class': 'mat-sort'},
  inputs: ['disabled: matSortDisabled'],
})
export class MatSort implements  OnChanges, OnDestroy, OnInit
{
  sortables = new Map<string, MatSortable>();
  readonly _stateChanges = new Subject<void>();
  @Input('matSortActive') active: string;
  @Input('matSortStart') start: SortDirection = 'asc';
  @Input('matSortDirection')
  get direction(): SortDirection {
    return this._direction;
  }
  set direction(direction: SortDirection) {
    if (
      direction &&
      direction !== 'asc' &&
      direction !== 'desc'
    ) {
      // throw getSortInvalidDirectionError(direction);
    }
    this._direction = direction;
  }
  private _direction: SortDirection = '';

  @Input('matSortDisableClear')
  get disableClear(): boolean {
    return this._disableClear;
  }
  set disableClear(v: boolean) {
    this._disableClear = v;
  }
  private _disableClear: boolean;

  @Output('matSortChange') readonly sortChange: EventEmitter<Sort> = new EventEmitter<Sort>();

  constructor(
    @Optional()
    @Inject(MAT_SORT_DEFAULT_OPTIONS)
    private _defaultOptions?: MatSortDefaultOptions,
  ) {}

  register(sortable: MatSortable): void {
      if (!sortable.id) {
        // throw getSortHeaderMissingIdError();
      }

      if (this.sortables.has(sortable.id)) {
        // throw getSortDuplicateSortableIdError(sortable.id);
      }
    

    this.sortables.set(sortable.id, sortable);
  }

  /**
   * Unregister function to be used by the contained MatSortables. Removes the MatSortable from the
   * collection of contained MatSortables.
   */
  deregister(sortable: MatSortable): void {
    this.sortables.delete(sortable.id);
  }

  /** Sets the active sort id and determines the new sort direction. */
  sort(sortable: MatSortable): void {
    if (this.active != sortable.id) {
      this.active = sortable.id;
      this.direction = sortable.start ? sortable.start : this.start;
    } else {
      this.direction = this.getNextSortDirection(sortable);
    }

    this.sortChange.emit({active: this.active, direction: this.direction});
  }

  /** Returns the next sort direction of the active sortable, checking for potential overrides. */
  getNextSortDirection(sortable: MatSortable): SortDirection {
    if (!sortable) {
      return '';
    }

    // Get the sort direction cycle with the potential sortable overrides.
    const disableClear =
      sortable?.disableClear ?? this.disableClear ?? !!this._defaultOptions?.disableClear;
    let sortDirectionCycle = getSortDirectionCycle(sortable.start || this.start, disableClear);

    // Get and return the next direction in the cycle
    let nextDirectionIndex = sortDirectionCycle.indexOf(this.direction) + 1;
    if (nextDirectionIndex >= sortDirectionCycle.length) {
      nextDirectionIndex = 0;
    }
    return sortDirectionCycle[nextDirectionIndex];
  }

  ngOnInit() {
    // this._markInitialized();
  }

  ngOnChanges() {
    this._stateChanges.next();
  }

  ngOnDestroy() {
    this._stateChanges.complete();
  }
}

/** Returns the sort direction cycle to use given the provided parameters of order and clear. */
function getSortDirectionCycle(start: SortDirection, disableClear: boolean): SortDirection[] {
  let sortOrder: SortDirection[] = ['asc', 'desc'];
  if (start == 'desc') {
    sortOrder.reverse();
  }
  if (!disableClear) {
    sortOrder.push('');
  }

  return sortOrder;
}

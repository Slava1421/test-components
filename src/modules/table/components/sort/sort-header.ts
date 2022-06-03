
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  ViewEncapsulation,
} from '@angular/core';
import {merge, Subscription} from 'rxjs';
import { MatSort, MAT_SORT_DEFAULT_OPTIONS, SortHeaderArrowPosition } from '../../directives/sort';
import { BooleanInput, coerceBooleanProperty } from '../../shared/boolean-property';
export type SortDirection = 'asc' | 'desc' | '';
export type ArrowViewState = SortDirection | 'hint' | 'active';

export interface ArrowViewStateTransition {
  fromState?: ArrowViewState;
  toState?: ArrowViewState;
}

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

interface MatSortHeaderColumnDef {
  name: string;
}

@Component({
  selector: '[mat-sort-header]',
  exportAs: 'matSortHeader',
  templateUrl: './sort-header.html',
  styleUrls: ['./sort-header.scss'],
  host: {
    'class': 'mat-sort-header',
    '(click)': '_handleClick()',
    '(keydown)': '_handleKeydown($event)',
    '(mouseenter)': '_setIndicatorHintVisible(true)',
    '(mouseleave)': '_setIndicatorHintVisible(false)',
    '[attr.aria-sort]': '_getAriaSortAttribute()',
    '[class.mat-sort-header-disabled]': '_isDisabled()',
  },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  inputs: ['disabled'],
})
export class MatSortHeader implements MatSortable, OnDestroy, OnInit, AfterViewInit
{
  private _rerenderSubscription: Subscription;
  private _sortButton: HTMLElement;
  _showIndicatorHint: boolean = false;
  _viewState: ArrowViewStateTransition = {};
  _arrowDirection: SortDirection = '';
  _disableViewStateAnimation = false;

  @Input('mat-sort-header') id: string;
  @Input() arrowPosition: SortHeaderArrowPosition = 'after';
  @Input() start: SortDirection;
  @Input()
  get sortActionDescription(): string {
    return this._sortActionDescription;
  }
  set sortActionDescription(value: string) {
    this._updateSortActionDescription(value);
  }

  private _sortActionDescription: string = 'Sort';

  @Input()
  get disableClear(): boolean {
    return this._disableClear;
  }
  set disableClear(v: boolean) {
    this._disableClear = v;
  }
  private _disableClear: boolean;

  constructor(
    /**
     * @deprecated `_intl` parameter isn't being used anymore and it'll be removed.
     * @breaking-change 13.0.0
     */
    private _changeDetectorRef: ChangeDetectorRef,
    // `MatSort` is not optionally injected, but just asserted manually w/ better error.
    // tslint:disable-next-line: lightweight-tokens
    @Optional() public _sort: MatSort,
    @Inject('MAT_SORT_HEADER_COLUMN_DEF')
    @Optional()
    public _columnDef: MatSortHeaderColumnDef,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional()
    @Inject(MAT_SORT_DEFAULT_OPTIONS)
    defaultOptions?: MatSortDefaultOptions,
  ) {

    if (defaultOptions?.arrowPosition) {
      this.arrowPosition = defaultOptions?.arrowPosition;
    }

    this._handleStateChanges();
  }

  ngOnInit() {
    if (!this.id && this._columnDef) {
      this.id = this._columnDef.name;
    }

    // Initialize the direction of the arrow and set the view state to be immediately that state.
    this._updateArrowDirection();
    this._setAnimationTransitionState({
      toState: this._isSorted() ? 'active' : this._arrowDirection,
    });

    this._sort.register(this);

    this._sortButton = this._elementRef.nativeElement.querySelector('.mat-sort-header-container');
    this._updateSortActionDescription(this._sortActionDescription);
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    this._sort.deregister(this);
    this._rerenderSubscription.unsubscribe();
  }

  _setIndicatorHintVisible(visible: boolean) {
    // if (this._isDisabled() && visible) {
    //   return;
    // }

    this._showIndicatorHint = visible;

    if (!this._isSorted()) {
      this._updateArrowDirection();
      if (this._showIndicatorHint) {
        this._setAnimationTransitionState({fromState: this._arrowDirection, toState: 'hint'});
      } else {
        this._setAnimationTransitionState({fromState: 'hint', toState: this._arrowDirection});
      }
    }
  }

  _setAnimationTransitionState(viewState: ArrowViewStateTransition) {
    this._viewState = viewState || {};

    if (this._disableViewStateAnimation) {
      this._viewState = {toState: viewState.toState};
    }
  }

  _toggleOnInteraction() {
    this._sort.sort(this);

    if (this._viewState.toState === 'hint' || this._viewState.toState === 'active') {
      this._disableViewStateAnimation = true;
    }
  }

  _handleClick() {
    // if (!this._isDisabled()) {
    //   this._sort.sort(this);
    // }
  }

  // _handleKeydown(event: KeyboardEvent) {
  //   if (!this._isDisabled() && (event.keyCode === SPACE || event.keyCode === ENTER)) {
  //     event.preventDefault();
  //     this._toggleOnInteraction();
  //   }
  // }

  _isSorted() {
    return (
      this._sort.active == this.id &&
      (this._sort.direction === 'asc' || this._sort.direction === 'desc')
    );
  }

  _getArrowDirectionState() {
    return `${this._isSorted() ? 'active-' : ''}${this._arrowDirection}`;
  }

  _getArrowViewState() {
    const fromState = this._viewState.fromState;
    return (fromState ? `${fromState}-to-` : '') + this._viewState.toState;
  }

  _updateArrowDirection() {
    this._arrowDirection = this._isSorted() ? this._sort.direction : this.start || this._sort.start;
  }

  _isDisabled(): boolean {
    // return this._sort.disabled || this.disabled;
    return false;
  }

  _getAriaSortAttribute() {
    if (!this._isSorted()) {
      return 'none';
    }

    return this._sort.direction == 'asc' ? 'ascending' : 'descending';
  }

  _renderArrow() {
    // return !this._isDisabled() || this._isSorted();
  }

  private _updateSortActionDescription(newDescription: string) {
    if (this._sortButton) {
      // this._ariaDescriber?.removeDescription(this._sortButton, this._sortActionDescription);
      // this._ariaDescriber?.describe(this._sortButton, newDescription);
    }

    this._sortActionDescription = newDescription;
  }

  private _handleStateChanges() {
    this._rerenderSubscription = merge(
      this._sort.sortChange,
      this._sort._stateChanges,
    ).subscribe(() => {
      if (this._isSorted()) {
        this._updateArrowDirection();

        // Do not show the animation if the header was already shown in the right position.
        if (this._viewState.toState === 'hint' || this._viewState.toState === 'active') {
          this._disableViewStateAnimation = true;
        }

        this._setAnimationTransitionState({fromState: this._arrowDirection, toState: 'active'});
        this._showIndicatorHint = false;
      }

      // If this header was recently active and now no longer sorted, animate away the arrow.
      if (!this._isSorted() && this._viewState && this._viewState.toState === 'active') {
        this._disableViewStateAnimation = false;
        this._setAnimationTransitionState({fromState: 'active', toState: this._arrowDirection});
      }

      this._changeDetectorRef.markForCheck();
    });
  }
}

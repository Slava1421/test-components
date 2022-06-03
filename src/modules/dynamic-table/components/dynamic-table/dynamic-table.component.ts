import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultColumn } from '../../model/model';
import { Alias } from '../../model/shared';
import { RegisterPropertyDefService } from '../../services/register-property-def.service';

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss']
})
export class DynamicTableComponent<T> implements OnInit, AfterViewInit {
  @Input() defaultColumns: DefaultColumn[];
  @Input() source$: Observable<T[]>;

  displayedColumns = [];
  sources: T[] = [];

  constructor(
    private readonly registerPropertyDefService: RegisterPropertyDefService<T>,
    private readonly parent: Alias<T[]>
  ) { }

  ngOnInit() {
    this.source$.subscribe((data: T[]) => this.sources = data);
    this.displayedColumns = this.defaultColumns.map(c => c.id);
  }

  findColumnByKey(key: string): DefaultColumn {
    return this.defaultColumns.find(column => column.id === key);
  }

  ngAfterViewInit(): void {
    this.defaultColumns = this.defaultColumns.map(column =>
      Object.assign(column, {
        template: this.registerPropertyDefService.getTemplate(this.parent, column.id)
      })
    );
  }

}

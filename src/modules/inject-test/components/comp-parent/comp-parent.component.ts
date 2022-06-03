import { Component, OnInit } from '@angular/core';
import { ServService } from '../../services/serv.service';
import { API_URL2 } from '../../token/token';

@Component({
  selector: 'app-comp-parent',
  templateUrl: './comp-parent.component.html',
  styleUrls: ['./comp-parent.component.scss'],
  providers: [
    { provide: API_URL2, useClass: ServService },
    // { provide: API_URL1, useExisting: API_URL2 },
  ]
})
export class CompParentComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

import { Component, Inject, OnInit } from '@angular/core';
import { ServService } from '../../services/serv.service';
import { API_URL1, API_URL2 } from '../../token/token';

@Component({
  selector: 'app-comp-child1',
  templateUrl: './comp-child1.component.html',
  styleUrls: ['./comp-child1.component.scss'],
  providers: [{ provide: API_URL1, useExisting: API_URL2 }]
})
export class CompChild1Component implements OnInit {

  constructor(
    // private serv: ServService,
    @Inject(API_URL1) private serv: ServService
  ) { }

  ngOnInit(): void {
    console.log('child1', this.serv.test);
  }

}

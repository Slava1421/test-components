import { Component, Inject, OnInit } from '@angular/core';
import { ServService } from '../../services/serv.service';
import { API_URL2 } from '../../token/token';

@Component({
  selector: 'app-comp-child2',
  templateUrl: './comp-child2.component.html',
  styleUrls: ['./comp-child2.component.scss']
})
export class CompChild2Component implements OnInit {

  constructor(
    // private serv: ServService,
    @Inject(API_URL2) private serv: ServService
  ) { }

  ngOnInit(): void {
    console.log('child2', this.serv.test);
    this.serv.test = 'adadadaa';
  }

}

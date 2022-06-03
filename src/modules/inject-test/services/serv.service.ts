import { Injectable } from '@angular/core';

@Injectable()
export class ServService {

  test = 'fak';

  constructor() {
    console.log('Serv init!!!');
  }
}

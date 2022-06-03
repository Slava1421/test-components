import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TableModule } from 'src/modules/table/table.module';
import { DynamicTableModule } from 'src/modules/dynamic-table/dynamic-table.module';
import { InjectTestModule } from 'src/modules/inject-test/inject-test.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    TableModule,
    DynamicTableModule,
    InjectTestModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

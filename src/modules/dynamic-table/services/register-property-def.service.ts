import { ComponentRef, Injectable, TemplateRef } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RegisterPropertyDefService<T> {

  private store = new Map<any, Map<string, TemplateRef<T>>>();

  setTemplateById(cmp: any, id: string, template: TemplateRef<any>): void {
    const state = this.store.get(cmp) || new Map();
    state.set(id, template);

    this.store.set(cmp, state);
  }

  getTemplate(cmp: any, id: string): TemplateRef<T> {
    return this.store.get(cmp).get(id);
  }
}

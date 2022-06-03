import { ComponentRef, Directive, Input, OnInit, Optional, TemplateRef, ViewContainerRef } from '@angular/core';
import { Alias } from '../model/shared';
import { RegisterPropertyDefService } from '../services/register-property-def.service';

@Directive({
  selector: '[appProvidePropertyDefValue]'
})
export class ProvidePropertyDefValueDirective<T> implements OnInit {

  @Input() providePropertyDefValueId: string;

  constructor(
    private container: ViewContainerRef,
    private template: TemplateRef<any>, // шаблон в котором определена наша разметка
    private registerPropertyDefService: RegisterPropertyDefService<any>, // сервис созданый выше
    @Optional() private parent: Alias<T[]> // тут у нас хранится ссылка на компонент в котором используются наши карточки 
  ) {}

  ngOnInit(): void {
    this.container.clear(); // этот пункт не обязателен, объясню по ходу
    this.registerPropertyDefService.setTemplateById(
      this.parent ,
      this.providePropertyDefValueId,
      this.template
    );
  }

}

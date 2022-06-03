import { TemplateRef } from "@angular/core";

export interface DefaultColumn {
  label: string;
  id: string;
  template?: TemplateRef<any>;
}
import { DefaultColumn } from "./model";

export abstract class Alias<T> {
  abstract defaultColumns: DefaultColumn[];
}
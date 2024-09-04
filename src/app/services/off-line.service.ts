import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Observable, fromEvent, merge } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

// Definir la interfaz para los datos que deseas almacenar
interface Template {
  id: string;
  content: string;
}

interface User {
  name: string,
  lastName: string,
  phone: string,
  id?: number
}

@Injectable({
  providedIn: 'root'
})
export class OffLineService extends Dexie {
  public db!: any;
  public templates_db!: any;
  templates!: Dexie.Table<Template, string>;

  constructor() {
    super('TemplateDB');

    this.db = new Dexie('user_database');
    this.db.version(1).stores({
      users: 'name,lastName,phone'
    });

    this.templates_db = new Dexie('templates_database');
    this.version(1).stores({
      templates: 'id' // Usar 'id' como clave primaria
    });

    // Inicializar la tabla
    this.templates = this.table('templates');
  }

  // Método para guardar una plantilla
  async saveTemplate(id: string, content: string): Promise<void> {
    await this.templates.put({ id, content });
  }

   // Método para recuperar una plantilla
   async getTemplate(id: string): Promise<string | undefined> {
    const template = await this.templates.get(id);
    return template?.content;
  }

  async insert<T>(tableName: string, object: T) {
    return this.db[tableName].put(object);
  }

  async save(data: User): Promise<boolean> {
    const user = await this.getUserByName<User>('users', data.name, data.lastName, data.phone);
    
    if(user === undefined) {
      const user = {
        name: data.name,
        lastName: data.lastName,
        phone: data.phone
      };

      await this.insert<User>('users', user);
      return true;
    }
    return false;
  }

  async getUserByName<T>(tableName: string, name: string, lastName: string, phone: string) {
    return this.db[tableName].where({'name': name, lastName, phone}).first();
  }

  async getAll<T>(tableName: string) {
    return this.db[tableName].toArray();
  }

  async clearTable<T>(tableName: string) {
    return this.db[tableName].clear();
  }
}

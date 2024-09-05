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
  id?: number,
  email: string,
  subject: string,
  message: string
}

// Definimos las interfaces para los tipos de datos
export interface HtmlTemplate {
  id: string;
  template: string;
}

export interface DataItem {
  id?: number;
  data: string;
}

@Injectable({
  providedIn: 'root'
})
export class DexieJsService extends Dexie {
  public userDB!: any;

  templates!: Dexie.Table<HtmlTemplate, string>;

  constructor() {
    super('OfflineDatabase');
    // super('TemplateDB');

    // Definimos las tablas para plantillas HTML y datos
    this.userDB = new Dexie('users_database');
    this.userDB.version(1).stores({
      users: 'name,lastName,phone,email,subject,message',
    });
   
    this.version(1).stores({
      templates: 'id,template',
    });

    // this.templates_db = new Dexie('templates_database');
    // this.version(1).stores({
    //   templates: 'id'
    // });

    // Inicializar la tabla
    // this.templates = this.table('templates');
  }

  // Método para guardar una plantilla
  async saveTemplate(id: string, template: string): Promise<void> {
    await this.templates.put({ id, template });
  }

   // Método para recuperar una plantilla
   async getTemplate(id: string): Promise<string | undefined> {
    const template = await this.templates.get(id);
    return template?.template;
  }

  async insert<T>(tableName: string, object: T) {
    return this.userDB[tableName].put(object);
  }

  async save(data: User): Promise<boolean> {
    const user = await this.getUserByName<User>('users', data.name, data.lastName, data.phone);
    
    if(user === undefined) {
      const user = {
        name: data.name,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        subject: data.subject,
        message: data.message
      };

      await this.insert<User>('users', user);
      return true;
    }
    return false;
  }

  async getUserByName<T>(tableName: string, name: string, lastName: string, phone: string) {
    return this.userDB[tableName].where({'name': name, lastName, phone}).first();
  }

  async getAll<T>(tableName: string) {
    return this.userDB[tableName].toArray();
  }

  async clearTable<T>(tableName: string) {
    return this.userDB[tableName].clear();
  }
}

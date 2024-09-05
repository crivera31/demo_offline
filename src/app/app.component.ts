import { Component, OnDestroy, OnInit } from '@angular/core';
import { RestApiService } from './services/rest-api.service';
import { DexieJsService } from './services/dexie-js.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NetworkStatusService } from './services/network-status.service';
import { Subscription, forkJoin, tap } from 'rxjs';
import { ConnectionService, ConnectionServiceOptions, ConnectionState } from 'ng-connection-service';

interface User {
  name: string,
  lastName: string,
  phone: string,
  id?: any,
  email: string,
  subject: string,
  message: string
}
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit  {

  public template: string | undefined = '';
  public userForm!: FormGroup;
  public user!: User;
  public lstUsers: User[] = [];
  
  isOnline: boolean = false;
  isSave = false;

  status!: boolean;
  hasNetworkConnection!: boolean;
  hasInternetAccess!: boolean;

  constructor(
    private readonly _restApi: RestApiService,
    private readonly _fb: FormBuilder,
    private readonly _dexieJS: DexieJsService,
    private _networkStatus: NetworkStatusService,
    private _connectionService: ConnectionService
  ) { }


  async ngOnInit(): Promise<void> {

    this.networkStatus();
    // this.connectionPlugin();
    this.initDataForm();
    // Cargar la plantilla al iniciar el componente
    // this.template = await this._onlineOff.getTemplate('myTemplate');
    this.saveTemplate();
    this.getAll()

    
  }

  async saveTemplate(): Promise<void> {
    const newTemplate = `<h1>Mi Plantilla Offline</h1><p>Esta es una plantilla guardada en IndexedDB usando Dexie.</p>`;
    await this._dexieJS.saveTemplate('myTemplate', newTemplate);
  }

  connectionPlugin() {
    this._connectionService.monitor().subscribe((currentState: ConnectionState) => {
      console.log(currentState);
      this.hasNetworkConnection = currentState.hasNetworkConnection;
      this.hasInternetAccess = currentState.hasInternetAccess;
      this.status = this.hasNetworkConnection && this.hasInternetAccess;
    });
  }

  networkStatus() {
    this._networkStatus.onlineStatus$.subscribe(status => {
      console.log(status);      
      this.checkConnection(status);
    });
  }

  async checkConnection(data: boolean) {
    if(data) {
      this.isOnline = data;
      // this.template = '';
      this.template = '<h1>Mi Plantilla en Líneaaa</h1><p>Esta plantilla se cargó desde la web.</p>';
      // await this._onlineOff.saveTemplate('myTemplate', this.template);
    } else {
      console.log('2')
      this.isOnline = data;
      // Si no hay conexión, carga la plantilla desde Dexie
      this.template = await this._dexieJS.getTemplate('myTemplate');
    }
  }

  initDataForm() {
    this.userForm = this._fb.group({
      name: this._fb.control('', [Validators.required]),
      lastName: this._fb.control('', [Validators.required]),
      phone: this._fb.control('', [Validators.required]),
      email: this._fb.control('', [Validators.required]),
      subject: this._fb.control('', [Validators.required]),
      message: this._fb.control('', [Validators.required])
    })
  }

  onSave() {
    this.isSave = true;
    this._restApi.create(this.userForm.value).subscribe({
      next: (res: User) => {
        if (res.id) {
          this.userForm.reset();
          this.isSave = false;
          this.showSuccessMessage("✅ SI hay conexión... guardando en MOCKAPI!!!");
          this.getAll();
        }
      },
      error: () => {
        // console.log("❌", 'NO hay conexión... guardando en local!!!');
        this.onSaveLocal();
      }
    });
  }

  async onSaveLocal() {
    console.log(this.lstUsers)
    const isUserCreated = await this._dexieJS.save(this.userForm.value);

    if (isUserCreated) {
      this.isSave = false;
      this.userForm.reset();
      alert('Usuario guardado en local!!!');
      const lstUsersLocal = await this._dexieJS.getAll('users');
      this.lstUsers = [...this.lstUsers, ...lstUsersLocal]
    } else {
      alert('Usuario ya exite en local!!!');
    }
  }

  async onSyncData() {
    const lstUsers = await this._dexieJS.getAll('users');
    
    if(lstUsers.length === 0) {
      alert('Not found data in local!!!');
      return;
    }

    try {
      // Create an array of observables
      const saveObservables = lstUsers.map((element: User) => {
        return this._restApi.create(element);
      });
  
      // Use forkJoin to wait for all observables to complete
      forkJoin(saveObservables).subscribe({
        next: () => {
          // This will be called when all requests are successful
          this.showSuccessMessage('Data synchronized successfully');
          this._dexieJS.clearTable('users');
          this.getAll();
        },
        error: (error) => {
          // Handle errors here if any of the requests fail
          console.error('Error synchronizing data', error);
          this.showErrorMessage('Data synchronization failed');
        }
      });
    } catch (error) {
      // Handle any synchronous errors that might occur
      console.error('Error synchronizing data', error);
      this.showErrorMessage('Data synchronization failed');
    }
  }

  getAll() {
    this._restApi.getAll().subscribe({
      next: (response: User[]) => {
        this.lstUsers = response;
      }
    })
  }

  onDelete(id: string) {
    this._restApi.delete(id).subscribe({
      next: response => {
        this.getAll();
      }
    })
  }

  showSuccessMessage(message: string) {
    alert(message);
  }
  
  showErrorMessage(message: string) {
    alert(message);
  }
}
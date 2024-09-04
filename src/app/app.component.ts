import { Component, OnInit } from '@angular/core';
import { RestApiService } from './services/rest-api.service';
import { OffLineService } from './services/off-line.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NetworkStatusService } from './services/network-status.service';
import { forkJoin } from 'rxjs';


interface User {
  name: string,
  lastName: string,
  phone: string,
  id?: number
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
  isOnline: boolean = true;
  isSave = false;

  constructor(
    private readonly _restApi: RestApiService,
    private readonly _fb: FormBuilder,
    private readonly _onlineOff: OffLineService,
    private _networkStatus: NetworkStatusService
  ) { }


  async ngOnInit(): Promise<void> {
    this._networkStatus.onlineStatus$.subscribe(status => {
      this.isOnline = status;
      console.log('Online status:', status);
      this.verify(this.isOnline);
    });
    this.initDataForm();

    // Cargar la plantilla al iniciar el componente
    // this.template = await this._onlineOff.getTemplate('myTemplate');
    this.saveTemplate();


  }

  async saveTemplate(): Promise<void> {
    const newTemplate = `<h1>Mi Plantilla Offline</h1><p>Esta es una plantilla guardada en IndexedDB usando Dexie.</p>`;
    await this._onlineOff.saveTemplate('myTemplate', newTemplate);
  }

  async verify(data: boolean) {
    if(data) {
      console.log('1')
      this.template = '<h1>Mi Plantilla en Líneaaa</h1><p>Esta plantilla se cargó desde la web.</p>';
      // await this._onlineOff.saveTemplate('myTemplate', this.template);
    } else {
      console.log('2')
      // Si no hay conexión, carga la plantilla desde Dexie
      this.template = await this._onlineOff.getTemplate('myTemplate');
    }
  }

  initDataForm() {
    this.userForm = this._fb.group({
      name: this._fb.control('', [Validators.required]),
      lastName: this._fb.control('', [Validators.required]),
      phone: this._fb.control('', [Validators.required])
    })
  }

  onSave(data?: User) {
    this.isSave = true;
    const body = !data ? this.userForm.value : data;
    this._restApi.create(body).subscribe({
      next: (res: User) => {
        if (res.id) {
          this.userForm.reset();
          this.isSave = false;
          this.showSuccessMessage("✅ SI hay conexión... guardando en MOCKAPI!!!");
        }
      },
      error: () => {
        // console.log("❌", 'NO hay conexión... guardando en local!!!');
        this.onSaveLocal();
      }
    });
  }

  async onSaveLocal() {
    const isUserCreated = await this._onlineOff.save(this.userForm.value);

    if (isUserCreated) {
      this.isSave = false;
      this.userForm.reset();
      alert('Usuario guardado en local!!!');
    } else {
      alert('Usuario ya exite en local!!!');
    }
  }

  async onSynchronize() {
    const lstUsers = await this._onlineOff.getAll('users');
    
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
          this._onlineOff.clearTable('users');
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

  showSuccessMessage(message: string) {
    alert(message);
  }
  
  showErrorMessage(message: string) {
    alert(message);
  }
}
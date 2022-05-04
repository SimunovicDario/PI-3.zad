import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {
  type = "SQL";
  server = "localhost"
  database = "AdventureWorksDW2019"
  username = "dario"
  password = "test"
  err = null
  @Output() loggedIn: EventEmitter<any> = new EventEmitter();
  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
  }

  reset() {
    this.type = "SQL"
    this.server = "localhost"
    this.database = "AdventureWorksDW2019"
    this.username = "dario"
    this.password = "test"
  }

  login() {
    this.http.post(environment.url + '/login',
      { type: this.type, 
        server: this.server, 
        database: this.database, 
        username: this.username, 
        password: this.password 
      }).subscribe((res)=>{
        this.router.navigateByUrl('');
        this.loggedIn.emit();
      }, err=>{
        alert(err.error)
        this.err = err.error;
      })
  }

}

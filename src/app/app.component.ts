import { Component } from '@angular/core';
import { sp } from '@pnp/sp';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'CT Recruiting Information';
  groupName: string = 'CT Recruiting Information Owners';
  isUserAdmin: boolean = false;

  constructor() {
    this.getCurrentUser();
  }

  checkUserAdmin(currentUser: any) {
    sp.web.siteGroups.getByName(this.groupName).users.getByEmail(currentUser.Email).get().then(rs => {
      console.log("user belongs to group");
      this.isUserAdmin = true;
    }).catch(error => {
      console.log("user does not belong");
    });
  }

  getCurrentUser() {
    sp.web.currentUser.get().then(result => {
      this.checkUserAdmin(result);
    });
  }
}

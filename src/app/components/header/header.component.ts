import { Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [FormsModule , RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  title = input('Workflow dashBoard');
  ButtonClick = output<string>();
  isSearchAble = input(false);
  searchText = model('');
  showBack = input(false);
  isButtons = input(false);
  buttons = input<{ name: string; onClick?: () => void }[]>([]);

  onClick(name: string) {
    this.ButtonClick.emit(name);
  }
}

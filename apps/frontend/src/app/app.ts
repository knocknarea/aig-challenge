import { Component } from '@angular/core';
import { QuoteFormComponent } from './quote-form/quote-form.component';

@Component({
  imports: [QuoteFormComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}

import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { delay } from 'rxjs';
import { QuoteResponse } from 'shared';
import { RiskBandBadgeComponent } from '../shared/components/risk-band-badge/risk-band-badge.component';

const API_URL = 'http://localhost:3000/policy/quote';

@Component({
  selector: 'app-quote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RiskBandBadgeComponent],
  templateUrl: './quote-form.component.html',
  styleUrl: './quote-form.component.scss',
})
export class QuoteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly loading = signal(false);
  readonly quoteResult = signal<QuoteResponse | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(1)]],
    age: [null as number | null, [Validators.required, Validators.min(18), Validators.max(120)]],
    propertyType: ['House' as 'House' | 'Flat' | 'Bungalow', Validators.required],
    propertyValue: [null as number | null, [Validators.required, Validators.min(1)]],
    postcode: ['', Validators.required],
    previousClaims: [0, [Validators.required, Validators.min(0)]],
  });

  readonly propertyTypes = ['House', 'Flat', 'Bungalow'] as const;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.quoteResult.set(null);
    this.errorMessage.set(null);

    const payload = {
      customerName: this.form.value.customerName!,
      age: Number(this.form.value.age),
      propertyType: this.form.value.propertyType!,
      propertyValue: Number(this.form.value.propertyValue),
      postcode: this.form.value.postcode!,
      previousClaims: Number(this.form.value.previousClaims),
    };

    this.http.post<QuoteResponse>(API_URL, payload).pipe(delay(2000)).subscribe({
      next: (result) => {
        this.quoteResult.set(result);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(err.error?.message ?? 'An unexpected error occurred. Please try again.');
        this.loading.set(false);
      },
    });
  }

  reset(): void {
    this.form.reset({ propertyType: 'House', previousClaims: 0 });
    this.quoteResult.set(null);
    this.errorMessage.set(null);
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control.touched);
  }
}

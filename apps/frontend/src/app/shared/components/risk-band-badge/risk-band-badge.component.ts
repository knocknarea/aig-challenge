import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RiskBand = 'STANDARD' | 'ELEVATED' | 'HIGH_RISK';

@Component({
  selector: 'app-risk-band-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-band-badge.component.html',
  styleUrl: './risk-band-badge.component.scss',
})
export class RiskBandBadgeComponent {
  readonly riskBand = input.required<RiskBand>();

  get label(): string {
    const labels: Record<RiskBand, string> = {
      STANDARD: 'Standard',
      ELEVATED: 'Elevated',
      HIGH_RISK: 'High Risk',
    };
    return labels[this.riskBand()];
  }
}

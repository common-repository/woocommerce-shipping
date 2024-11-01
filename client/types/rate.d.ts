import { Carrier } from './carrier';

export interface Rate {
	carrierId: Carrier;
	freePickup: boolean;
	insurance: number;
	isSelected: boolean;
	listRate: number;
	rate: number;
	rateId: string;
	retailRate: number;
	serviceId: string;
	shipmentId: string;
	title: string;
	tracking: boolean;
	type?: 'adultSignatureRequired' | 'signatureRequiredRate';
}

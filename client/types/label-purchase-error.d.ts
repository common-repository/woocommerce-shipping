import { NoticeAction } from '@wordpress/components/build-types/notice/types';

export interface LabelPurchaseError {
	cause: 'purchase_error' | 'print_error'| 'status_error';
	message: string[];
	actions?: NoticeAction[];
}

import { useSelect } from '@wordpress/data';
import { settingsStore } from 'data/settings';

export const useSettings = () => {
	// Get "formData"
	const {
		paper_size: labelSize,
		email_receipts: emailReceiptEnabled,
		use_last_service: rememberServiceEnabled,
		use_last_package: rememberPackageEnabled,
		checkout_address_validation: checkoutAddressValidation,
	} = useSelect( ( select ) => {
		const settings = select( settingsStore ).getConfigSettings();
		if ( ! settings ) {
			//defaults
			return {
				paper_size: '',
				email_receipts: '',
				use_last_service: '',
				use_last_package: '',
				checkout_address_validation: '',
			};
		}
		return {
			paper_size: settings.paper_size ?? '',
			email_receipts: settings.email_receipts ?? '',
			use_last_service: settings.use_last_service ?? '',
			use_last_package: settings.use_last_package ?? '',
			checkout_address_validation:
				settings.checkout_address_validation ?? '',
		};
	} );

	// Get "formMeta"
	const {
		master_user_name: storeOwnerUsername,
		master_user_login: storeOwnerLogin,
		master_user_email: storeOwnerEmail,
	} = useSelect( ( select ) => {
		const settings = select( settingsStore ).getConfigMeta();
		if ( ! settings ) {
			//defaults
			return {
				master_user_name: '',
				master_user_login: '',
				master_user_email: '',
			};
		}
		return {
			master_user_name: settings.master_user_name ?? '',
			master_user_login: settings.master_user_login ?? '',
			master_user_email: settings.master_user_email ?? '',
		};
	} );

	// Consolidate all settings into 1 object.
	return {
		labelSize,
		emailReceiptEnabled,
		rememberServiceEnabled,
		rememberPackageEnabled,
		checkoutAddressValidation,
		storeOwnerUsername,
		storeOwnerLogin,
		storeOwnerEmail,
	};
};

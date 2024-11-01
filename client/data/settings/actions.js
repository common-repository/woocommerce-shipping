import {
	SETTINGS_SAVE,
	SETTINGS_UPDATE_FORM_DATA,
} from 'data/settings/action-types';

export function* saveSettings( { payload } ) {
	const result = yield {
		type: 'API_SAVE_ACCOUNT_SETTINGS',
		payload,
	};

	return {
		type: SETTINGS_SAVE,
		result,
	};
}

export function updateFormData( formInputKey, formInputvalue ) {
	return {
		type: SETTINGS_UPDATE_FORM_DATA,
		payload: {
			[ formInputKey ]: formInputvalue,
		},
	};
}

export const getSettings = ( state ) => {
	return state;
};

export const getAddPaymentMethodURL = ( state ) => {
	//TODO: Why did we call it formMeta? Can we rename this from the API?
	return (
		state.formMeta?.add_payment_method_url ??
		'https://wordpress.com/me/purchases/add-credit-card'
	);
};

export const getPaymentMethods = ( state ) => {
	//TODO: Why did we call it formMeta? Can we rename this from the API?
	return state.formMeta?.payment_methods ?? [];
};

export const getSelectedPaymentMethod = ( state ) => {
	return state.formData?.selected_payment_method_id;
};

export const getConfigSettings = ( state ) => {
	//TODO: Why did we call it formData? Can we rename this from the API?
	return state.formData;
};

export const getConfigMeta = ( state ) => {
	//TODO: Why did we call it formMeta? Can we rename this from the API?
	return state.formMeta;
};

export const getEnabledServices = ( state ) => {
	return state?.enabledServices ?? [];
};

import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { useSettings } from 'wcshipping/data/settings/hooks';

const ExternalInfo = () => {
	const { storeOwnerLogin, storeOwnerEmail } = useSettings();

	if ( ! storeOwnerLogin ) {
		return null;
	}

	return (
		<p className="wcshipping-settings__extras">
			{ sprintf(
				// translators: %1$s is the WordPress.com username, %2$s is the email address.
				__(
					'Credit cards are retrieved from the following WordPress.com account: %1$s <%2$s>',
					'woocommerce-shipping'
				),
				storeOwnerLogin,
				storeOwnerEmail
			) }
		</p>
	);
};

export default ExternalInfo;

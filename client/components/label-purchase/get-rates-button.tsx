import React from 'react';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface GetRatesButtonProps {
	isBusy: boolean;
	disabled: boolean;
	onClick: () => void;
}

export const GetRatesButton = ( {
	isBusy,
	disabled,
	onClick,
}: GetRatesButtonProps ) => {
	return (
		<Button
			onClick={ onClick }
			isBusy={ isBusy }
			disabled={ disabled }
			variant="secondary"
			title={
				disabled
					? __(
							'Complete package selection/fields to get shipping rates',
							'woocommerce-shipping'
					  )
					: __( 'Get shipping rates', 'woocommerce-shipping' )
			}
		>
			{ __( 'Get shipping rates', 'woocommerce-shipping' ) }
		</Button>
	);
};

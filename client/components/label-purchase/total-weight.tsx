import { __ } from '@wordpress/i18n';
import React from 'react';
import { isNumber } from 'lodash';
import { __experimentalInputControl as InputControl } from '@wordpress/components';
import { getWeightUnit } from 'utils';
import { useLabelPurchaseContext } from './context';
import { numberFormat } from '@woocommerce/number';
import { useEffect } from '@wordpress/element';

const formatNumber = ( val: string | number ) =>
	numberFormat(
		{
			precision: 2,
			thousandSeparator: '',
		},
		Number( val )
	);
export const TotalWeight = ( { packageWeight = 0 } ) => {
	const weightUnit = getWeightUnit();
	const {
		weight: {
			getShipmentWeight,
			getShipmentTotalWeight,
			setShipmentTotalWeight,
		},
		rates: { isFetching, errors, setErrors },
	} = useLabelPurchaseContext();

	useEffect( () => {
		setShipmentTotalWeight( getShipmentWeight() + Number( packageWeight ) );
		// reset errors on initial render to avoid false positives on context switch
		if ( errors.totalWeight !== false ) {
			setErrors( () => ( {
				...errors,
				totalWeight: false,
			} ) );
		}

		// This effect should not run on `errors` change, so it's removed from the dependency array
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		packageWeight,
		getShipmentWeight,
		setShipmentTotalWeight,
		setErrors,
	] );

	const fieldName = 'totalWeight';

	const props = {
		onChange: ( val: string | undefined ) => {
			const { ...newErrors } = errors;
			delete newErrors[ fieldName ];
			setErrors( newErrors );
			setShipmentTotalWeight( Number( val ) );
		},
		value: formatNumber( getShipmentTotalWeight() ),
		className: errors[ fieldName ]
			? 'package-total-weight has-error'
			: 'package-total-weight',
		onValidate: ( value: string ) => {
			const float = parseFloat( value );
			setErrors( {
				...errors,
				[ fieldName ]: ! isNumber( float ) || float <= 0,
			} );
		},
		help:
			errors[ fieldName ] &&
			typeof errors[ fieldName ] === 'object' &&
			'message' in errors[ fieldName ]
				? errors[ fieldName ].message
				: '',
	};
	return (
		<InputControl
			label={ __(
				'Total shipment weight (with package)',
				'woocommerce-shipping'
			) }
			type="number"
			suffix={ weightUnit }
			disabled={ isFetching }
			step="0.1"
			min={ formatNumber( getShipmentWeight() ) }
			{ ...props }
		/>
	);
};

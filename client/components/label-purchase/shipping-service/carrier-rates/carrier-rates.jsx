import { Flex } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getSignatureRate } from 'utils';
import { labelPurchaseStore } from 'data/label-purchase';
import { RateRow } from './rate-row';
import { useLabelPurchaseContext } from 'components/label-purchase/context';
import { useCallback, useEffect } from '@wordpress/element';

export const CarrierRates = ( { rates } ) => {
	const {
		rates: { getSelectedRate, selectRate },
		shipment: { currentShipmentId },
		essentialDetails: {
			resetFocusArea: resetEssentialDetailsFocusArea,
			setShippingServiceCompleted,
		},
	} = useLabelPurchaseContext();
	const setSelected = useCallback(
		( rate, parent ) => ( checked ) => {
			resetEssentialDetailsFocusArea();
			setShippingServiceCompleted( true );
			if ( checked ) {
				selectRate( rate, parent );
			}

			if ( ! checked && parent ) {
				selectRate( parent );
			}
		},
		[ selectRate ]
	);

	useEffect( () => {
		if ( getSelectedRate() ) {
			setShippingServiceCompleted( false );
		}
	}, [ getSelectedRate, setShippingServiceCompleted ] );

	const signatureRequiredRates = useSelect( ( s ) =>
		s( labelPurchaseStore ).getRatesForShipment(
			currentShipmentId,
			'signature_required'
		)
	);
	const adultSignatureRequiredRates = useSelect( ( s ) =>
		s( labelPurchaseStore ).getRatesForShipment(
			currentShipmentId,
			'adult_signature_required'
		)
	);

	return (
		<Flex
			className="carrier-rates"
			justify="space-between"
			gap={ 4 }
			direction="column"
		>
			{ rates.map( ( rate ) => (
				<RateRow
					key={ rate.rateId }
					rate={ rate }
					selected={ getSelectedRate() }
					setSelected={ setSelected }
					signatureRequiredRate={ getSignatureRate(
						rate.serviceId,
						signatureRequiredRates?.[ rate.carrierId ] ?? [],
						rate || 0
					) }
					adultSignatureRequiredRate={ getSignatureRate(
						rate.serviceId,
						adultSignatureRequiredRates?.[ rate.carrierId ] ?? [],
						rate || 0,
						'adultSignatureRequired'
					) }
				/>
			) ) }
		</Flex>
	);
};

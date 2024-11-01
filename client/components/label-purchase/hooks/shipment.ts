import { useCallback, useEffect, useState } from '@wordpress/element';
import { dispatch, select as selectData, useSelect } from '@wordpress/data';
import { invert, isEqual } from 'lodash';
import {
	getCurrentOrderShipments,
	getFirstSelectableOriginAddress,
} from 'utils';
import { LabelShipmentIdMap, OriginAddress, ShipmentItem } from 'types';
import { addressStore } from 'data/address';
import { labelPurchaseStore } from 'data/label-purchase';
import { LABEL_PURCHASE_STATUS } from 'data/constants';

export function useShipmentState() {
	const [ currentShipmentId, setCurrentShipmentId ] = useState( '0' );
	const [ shipments, updateShipments ] = useState<
		Record< string, ShipmentItem[] >
	>( getCurrentOrderShipments() );
	const [ selections, setSelection ] = useState<
		Record< string, ShipmentItem[] >
	>( {
		0: [],
	} );

	const [ shipmentOrigins, setShipmentOrigins ] = useState<
		Record< string, OriginAddress | undefined >
	>( {
		0: getFirstSelectableOriginAddress(),
	} );

	const findOriginAddressById = ( originId: string ) => {
		const origins = selectData( addressStore ).getOriginAddresses();
		return origins.find( ( a ) => a.id === originId );
	};

	const setShipmentOrigin = useCallback(
		( originId: string ) => {
			const origin = findOriginAddressById( originId );

			if (
				! origin ||
				( origin &&
					isEqual( shipmentOrigins[ currentShipmentId ], origin ) )
			) {
				return;
			}

			setShipmentOrigins( ( prevState ) => ( {
				...prevState,
				[ currentShipmentId ]: origin,
			} ) );
		},
		[ currentShipmentId, shipmentOrigins ]
	);

	// The most recently purchased label, that has not been refunded.
	const activePurchasedLabel =
		selectData( labelPurchaseStore ).getPurchasedLabel( currentShipmentId );

	const purchasedLabelOrigin = useSelect(
		( select ) =>
			select( labelPurchaseStore ).getLabelOrigins( currentShipmentId ),
		[ currentShipmentId, activePurchasedLabel ]
	);

	const purchasedLabelDestination = useSelect(
		( select ) =>
			select( labelPurchaseStore ).getLabelDestinations(
				currentShipmentId
			),
		[ currentShipmentId, activePurchasedLabel ]
	);

	const orderDestination = useSelect(
		( select ) => select( addressStore ).getOrderDestination(),
		[ currentShipmentId, activePurchasedLabel ]
	);

	useEffect( () => {
		// Fetching the origin and destination addresses for the most recently purchased label doesn't check
		// if it has been refunded or not, so we check for "activePurchasedLabel" as well.
		// older implementations of purchasedLabelOrigin don't have the id property, so we check for it.
		if ( activePurchasedLabel && purchasedLabelOrigin?.id ) {
			setShipmentOrigin( purchasedLabelOrigin.id );
		} else if ( ! shipmentOrigins[ currentShipmentId ] ) {
			setShipmentOrigin( getFirstSelectableOriginAddress().id );
		}
	}, [
		currentShipmentId,
		activePurchasedLabel,
		purchasedLabelOrigin,
		purchasedLabelDestination,
		shipments,
		setShipmentOrigin,
		orderDestination,
		shipmentOrigins,
	] );

	const [ labelShipmentIdsToUpdate, setLabelShipmentIdsToUpdate ] =
		useState< LabelShipmentIdMap >( {} );

	const getShipmentWeight = useCallback(
		() =>
			shipments[ currentShipmentId ].reduce(
				( acc, { weight, quantity } ) =>
					acc + Number( weight || 0 ) * Number( quantity ),
				0
			),
		[ shipments, currentShipmentId ]
	);

	const resetSelections = ( shipmentIds: string[] ) => {
		setSelection(
			shipmentIds.reduce(
				( acc, key ) => ( { ...acc, [ key ]: [] } ),
				{}
			)
		);
	};

	const getShipmentItems = useCallback(
		( shipmentId = currentShipmentId ) => shipments[ shipmentId ],
		[ shipments, currentShipmentId ]
	);

	const getShipmentOrigin = useCallback( () => {
		if ( activePurchasedLabel && purchasedLabelOrigin ) {
			const foundOrigin = findOriginAddressById(
				purchasedLabelOrigin.id
			);
			if ( foundOrigin ) {
				return foundOrigin;
			}
		}

		return (
			shipmentOrigins[ currentShipmentId ] ??
			getFirstSelectableOriginAddress()
		);
	}, [
		activePurchasedLabel,
		currentShipmentId,
		purchasedLabelOrigin,
		shipmentOrigins,
	] );

	/**
	 * Returns the ship from address recorded at the time of purchase.
	 * This can differ from the current ship from address if the user has changed it.
	 * If the user has changed the address, the id will remain the same, but the address will be different.
	 */
	const getShipmentPurchaseOrigin = () =>
		activePurchasedLabel &&
		purchasedLabelOrigin &&
		activePurchasedLabel.status === LABEL_PURCHASE_STATUS.PURCHASED
			? purchasedLabelOrigin
			: null;

	const getShipmentDestination = useCallback( () => {
		if ( activePurchasedLabel && purchasedLabelDestination ) {
			return purchasedLabelDestination;
		}

		return orderDestination;
	}, [ activePurchasedLabel, orderDestination, purchasedLabelDestination ] );

	const setShipments = (
		newShipments: Record< string, ShipmentItem[] >,
		updatedShipmentIds?: LabelShipmentIdMap
	) => {
		if ( updatedShipmentIds ) {
			setLabelShipmentIdsToUpdate( updatedShipmentIds );
			dispatch( labelPurchaseStore ).stageLabelsNewShipmentIds(
				updatedShipmentIds
			);
		}

		updateShipments( newShipments );
	};

	const revertLabelShipmentIdsToUpdate = () => {
		dispatch( labelPurchaseStore ).stageLabelsNewShipmentIds(
			invert( labelShipmentIdsToUpdate )
		);
		setLabelShipmentIdsToUpdate( {} );
	};

	return {
		shipments,
		setShipments,
		getShipmentWeight,
		resetSelections,
		selections,
		setSelection,
		currentShipmentId,
		setCurrentShipmentId,
		getShipmentItems,
		getShipmentOrigin,
		setShipmentOrigin,
		getShipmentDestination,
		revertLabelShipmentIdsToUpdate,
		labelShipmentIdsToUpdate,
		getShipmentPurchaseOrigin,
	};
}

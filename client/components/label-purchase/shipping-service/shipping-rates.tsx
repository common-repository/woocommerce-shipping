import React from 'react';
import {
	__experimentalHeading as Heading,
	Flex,
	Icon,
	TabPanel,
	Notice,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { shipping } from '@wordpress/icons';
import {
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
	useEffect,
} from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { intersection, sortBy } from 'lodash';
import { CarrierIcon } from 'components/carrier-icon';
import { CARRIER_ID_TO_NAME } from '../packages';
import { useLabelPurchaseContext } from '../context';
import { CarrierRates } from './carrier-rates';
import { RatesSorter } from './rates-sorter';
import { DELIVERY_PROPERTIES } from './constants';
import { mainModalContentSelector } from '../constants';
import { SHIPPING_SERVICE_SECTION } from '../essential-details/constants';
import { Carrier, Rate } from 'types';
import clsx from 'clsx';

const allTabId = 'all' as const;
type TabId = Carrier | typeof allTabId;

interface ShippingRatesProps {
	isFetching: boolean;
	availableRates: Record< Carrier, Rate[] >;
	className?: string;
}

export const ShippingRates = ( {
	availableRates,
	isFetching,
	className,
}: ShippingRatesProps ) => {
	const previousFetchingState = usePrevious( isFetching );

	const wrapperRef = useRef< HTMLDivElement >();
	const shouldHaveAllTab = Object.keys( availableRates ).length > 1;
	const [ sortingBy, setSortBy ] = useState( '' );
	const initialTabName: TabId | '' = shouldHaveAllTab
		? allTabId
		: ( Object.keys( availableRates )[ 0 ] as Carrier ) ?? '';

	const {
		shipment: { shipments },
		essentialDetails: { focusArea: essentialDetailsFocusArea },
		rates: { getSelectedRate },
	} = useLabelPurchaseContext();

	const [ currentTabId, setTabId ] = useState< Carrier | typeof allTabId >(
		getSelectedRate()?.rate.carrierId ?? initialTabName
	);

	const canSortByDelivery = useCallback( () => {
		let rates;
		if ( currentTabId === allTabId ) {
			rates = Object.values( availableRates ).flat();
		} else {
			rates = currentTabId ? availableRates[ currentTabId ] || [] : [];
		}

		return rates.some(
			( rate ) =>
				intersection( Object.keys( rate ), DELIVERY_PROPERTIES )
					.length > 0
		);
	}, [ currentTabId, availableRates ] );

	const tabs = ( Object.keys( availableRates ) as Carrier[] ).map(
		( carrierId ) => ( {
			name: carrierId as string,
			title: CARRIER_ID_TO_NAME[ carrierId ],
			icon: (
				<>
					{ /*
					 * Untyped component.
					 * @ts-ignore */ }
					<CarrierIcon carrier={ carrierId } />
					{ CARRIER_ID_TO_NAME[ carrierId ] ||
						availableRates[ carrierId ] }
				</>
			),
		} )
	);

	if ( shouldHaveAllTab ) {
		tabs.unshift( {
			name: allTabId,
			title: __( 'All carriers', 'woocommerce-shipping' ),
			icon: (
				<>
					<Icon icon={ shipping } />
					{ __( 'All carriers', 'woocommerce-shipping' ) }
				</>
			),
		} );
	}

	/**
	 * Scroll to the top of the shipping rates section when the rates are fetched.
	 */
	useLayoutEffect( () => {
		if (
			isFetching ||
			! previousFetchingState ||
			! wrapperRef?.current?.offsetTop
		) {
			return;
		}

		document.querySelector( mainModalContentSelector )?.scrollTo( {
			left: 0,
			top: wrapperRef.current.offsetTop,
			behavior: 'smooth',
		} );
	}, [ wrapperRef, isFetching, previousFetchingState ] );

	useEffect( () => {
		if (
			essentialDetailsFocusArea === SHIPPING_SERVICE_SECTION &&
			document.querySelector( mainModalContentSelector )
		) {
			if ( ! wrapperRef.current ) {
				return;
			}
			document.querySelector( mainModalContentSelector )?.scrollTo( {
				left: 0,
				// We have to offset the height of the header, so it doesn't overlap our message.
				// If there's more than one shipment being created, then we also have to take the
				// "Shipment tabs" component into account.
				// @todo We could make this smarter by finding the height with JS, but the heights
				//       are a fixed size, so we're keeping it dumb for now for simplicity.
				top:
					wrapperRef.current.offsetTop -
					( Object.keys( shipments ).length > 1 ? 140 : 72 ),
				behavior: 'smooth',
			} );
		}
	}, [ essentialDetailsFocusArea, shipments ] );

	return (
		<Flex
			className={ clsx( 'shipping-rates', className ) }
			as="section"
			direction="column"
			ref={ wrapperRef }
		>
			<Heading level={ 3 }>
				{ __( 'Shipping service', 'woocommerce-shipping' ) }
			</Heading>
			{ essentialDetailsFocusArea === SHIPPING_SERVICE_SECTION && (
				<Notice
					status="error"
					className="shipping-rates-notice"
					isDismissible={ false }
				>
					{ __(
						'Please select a shipping service before purchasing a shipping label.',
						'woocommerce-shipping'
					) }
				</Notice>
			) }
			<Flex align="flex-start">
				<TabPanel
					tabs={ tabs }
					className="shipping-rates-tabs"
					onSelect={ ( carrierId ) => {
						setTabId( carrierId as TabId );
					} }
					children={ ( { name: carrierId } ) => (
						<CarrierRates
							rates={ sortBy(
								availableRates[ carrierId as Carrier ] ||
									Object.values( availableRates ).flat(),
								sortingBy
							) }
						/>
					) }
					initialTabName={ currentTabId }
					key={ currentTabId }
				/>
				<RatesSorter
					canSortByDelivery={ canSortByDelivery() }
					setSortBy={ setSortBy }
					sortingBy={ sortingBy }
				/>
			</Flex>
		</Flex>
	);
};

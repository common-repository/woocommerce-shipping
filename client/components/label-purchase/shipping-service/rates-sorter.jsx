import { Button, Dropdown, MenuItem } from '@wordpress/components';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { isEqual } from 'lodash';
import { DELIVERY_PROPERTIES } from 'components/label-purchase/shipping-service/constants';

export const RatesSorter = ( { setSortBy, sortingBy, canSortByDelivery } ) => (
	<Dropdown
		popoverProps={ {
			placement: 'bottom-end',
			resize: true,
			shift: true,
			inline: true,
		} }
		renderToggle={ ( { isOpen, onToggle } ) => {
			return (
				<Button
					isTertiary
					className="shipping-rates__sort"
					onClick={ onToggle }
					aria-expanded={ isOpen }
					icon={ isOpen ? chevronUp : chevronDown }
				>
					{ __( 'Sort by', 'woocommerce-shipping' ) }
				</Button>
			);
		} }
		renderContent={ ( { onClose } ) => (
			<>
				<MenuItem
					onClick={ () => {
						setSortBy( 'rate' );
						onClose();
					} }
					role="menuitemradio"
					isSelected={ sortingBy === 'rate' }
				>
					{ __( 'Cheapest', 'woocommerce-shipping' ) }
				</MenuItem>

				{ canSortByDelivery && (
					<MenuItem
						onClick={ () => {
							setSortBy( DELIVERY_PROPERTIES );
							onClose();
						} }
						role="menuitemradio"
						isSelected={ isEqual( sortingBy, DELIVERY_PROPERTIES ) }
					>
						{ __( 'Fastest', 'woocommerce-shipping' ) }
					</MenuItem>
				) }
			</>
		) }
	/>
);
